import { createClient } from "@/lib/supabase/server"
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
    morningMissions: { processed: false, error: null as string | null },
    campaigns: { processed: 0, errors: [] as string[] },
  }

  // Check if it's time for morning missions (8 AM CT = 14:00 UTC, run at :00 minutes only)
  const now = new Date()
  const minutes = now.getUTCMinutes()
  const hours = now.getUTCHours()

  if (hours === 14 && minutes === 0) {
    try {
      await processMorningMissions()
      results.morningMissions.processed = true
    } catch (error) {
      results.morningMissions.error = error instanceof Error ? error.message : "Unknown error"
    }
  }

  // Always process campaigns (runs every 15 minutes)
  try {
    const campaignResults = await processCampaigns()
    results.campaigns.processed = campaignResults.processed
    results.campaigns.errors = campaignResults.errors
  } catch (error) {
    results.campaigns.errors.push(error instanceof Error ? error.message : "Unknown error")
  }

  return NextResponse.json({ success: true, results })
}

async function processMorningMissions() {
  const supabase = await createClient()

  // Get all agents with their selected missions
  const { data: agents } = await supabase
    .from("agents")
    .select(`
      id,
      "Name",
      "Email",
      agent_missions (
        mission_templates (
          title,
          description,
          points
        )
      )
    `)
    .not("Email", "is", null)

  if (!agents || agents.length === 0) return

  for (const agent of agents) {
    if (!agent.Email || !agent.agent_missions || agent.agent_missions.length === 0) continue

    const missions = agent.agent_missions.map((am: any) => am.mission_templates).filter(Boolean)

    if (missions.length === 0) continue

    const missionsList = missions
      .map((m: any, i: number) => `${i + 1}. ${m.title} (${m.points} pts)\n   ${m.description}`)
      .join("\n\n")

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Good Morning, ${agent.Name || "Agent"}!</h1>
        <p style="color: #666;">Here are your missions for today:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${missionsList}</pre>
        </div>
        <p style="color: #666;">Complete your missions to earn points and climb the leaderboard!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          View Dashboard
        </a>
      </div>
    `

    try {
      await resend.emails.send({
        from: "McKinney Realty <missions@mckinneyrealtyco.com>",
        to: agent.Email,
        subject: `Your Daily Missions - ${new Date().toLocaleDateString()}`,
        html: emailHtml,
      })
    } catch (error) {
      console.error(`Failed to send email to ${agent.Email}:`, error)
    }
  }
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
