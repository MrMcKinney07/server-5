import { createServiceClient } from "@/lib/supabase/server"
import { grantXP } from "@/lib/xp-service"
import { NextResponse } from "next/server"

const CLOSE_XP = 15

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: contractId } = await params
  const serviceClient = createServiceClient()

  // Fetch the full contract
  const { data: contract, error: fetchError } = await serviceClient
    .from("executed_contracts")
    .select("*")
    .eq("id", contractId)
    .single()

  if (fetchError || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  // Already processed — return success without duplicating
  if (contract.payment_status === "sent") {
    return NextResponse.json({ success: true, already: true })
  }

  // Fetch the agent's active commission plan
  const { data: agentPlan } = await serviceClient
    .from("agent_commission_plans")
    .select("id, cap_progress, ytd_gci, plan:commission_plans(id, split_percentage, cap_amount, transaction_fee)")
    .eq("agent_id", contract.agent_id)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  // split_percentage stored as decimal fraction (0.70, 0.80, 0.85)
  let agentFraction = 0.70
  let capAmount: number | null = null
  let transactionFee = 499

  const plan = agentPlan?.plan as any
  if (plan) {
    agentFraction = Number(plan.split_percentage) || 0.70
    capAmount = plan.cap_amount ? Number(plan.cap_amount) : null
    transactionFee = Number(plan.transaction_fee) || 499
  } else {
    const { data: defaultPlan } = await serviceClient
      .from("commission_plans")
      .select("split_percentage, cap_amount, transaction_fee")
      .eq("is_default", true)
      .maybeSingle()
    if (defaultPlan) {
      agentFraction = Number(defaultPlan.split_percentage) || 0.70
      capAmount = defaultPlan.cap_amount ? Number(defaultPlan.cap_amount) : null
      transactionFee = Number(defaultPlan.transaction_fee) || 499
    }
  }

  const brokerFraction = 1 - agentFraction

  // Compute gross commission
  let grossCommission = 0
  if (contract.commission_value) {
    if (contract.commission_type === "percent" && contract.sale_price) {
      grossCommission = (Number(contract.sale_price) * Number(contract.commission_value)) / 100
    } else if (contract.commission_type === "dollar") {
      grossCommission = Number(contract.commission_value)
    }
  }

  const agentGross = grossCommission * agentFraction
  const brokerShare = grossCommission * brokerFraction
  const agentNet = Math.max(0, agentGross - transactionFee)
  const splitPct = Math.round(agentFraction * 100)

  // 1. Mark contract as sent + closed
  const { error: updateError } = await serviceClient
    .from("executed_contracts")
    .update({ payment_status: "sent", status: "closed" })
    .eq("id", contractId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // commission_rate is NUMERIC(5,4) — must be a decimal fraction (e.g. 3% = 0.0300)
  // agent_split is NUMERIC(5,4) — must be a decimal fraction (e.g. 70% = 0.7000)
  const commissionRateDecimal = contract.commission_type === "percent"
    ? Number(contract.commission_value) / 100   // 3 → 0.0300
    : null

  // 2. Write transaction record
  const { error: txError } = await serviceClient.from("transactions").insert({
    agent_id: contract.agent_id,
    transaction_type: contract.transaction_type ?? "residential",
    property_address: contract.property_address,
    sale_price: contract.sale_price ? Number(contract.sale_price) : null,
    commission_rate: commissionRateDecimal,
    gross_commission: Math.round(grossCommission * 100) / 100,
    agent_split: agentFraction,                  // already 0.70 / 0.80 / 0.85
    agent_commission: Math.round(agentNet * 100) / 100,
    broker_commission: Math.round(brokerShare * 100) / 100,
    contract_date: contract.contract_date ?? null,
    closing_date: contract.expected_closing_date ?? new Date().toISOString().split("T")[0],
    status: "closed",
    notes: contract.notes ?? null,
  })

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 })
  }

  // 3. Update cap_progress + ytd_gci on agent commission plan
  if (agentPlan?.id) {
    const newCapProgress = capAmount
      ? Math.min(Number(agentPlan.cap_progress || 0) + brokerShare, capAmount)
      : Number(agentPlan.cap_progress || 0) + brokerShare
    const newYtdGci = Number(agentPlan.ytd_gci || 0) + grossCommission

    await serviceClient
      .from("agent_commission_plans")
      .update({ cap_progress: newCapProgress, ytd_gci: newYtdGci })
      .eq("id", agentPlan.id)
  }

  // 4. Award 15 XP to agent for closing (pass service client so grantXP doesn't need cookies)
  await grantXP(contract.agent_id, CLOSE_XP, "Contract closed — check sent", "CONTRACT", serviceClient)

  return NextResponse.json({ success: true, grossCommission, brokerShare, agentNet })
}
