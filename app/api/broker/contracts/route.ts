import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

// Broker-only: fetch all contracts across all agents, with docs
export async function GET() {
  const supabase = await createClient()
  const broker = await requireAdmin()
  if (!broker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: contracts, error } = await supabase
    .from("executed_contracts")
    .select(`
      *,
      agent:agents(id, Name, Email),
      contract_documents(
        id, document_key, document_name, category,
        status, file_url, file_name, is_required, is_conditional, uploaded_at
      ),
      contract_deal_specific_docs(
        id, document_name, status, file_url, file_name, uploaded_at
      )
    `)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by agent
  const grouped: Record<string, { agent: any; contracts: any[] }> = {}
  for (const contract of contracts ?? []) {
    const agentId = contract.agent?.id ?? "unknown"
    if (!grouped[agentId]) {
      grouped[agentId] = { agent: contract.agent, contracts: [] }
    }
    grouped[agentId].contracts.push(contract)
  }

  return NextResponse.json({ grouped: Object.values(grouped), total: contracts?.length ?? 0 })
}
