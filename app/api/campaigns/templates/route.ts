import { createServiceClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

// GET /api/campaigns/templates — fetch all active templates with their steps
export async function GET() {
  try {
    await requireAuth()
    const supabase = createServiceClient()

    const { data: templates, error } = await supabase
      .from("campaign_templates")
      .select(`
        *,
        campaign_template_steps (
          id, step_number, type, subject, body, delay_hours
        )
      `)
      .eq("is_active", true)
      .order("category")
      .order("name")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Sort steps inside each template
    const sorted = (templates || []).map((t) => ({
      ...t,
      campaign_template_steps: (t.campaign_template_steps || []).sort(
        (a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number
      ),
    }))

    return NextResponse.json({ templates: sorted })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
