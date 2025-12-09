import { createClient } from "@/lib/supabase/server"

interface RankingResult {
  agent_id: string
  agent_name: string
  total_points: number
  rank: number
}

/**
 * Rebuild monthly rankings for the current month
 * Calculates total_points from agent_daily_missions and updates monthly_agent_stats
 */
export async function rebuildMonthlyRanking(): Promise<RankingResult[]> {
  const supabase = await createClient()

  // Get current year and month in America/New_York timezone
  const nowInNY = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
  const nyDate = new Date(nowInNY)
  const year = nyDate.getFullYear()
  const month = nyDate.getMonth() + 1 // JavaScript months are 0-indexed

  // Calculate the date range for the current month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`

  // Fetch all completed missions for the current month
  const { data: missions, error: missionsError } = await supabase
    .from("agent_daily_missions")
    .select("agent_id, mission1_completed, mission2_completed, mission3_completed")
    .gte("date", startDate)
    .lt("date", endDate)
    .not("released_at", "is", null)

  if (missionsError) {
    throw new Error(`Failed to fetch missions: ${missionsError.message}`)
  }

  // Calculate points per agent
  const agentPoints: Record<string, number> = {}

  for (const mission of missions || []) {
    const points =
      (mission.mission1_completed ? 1 : 0) + (mission.mission2_completed ? 1 : 0) + (mission.mission3_completed ? 1 : 0)

    if (!agentPoints[mission.agent_id]) {
      agentPoints[mission.agent_id] = 0
    }
    agentPoints[mission.agent_id] += points
  }

  // Fetch all active agents to ensure everyone has a stats row
  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("id, full_name")
    .eq("is_active", true)

  if (agentsError) {
    throw new Error(`Failed to fetch agents: ${agentsError.message}`)
  }

  // Sort agents by points DESC for ranking
  const sortedAgents = (agents || [])
    .map((agent) => ({
      agent_id: agent.id,
      agent_name: agent.full_name || "Unknown",
      total_points: agentPoints[agent.id] || 0,
    }))
    .sort((a, b) => b.total_points - a.total_points)

  // Assign ranks (1 = most points)
  const rankings: RankingResult[] = sortedAgents.map((agent, index) => ({
    ...agent,
    rank: index + 1,
  }))

  // Upsert into monthly_agent_stats
  for (const ranking of rankings) {
    const { error: upsertError } = await supabase.from("monthly_agent_stats").upsert(
      {
        agent_id: ranking.agent_id,
        year,
        month,
        total_points: ranking.total_points,
        rank: ranking.rank,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "agent_id,year,month",
      },
    )

    if (upsertError) {
      console.error(`Failed to upsert stats for agent ${ranking.agent_id}:`, upsertError)
    }
  }

  return rankings
}
