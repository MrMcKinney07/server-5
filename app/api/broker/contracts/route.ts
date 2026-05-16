import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { getDocumentsForContract } from "@/lib/contracts/document-definitions"
import { NextResponse } from "next/server"

// Broker-only: fetch all contracts across all agents, with docs
export async function GET() {
  const supabase = createServiceClient()

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

// Broker-only: manually create a contract on behalf of any agent
export async function POST(req: Request) {
  const agent = await requireAdmin()
  if (!agent || (agent.Role !== "broker" && agent.Role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = createServiceClient()
  const body = await req.json()
  const {
    agent_id,
    transaction_type,
    property_address,
    client_name,
    contract_date,
    expected_closing_date,
    has_hoa,
    has_cdd,
    notes,
    sale_price,
    commission_type,
    commission_value,
  } = body

  if (!agent_id) return NextResponse.json({ error: "agent_id is required" }, { status: 400 })

  const { data: contract, error: contractError } = await supabase
    .from("executed_contracts")
    .insert({
      agent_id,
      transaction_type,
      property_address,
      client_name,
      contract_date,
      expected_closing_date: expected_closing_date || null,
      has_hoa: has_hoa ?? false,
      has_cdd: has_cdd ?? false,
      notes: notes || null,
      risk_status: "green",
      sale_price: sale_price ? parseFloat(sale_price) : null,
      commission_type: commission_type || null,
      commission_value: commission_value ? parseFloat(commission_value) : null,
    })
    .select()
    .single()

  if (contractError) return NextResponse.json({ error: contractError.message }, { status: 500 })

  const docs = getDocumentsForContract(transaction_type, has_hoa ?? false, has_cdd ?? false)
  const docRows = docs.map((d) => ({
    contract_id: contract.id,
    document_key: d.key,
    document_name: d.name,
    category: d.category,
    is_required: d.isRequired,
    is_conditional: d.isConditional,
    condition_field: d.conditionField || null,
  }))

  if (docRows.length > 0) {
    const { error: docError } = await supabase.from("contract_documents").insert(docRows)
    if (docError) return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  return NextResponse.json(contract, { status: 201 })
}
