import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { NextResponse } from "next/server"

// This cron job runs every day at 7 AM to send mission reminders
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/morning-missions", "schedule": "0 7 * * *" }] }

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Use service role to bypass RLS and access all agents
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const today = new Date().toISOString().split("T")[0]

  // Fetch all agents with their email
  const { data: agents, error: agentsError } = await supabase.from("agents").select("id, Name, Email")

  if (agentsError || !agents) {
    console.error("Failed to fetch agents:", agentsError)
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
  }

  // Fetch today's missions for all agents
  const { data: todayMissions } = await supabase.from("agent_missions").select("agent_id").eq("mission_date", today)

  // Group missions by agent
  const missionsByAgent = new Map<string, number>()
  todayMissions?.forEach((m) => {
    missionsByAgent.set(m.agent_id, (missionsByAgent.get(m.agent_id) || 0) + 1)
  })

  // Send emails to agents who haven't selected their missions yet
  const emailPromises = agents
    .filter((agent) => {
      const missionsCount = missionsByAgent.get(agent.id) || 0
      return missionsCount < 3 && agent.Email
    })
    .map(async (agent) => {
      try {
        await resend.emails.send({
          from: "McKinney One <missions@mckinneyone.com>",
          to: agent.Email,
          subject: "Select Your Daily Missions",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Good Morning, ${agent.Name || "Agent"}!</h1>
              </div>
              <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  It's time to select your <strong>3 daily missions</strong> and start earning points!
                </p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Complete your missions to climb the leaderboard and unlock rewards.
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/missions" 
                   style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  Select Missions
                </a>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                  McKinney One - Your Real Estate Success Platform
                </p>
              </div>
            </div>
          `,
        })
        return { agent: agent.Email, success: true }
      } catch (error) {
        console.error(`Failed to send email to ${agent.Email}:`, error)
        return { agent: agent.Email, success: false, error }
      }
    })

  const results = await Promise.all(emailPromises)
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({
    message: `Morning mission emails sent`,
    successful,
    failed,
    total: results.length,
  })
}
