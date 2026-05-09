import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { grantXP } from "@/lib/xp-service"
import { NextResponse } from "next/server"

const CLOSE_XP = 15

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Use getCurrentAgent (returns null instead of redirecting) so Route Handler stays alive
  const agent = await getCurrentAgent()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roleLower = (agent.role || "").toLowerCase()
  const isBroker = roleLower === "admin" || roleLower === "broker"
  if (!isBroker) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id: contractId } = await params
  const serviceClient = createServiceClient()

  // Fetch the full contract
  const { data: contract, error: fetchError } = await serviceClient
    .from("executed_contracts")
    .select("*")
    .eq("id", contractId)
    .single()

  if (fetchError || !contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 })

  // Already closed — skip
  if (contract.payment_status === "sent") return NextResponse.json({ success: true, already: true })

  // Fetch the agent's active commission plan
  const { data: agentPlan } = await serviceClient
    .from("agent_commission_plans")
    .select("id, plan_id, cap_progress, ytd_gci, plan:commission_plans(id, split_percentage, cap_amount, transaction_fee)")
    .eq("agent_id", contract.agent_id)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  let splitPct = 70
  let capAmount: number | null = null
  let transactionFee = 0
  let agentPlanId: string | null = agentPlan?.id ?? null

  const plan = agentPlan?.plan as any
  if (plan) {
    splitPct = Number(plan.split_percentage) || 70
    capAmount = plan.cap_amount ? Number(plan.cap_amount) : null
    transactionFee = Number(plan.transaction_fee) || 0
  } else {
    const { data: defaultPlan } = await serviceClient
      .from("commission_plans")
      .select("id, split_percentage, cap_amount, transaction_fee")
      .eq("is_default", true)
      .maybeSingle()
    if (defaultPlan) {
      splitPct = Number(defaultPlan.split_percentage) || 70
      capAmount = defaultPlan.cap_amount ? Number(defaultPlan.cap_amount) : null
      transactionFee = Number(defaultPlan.transaction_fee) || 0
    }
  }

  // Compute gross commission from contract fields
  let grossCommission = 0
  if (contract.commission_value) {
    if (contract.commission_type === "percent" && contract.sale_price) {
      grossCommission = (Number(contract.sale_price) * Number(contract.commission_value)) / 100
    } else if (contract.commission_type === "dollar") {
      grossCommission = Number(contract.commission_value)
    }
  }

  const agentGross = grossCommission * (splitPct / 100)
  const brokerShare = grossCommission - agentGross
  const agentNet = Math.max(0, agentGross - transactionFee)

  // 1. Mark contract as sent + closed
  const { error: updateError } = await serviceClient
    .from("executed_contracts")
    .update({ payment_status: "sent", status: "closed" })
    .eq("id", contractId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 2. Write transaction record
  await serviceClient.from("transactions").insert({
    agent_id: contract.agent_id,
    transaction_type: contract.transaction_type,
    property_address: contract.property_address,
    sale_price: contract.sale_price ?? null,
    commission_rate: contract.commission_type === "percent" ? Number(contract.commission_value) : null,
    gross_commission: grossCommission,
    agent_split: splitPct,
    agent_commission: agentNet,
    broker_commission: brokerShare,
    contract_date: contract.contract_date,
    closing_date: contract.expected_closing_date ?? new Date().toISOString().split("T")[0],
    status: "closed",
    notes: contract.notes ?? null,
  })

  // 3. Update agent commission plan progress
  if (agentPlan && agentPlanId) {
    const currentCapProgress = Number(agentPlan.cap_progress || 0)
    const newCapProgress = capAmount
      ? Math.min(currentCapProgress + brokerShare, capAmount)
      : currentCapProgress + brokerShare
    const newYtdGci = Number(agentPlan.ytd_gci || 0) + grossCommission

    await serviceClient
      .from("agent_commission_plans")
      .update({ cap_progress: newCapProgress, ytd_gci: newYtdGci })
      .eq("id", agentPlanId)
  }

  // 4. Award 15 XP to agent
  await grantXP(contract.agent_id, CLOSE_XP, "Contract closed — check sent", "CONTRACT")

  return NextResponse.json({ success: true, grossCommission, brokerShare, agentNet })
}
