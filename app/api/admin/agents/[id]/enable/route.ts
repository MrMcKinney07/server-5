import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { id } = params

    // Enable the agent account
    const { error } = await supabase
      .from("agents")
      .update({
        is_active: true,
        disabled_at: null,
        disabled_by: null,
      })
      .eq("id", id)

    if (error) {
      console.error("Error enabling agent:", error)
      return NextResponse.json({ error: "Failed to enable agent" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in enable agent:", error)
    return NextResponse.json({ error: "Failed to enable agent" }, { status: 500 })
  }
}
