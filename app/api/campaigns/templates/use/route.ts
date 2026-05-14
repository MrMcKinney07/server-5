import { createServiceClient, createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

// POST /api/campaigns/templates/use
// Body: { templateId, name?, sendTime?, sendDays?, quietHoursStart?, quietHoursEnd?, throttlePerMinute? }
export async function POST(request: Request) {
  try {
    const agent = await requireAuth()
    const supabase = createServiceClient()
    const authClient = await createClient()

    const body = await request.json()
    const {
      templateId,
      name,
      sendTime = "10:30:00",
      sendDays = ["monday", "tuesday", "wednesday", "thursday", "friday"],
      quietHoursStart = "09:00:00",
      quietHoursEnd = "19:00:00",
      throttlePerMinute = 10,
    } = body

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 })
    }

    // Fetch template + steps
    const { data: template, error: tErr } = await supabase
      .from("campaign_templates")
      .select("*, campaign_template_steps(*)")
      .eq("id", templateId)
      .eq("is_active", true)
      .single()

    if (tErr || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const campaignName = name || template.name

    // Get the authenticated user id
    const { data: sessionData } = await authClient.auth.getSession()
    const userId = sessionData?.session?.user?.id || agent.id

    // Create campaign
    const { data: campaign, error: cErr } = await supabase
      .from("campaigns")
      .insert({
        name: campaignName,
        description: template.description,
        owner_id: userId,
        channel: template.channel,
        type: template.type === "DRIP" ? "SEQUENCE" : template.type,
        send_time_local: sendTime,
        send_days: sendDays,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
        stop_on_reply: true,
        throttle_per_minute: throttlePerMinute,
        dedupe_window_days: 365,
        is_active: false, // start paused so agent can review
      })
      .select()
      .single()

    if (cErr || !campaign) {
      return NextResponse.json({ error: cErr?.message || "Failed to create campaign" }, { status: 500 })
    }

    // Copy template steps into campaign_steps
    const steps = (template.campaign_template_steps || []).sort(
      (a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number
    )

    if (steps.length > 0) {
      const stepInserts = steps.map((s: {
        step_number: number
        type: string
        subject: string | null
        body: string
        delay_hours: number
      }) => ({
        campaign_id: campaign.id,
        step_number: s.step_number,
        type: s.type,
        subject: s.subject,
        body: s.body,
        delay_hours: s.delay_hours,
      }))

      const { error: stepsErr } = await supabase.from("campaign_steps").insert(stepInserts)
      if (stepsErr) {
        // Rollback campaign
        await supabase.from("campaigns").delete().eq("id", campaign.id)
        return NextResponse.json({ error: stepsErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ campaignId: campaign.id })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
