import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key")
  return apiKey === process.env.ZAPIER_API_KEY
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized. Provide x-api-key header or api_key query param." }, { status: 401 })
  }

  const supabaseAdmin = createServiceClient()

  try {
    const body = await request.json()
    const { leadId, assignedRepId, dealSize, leadSource, buyerName, propertyAddress, phone, email } = body

    if (!assignedRepId) {
      return NextResponse.json({ error: "assignedRepId is required" }, { status: 400 })
    }

    // Verify the rep exists and is active
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id, full_name, is_active")
      .eq("id", assignedRepId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Rep not found" }, { status: 404 })
    }

    if (!agent.is_active) {
      return NextResponse.json({ error: "Rep is not active" }, { status: 400 })
    }

    // Validate pool eligibility based on deal size and rank
    // Pool 1: Rank 1-5 only, for leads 600k+
    // Pool 2: Rank 1-50, for all leads
    if (dealSize && dealSize >= 600000) {
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const { data: stats } = await supabaseAdmin
        .from("monthly_agent_stats")
        .select("rank")
        .eq("agent_id", assignedRepId)
        .eq("month_year", monthYear)
        .single()

      const agentRank = stats?.rank || 999

      if (agentRank > 5) {
        return NextResponse.json({
          error: `Rep rank is ${agentRank}. Leads with deal size 600k+ require a Pool 1 rep (rank 1-5).`,
          repRank: agentRank,
          dealSize,
          requiredPool: "pool1",
        }, { status: 400 })
      }
    }

    const assignedAt = new Date().toISOString()

    // Helper: notify Zapier webhook after assignment
    async function notifyZapier(payload: Record<string, unknown>) {
      const webhookUrl = process.env.ZAPIER_WEBHOOK_URL
      if (!webhookUrl) return
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } catch (e) {
        console.error("Failed to notify Zapier webhook:", e)
      }
    }

    // If a leadId is provided, update the existing lead
    if (leadId) {
      const { data: lead, error: updateError } = await supabaseAdmin
        .from("leads")
        .update({
          assigned_agent_id: assignedRepId,
          status: "assigned",
          assigned_at: assignedAt,
          source: leadSource || "other",
          raw_payload: {
            deal_size: dealSize || null,
            buyer_name: buyerName || null,
            property_address: propertyAddress || null,
            zapier_assigned: true,
            zapier_assigned_at: assignedAt,
          },
        })
        .eq("id", leadId)
        .select("id")
        .single()

      if (updateError) {
        console.error("Error updating lead:", updateError)
        return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
      }

      // Notify Zapier
      await notifyZapier({
        event: "lead_assigned",
        leadId: lead.id,
        assignedRepId,
        assignedRepName: agent.full_name,
        dealSize: dealSize || null,
        leadSource: leadSource || null,
        buyerName: buyerName || null,
        assignedAt,
      })

      return NextResponse.json({
        success: true,
        leadId: lead.id,
        assignedRepId,
        assignedAt,
      })
    }

    // Otherwise, create a new contact + lead
    const contactName = buyerName || "Zapier Lead"
    const nameParts = contactName.split(" ")
    const firstName = nameParts[0] || "Unknown"
    const lastName = nameParts.slice(1).join(" ") || "Contact"

    // Create contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .insert({
        full_name: contactName,
        email: email || null,
        phone: phone || null,
        primary_agent_id: assignedRepId,
      })
      .select("id")
      .single()

    if (contactError) {
      console.error("Error creating contact:", contactError)
      return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
    }

    // Create lead
    const validSources = ["realtor", "upnest", "opcity", "fb_ads", "manual", "referral", "website", "other"]
    const source = validSources.includes(leadSource) ? leadSource : "other"

    const { data: newLead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        contact_id: contact.id,
        source,
        assigned_agent_id: assignedRepId,
        status: "assigned",
        assigned_at: assignedAt,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email || null,
        raw_payload: {
          deal_size: dealSize || null,
          buyer_name: buyerName || null,
          property_address: propertyAddress || null,
          zapier_assigned: true,
          zapier_assigned_at: assignedAt,
        },
      })
      .select("id")
      .single()

    if (leadError) {
      console.error("Error creating lead:", leadError)
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    }

    // Notify Zapier
    await notifyZapier({
      event: "lead_created_and_assigned",
      leadId: newLead.id,
      contactId: contact.id,
      assignedRepId,
      assignedRepName: agent.full_name,
      dealSize: dealSize || null,
      leadSource: source,
      buyerName: contactName,
      email: email || null,
      phone: phone || null,
      propertyAddress: propertyAddress || null,
      assignedAt,
    })

    return NextResponse.json({
      success: true,
      leadId: newLead.id,
      assignedRepId,
      assignedAt,
      created: true,
    })
  } catch (error) {
    console.error("Error in lead assign endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
