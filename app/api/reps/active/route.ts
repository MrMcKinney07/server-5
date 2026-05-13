import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key")
  return apiKey === process.env.ZAPIER_API_KEY
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized. Provide x-api-key header or api_key query param." }, { status: 401 })
  }

  const supabaseAdmin = createServiceClient()

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
        pool1Description: "Rank 1-5 reps, eligible for 600k+ leads",
        pool2Description: "Rank 1-50 reps, eligible for all leads",
        daysChecked: days,
        totalActiveReps: 0,
      })
    }

    // Get agent details
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from("agents")
      .select("id, full_name, is_active")
      .in("id", Array.from(activeAgentIds))
      .eq("is_active", true)

    if (agentsError) {
      console.error("Error fetching agents:", agentsError)
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
    }

    // Get current month rankings from monthly_agent_stats
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const { data: rankings } = await supabaseAdmin
      .from("monthly_agent_stats")
      .select("agent_id, rank")
      .eq("month_year", monthYear)

    // Build a rank lookup from monthly stats
    const rankMap: Record<string, number> = {}
    for (const r of rankings || []) {
      rankMap[r.agent_id] = r.rank
    }

    // Pool 1 = Rank 1-5 (top performers, eligible for 600k+ leads)
    // Pool 2 = Rank 1-50 (all ranked reps, eligible for all leads)
    const pool1Reps: Array<{ repId: string; rank: number; name: string; missionCount: number }> = []
    const pool2Reps: Array<{ repId: string; rank: number; name: string; missionCount: number }> = []

    for (const agent of agents || []) {
      const agentRank = rankMap[agent.id] || 999
      const rep = {
        repId: agent.id,
        rank: agentRank,
        name: agent.full_name || "Unknown",
        missionCount: agentMissionCounts[agent.id] || 0,
      }

      // Pool 1: Rank 1-5 only
      if (agentRank >= 1 && agentRank <= 5) {
        pool1Reps.push(rep)
      }

      // Pool 2: Rank 1-50 (includes pool 1 reps too)
      if (agentRank >= 1 && agentRank <= 50) {
        pool2Reps.push(rep)
      }
    }

    // Sort by rank ascending (rank 1 = best)
    pool1Reps.sort((a, b) => a.rank - b.rank)
    pool2Reps.sort((a, b) => a.rank - b.rank)

    return NextResponse.json({
      pool1Reps,
      pool2Reps,
      pool1Description: "Rank 1-5 reps, eligible for 600k+ leads",
      pool2Description: "Rank 1-50 reps, eligible for all leads",
      daysChecked: days,
      totalActiveReps: activeAgentIds.size,
    })
  } catch (error) {
    console.error("Error in active reps endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
