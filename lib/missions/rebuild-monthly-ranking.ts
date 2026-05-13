import { createClient } from "@/lib/supabase/server"

interface RankingResult {
  agent_id: string
  agent_name: string
  total_points: number
  missions_completed: number
  rank: number
}

/**
 * Rebuild monthly rankings for the current month
 * Calculates total_points from daily_mission_items and updates monthly_agent_stats
 */
export async function rebuildMonthlyRanking(): Promise<RankingResult[]> {
  const supabase = await createClient()

  // Get current year and month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Calculate the date range for the current month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`

  const { data: agents, error: agentsError } = await supabase.from("agents").select("id, Name")

  if (agentsError) {
    throw new Error(`Failed to fetch agents: ${agentsError.message}`)
  }

  const agentPoints: Record<string, { points: number; completed: number }> = {}

  for (const agent of agents || []) {
    // Get completed missions for this agent this month
    const { data: completedMissions, error: missionsError } = await supabase
      .from("daily_mission_sets")
      .select(
        `
        id,
        daily_mission_items!inner(
          id,
          status
        )
      `,
      )
      .eq("user_id", agent.id)
      .gte("mission_date", startDate)
      .lt("mission_date", endDate)

    if (missionsError) {
      console.error(`Failed to fetch missions for agent ${agent.id}:`, missionsError)
      continue
    }

    let completedCount = 0
    for (const set of completedMissions || []) {
      const items = set.daily_mission_items as unknown as Array<{ status: string }>
      completedCount += items.filter((item) => item.status === "completed").length
    }

    agentPoints[agent.id] = {
      points: completedCount, // 1 point per completed mission
      completed: completedCount,
    }
  }

  // Sort agents by points DESC for ranking
  const sortedAgents = (agents || [])
    .map((agent) => ({
      agent_id: agent.id,
      agent_name: agent.Name || "Unknown",
      total_points: agentPoints[agent.id]?.points || 0,
      missions_completed: agentPoints[agent.id]?.completed || 0,
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
        missions_completed: ranking.missions_completed,
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
