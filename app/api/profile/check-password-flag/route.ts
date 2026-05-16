import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const authClient = await createClient()
  const { data: { user }, error } = await authClient.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ must_change_password: false })
  }

  const db = createServiceClient()
  const { data } = await db
    .from("agents")
    .select("must_change_password")
    .eq("id", user.id)
    .single()

  return NextResponse.json({ must_change_password: data?.must_change_password ?? false })
}
