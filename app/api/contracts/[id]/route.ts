import { createClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await getCurrentAgent()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const { data: contract, error } = await supabase
    .from("executed_contracts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: documents } = await supabase
    .from("contract_documents")
    .select("*")
    .eq("contract_id", id)
    .order("category")

  const { data: dealDocs } = await supabase
    .from("contract_deal_specific_docs")
    .select("*")
    .eq("contract_id", id)
    .order("created_at")

  return NextResponse.json({ contract, documents: documents ?? [], dealDocs: dealDocs ?? [] })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await getCurrentAgent()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabase
    .from("executed_contracts")
    .update(body)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
