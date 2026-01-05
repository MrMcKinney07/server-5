import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import twilio from "twilio"
import { generateText } from "ai"

const resend = new Resend(process.env.RESEND_API_KEY)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = {
    missionAssignment: { processed: 0, emailed: 0, errors: [] as string[] },
    campaigns: { processed: 0, errors: [] as string[] },
  }

  try {
    const assignmentResults = await assignDailyMissionsAndEmail()
    results.missionAssignment = assignmentResults
  } catch (error) {
    results.missionAssignment.errors.push(error instanceof Error ? error.message : "Unknown error")
  }

  // Always process campaigns (runs every 15 minutes if needed)
  try {
    const campaignResults = await processCampaigns()
    results.campaigns.processed = campaignResults.processed
    results.campaigns.errors = campaignResults.errors
  } catch (error) {
    results.campaigns.errors.push(error instanceof Error ? error.message : "Unknown error")
  }

  return NextResponse.json({ success: true, results })
}

async function assignDailyMissionsAndEmail() {
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const results = { processed: 0, emailed: 0, errors: [] as string[] }
  const today = new Date().toISOString().split("T")[0]
  const dayOfWeek = new Date().getDay() // 0-6 (Sunday-Saturday)

  console.log("[Cron] Starting daily mission assignment for", today, "day:", dayOfWeek)

  // Get all active agents with their account creation dates
  const { data: agents, error: agentsError } = await serviceSupabase
    .from("agents")
    .select("id, Name, Email, created_at, is_active")
    .eq("is_active", true)

  if (agentsError || !agents || agents.length === 0) {
    console.error("[Cron] Failed to fetch agents:", agentsError)
    return results
  }

  console.log("[Cron] Found", agents.length, "active agents")

  // Get mission templates active for today
  const { data: templates, error: templatesError } = await serviceSupabase
    .from("mission_templates")
    .select("id, title, description, points")
    .eq("is_active", true)
    .contains("active_days", [dayOfWeek])

  if (templatesError || !templates || templates.length === 0) {
    console.error("[Cron] No mission templates found for today:", templatesError)
    return results
  }

  console.log("[Cron] Found", templates.length, "mission templates for today")

  // Process each agent
  for (const agent of agents) {
    try {
      // Check if agent already has missions for today
      const { data: existingSet } = await serviceSupabase
        .from("daily_mission_sets")
        .select("id")
        .eq("user_id", agent.id)
        .eq("mission_date", today)
        .single()

      if (existingSet) {
        console.log("[Cron] Agent", agent.Name, "already has missions for today")
        continue
      }

      // Check if agent is within first 6 months (auto-assignment period)
      const accountAge = Date.now() - new Date(agent.created_at).getTime()
      const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000
      const isNewAgent = accountAge < sixMonthsInMs

      // Auto-assign 3 random missions for new agents
      if (isNewAgent) {
        // Shuffle templates and pick 3
        const shuffled = [...templates].sort(() => Math.random() - 0.5)
        const selectedTemplates = shuffled.slice(0, 3)

        // Create daily mission set
        const { data: newSet, error: setError } = await serviceSupabase
          .from("daily_mission_sets")
          .insert({
            user_id: agent.id,
            mission_date: today,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (setError || !newSet) {
          results.errors.push(`Failed to create mission set for ${agent.Name}: ${setError?.message}`)
          continue
        }

        // Insert mission items
        const missionItems = selectedTemplates.map((template) => ({
          daily_set_id: newSet.id,
          mission_template_id: template.id,
          status: "assigned",
          created_at: new Date().toISOString(),
        }))

        const { error: itemsError } = await serviceSupabase.from("daily_mission_items").insert(missionItems)

        if (itemsError) {
          results.errors.push(`Failed to create mission items for ${agent.Name}: ${itemsError.message}`)
          continue
        }

        results.processed++
        console.log("[Cron] Auto-assigned", selectedTemplates.length, "missions to", agent.Name)

        // Send email with mission list
        if (agent.Email) {
          try {
            const missionsList = selectedTemplates
              .map((m, i) => `${i + 1}. ${m.title} (${m.points} XP)\n   ${m.description}`)
              .join("\n\n")

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1a1a1a; margin-bottom: 10px;">Good Morning, ${agent.Name || "Agent"}! ☀️</h1>
                <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                  Your daily missions have been assigned. Complete them to earn XP and climb the leaderboard!
                </p>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; margin: 24px 0;">
                  <h2 style="color: white; margin: 0 0 16px 0; font-size: 18px;">Today's Missions - ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h2>
                  <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px;">
                    <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; color: white; margin: 0; line-height: 1.6;">${missionsList}</pre>
                  </div>
                </div>
                <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                  💡 <strong>Tip:</strong> You're in your first 6 months, so missions are automatically selected for you. 
                  After 6 months, you'll be able to choose your own missions!
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.mckinneyrealtyco.com"}/dashboard/missions" 
                   style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px;">
                  View My Missions →
                </a>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                  McKinney Realty Co | Level up your real estate career
                </p>
              </div>
            `

            await resend.emails.send({
              from: "McKinney Realty Missions <missions@mckinneyrealtyco.com>",
              to: agent.Email,
              subject: `Your Daily Missions - ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
              html: emailHtml,
            })

            results.emailed++
            console.log("[Cron] Sent mission email to", agent.Email)
          } catch (emailError) {
            console.error(`[Cron] Failed to send email to ${agent.Email}:`, emailError)
            results.errors.push(
              `Email failed for ${agent.Name}: ${emailError instanceof Error ? emailError.message : "Unknown"}`,
            )
          }
        }
      } else {
        // Veteran agents (6+ months) don't get auto-assigned missions
        console.log("[Cron] Agent", agent.Name, "is a veteran - they select their own missions")
      }
    } catch (agentError) {
      results.errors.push(
        `Error processing agent ${agent.Name}: ${agentError instanceof Error ? agentError.message : "Unknown"}`,
      )
    }
  }

  console.log("[Cron] Mission assignment complete. Processed:", results.processed, "Emailed:", results.emailed)
  return results
}

async function processCampaigns() {
  const supabase = await createClient()
  const results = { processed: 0, errors: [] as string[] }

  // Get all enrollments that are due
  const { data: dueEnrollments, error } = await supabase
    .from("lead_campaign_enrollments")
    .select(`
      id,
      lead_id,
      campaign_id,
      current_step,
      leads (
        id,
        name,
        email,
        phone,
        budget,
        timeline,
        property_type
      ),
      campaigns (
        id,
        name,
        owner_id
      )
    `)
    .eq("status", "active")
    .lte("next_run_at", new Date().toISOString())

  if (error || !dueEnrollments || dueEnrollments.length === 0) {
    return results
  }

  for (const enrollment of dueEnrollments) {
    try {
      const lead = enrollment.leads as any
      const campaign = enrollment.campaigns as any

      if (!lead || !campaign) continue

      // Get the next step
      const { data: step } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_id", enrollment.campaign_id)
        .eq("step_number", enrollment.current_step + 1)
        .single()

      if (!step) {
        // No more steps, mark as completed
        await supabase.from("lead_campaign_enrollments").update({ status: "completed" }).eq("id", enrollment.id)

        await supabase.from("campaign_logs").insert({
          lead_id: enrollment.lead_id,
          campaign_id: enrollment.campaign_id,
          event: "campaign_completed",
          info: { completed_at: new Date().toISOString() },
        })

        results.processed++
        continue
      }

      // Process the step based on type
      let content = step.body || ""

      // AI personalization if enabled
      if (step.ai_personalize && content) {
        try {
          const { text } = await generateText({
            model: "openai/gpt-4o-mini",
            prompt: `Personalize this message for a real estate lead:
            
Lead Info:
- Name: ${lead.name || "there"}
- Budget: ${lead.budget || "Not specified"}
- Timeline: ${lead.timeline || "Not specified"}
- Property Interest: ${lead.property_type || "Not specified"}

Original Message:
${content}

Rewrite the message to be personalized and engaging. Keep the same tone and intent.`,
          })
          content = text
        } catch (aiError) {
          console.error("AI personalization failed:", aiError)
        }
      }

      // Send based on step type
      if (step.type === "email" && lead.email) {
        await resend.emails.send({
          from: "McKinney Realty <campaigns@mckinneyrealtyco.com>",
          to: lead.email,
          subject: step.subject || "Message from McKinney Realty",
          html: `<div style="font-family: Arial, sans-serif;">${content.replace(/\n/g, "<br>")}</div>`,
        })
      } else if (step.type === "sms" && lead.phone) {
        await twilioClient.messages.create({
          body: content,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: lead.phone,
        })
      } else if (step.type === "property_recommendation" && lead.email) {
        // Generate AI property recommendations
        const { text: recommendations } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: `Generate 3 property recommendations for a real estate lead:
          
Lead Preferences:
- Budget: ${lead.budget || "Not specified"}
- Property Type: ${lead.property_type || "Any"}
- Timeline: ${lead.timeline || "Flexible"}

Format as a brief, friendly email with 3 fictional but realistic property suggestions that match their criteria.`,
        })

        await resend.emails.send({
          from: "McKinney Realty <recommendations@mckinneyrealtyco.com>",
          to: lead.email,
          subject: "Properties You Might Love",
          html: `<div style="font-family: Arial, sans-serif;">${recommendations.replace(/\n/g, "<br>")}</div>`,
        })
      }

      // Log the step execution
      await supabase.from("campaign_logs").insert({
        lead_id: enrollment.lead_id,
        campaign_id: enrollment.campaign_id,
        step_id: step.id,
        event: "step_executed",
        info: { step_type: step.type, step_number: step.step_number },
      })

      // Update enrollment to next step
      const nextRunAt = new Date()
      nextRunAt.setHours(nextRunAt.getHours() + (step.delay_hours || 24))

      await supabase
        .from("lead_campaign_enrollments")
        .update({
          current_step: enrollment.current_step + 1,
          next_run_at: nextRunAt.toISOString(),
        })
        .eq("id", enrollment.id)

      results.processed++
    } catch (stepError) {
      results.errors.push(
        `Failed to process enrollment ${enrollment.id}: ${stepError instanceof Error ? stepError.message : "Unknown error"}`,
      )
    }
  }

  return results
}
