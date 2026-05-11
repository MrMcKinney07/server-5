import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

// Broker-only: approve or reject a document
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const broker = await requireAdmin()
  if (!broker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params
  const body = await req.json()
  const { document_key, action } = body // action: "approved" | "rejected"

  if (!["approved", "not_uploaded"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("contract_documents")
    .update({
      status: action,
      uploaded_at: action === "approved" ? new Date().toISOString() : null,
    })
    .eq("contract_id", contractId)
    .eq("document_key", document_key)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate progress — only count required docs
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

  return NextResponse.json({ ...data, progress })
}
