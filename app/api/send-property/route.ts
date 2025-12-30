import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { lead_id, property_id } = await request.json()

    const supabase = await createServerClient()

    // Get the lead with contact info
    const { data: lead } = await supabase.from("leads").select("*, contact:contacts(*)").eq("id", lead_id).single()

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Get the property details
    const { data: property } = await supabase.from("saved_properties").select("*").eq("id", property_id).single()

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Get agent info
    const { data: agent } = await supabase
      .from("agents")
      .select("Name, Email, Phone")
      .eq("id", property.agent_id)
      .single()

    // Format property details
    const propertyDetails = `
${property.address}
${property.city ? `${property.city}, ${property.state} ${property.zip}` : ""}

${property.price ? `Price: $${property.price.toLocaleString()}` : ""}
${property.beds ? `Bedrooms: ${property.beds}` : ""}
${property.baths ? `Bathrooms: ${property.baths}` : ""}
${property.mls_number ? `MLS#: ${property.mls_number}` : ""}

View full listing: ${property.idx_url}

---
${agent?.Name || "Your Agent"}
${agent?.Email || ""}
${agent?.Phone || ""}
    `.trim()

    const contact = lead.contact
    const contactName = contact?.FirstName || lead.first_name || "there"

    const propertyLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/property-view/${property_id}`

    // Send via email if available
    if (contact?.Email || lead.email) {
      const emailBody = {
        from: "McKinney Realty Co <noreply@mckinneyrealty.com>",
        to: [contact?.Email || lead.email],
        subject: `Property Match: ${property.address}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hi ${contactName},</h2>
            <p>I thought you might be interested in this property:</p>
            
            ${property.photo_url ? `<img src="${property.photo_url}" alt="${property.address}" style="width: 100%; max-width: 500px; border-radius: 8px; margin: 16px 0;" />` : ""}
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0;">${property.address}</h3>
              ${property.city ? `<p style="color: #666; margin: 4px 0;">${property.city}, ${property.state} ${property.zip}</p>` : ""}
              
              <div style="margin: 16px 0;">
                ${property.price ? `<p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 8px 0;">$${property.price.toLocaleString()}</p>` : ""}
                ${property.beds || property.baths ? `<p style="color: #666; margin: 8px 0;">${property.beds ? `${property.beds} bed` : ""} ${property.beds && property.baths ? "•" : ""} ${property.baths ? `${property.baths} bath` : ""}</p>` : ""}
                ${property.mls_number ? `<p style="color: #666; margin: 8px 0;">MLS# ${property.mls_number}</p>` : ""}
              </div>
              
              <a href="${propertyLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 8px;">View Property Details</a>
            </div>
            
            <p>Let me know if you'd like to schedule a showing or if you have any questions!</p>
            
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p style="margin: 4px 0;"><strong>${agent?.Name || "Your Agent"}</strong></p>
              ${agent?.Email ? `<p style="margin: 4px 0;">${agent.Email}</p>` : ""}
              ${agent?.Phone ? `<p style="margin: 4px 0;">${agent.Phone}</p>` : ""}
            </div>
          </div>
        `,
      }

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailBody),
      })
    }

    // Send via SMS if available and no email
    if (contact?.Phone || lead.phone) {
      const smsBody = `Hi ${contactName}! Check out this property I think you'll love:\n\n${property.address}\n${property.price ? `$${property.price.toLocaleString()}` : ""}\n${property.beds ? `${property.beds} bed` : ""}${property.beds && property.baths ? " • " : ""}${property.baths ? `${property.baths} bath` : ""}\n\nView details: ${propertyLink}\n\n- ${agent?.Name || "Your Agent"}`

      const twilioAuth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString(
        "base64",
      )

      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${twilioAuth}`,
        },
        body: new URLSearchParams({
          To: contact?.Phone || lead.phone,
          From: process.env.TWILIO_PHONE_NUMBER!,
          Body: smsBody,
        }),
      })
    }

    // Log activity
    await supabase.from("activities").insert({
      lead_id,
      agent_id: property.agent_id,
      type: "email",
      subject: `Sent property: ${property.address}`,
      notes: propertyDetails,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending property:", error)
    return NextResponse.json({ error: "Failed to send property" }, { status: 500 })
  }
}
