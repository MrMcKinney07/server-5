import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import { sendSms } from "@/lib/sms/send-sms"
import type { CampaignStep, Contact } from "@/lib/types/database"

interface EnrollmentWithDetails {
  id: string
  campaign_id: string
  contact_id: string
  lead_id: string | null
  agent_id: string
  enrolled_at: string
  last_step_executed: number
  contact: Contact
}

/**
 * Cron job to execute due drip campaign steps.
 *
 * For each active enrollment (not paused, not completed):
 * 1. Find steps where delay_minutes has elapsed since enrolled_at
 * 2. Execute steps in order that haven't been executed yet
 * 3. Mark enrollment as completed when all steps are done
 *
 * Configure in vercel.json: schedule every 5 minutes
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()

    // Get all active enrollments with contact info
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("campaign_enrollments")
      .select(
        `
        id,
        campaign_id,
        contact_id,
        lead_id,
        agent_id,
        enrolled_at,
        last_step_executed,
        contact:contacts(*)
      `,
      )
      .eq("is_paused", false)
      .is("completed_at", null)

    if (enrollmentError) {
      console.error("Error fetching enrollments:", enrollmentError)
      return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: "No active enrollments", processed: 0 })
    }

    const results: {
      enrollmentId: string
      stepsExecuted: number
      completed: boolean
    }[] = []

    for (const enrollment of enrollments as unknown as EnrollmentWithDetails[]) {
      const enrolledAt = new Date(enrollment.enrolled_at)
      const minutesSinceEnrollment = Math.floor((now.getTime() - enrolledAt.getTime()) / (1000 * 60))

      // Get all steps for this campaign
      const { data: steps } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_id", enrollment.campaign_id)
        .order("step_number", { ascending: true })

      if (!steps || steps.length === 0) continue

      // Find steps that are due but not yet executed
      const dueSteps = (steps as CampaignStep[]).filter(
        (step) => step.step_number > enrollment.last_step_executed && step.delay_minutes <= minutesSinceEnrollment,
      )

      let stepsExecuted = 0
      let lastExecutedStep = enrollment.last_step_executed

      for (const step of dueSteps) {
        const contact = enrollment.contact

        try {
          switch (step.action_type) {
            case "email":
              if (contact.email) {
                await sendEmail({
                  to: contact.email,
                  subject: step.subject || "Message from McKinney One",
                  body: step.body,
                })
              }
              break

            case "sms":
              if (contact.phone) {
                await sendSms({
                  to: contact.phone,
                  body: step.body,
                })
              }
              break

            case "task":
              // Create an activity record as a task for the agent
              await supabase.from("activities").insert({
                contact_id: enrollment.contact_id,
                lead_id: enrollment.lead_id,
                agent_id: enrollment.agent_id,
                type: "other",
                description: `[Campaign Task] ${step.body}`,
              })
              break
          }

          stepsExecuted++
          lastExecutedStep = step.step_number
        } catch (stepError) {
          console.error(`Error executing step ${step.id}:`, stepError)
          // Continue to next step even if one fails
        }
      }

      // Update enrollment progress
      if (stepsExecuted > 0) {
        const isCompleted = lastExecutedStep >= steps.length
        await supabase
          .from("campaign_enrollments")
          .update({
            last_step_executed: lastExecutedStep,
            completed_at: isCompleted ? now.toISOString() : null,
          })
          .eq("id", enrollment.id)

        results.push({
          enrollmentId: enrollment.id,
          stepsExecuted,
          completed: isCompleted,
        })
      }
    }

    const totalSteps = results.reduce((sum, r) => sum + r.stepsExecuted, 0)
    const completedEnrollments = results.filter((r) => r.completed).length

    return NextResponse.json({
      message: `Processed ${results.length} enrollments, executed ${totalSteps} steps, completed ${completedEnrollments} enrollments`,
      processed: results.length,
      stepsExecuted: totalSteps,
      completedEnrollments,
      results,
    })
  } catch (error) {
    console.error("Error in run-drips cron:", error)
    return NextResponse.json({ error: "Failed to process drip campaigns" }, { status: 500 })
  }
}
