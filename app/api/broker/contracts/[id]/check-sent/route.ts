import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { grantXP } from "@/lib/xp-service"
import { NextResponse } from "next/server"

const CLOSE_XP = 15

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await requireAuth()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isBroker = agent.role === "admin" || agent.role === "broker"
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

  // Fetch the agent's active commission plan
  const { data: agentPlan } = await serviceClient
    .from("agent_commission_plans")
    .select("*, plan:commission_plans(*)")
    .eq("agent_id", contract.agent_id)
    .order("effective_date", { ascending: false })
    .limit(1)
    .single()

  // Fall back to default plan if agent has no assigned plan
  let splitPct = 70 // default 70/30
  let capAmount: number | null = null
  let transactionFee = 0
  let planId: string | null = null

  if (agentPlan?.plan) {
    splitPct = Number(agentPlan.plan.split_percentage)
    capAmount = agentPlan.plan.cap_amount ? Number(agentPlan.plan.cap_amount) : null
    transactionFee = Number(agentPlan.plan.transaction_fee) || 0
    planId = agentPlan.plan_id
  } else {
    // Try to load the default plan
    const { data: defaultPlan } = await serviceClient
      .from("commission_plans")
      .select("*")
      .eq("is_default", true)
      .single()
    if (defaultPlan) {
      splitPct = Number(defaultPlan.split_percentage)
      capAmount = defaultPlan.cap_amount ? Number(defaultPlan.cap_amount) : null
      transactionFee = Number(defaultPlan.transaction_fee) || 0
      planId = defaultPlan.id
    }
  }

  // Compute gross commission
  let grossCommission = 0
  if (contract.sale_price && contract.commission_value) {
    if (contract.commission_type === "percent") {
      grossCommission = (Number(contract.sale_price) * Number(contract.commission_value)) / 100
    } else {
      grossCommission = Number(contract.commission_value)
    }
  }

  // Calculate splits
  const agentGross = grossCommission * (splitPct / 100)
  const brokerShare = grossCommission - agentGross
  // Agent net = their gross minus the transaction fee
  const agentNet = Math.max(0, agentGross - transactionFee)

  // Mark payment as sent
  const { error: updateError } = await serviceClient
    .from("executed_contracts")
    .update({ payment_status: "sent", status: "closed" })
    .eq("id", contractId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Write full transactions record
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

  // Update agent_commission_plans: cap_progress and ytd_gci
  if (agentPlan) {
    const newCapProgress = Math.min(
      Number(agentPlan.cap_progress || 0) + brokerShare,
      capAmount ?? Infinity
    )
    const newYtdGci = Number(agentPlan.ytd_gci || 0) + grossCommission
    await serviceClient
      .from("agent_commission_plans")
      .update({
        cap_progress: newCapProgress,
        ytd_gci: newYtdGci,
      })
      .eq("agent_id", contract.agent_id)
      .eq("plan_id", planId)
  }

  // Award 15 XP to the agent
  await grantXP(contract.agent_id, CLOSE_XP, "Contract closed — check sent", "CONTRACT")

  return NextResponse.json({ success: true, grossCommission, brokerShare, agentNet })
}
