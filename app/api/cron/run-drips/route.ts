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

interface DripStep {
  id: string
  campaign_id: string
  step_order: number
  step_type: string // 'email', 'sms', 'task'
  delay_days: number
  delay_hours: number
  subject: string | null
  content: string
}

interface EnrollmentWithDetails {
  id: string
  campaign_id: string
  lead_id: string
  current_step: number
  status: string
  next_run_at: string
  leads: Lead
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
      console.error("Error fetching enrollments:", enrollmentError)
      return NextResponse.json(
        { error: "Failed to fetch enrollments", details: enrollmentError.message },
        { status: 500 },
      )
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: "No active enrollments due", processed: 0 })
    }

    const results: {
      enrollmentId: string
      stepsExecuted: number
      completed: boolean
      error?: string
    }[] = []

    for (const enrollment of enrollments as unknown as EnrollmentWithDetails[]) {
      const currentStepOrder = enrollment.current_step || 0

      const { data: step, error: stepError } = await supabase
        .from("drip_steps")
        .select("*")
        .eq("campaign_id", enrollment.campaign_id)
        .eq("step_order", currentStepOrder)
        .single()

      if (stepError || !step) {
        // No more steps - mark as completed
        await supabase
          .from("drip_enrollments")
          .update({ status: "completed", next_run_at: null, completed_at: now.toISOString() })
          .eq("id", enrollment.id)

        results.push({
          enrollmentId: enrollment.id,
          stepsExecuted: 0,
          completed: true,
        })
        continue
      }

      const typedStep = step as DripStep
      const lead = enrollment.leads
      if (!lead) {
        results.push({
          enrollmentId: enrollment.id,
          stepsExecuted: 0,
          completed: false,
          error: "No lead found",
        })
        continue
      }

      let stepExecuted = false
      let stepError2: string | undefined

      try {
        // Execute based on step type
        if (typedStep.step_type === "email" && lead.email) {
          const sent = await sendEmail({
            to: lead.email,
            subject: typedStep.subject || "Message from McKinney One",
            body: typedStep.content || "",
          })
          stepExecuted = sent
          if (!sent) stepError2 = "Email send failed"
        } else if (typedStep.step_type === "sms" && lead.phone) {
          const sent = await sendSms({
            to: lead.phone,
            body: typedStep.content || "",
          })
          stepExecuted = sent
          if (!sent) stepError2 = "SMS send failed"
        } else if (typedStep.step_type === "task") {
          // Create an activity record as a task for the agent
          await supabase.from("lead_activities").insert({
            lead_id: enrollment.lead_id,
            type: "note",
            description: `[Campaign Task] ${typedStep.content}`,
          })
          stepExecuted = true
        } else {
          stepError2 = `Missing contact info for ${typedStep.step_type}: email=${lead.email}, phone=${lead.phone}`
        }

        if (stepExecuted) {
          // Get next step to calculate next_run_at
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
            // If no delay, run in 1 minute (for testing)
            nextRunAt = new Date(Date.now() + (delayMs || 60000)).toISOString()
          }

          // Update enrollment progress
          await supabase
            .from("drip_enrollments")
            .update({
              current_step: currentStepOrder + 1,
              next_run_at: nextRunAt,
              status: nextRunAt ? "active" : "completed",
              completed_at: nextRunAt ? null : now.toISOString(),
            })
            .eq("id", enrollment.id)

          // Log the step execution
          await supabase.from("drip_logs").insert({
            enrollment_id: enrollment.id,
            step_id: typedStep.id,
            status: "sent",
          })

          results.push({
            enrollmentId: enrollment.id,
            stepsExecuted: 1,
            completed: !nextRunAt,
          })
        } else {
          // Log the failed step
          await supabase.from("drip_logs").insert({
            enrollment_id: enrollment.id,
            step_id: typedStep.id,
            status: "failed",
            error_message: stepError2,
          })

          results.push({
            enrollmentId: enrollment.id,
            stepsExecuted: 0,
            completed: false,
            error: stepError2,
          })
        }
      } catch (err) {
        console.error(`Error executing step for enrollment ${enrollment.id}:`, err)
        results.push({
          enrollmentId: enrollment.id,
          stepsExecuted: 0,
          completed: false,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    const totalSteps = results.reduce((sum, r) => sum + r.stepsExecuted, 0)
    const completedEnrollments = results.filter((r) => r.completed).length
    const failedEnrollments = results.filter((r) => r.error).length

    return NextResponse.json({
      message: `Processed ${results.length} enrollments, executed ${totalSteps} steps, completed ${completedEnrollments}, failed ${failedEnrollments}`,
      processed: results.length,
      stepsExecuted: totalSteps,
      completedEnrollments,
      failedEnrollments,
      results,
    })
  } catch (error) {
    console.error("Error in run-drips cron:", error)
    return NextResponse.json(
      { error: "Failed to process drip campaigns", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
