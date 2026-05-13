import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import { sendSms } from "@/lib/sms/send-sms"

/**
 * Cron job to execute due drip campaign steps from the drip_enrollments table.
 * This handles the drip_campaigns / drip_steps / drip_enrollments tables.
 * The main campaigns system uses /api/cron/campaigns instead.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    const now = new Date()

    // Fetch active drip enrollments that are due
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("drip_enrollments")
      .select(`
        id,
        campaign_id,
        lead_id,
        agent_id,
        current_step,
        status,
        next_run_at
      `)
      .eq("status", "active")
      .lte("next_run_at", now.toISOString())
      .limit(100)

    if (enrollmentError) {
      console.error("Error fetching drip enrollments:", enrollmentError)
      return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: "No active drip enrollments due", processed: 0 })
    }

    const results: {
      enrollmentId: string
      stepsExecuted: number
      completed: boolean
    }[] = []

    for (const enrollment of enrollments) {
      try {
        // Get lead data
        const { data: lead } = await supabase
          .from("leads")
          .select("id, first_name, last_name, email, phone, agent_id")
          .eq("id", enrollment.lead_id)
          .single()

        if (!lead) continue

        const nextStepNumber = (enrollment.current_step || 0) + 1

        // Get the next step for this drip campaign
        const { data: step, error: stepError } = await supabase
          .from("drip_steps")
          .select("*")
          .eq("campaign_id", enrollment.campaign_id)
          .eq("step_order", nextStepNumber)
          .single()

        if (stepError || !step) {
          // No more steps - mark as completed
          await supabase
            .from("drip_enrollments")
            .update({ status: "completed", completed_at: now.toISOString(), next_run_at: null })
            .eq("id", enrollment.id)

          results.push({
            enrollmentId: enrollment.id,
            stepsExecuted: 0,
            completed: true,
          })
          continue
        }

        let stepExecuted = false

        // Execute based on step type
        if (step.step_type === "email" && lead.email) {
          const sent = await sendEmail({
            to: lead.email,
            subject: step.subject || "Message from McKinney One",
            body: step.content || "",
          })
          stepExecuted = sent
        } else if (step.step_type === "sms" && lead.phone) {
          const sent = await sendSms({
            to: lead.phone,
            body: step.content || "",
          })
          stepExecuted = sent
        } else if (step.step_type === "task") {
          // Create an activity record as a task for the agent
          await supabase.from("activities").insert({
            agent_id: enrollment.agent_id || lead.agent_id,
            lead_id: enrollment.lead_id,
            activity_type: "task",
            subject: "Drip Campaign Task",
            description: step.content,
            due_at: now.toISOString(),
            completed: false,
          })
          stepExecuted = true
        }

        if (stepExecuted) {
          // Get next step to calculate next_run_at
          const { data: nextStep } = await supabase
            .from("drip_steps")
            .select("delay_days, delay_hours")
            .eq("campaign_id", enrollment.campaign_id)
            .eq("step_order", nextStepNumber + 1)
            .single()

          let nextRunAt: string | null = null
          if (nextStep) {
            const delayMs = ((nextStep.delay_days || 0) * 24 + (nextStep.delay_hours || 0)) * 60 * 60 * 1000
            nextRunAt = new Date(Date.now() + delayMs).toISOString()
          }

          // Update enrollment progress
          await supabase
            .from("drip_enrollments")
            .update({
              current_step: nextStepNumber,
              next_run_at: nextRunAt,
              status: nextRunAt ? "active" : "completed",
              completed_at: nextRunAt ? null : now.toISOString(),
            })
            .eq("id", enrollment.id)

          // Log the step execution
          await supabase.from("drip_logs").insert({
            enrollment_id: enrollment.id,
            step_id: step.id,
            status: "sent",
            sent_at: now.toISOString(),
          })

          results.push({
            enrollmentId: enrollment.id,
            stepsExecuted: 1,
            completed: !nextRunAt,
          })
        }
      } catch (stepError) {
        console.error(`Error executing step for drip enrollment ${enrollment.id}:`, stepError)
        
        // Log the error
        await supabase.from("drip_logs").insert({
          enrollment_id: enrollment.id,
          status: "failed",
          error_message: String(stepError),
        })
      }
    }

    const totalSteps = results.reduce((sum, r) => sum + r.stepsExecuted, 0)
    const completedEnrollments = results.filter((r) => r.completed).length

    return NextResponse.json({
      message: `Processed ${results.length} drip enrollments, executed ${totalSteps} steps, completed ${completedEnrollments}`,
      processed: results.length,
      stepsExecuted: totalSteps,
      completedEnrollments,
    })
  } catch (error) {
    console.error("Error in run-drips cron:", error)
    return NextResponse.json({ error: "Failed to process drip campaigns" }, { status: 500 })
  }
}
