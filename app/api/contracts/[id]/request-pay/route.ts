import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await requireAuth()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params

  // Fetch the contract to confirm it belongs to this agent and is at 100%
  const { data: contract, error: contractErr } = await supabase
    .from("executed_contracts")
    .select("id, property_address, progress_percent, payment_status, agent_id")
    .eq("id", contractId)
    .single()

  if (contractErr || !contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  if (contract.agent_id !== agent.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (contract.progress_percent < 100) return NextResponse.json({ error: "Documents not fully approved" }, { status: 400 })
  if (contract.payment_status === "pending" || contract.payment_status === "sent") {
    return NextResponse.json({ error: "Payment already requested" }, { status: 400 })
  }

  // Set payment_status to pending
  const { error: updateErr } = await supabase
    .from("executed_contracts")
    .update({ payment_status: "pending" })
    .eq("id", contractId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Fetch agent name
  const { data: agentRow } = await supabase
    .from("agents")
    .select("Name")
    .eq("id", agent.id)
    .single()

  // Notify all brokers/admins
  const { data: brokers } = await supabase
    .from("agents")
    .select("id")
    .in("Role", ["admin", "broker"])

  if (brokers && brokers.length > 0) {
    const serviceClient = createServiceClient()
    const notifRows = brokers.map((b) => ({
      recipient_id: b.id,
      contract_id: contractId,
      document_key: "payment_request",
      document_name: "Payment Request",
      agent_name: agentRow?.Name || agent.email,
      property_address: contract.property_address,
      read: false,
    }))
    await serviceClient.from("contract_notifications").insert(notifRows)
  }

  return NextResponse.json({ success: true })
}
