import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await requireAuth()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isBroker = agent.Role === "admin" || agent.Role === "broker"
  if (!isBroker) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id: contractId } = await params

  const { error } = await supabase
    .from("executed_contracts")
    .update({ payment_status: "sent" })
    .eq("id", contractId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
