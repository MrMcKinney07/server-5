import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await requireAuth()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params

  // Verify the agent owns this contract
  const { data: contract } = await supabase
    .from("executed_contracts")
    .select("id, agent_id")
    .eq("id", contractId)
    .single()

  if (!contract || contract.agent_id !== agent.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  const documentKey = formData.get("document_key") as string

  if (!file || !documentKey) {
    return NextResponse.json({ error: "Missing file or document_key" }, { status: 400 })
  }

  const pathname = `contracts/${contractId}/${documentKey}/${file.name}`

  const blob = await put(pathname, file, { access: "public" })

  return NextResponse.json({ url: blob.url, file_name: file.name })
}
