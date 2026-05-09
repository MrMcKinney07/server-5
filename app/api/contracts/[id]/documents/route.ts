import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await getCurrentAgent()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params
  const body = await req.json()
  const { document_key, status, file_url, file_name } = body

  const { data, error } = await supabase
    .from("contract_documents")
    .update({
      status,
      file_url: file_url || null,
      file_name: file_name || null,
      uploaded_at: status === "uploaded" || status === "approved" ? new Date().toISOString() : null,
    })
    .eq("contract_id", contractId)
    .eq("document_key", document_key)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate progress_percent — only count required docs
  const { data: allDocs } = await supabase
    .from("contract_documents")
    .select("status, is_required")
    .eq("contract_id", contractId)

  const requiredDocs = allDocs?.filter((d) => d.is_required) ?? []
  const total = requiredDocs.length
  const approved = requiredDocs.filter((d) => d.status === "approved").length
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0

  await supabase
    .from("executed_contracts")
    .update({ progress_percent: progress })
    .eq("id", contractId)

  // Fire notification to all brokers/admins when agent uploads a document
  if (status === "uploaded") {
    const { data: contract } = await supabase
      .from("executed_contracts")
      .select("property_address, agent_id")
      .eq("id", contractId)
      .single()

    const { data: agentRow } = await supabase
      .from("agents")
      .select("Name")
      .eq("id", agent.id)
      .single()

    const { data: brokers } = await supabase
      .from("agents")
      .select("id")
      .in("Role", ["admin", "broker"])

    if (contract && agentRow && brokers && brokers.length > 0) {
      const serviceClient = await createServiceClient()
      const notifRows = brokers.map((b) => ({
        recipient_id: b.id,
        contract_id: contractId,
        document_key: document_key,
        document_name: data.document_name,
        agent_name: agentRow.Name || agent.email,
        property_address: contract.property_address,
        read: false,
      }))
      await serviceClient.from("contract_notifications").insert(notifRows)
    }
  }

  return NextResponse.json({ ...data, progress })
}

// Add a deal-specific document
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await getCurrentAgent()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params
  const body = await req.json()
  const { document_name, file_url, file_name } = body

  const { data, error } = await supabase
    .from("contract_deal_specific_docs")
    .insert({
      contract_id: contractId,
      document_name,
      file_url: file_url || null,
      file_name: file_name || null,
      status: file_url ? "uploaded" : "not_uploaded",
      uploaded_at: file_url ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
