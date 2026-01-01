import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send-email"
import { sendSms } from "@/lib/sms/send-sms"

// Use service role for cron job
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

interface EnrollmentWithDetails {
  id: string
  campaign_id: string
  lead_id: string
  current_step: number
  status: string
  next_run_at: string
  lead: Lead
}

/**
 * Cron job to execute due drip campaign steps.
 *
 * For each active enrollment (not paused, not completed):
 * 1. Find steps where delay has elapsed since last step
 * 2. Execute steps in order that haven't been executed yet
 * 3. Mark enrollment as completed when all steps are done
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("lead_campaign_enrollments")
      .select(`
        id,
        campaign_id,
        lead_id,
        current_step,
        status,
        next_run_at,
        lead:leads(id, first_name, last_name, email, phone)
      `)
      .eq("status", "active")
      .lte("next_run_at", now.toISOString())
      .limit(100)

    if (enrollmentError) {
      console.error("Error fetching enrollments:", enrollmentError)
      return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: "No active enrollments due", processed: 0 })
    }

    const results: {
      enrollmentId: string
      stepsExecuted: number
      completed: boolean
    }[] = []

    for (const enrollment of enrollments as unknown as EnrollmentWithDetails[]) {
      const nextStepNumber = (enrollment.current_step || 0) + 1

      // Get the next step for this campaign
      const { data: step, error: stepError } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_id", enrollment.campaign_id)
        .eq("step_number", nextStepNumber)
        .single()

      if (stepError || !step) {
        // No more steps - mark as completed
        await supabase
          .from("lead_campaign_enrollments")
          .update({ status: "completed", next_run_at: null })
          .eq("id", enrollment.id)

        results.push({
          enrollmentId: enrollment.id,
          stepsExecuted: 0,
          completed: true,
        })
        continue
      }

      const lead = enrollment.lead
      if (!lead) continue

      let stepExecuted = false

      try {
        // Execute based on step type
        if (step.type === "email" && lead.email) {
          const sent = await sendEmail({
            to: lead.email,
            subject: step.subject || "Message from McKinney One",
            body: step.body || "",
          })
          stepExecuted = sent
        } else if (step.type === "sms" && lead.phone) {
          const sent = await sendSms({
            to: lead.phone,
            body: step.body || "",
          })
          stepExecuted = sent
        } else if (step.type === "task") {
          // Create an activity record as a task for the agent
          await supabase.from("lead_activities").insert({
            lead_id: enrollment.lead_id,
            type: "note",
            description: `[Campaign Task] ${step.body}`,
          })
          stepExecuted = true
        }

        if (stepExecuted) {
          // Get next step to calculate next_run_at
          const { data: nextStep } = await supabase
            .from("campaign_steps")
            .select("delay_hours")
            .eq("campaign_id", enrollment.campaign_id)
            .eq("step_number", nextStepNumber + 1)
            .single()

          const nextRunAt = nextStep
            ? new Date(Date.now() + (nextStep.delay_hours || 1) * 60 * 60 * 1000).toISOString()
            : null

          // Update enrollment progress
          await supabase
            .from("lead_campaign_enrollments")
            .update({
              current_step: nextStepNumber,
              next_run_at: nextRunAt,
              status: nextRunAt ? "active" : "completed",
            })
            .eq("id", enrollment.id)

          // Log the step execution
          await supabase.from("campaign_logs").insert({
            lead_id: enrollment.lead_id,
            campaign_id: enrollment.campaign_id,
            step_id: step.id,
            event: `${step.type}_sent`,
            info: { step_number: nextStepNumber },
          })

          results.push({
            enrollmentId: enrollment.id,
            stepsExecuted: 1,
            completed: !nextRunAt,
          })
        }
      } catch (stepError) {
        console.error(`Error executing step for enrollment ${enrollment.id}:`, stepError)
      }
    }

    const totalSteps = results.reduce((sum, r) => sum + r.stepsExecuted, 0)
    const completedEnrollments = results.filter((r) => r.completed).length

    return NextResponse.json({
      message: `Processed ${results.length} enrollments, executed ${totalSteps} steps, completed ${completedEnrollments}`,
      processed: results.length,
      stepsExecuted: totalSteps,
      completedEnrollments,
    })
  } catch (error) {
    console.error("Error in run-drips cron:", error)
    return NextResponse.json({ error: "Failed to process drip campaigns" }, { status: 500 })
  }
}
