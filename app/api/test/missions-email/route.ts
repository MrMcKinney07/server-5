import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the agent by email
    const { data: agent } = await supabase.from("agents").select("id, Name").eq("Email", email).single()

    if (!agent) {
      return NextResponse.json({ error: "Agent not found with that email" }, { status: 404 })
    }

    // Get today's missions for this agent
    const { data: missionSet } = await supabase
      .from("daily_mission_sets")
      .select(`
        id,
        mission_date,
        daily_mission_items (
          id,
          status,
          mission_templates (
            title,
            description,
            xp_reward
          )
        )
      `)
      .eq("user_id", agent.id)
      .eq("mission_date", new Date().toISOString().split("T")[0])
      .single()

    if (!missionSet || !missionSet.daily_mission_items || missionSet.daily_mission_items.length === 0) {
      return NextResponse.json({ error: "No missions found for today" }, { status: 404 })
    }

    // Format missions for email
    const missions = missionSet.daily_mission_items.map((item: any) => ({
      title: item.mission_templates.title,
      description: item.mission_templates.description,
      xp_reward: item.mission_templates.xp_reward,
      status: item.status,
    }))
    // </CHANGE>

    const totalPoints = missions.reduce((sum, m) => sum + m.xp_reward, 0)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"

    const missionsListHTML = missions
      .map(
        (mission) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong style="color: #111827; font-size: 14px;">${mission.title}</strong>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${mission.description}</p>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="display: inline-block; background: #f3f4f6; color: #059669; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 13px;">
              +${mission.xp_reward} XP
            </span>
          </td>
        </tr>
      `,
      )
      .join("")

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Daily Missions</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        🎯 Your Daily Missions
                      </h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">
                        ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </td>
                  </tr>

                  <!-- Introduction -->
                  <tr>
                    <td style="padding: 32px 24px 24px 24px;">
                      <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Good morning! 🌅
                      </p>
                      <p style="margin: 12px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Your missions have been automatically assigned for today. Complete them to earn <strong>${totalPoints} XP</strong> and level up your real estate game!
                      </p>
                    </td>
                  </tr>

                  <!-- Missions List -->
                  <tr>
                    <td style="padding: 0 24px 24px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <thead>
                          <tr style="background-color: #f9fafb;">
                            <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              Mission
                            </th>
                            <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              Reward
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          ${missionsListHTML}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 0 24px 32px 24px; text-align: center;">
                      <a href="${appUrl}/dashboard/missions" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                        View Missions Dashboard →
                      </a>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                      <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                        💡 Pro tip: Complete all missions to build momentum and maximize your success!
                      </p>
                      <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 12px;">
                        You're receiving this because you're enrolled in daily mission assignments.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    await sendEmail({
      to: email,
      subject: `🎯 Your Daily Missions - ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
      html,
    })

    return NextResponse.json({
      success: true,
      message: `Test missions email sent to ${email}`,
      missions: missions.length,
      totalXP: totalPoints,
    })
  } catch (error) {
    console.error("Error sending test missions email:", error)
    return NextResponse.json(
      { error: "Failed to send test email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
