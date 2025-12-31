import { createClient } from "@supabase/supabase-js"
import { generateText } from "ai"
import { NextResponse } from "next/server"

// Use service role for cron job
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const results = { processed: 0, emails: 0, sms: 0, propertyRecs: 0, errors: [] as string[] }

  try {
    const { data: dueEnrollments, error: fetchError } = await supabase
      .from("lead_campaign_enrollments")
      .select(`
        *,
        lead:leads(*),
        campaign:campaigns(
          *,
          owner:agents!owner_id(Name, Email)
        )
      `)
      .eq("status", "active")
      .lte("next_run_at", now.toISOString())
      .limit(100)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!dueEnrollments || dueEnrollments.length === 0) {
      return NextResponse.json({ message: "No campaigns due", ...results })
    }

    for (const enrollment of dueEnrollments) {
      try {
        if (!enrollment.campaign || !enrollment.lead) {
          continue
        }

        const nextStepNumber = (enrollment.current_step || 0) + 1

        // Get the next step
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

          await supabase.from("campaign_logs").insert({
            lead_id: enrollment.lead_id,
            campaign_id: enrollment.campaign_id,
            event: "completed",
            info: { total_steps: enrollment.current_step },
          })

          results.processed++
          continue
        }

        const lead = enrollment.lead
        const campaign = enrollment.campaign
        let content = step.body || ""
        let subject = step.subject || ""

        const agentName = campaign.owner?.Name || "McKinney Realty Team"

        // AI personalization if enabled
        if (step.ai_personalize && lead) {
          const personalizationPrompt = `
You are a real estate agent assistant. Personalize the following ${step.type} content for a lead.

Lead Info:
- Name: ${lead.first_name} ${lead.last_name}
- Type: ${lead.lead_type}
- Budget: $${lead.budget_min || 0} - $${lead.budget_max || "unlimited"}
- Property Interest: ${lead.property_interest || "Not specified"}
- Timeline: ${lead.timeline || "Not specified"}

Agent Name: ${agentName}

Original Content:
${content}

Instructions:
- Replace any placeholders like {{first_name}}, {{agent_name}} with actual values
- Make the message feel personal and relevant
- Keep the same general structure and call-to-action
- For SMS, keep under 160 characters
- Be warm and professional

Return ONLY the personalized message, nothing else.
`
          try {
            const { text } = await generateText({
              model: "openai/gpt-4o-mini",
              prompt: personalizationPrompt,
            })
            content = text

            // Personalize subject too for emails
            if (step.type === "email" && subject) {
              const { text: subjectText } = await generateText({
                model: "openai/gpt-4o-mini",
                prompt: `Personalize this email subject line for ${lead.first_name}: "${subject}". Return ONLY the subject line.`,
              })
              subject = subjectText
            }
          } catch (aiError) {
            // Fall back to manual placeholder replacement
            content = replacePlaceholders(content, lead, agentName)
            subject = replacePlaceholders(subject, lead, agentName)
          }
        } else if (lead) {
          // Manual placeholder replacement
          content = replacePlaceholders(content, lead, agentName)
          subject = replacePlaceholders(subject, lead, agentName)
        }

        const campaignChannel = campaign.channel || "EMAIL"

        // Execute the step based on type AND campaign channel
        if ((step.type === "email" || campaignChannel === "EMAIL" || campaignChannel === "BOTH") && lead?.email) {
          // Send email via Resend
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "McKinney Realty <noreply@mckinneyrealtyco.com>",
              to: lead.email,
              subject: subject || "Message from McKinney Realty",
              html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <p>${content.replace(/\n/g, "<br>")}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                  ${agentName}<br>
                  McKinney Realty Co.
                </p>
              </div>`,
            }),
          })

          if (emailRes.ok) {
            results.emails++
          }
        }

        if ((step.type === "sms" || campaignChannel === "SMS" || campaignChannel === "BOTH") && lead?.phone) {
          // Send SMS via Twilio
          const twilioAuth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString(
            "base64",
          )

          const smsRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${twilioAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: lead.phone,
                From: process.env.TWILIO_PHONE_NUMBER!,
                Body: content,
              }),
            },
          )

          if (smsRes.ok) {
            results.sms++
          }
        }

        if (step.type === "property_recommendation" && lead?.email) {
          // Get property recommendations based on lead preferences
          const { data: properties } = await supabase
            .from("properties")
            .select("*")
            .eq("status", "active")
            .gte("price", lead.budget_min || 0)
            .lte("price", lead.budget_max || 10000000)
            .limit(3)

          if (properties && properties.length > 0) {
            const propertyList = properties
              .map(
                (p) =>
                  `<div style="margin: 15px 0; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
                    <h3 style="margin: 0 0 5px 0;">${p.address}</h3>
                    <p style="margin: 0; color: #666;">${p.city}, ${p.state} ${p.zip}</p>
                    <p style="margin: 10px 0; font-size: 18px; font-weight: bold; color: #2563eb;">
                      $${p.price?.toLocaleString()}
                    </p>
                    <p style="margin: 0; color: #666;">
                      ${p.beds} bed | ${p.baths} bath | ${p.sqft?.toLocaleString()} sqft
                    </p>
                  </div>`,
              )
              .join("")

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "McKinney Realty <noreply@mckinneyrealtyco.com>",
                to: lead.email,
                subject: `${lead.first_name}, check out these homes just for you!`,
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Hi ${lead.first_name}!</h2>
                  <p>Based on your preferences, I thought you might be interested in these properties:</p>
                  ${propertyList}
                  <p style="margin-top: 20px;">
                    <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                      View All Listings
                    </a>
                  </p>
                  <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                  <p style="color: #666; font-size: 12px;">
                    ${agentName}<br>
                    McKinney Realty Co.
                  </p>
                </div>`,
              }),
            })
            results.propertyRecs++
          }
        }

        // Log the step execution
        await supabase.from("campaign_logs").insert({
          lead_id: enrollment.lead_id,
          campaign_id: enrollment.campaign_id,
          step_id: step.id,
          event: `${step.type}_sent`,
          info: { step_number: nextStepNumber, ai_personalized: step.ai_personalize, channel: campaignChannel },
        })

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

        // Update enrollment
        await supabase
          .from("lead_campaign_enrollments")
          .update({
            current_step: nextStepNumber,
            next_run_at: nextRunAt,
            status: nextRunAt ? "active" : "completed",
          })
          .eq("id", enrollment.id)

        results.processed++
      } catch (stepError) {
        results.errors.push(`Enrollment ${enrollment.id}: ${stepError}`)
      }
    }

    return NextResponse.json({
      message: "Campaign cron completed",
      ...results,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

function replacePlaceholders(text: string, lead: any, agentName: string): string {
  return text
    .replace(/\{\{first_name\}\}/gi, lead.first_name || "")
    .replace(/\{\{last_name\}\}/gi, lead.last_name || "")
    .replace(/\{\{agent_name\}\}/gi, agentName)
    .replace(/\{\{property_interest\}\}/gi, lead.property_interest || "your area")
    .replace(/\{\{budget\}\}/gi, lead.budget_max ? `$${lead.budget_max.toLocaleString()}` : "your budget")
    .replace(/\{\{timeline\}\}/gi, lead.timeline || "soon")
}
