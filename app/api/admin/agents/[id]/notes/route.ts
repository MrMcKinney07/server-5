import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { id } = params
    const { notes } = await request.json()

    const { error } = await supabase.from("agents").update({ notes }).eq("id", id)

    if (error) {
      console.error("Error updating agent notes:", error)
      return NextResponse.json({ error: "Failed to update notes" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update notes:", error)
    return NextResponse.json({ error: "Failed to update notes" }, { status: 500 })
  }
}
