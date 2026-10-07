import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { grantXP } from "@/lib/xp-service"
import { sendEmail } from "@/lib/email/send-email"
import { NextResponse } from "next/server"

const CLOSE_XP = 15

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const broker = await requireAdmin()
  if (!broker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params
  const body = await req.json().catch(() => ({}))
  const checkNumber = typeof body.check_number === "string" ? body.check_number.trim().slice(0, 50) : ""
  const rawAmount = body.check_amount === "" || body.check_amount == null ? null : Number(body.check_amount)
  if (rawAmount !== null && (!Number.isFinite(rawAmount) || rawAmount < 0 || rawAmount > 10_000_000)) {
    return NextResponse.json({ error: "Invalid check amount" }, { status: 400 })
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : ""

  const serviceClient = createServiceClient()

  const { data: contract, error: fetchError } = await serviceClient
    .from("executed_contracts")
    .select("*")
    .eq("id", contractId)
    .single()

  if (fetchError || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  if (contract.payment_status === "sent") {
    return NextResponse.json({ success: true, already: true })
  }

  const { data: agentPlan } = await serviceClient
    .from("agent_commission_plans")
    .select("id, cap_progress, ytd_gci, plan:commission_plans(id, split_percentage, cap_amount, transaction_fee)")
    .eq("agent_id", contract.agent_id)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  // split_percentage stored as decimal fraction (0.70, 0.80, 0.85)
  let agentFraction = 0.7
  let capAmount: number | null = null
  let transactionFee = 499

  const plan = agentPlan?.plan as any
  if (plan) {
    agentFraction = Number(plan.split_percentage) || 0.7
    capAmount = plan.cap_amount ? Number(plan.cap_amount) : null
    transactionFee = Number(plan.transaction_fee) || 499
  } else {
    const { data: defaultPlan } = await serviceClient
      .from("commission_plans")
      .select("split_percentage, cap_amount, transaction_fee")
      .eq("is_default", true)
      .maybeSingle()
    if (defaultPlan) {
      agentFraction = Number(defaultPlan.split_percentage) || 0.7
      capAmount = defaultPlan.cap_amount ? Number(defaultPlan.cap_amount) : null
      transactionFee = Number(defaultPlan.transaction_fee) || 499
    }
  }

  const brokerFraction = 1 - agentFraction

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
  const checkAmount = Math.round((rawAmount ?? agentNet) * 100) / 100
  const sentAt = new Date().toISOString()

  // Atomically claim so a double click or two admins can't record the payout twice.
  const { data: claimed, error: updateError } = await serviceClient
    .from("executed_contracts")
    .update({
      payment_status: "sent",
      status: "closed",
      check_number: checkNumber || null,
      check_amount: checkAmount,
      check_sent_at: sentAt,
      check_sent_by: broker.id,
    })
    .eq("id", contractId)
    .or("payment_status.is.null,payment_status.neq.sent")
    .select("id")
    .maybeSingle()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  if (!claimed) {
    return NextResponse.json({ success: true, already: true })
  }

  // commission_rate / agent_split are NUMERIC(5,4) decimal fractions
  const commissionRateDecimal =
    contract.commission_type === "percent" ? Number(contract.commission_value) / 100 : null

  const txTypeMap: Record<string, string> = {
    buyer: "buy", buy: "buy",
    seller: "sell", sell: "sell",
    dual: "dual",
    lease: "lease", rental: "lease",
  }
  const transactionType = txTypeMap[(contract.transaction_type ?? "").toLowerCase()] ?? "buy"

  const { error: txError } = await serviceClient.from("transactions").insert({
    agent_id: contract.agent_id,
    transaction_type: transactionType,
    property_address: contract.property_address,
    sale_price: contract.sale_price ? Number(contract.sale_price) : null,
    commission_rate: commissionRateDecimal,
    gross_commission: Math.round(grossCommission * 100) / 100,
    agent_split: agentFraction,
    agent_commission: checkAmount,
    broker_commission: Math.round(brokerShare * 100) / 100,
    contract_date: contract.contract_date ?? null,
    closing_date: contract.expected_closing_date ?? sentAt.split("T")[0],
    status: "closed",
    notes: contract.notes ?? null,
  })

  if (txError) {
    // Roll back the claim so the admin can retry.
    await serviceClient
      .from("executed_contracts")
      .update({
        payment_status: contract.payment_status,
        status: contract.status,
        check_number: null,
        check_amount: null,
        check_sent_at: null,
        check_sent_by: null,
      })
      .eq("id", contractId)
    return NextResponse.json({ error: txError.message }, { status: 500 })
  }

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

  await grantXP(contract.agent_id, CLOSE_XP, "Contract closed — check sent", "CONTRACT", serviceClient)

  const emailSent = await notifyAgentCheckSent({
    agentId: contract.agent_id,
    contractId,
    property: contract.property_address || contract.client_name || "your transaction",
    checkAmount,
    checkNumber,
    note,
  })

  await serviceClient.from("executed_contracts").update({ check_email_sent: emailSent }).eq("id", contractId)

  return NextResponse.json({ success: true, grossCommission, brokerShare, agentNet, checkAmount, emailSent })
}

async function notifyAgentCheckSent(opts: {
  agentId: string
  contractId: string
  property: string
  checkAmount: number
  checkNumber: string
  note: string
}) {
  const service = createServiceClient()
  const { data: agent } = await service.from("agents").select("Name, Email").eq("id", opts.agentId).single()
  if (!agent?.Email) return false

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  const contractUrl = `${appUrl}/dashboard/contracts/${opts.contractId}`
  const firstName = (agent.Name ?? "").split(" ")[0] || "there"

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
      <h1 style="font-size:22px;margin:0 0 16px">Your check is on the way, ${escapeHtml(firstName)}!</h1>
      <p>Your commission for <strong>${escapeHtml(opts.property)}</strong> has been sent.</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 16px 4px 0;color:#555">Amount</td><td style="padding:4px 0"><strong>${formatMoney(opts.checkAmount)}</strong></td></tr>
        ${opts.checkNumber ? `<tr><td style="padding:4px 16px 4px 0;color:#555">Check #</td><td style="padding:4px 0"><strong>${escapeHtml(opts.checkNumber)}</strong></td></tr>` : ""}
      </table>
      ${opts.note ? `<p><strong>Note from the broker:</strong> ${escapeHtml(opts.note)}</p>` : ""}
      <p>Congratulations on closing this one. Thank you for all your hard work!</p>
      ${appUrl ? `<p><a href="${contractUrl}" style="display:inline-block;padding:10px 16px;background:#0e7490;color:#fff;text-decoration:none;border-radius:6px">View transaction</a></p>` : ""}
      <p>McKinney Realty Co</p>
    </div>`

  return sendEmail({
    to: agent.Email,
    subject: `Your check has been sent — ${opts.property}`,
    html,
  })
}
