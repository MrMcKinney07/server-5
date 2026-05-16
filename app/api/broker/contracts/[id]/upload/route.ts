import { put } from "@vercel/blob"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAdmin()
  if (!agent || (agent.Role !== "broker" && agent.Role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: contractId } = await params
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const blob = await put(`contracts/${contractId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("contract_deal_specific_docs")
    .insert({
      contract_id: contractId,
      document_name: file.name,
      file_url: blob.url,
      file_name: file.name,
      status: "uploaded",
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
