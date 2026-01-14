import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send-email"
import { sendSms } from "@/lib/sms/send-sms"

// Use service role for testing
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Test endpoint to manually trigger drip campaigns (no auth required for testing)
 */
export async function GET() {
  try {
    const now = new Date()

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("drip_enrollments")
      .select(`
        id,
        campaign_id,
        lead_id,
        current_step,
        status,
        next_run_at,
        leads(id, first_name, last_name, email, phone)
      `)
      .eq("status", "active")
      .lte("next_run_at", now.toISOString())
      .limit(100)

    if (enrollmentError) {
      return NextResponse.json(
        { error: "Failed to fetch enrollments", details: enrollmentError.message },
        { status: 500 },
      )
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: "No active enrollments due", processed: 0 })
    }

    const results: any[] = []

    for (const enrollment of enrollments as any[]) {
      const currentStepOrder = enrollment.current_step || 0

      const { data: step, error: stepError } = await supabase
        .from("drip_steps")
        .select("*")
        .eq("campaign_id", enrollment.campaign_id)
        .eq("step_order", currentStepOrder)
        .single()

      if (stepError || !step) {
        await supabase
          .from("drip_enrollments")
          .update({ status: "completed", next_run_at: null, completed_at: now.toISOString() })
          .eq("id", enrollment.id)

        results.push({ enrollmentId: enrollment.id, status: "completed", reason: "No more steps" })
        continue
      }

      const lead = enrollment.leads
      if (!lead) {
        results.push({ enrollmentId: enrollment.id, status: "skipped", reason: "No lead found" })
        continue
      }

      let stepExecuted = false
      let message = ""

      try {
        if (step.step_type === "email" && lead.email) {
          stepExecuted = await sendEmail({
            to: lead.email,
            subject: step.subject || "Message from McKinney One",
            body: step.content || "",
          })
          message = stepExecuted ? `Email sent to ${lead.email}` : "Email failed"
        } else if (step.step_type === "sms" && lead.phone) {
          stepExecuted = await sendSms({
            to: lead.phone,
            body: step.content || "",
          })
          message = stepExecuted ? `SMS sent to ${lead.phone}` : "SMS failed"
        } else if (step.step_type === "task") {
          await supabase.from("lead_activities").insert({
            lead_id: enrollment.lead_id,
            type: "note",
            description: `[Campaign Task] ${step.content}`,
          })
          stepExecuted = true
          message = "Task created"
        } else {
          message = `Missing contact: email=${lead.email}, phone=${lead.phone}`
        }

        if (stepExecuted) {
          const { data: nextStep } = await supabase
            .from("drip_steps")
            .select("delay_days, delay_hours")
            .eq("campaign_id", enrollment.campaign_id)
            .eq("step_order", currentStepOrder + 1)
            .single()

          let nextRunAt: string | null = null
          if (nextStep) {
            const delayMs =
              (nextStep.delay_days || 0) * 24 * 60 * 60 * 1000 + (nextStep.delay_hours || 0) * 60 * 60 * 1000
            nextRunAt = new Date(Date.now() + (delayMs || 60000)).toISOString()
          }

          await supabase
            .from("drip_enrollments")
            .update({
              current_step: currentStepOrder + 1,
              next_run_at: nextRunAt,
              status: nextRunAt ? "active" : "completed",
              completed_at: nextRunAt ? null : now.toISOString(),
            })
            .eq("id", enrollment.id)

          await supabase.from("drip_logs").insert({
            enrollment_id: enrollment.id,
            step_id: step.id,
            status: "sent",
          })
        }

        results.push({
          enrollmentId: enrollment.id,
          leadEmail: lead.email,
          leadPhone: lead.phone,
          stepType: step.step_type,
          stepOrder: currentStepOrder,
          executed: stepExecuted,
          message,
        })
      } catch (err) {
        results.push({
          enrollmentId: enrollment.id,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} enrollments`,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
