import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import twilio from "twilio"
import { generateText } from "ai"

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const getResend = () => new Resend(process.env.RESEND_API_KEY)

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

  const { data: templates, error: templatesError } = await serviceSupabase
    .from("mission_templates")
    .select("id, title, description, points, category")
    .eq("is_active", true)
    .contains("active_days", [dayOfWeek])

  if (templatesError || !templates || templates.length === 0) {
    console.error("[Cron] No mission templates found for today:", templatesError)
    return results
  }

  console.log("[Cron] Found", templates.length, "mission templates for today")

  const prospectingMissions = templates.filter((t) => t.category === "prospecting")
  const marketingMissions = templates.filter((t) => t.category === "marketing")
  const otherMissions = templates.filter((t) => t.category !== "prospecting" && t.category !== "marketing")

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

      // Auto-assign 3 missions for new agents
      if (isNewAgent) {
        const selectedTemplates = []

        // Add 1 prospecting mission
        if (prospectingMissions.length > 0) {
          const randomProspecting = prospectingMissions[Math.floor(Math.random() * prospectingMissions.length)]
          selectedTemplates.push(randomProspecting)
        }

        // Add 1 marketing mission
        if (marketingMissions.length > 0) {
          const randomMarketing = marketingMissions[Math.floor(Math.random() * marketingMissions.length)]
          selectedTemplates.push(randomMarketing)
        }

        // Add 1 other mission (or any random if we don't have enough specific categories)
        const remainingPool = [...otherMissions, ...prospectingMissions, ...marketingMissions].filter(
          (t) => !selectedTemplates.find((s) => s.id === t.id),
        )

        if (remainingPool.length > 0 && selectedTemplates.length < 3) {
          const randomOther = remainingPool[Math.floor(Math.random() * remainingPool.length)]
          selectedTemplates.push(randomOther)
        }

        // Fallback: if we still don't have 3, just grab random ones
        while (selectedTemplates.length < 3 && templates.length >= 3) {
          const available = templates.filter((t) => !selectedTemplates.find((s) => s.id === t.id))
          if (available.length === 0) break
          const random = available[Math.floor(Math.random() * available.length)]
          selectedTemplates.push(random)
        }

        if (selectedTemplates.length < 3) {
          results.errors.push(`Could not select enough diverse missions for ${agent.Name}`)
          continue
        }

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
            const totalXP = selectedTemplates.reduce((sum, m) => sum + (m.points || 0), 0)
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.mckinneyrealtyco.com"

            const emailHtml = `
              <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <!-- Import Montserrat Font -->
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                
                <!-- Hero Section -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 24px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
                    Good Morning, ${agent.Name}! ☀️
                  </h1>
                  <p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 18px; font-weight: 600;">
                    ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>

                <!-- Personal Motivational Message -->
                <div style="padding: 40px 32px 32px 32px; background: #ffffff;">
                  <p style="margin: 0; color: #1f2937; font-size: 18px; line-height: 1.7; font-weight: 600;">
                    Here's what I've lined up for you today 🎯
                  </p>
                  <p style="margin: 16px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
                    It's not about doing everything—it's about <strong style="color: #667eea;">consistently doing the work that matters most</strong>. These 3 missions are carefully chosen to move your business forward today.
                  </p>
                  
                  <!-- Compound Effect Box -->
                  <div style="margin: 24px 0 0 0; padding: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e3a8a; font-size: 17px; line-height: 1.7; font-weight: 700; text-align: center;">
                      3 actions every morning = <span style="color: #2563eb;">900+ completed tasks</span> by year-end
                    </p>
                    <p style="margin: 12px 0 0 0; color: #1e40af; font-size: 15px; line-height: 1.6; text-align: center; font-weight: 600;">
                      Consistency is key. 1% better everyday.
                    </p>
                  </div>
                </div>

                <!-- Total XP Badge -->
                <div style="padding: 0 32px 32px 32px; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px 48px; border-radius: 50px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);">
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                      XP Available Today
                    </p>
                    <p style="margin: 6px 0 0 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
                      ${totalXP} XP
                    </p>
                  </div>
                </div>

                <!-- Missions List -->
                <div style="padding: 0 32px 40px 32px;">
                  <h2 style="margin: 0 0 24px 0; color: #1f2937; font-size: 22px; font-weight: 700;">
                    Your 3 Missions Today
                  </h2>
                  ${selectedTemplates
                    .map(
                      (mission, index) => `
                    <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%); border: 2px solid #667eea; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
                      <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                          ${index + 1}
                        </div>
                        <div style="flex: 1;">
                          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: 700; line-height: 1.3;">
                            ${mission.title}
                          </h3>
                          <p style="margin: 0 0 14px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                            ${mission.description || "Complete this mission to earn XP and build momentum!"}
                          </p>
                          <div style="display: inline-flex; align-items: center; gap: 6px; background: #fbbf24; color: #78350f; padding: 8px 18px; border-radius: 24px; font-size: 14px; font-weight: 700;">
                            <span style="font-size: 16px;">⚡</span>
                            <span>${mission.points || 10} XP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  `,
                    )
                    .join("")}
                </div>

                <!-- CTA Button -->
                <div style="padding: 0 32px 48px 32px; text-align: center;">
                  <a href="${appUrl}/dashboard/missions" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 800; font-size: 17px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); text-transform: uppercase; letter-spacing: 1px;">
                    Let's Go! 🚀
                  </a>
                </div>

                <!-- Footer -->
                <div style="padding: 32px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 15px; font-weight: 600;">
                    I believe in you. Let's make today great.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                    McKinney Realty Co
                  </p>
                </div>
              </div>
            `

            await getResend().emails.send({
              from: "McKinney Realty Missions <missions@mckinneyrealtyco.com>",
              to: agent.Email,
              subject: `🌟 Your Daily Missions Are Here! - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
              html: emailHtml,
            })

            results.emailed++
            console.log("[Cron] Sent motivating mission email to", agent.Email)
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
        await getResend().emails.send({
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

        await getResend().emails.send({
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
