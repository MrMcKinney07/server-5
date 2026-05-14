import { createServiceClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

// GET /api/campaigns/templates/[id]/steps — fetch steps for a single template
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const supabase = createServiceClient()

    const { data: steps, error } = await supabase
      .from("campaign_template_steps")
      .select("id, step_number, type, subject, body, delay_hours")
      .eq("template_id", id)
      .order("step_number")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ steps: steps || [] })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
