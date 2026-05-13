import { createServerClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify admin/broker access
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: agent } = await supabase.from("agents").select("Role").eq("id", user.id).single()

    if (!agent || (agent.Role !== "admin" && agent.Role !== "broker")) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const { agentIds, subject, message, sendToAll } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    // Get target agents
    let targetAgents: { id: string; Name: string; Email: string }[] = []

    if (sendToAll) {
      const { data } = await supabase.from("agents").select("id, Name, Email").eq("is_active", true)

      targetAgents = data || []
    } else {
      if (!agentIds || agentIds.length === 0) {
        return NextResponse.json({ error: "No agents selected" }, { status: 400 })
      }

      const { data } = await supabase.from("agents").select("id, Name, Email").in("id", agentIds).eq("is_active", true)

      targetAgents = data || []
    }

    if (targetAgents.length === 0) {
      return NextResponse.json({ error: "No active agents found" }, { status: 400 })
    }

    // Send emails to all target agents
    const emailPromises = targetAgents.map(async (agent) => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                  McKinney Realty Co
                </h1>
                <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                  Team Announcement
                </p>
              </div>
              
              <!-- Content -->
              <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">Hi ${agent.Name},</p>
                
                <div style="margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border-left: 4px solid #667eea;">
                  <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                    ${subject}
                  </h2>
                  <div style="color: #4b5563; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
${message}
                  </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.mckinneyrealtyco.com"}/dashboard" 
                     style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View Dashboard
                  </a>
                </div>
                
                <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                  This is an automated message from McKinney Realty Co
                </p>
              </div>
            </div>
          </body>
        </html>
      `

      return sendEmail({
        to: agent.Email,
        subject: subject,
        body: message,
        html: html,
      })
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter((r) => r).length

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: targetAgents.length,
      agents: targetAgents.map((a) => ({ name: a.Name, email: a.Email })),
    })
  } catch (error) {
    console.error("[Broadcast Email] Error:", error)
    return NextResponse.json({ error: "Failed to send broadcast email" }, { status: 500 })
  }
}
