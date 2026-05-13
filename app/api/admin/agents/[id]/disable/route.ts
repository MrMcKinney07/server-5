import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()
    const { id } = params
    const { reason } = await request.json()

    // Prevent self-disable
    if (id === admin.id) {
      return NextResponse.json({ error: "Cannot disable your own account" }, { status: 400 })
    }

    // Disable the agent account
    const { error } = await supabase
      .from("agents")
      .update({
        is_active: false,
        disabled_at: new Date().toISOString(),
        disabled_by: admin.id,
        notes: reason ? `Disabled: ${reason}` : undefined,
      })
      .eq("id", id)

    if (error) {
      console.error("Error disabling agent:", error)
      return NextResponse.json({ error: "Failed to disable agent" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in disable agent:", error)
    return NextResponse.json({ error: "Failed to disable agent" }, { status: 500 })
  }
}
