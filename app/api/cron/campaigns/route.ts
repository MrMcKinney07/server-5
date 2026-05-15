import { createServiceClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"
import { sendSms } from "@/lib/sms/send-sms"

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()
  const results = { processed: 0, emails: 0, sms: 0, tasks: 0, errors: [] as string[] }

  try {
    // Process LEAD campaign enrollments (lead_campaign_enrollments table)
    const { data: leadEnrollments, error: leadFetchError } = await supabase
      .from("lead_campaign_enrollments")
      .select(`
        id,
        lead_id,
        campaign_id,
        current_step,
        status,
        next_run_at
      `)
      .eq("status", "active")
      .lte("next_run_at", now.toISOString())
      .limit(50)

    if (leadFetchError) {
      console.error("Error fetching lead enrollments:", leadFetchError)
    }

    // Process CONTACT campaign enrollments (campaign_enrollments table)
    const { data: contactEnrollments, error: contactFetchError } = await supabase
      .from("campaign_enrollments")
      .select(`
        id,
        contact_id,
        campaign_id,
        current_step,
        status,
        next_run_at
      `)
      .eq("status", "active")
      .lte("next_run_at", now.toISOString())
      .limit(50)

    if (contactFetchError) {
      console.error("Error fetching contact enrollments:", contactFetchError)
    }

    // Process lead enrollments
    for (const enrollment of leadEnrollments || []) {
      try {
        // Get lead data
        const { data: lead } = await supabase
          .from("leads")
          .select("id, first_name, last_name, email, phone, agent_id, lead_type, budget_min, budget_max, property_interest, timeline")
          .eq("id", enrollment.lead_id)
          .single()

        if (!lead) continue

        // Get campaign data
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("id, name, channel, owner_id")
          .eq("id", enrollment.campaign_id)
          .single()

        if (!campaign) continue

        // Get agent info for personalization and sender identity
        let agentName = "McKinney Realty Team"
        let agentEmail: string | null = null
        let agentPhone: string | null = null
        let agentAppointmentLink: string | null = null
        if (campaign.owner_id) {
          const { data: agent } = await supabase
            .from("agents")
            .select("Name, Email, Phone, appointment_link")
            .eq("id", campaign.owner_id)
            .single()
          if (agent?.Name) agentName = agent.Name
          if (agent?.Email) agentEmail = agent.Email
          if (agent?.Phone) agentPhone = agent.Phone
          if (agent?.appointment_link) agentAppointmentLink = agent.appointment_link
        }

        const stepResult = await processStep(enrollment, lead, campaign, agentName, agentEmail, agentPhone, agentAppointmentLink, "lead", supabase)
        results.processed++
        if (stepResult.email) results.emails++
        if (stepResult.sms) results.sms++
        if (stepResult.task) results.tasks++
      } catch (err) {
        results.errors.push(`Lead enrollment ${enrollment.id}: ${err}`)
      }
    }

    // Process contact enrollments
    for (const enrollment of contactEnrollments || []) {
      try {
        // Get contact data
        const { data: contact } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email, phone, agent_id")
          .eq("id", enrollment.contact_id)
          .single()

        if (!contact) continue

        // Get campaign data
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("id, name, channel, owner_id")
          .eq("id", enrollment.campaign_id)
          .single()

        if (!campaign) continue

        // Get agent info for personalization and sender identity
        let agentName = "McKinney Realty Team"
        let agentEmail: string | null = null
        let agentPhone: string | null = null
        let agentAppointmentLink: string | null = null
        if (campaign.owner_id) {
          const { data: agent } = await supabase
            .from("agents")
            .select("Name, Email, Phone, appointment_link")
            .eq("id", campaign.owner_id)
            .single()
          if (agent?.Name) agentName = agent.Name
          if (agent?.Email) agentEmail = agent.Email
          if (agent?.Phone) agentPhone = agent.Phone
          if (agent?.appointment_link) agentAppointmentLink = agent.appointment_link
        }

        const stepResult = await processStep(enrollment, contact, campaign, agentName, agentEmail, agentPhone, agentAppointmentLink, "contact", supabase)
        results.processed++
        if (stepResult.email) results.emails++
        if (stepResult.sms) results.sms++
        if (stepResult.task) results.tasks++
      } catch (err) {
        results.errors.push(`Contact enrollment ${enrollment.id}: ${err}`)
      }
    }

    return NextResponse.json({
      message: "Campaign cron completed",
      ...results,
    })
  } catch (error) {
    console.error("Campaign cron error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function processStep(
  enrollment: any,
  recipient: any,
  campaign: any,
  agentName: string,
  agentEmail: string | null,
  agentPhone: string | null,
  agentAppointmentLink: string | null,
  enrollmentType: "lead" | "contact",
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ email: boolean; sms: boolean; task: boolean }> {
  const result = { email: false, sms: false, task: false }
  const nextStepNumber = (enrollment.current_step || 0) + 1
  const tableName = enrollmentType === "lead" ? "lead_campaign_enrollments" : "campaign_enrollments"

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
      .from(tableName)
      .update({ status: "completed", next_run_at: null })
      .eq("id", enrollment.id)

    await supabase.from("campaign_logs").insert({
      lead_id: enrollmentType === "lead" ? enrollment.lead_id : null,
      campaign_id: enrollment.campaign_id,
      event: "completed",
      info: { total_steps: enrollment.current_step, enrollment_type: enrollmentType },
    })
    return result
  }

  let content = step.body || ""
  let subject = step.subject || ""

  // AI personalization if enabled
  if (step.ai_personalize && recipient) {
    try {
      const personalizationPrompt = `
You are a real estate agent assistant. Personalize the following ${step.type} content for a ${enrollmentType}.

${enrollmentType === "lead" ? `Lead Info:
- Name: ${recipient.first_name} ${recipient.last_name}
- Type: ${recipient.lead_type || "Not specified"}
- Budget: $${recipient.budget_min || 0} - $${recipient.budget_max || "unlimited"}
- Property Interest: ${recipient.property_interest || "Not specified"}
- Timeline: ${recipient.timeline || "Not specified"}` : `Contact Info:
- Name: ${recipient.first_name} ${recipient.last_name}`}

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
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: personalizationPrompt,
      })
      content = text

      if (step.type === "email" && subject) {
        const { text: subjectText } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: `Personalize this email subject line for ${recipient.first_name}: "${subject}". Return ONLY the subject line.`,
        })
        subject = subjectText
      }
    } catch {
      content = replacePlaceholders(content, recipient, agentName, agentEmail, agentPhone, agentAppointmentLink)
      subject = replacePlaceholders(subject, recipient, agentName, agentEmail, agentPhone, agentAppointmentLink)
    }
  } else {
    content = replacePlaceholders(content, recipient, agentName, agentEmail, agentPhone, agentAppointmentLink)
    subject = replacePlaceholders(subject, recipient, agentName, agentEmail, agentPhone, agentAppointmentLink)
  }

  const campaignChannel = campaign.channel || "EMAIL"
  const stepType = step.type || "email"

  // Execute based on step type and channel
  if ((stepType === "email" || campaignChannel === "EMAIL" || campaignChannel === "BOTH") && recipient?.email) {
    // Send from agent's email if available, otherwise fallback to default
    const fromAddress = agentEmail
      ? `${agentName} <${agentEmail}>`
      : `${agentName} <noreply@mckinneyrealtyco.com>`
    const sent = await sendEmail({
      to: recipient.email,
      subject: subject || `Message from ${agentName}`,
      body: content,
      from: fromAddress,
    })
    result.email = sent
  }

  if ((stepType === "sms" || campaignChannel === "SMS" || campaignChannel === "BOTH") && recipient?.phone) {
    // Include agent's phone number in the SMS body signature
    const smsBody = agentPhone
      ? `${content}\n\nReply or call: ${agentPhone}`
      : content
    const sent = await sendSms({
      to: recipient.phone,
      body: smsBody,
    })
    result.sms = sent
  }

  if (stepType === "task") {
    // Create activity/task for the agent
    await supabase.from("activities").insert({
      agent_id: recipient.agent_id || campaign.owner_id,
      lead_id: enrollmentType === "lead" ? enrollment.lead_id : null,
      contact_id: enrollmentType === "contact" ? enrollment.contact_id : null,
      activity_type: "task",
      subject: `Campaign Task: ${campaign.name}`,
      description: content,
      due_at: new Date().toISOString(),
      completed: false,
    })
    result.task = true
  }

  // Log the step execution
  await supabase.from("campaign_logs").insert({
    lead_id: enrollmentType === "lead" ? enrollment.lead_id : null,
    campaign_id: enrollment.campaign_id,
    step_id: step.id,
    event: `${stepType}_sent`,
    info: {
      step_number: nextStepNumber,
      ai_personalized: step.ai_personalize,
      channel: campaignChannel,
      enrollment_type: enrollmentType,
    },
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
    .from(tableName)
    .update({
      current_step: nextStepNumber,
      next_run_at: nextRunAt,
      status: nextRunAt ? "active" : "completed",
    })
    .eq("id", enrollment.id)

  return result
}

function replacePlaceholders(text: string, recipient: any, agentName: string, agentEmail?: string | null, agentPhone?: string | null, appointmentLink?: string | null): string {
  return text
    .replace(/\{\{first_name\}\}/gi, recipient.first_name || "")
    .replace(/\{\{last_name\}\}/gi, recipient.last_name || "")
    .replace(/\{\{agent_name\}\}/gi, agentName)
    .replace(/\{\{agent_email\}\}/gi, agentEmail || "")
    .replace(/\{\{agent_phone\}\}/gi, agentPhone || "")
    .replace(/\{\{appointment_link\}\}/gi, appointmentLink || "")
    .replace(/\{\{property_interest\}\}/gi, recipient.property_interest || "your area")
    .replace(/\{\{budget\}\}/gi, recipient.budget_max ? `$${recipient.budget_max.toLocaleString()}` : "your budget")
    .replace(/\{\{timeline\}\}/gi, recipient.timeline || "soon")
}
