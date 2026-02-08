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

    const totalPoints = missions.reduce((sum, m) => sum + m.xp_reward, 0)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"

    const missionsListHTML = missions
      .map(
        (mission) => `
        <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
          <strong style="color: #111827; font-size: 16px;">${mission.title}</strong>
          <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">${mission.description}</p>
          <span style="display: inline-block; background: #f3f4f6; color: #059669; padding: 6px 16px; border-radius: 16px; font-weight: 600; font-size: 14px;">
            +${mission.xp_reward} XP
          </span>
        </div>
      `,
      )
      .join("")

    const html = `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
            Good Morning, ${agent.Name}! ☀️
          </h1>
          <p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 18px; font-weight: 600;">
            ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <div style="padding: 40px 32px 32px 32px; background: #ffffff;">
          <p style="margin: 0; color: #1f2937; font-size: 18px; line-height: 1.7; font-weight: 600;">
            Here's what I've lined up for you today 🎯
          </p>
          <p style="margin: 16px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
            It's not about doing everything—it's about <strong style="color: #667eea;">consistently doing the work that matters most</strong>. These 3 missions are carefully chosen to move your business forward today.
          </p>
          
          <div style="margin: 24px 0 0 0; padding: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e3a8a; font-size: 17px; line-height: 1.7; font-weight: 700; text-align: center;">
              3 actions every morning = <span style="color: #2563eb;">900+ completed tasks</span> by year-end
            </p>
            <p style="margin: 12px 0 0 0; color: #1e40af; font-size: 15px; line-height: 1.6; text-align: center; font-weight: 600;">
              Consistency is key. 1% better everyday.
            </p>
          </div>
        </div>

        <div style="padding: 0 32px 32px 32px; text-align: center;">
          <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px 48px; border-radius: 50px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);">
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
              XP Available Today
            </p>
            <p style="margin: 6px 0 0 0; color: #ffffff; font-size: 36px; font-weight: 800;">
              ${totalPoints} XP
            </p>
          </div>
        </div>

        <div style="padding: 0 32px 40px 32px;">
          <h2 style="margin: 0 0 24px 0; color: #1f2937; font-size: 22px; font-weight: 700;">
            Your 3 Missions Today
          </h2>
          ${missionsListHTML}
        </div>

        <div style="padding: 0 32px 48px 32px; text-align: center;">
          <a href="${appUrl}/dashboard/missions" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 800; font-size: 17px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); text-transform: uppercase; letter-spacing: 1px;">
            Let's Go! 🚀
          </a>
        </div>

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
