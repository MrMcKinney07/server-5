import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const agent = await requireAdmin()
    if (agent.role !== "broker" && agent.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { key, value } = await req.json()
    const allowedKeys = ["show_closings_leaderboard", "show_listings_leaderboard"]
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("office_settings")
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: agent.id }, { onConflict: "key" })

    if (error) {
      console.error("[v0] office-settings update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[v0] office-settings error:", err)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
