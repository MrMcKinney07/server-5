import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, campaignName, agentName, agentEmail, campaignType, channel } = await request.json()

    if (!agentEmail || !campaignName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const channelText =
      channel === "BOTH" ? "Email + SMS" : channel === "EMAIL" ? "Email" : channel === "SMS" ? "SMS" : "Email"

    const typeText = campaignType === "BROADCAST" ? "One-Time Broadcast" : "Drip Sequence"

    const emailBody = `
Hi ${agentName || "there"},

Your drip campaign "${campaignName}" has been successfully created and is now active!

Campaign Details:
- Type: ${typeText}
- Channel: ${channelText}
- Status: Active

Your campaign is ready to start nurturing leads. You can add leads to this campaign from the Leads section or enroll them individually.

What's Next?
1. Add campaign steps (emails and SMS messages) to define your nurture sequence
2. Enroll leads into the campaign to start the automated follow-up process
3. Monitor campaign performance and engagement in the dashboard

View and manage your campaign: ${process.env.NEXT_PUBLIC_APP_URL || "https://app.mckinneyone.com"}/dashboard/campaigns/${campaignId}

Best regards,
McKinney One Team
    `.trim()

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Campaign Created Successfully! 🎉</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${agentName || "there"},</p>
    
    <p style="font-size: 16px;">Your drip campaign <strong style="color: #0ea5e9;">"${campaignName}"</strong> has been successfully created and is now active!</p>
    
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h2 style="margin-top: 0; font-size: 18px; color: #1e293b;">Campaign Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Type:</td>
          <td style="padding: 8px 0; font-weight: 600;">${typeText}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Channel:</td>
          <td style="padding: 8px 0; font-weight: 600;">${channelText}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Status:</td>
          <td style="padding: 8px 0;"><span style="background: #10b981; color: white; padding: 2px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">Active</span></td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 16px;">Your campaign is ready to start nurturing leads. You can add leads to this campaign from the Leads section or enroll them individually.</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; font-size: 16px; color: #92400e;">What's Next?</h3>
      <ol style="margin: 8px 0; padding-left: 20px; color: #78350f;">
        <li style="margin: 8px 0;">Add campaign steps (emails and SMS messages) to define your nurture sequence</li>
        <li style="margin: 8px 0;">Enroll leads into the campaign to start the automated follow-up process</li>
        <li style="margin: 8px 0;">Monitor campaign performance and engagement in the dashboard</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.mckinneyone.com"}/dashboard/campaigns/${campaignId}" 
         style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Campaign
      </a>
    </div>
    
    <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
      Best regards,<br>
      <strong>McKinney One Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>© ${new Date().getFullYear()} McKinney One. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim()

    const sent = await sendEmail({
      to: agentEmail,
      subject: `Campaign "${campaignName}" is now active!`,
      body: emailBody,
      html: htmlBody,
      from: "McKinney One <campaigns@mckinneyone.com>",
    })

    if (!sent) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
