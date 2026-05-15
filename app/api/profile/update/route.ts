import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name, phone, address, city, state, zip, must_change_password } = body

  const updates: Record<string, unknown> = {}
  if (name !== undefined && name !== "")          updates.Name    = name
  if (phone !== undefined)                        updates.Phone   = phone || null
  if (address !== undefined)                      updates.address = address || null
  if (city !== undefined)                         updates.city    = city || null
  if (state !== undefined)                        updates.state   = (state as string).toUpperCase() || null
  if (zip !== undefined)                          updates.zip     = zip || null
  if (must_change_password !== undefined)         updates.must_change_password = must_change_password

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true })
  }

  const db = createServiceClient()
  const { error } = await db.from("agents").update(updates).eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
