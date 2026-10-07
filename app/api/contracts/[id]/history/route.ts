import { createClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { NextResponse } from "next/server"

// RLS limits results: brokers/admins see all, agents see only their own contracts.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await getCurrentAgent()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("contract_document_history")
    .select("id, document_name, doc_type, action, file_url, file_name, actor_name, reason, created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
