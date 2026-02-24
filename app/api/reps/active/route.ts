import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key")
  return apiKey === process.env.ZAPIER_API_KEY
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized. Provide x-api-key header or api_key query param." }, { status: 401 })
  }

  try {
    const days = Number.parseInt(request.nextUrl.searchParams.get("days") || "3", 10)

    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const sinceDateStr = sinceDate.toISOString().split("T")[0]

    // Get all missions in the last N days
    const { data: missions, error: missionsError } = await supabaseAdmin
      .from("agent_daily_missions")
      .select("agent_id, date, mission1_completed, mission2_completed, mission3_completed")
      .gte("date", sinceDateStr)

    if (missionsError) {
      console.error("Error fetching missions:", missionsError)
      return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 })
    }

    // Find agents who completed at least one mission
    const activeAgentIds = new Set<string>()
    const agentMissionCounts: Record<string, number> = {}

    for (const m of missions || []) {
      const completedInDay = [m.mission1_completed, m.mission2_completed, m.mission3_completed].filter(Boolean).length
      if (completedInDay > 0) {
        activeAgentIds.add(m.agent_id)
        agentMissionCounts[m.agent_id] = (agentMissionCounts[m.agent_id] || 0) + completedInDay
      }
    }

    if (activeAgentIds.size === 0) {
      return NextResponse.json({
        pool1Reps: [],
        pool2Reps: [],
        daysChecked: days,
        totalActiveReps: 0,
      })
    }

    // Get agent details
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from("agents")
      .select("id, full_name, segment, tier, is_active, exp_season")
      .in("id", Array.from(activeAgentIds))
      .eq("is_active", true)

    if (agentsError) {
      console.error("Error fetching agents:", agentsError)
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
    }

    // Split into pools by segment and rank by mission count
    // Pool 1 = "new" agents, Pool 2 = "seasoned" agents
    const pool1Reps: Array<{ repId: string; rank: number; name: string; missionCount: number }> = []
    const pool2Reps: Array<{ repId: string; rank: number; name: string; missionCount: number }> = []

    for (const agent of agents || []) {
      const rep = {
        repId: agent.id,
        rank: 0,
        name: agent.full_name || "Unknown",
        missionCount: agentMissionCounts[agent.id] || 0,
      }

      if (agent.segment === "seasoned") {
        pool2Reps.push(rep)
      } else {
        pool1Reps.push(rep)
      }
    }

    // Sort by mission count descending and assign rank
    pool1Reps.sort((a, b) => b.missionCount - a.missionCount)
    pool2Reps.sort((a, b) => b.missionCount - a.missionCount)
    pool1Reps.forEach((r, i) => { r.rank = i + 1 })
    pool2Reps.forEach((r, i) => { r.rank = i + 1 })

    return NextResponse.json({
      pool1Reps,
      pool2Reps,
      daysChecked: days,
      totalActiveReps: activeAgentIds.size,
    })
  } catch (error) {
    console.error("Error in active reps endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
