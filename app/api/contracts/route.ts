import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getDocumentsForContract } from "@/lib/contracts/document-definitions"

export async function GET() {
  const supabase = await createClient()
  const agent = await requireAuth()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = agent.Role === "admin" || agent.Role === "broker"

  let query = supabase
    .from("executed_contracts")
    .select("*")
    .order("created_at", { ascending: false })

  if (!isAdmin) {
    query = query.eq("agent_id", agent.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contracts: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const agent = await requireAuth()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    transaction_type,
    property_address,
    client_name,
    contract_date,
    expected_closing_date,
    has_hoa,
    has_cdd,
    notes,
    risk_status,
  } = body

  // Create the contract
  const { data: contract, error: contractError } = await supabase
    .from("executed_contracts")
    .insert({
      agent_id: agent.id,
      transaction_type,
      property_address,
      client_name,
      contract_date,
      expected_closing_date: expected_closing_date || null,
      has_hoa: has_hoa ?? false,
      has_cdd: has_cdd ?? false,
      notes: notes || null,
      risk_status: risk_status || "green",
    })
    .select()
    .single()

  if (contractError) return NextResponse.json({ error: contractError.message }, { status: 500 })

  // Seed the document checklist from canonical definitions
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
