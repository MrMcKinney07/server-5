import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await requireAuth()
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

  // Recalculate progress_percent based on approved docs
  const { data: allDocs } = await supabase
    .from("contract_documents")
    .select("status, is_required, is_conditional")
    .eq("contract_id", contractId)

  const total = allDocs?.length ?? 0
  const approved = allDocs?.filter((d) => d.status === "approved").length ?? 0
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0

  await supabase
    .from("executed_contracts")
    .update({ progress_percent: progress })
    .eq("id", contractId)

  return NextResponse.json({ ...data, progress })
}

// Add a deal-specific document
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await requireAuth()
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
