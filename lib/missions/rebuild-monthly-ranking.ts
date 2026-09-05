import { createClient } from "@/lib/supabase/server"

interface RankingResult {
  agent_id: string
  agent_name: string
  total_xp_earned: number
  missions_completed: number
  rank: number
}

/**
 * Rebuild monthly rankings for the current month.
 *
 * Aggregates completed daily missions (XP + count) per active agent and writes them
 * to public.monthly_agent_stats, which is uniquely keyed on (agent_id, month_year).
 * Ranking is competition-style: ties share a rank and the next rank skips accordingly
 * (1, 2, 2, 4). Ordering is fully deterministic so repeated rebuilds are stable.
 */
export async function rebuildMonthlyRanking(): Promise<RankingResult[]> {
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthYear = `${year}-${String(month).padStart(2, "0")}`

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`

  // Only rank active agents.
  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("id, Name")
    .eq("is_active", true)

  if (agentsError) {
    throw new Error(`Failed to fetch agents: ${agentsError.message}`)
  }

  // Pull every completed mission item for the month in a single query, joining the
  // owning set (for the user id + date filter) and the template (for XP value).
  const { data: completedItems, error: missionsError } = await supabase
    .from("daily_mission_items")
    .select(
      `
      status,
      mission_templates(xp_reward),
      daily_mission_sets!inner(user_id, mission_date)
    `,
    )
    .eq("status", "completed")
    .gte("daily_mission_sets.mission_date", startDate)
    .lt("daily_mission_sets.mission_date", endDate)

  if (missionsError) {
    throw new Error(`Failed to fetch completed missions: ${missionsError.message}`)
  }

  const agentPoints: Record<string, { xp: number; completed: number }> = {}
  for (const item of completedItems || []) {
    const set = item.daily_mission_sets as unknown as { user_id: string } | null
    const userId = set?.user_id
    if (!userId) continue
    const xp = (item.mission_templates as unknown as { xp_reward?: number } | null)?.xp_reward || 0
    if (!agentPoints[userId]) agentPoints[userId] = { xp: 0, completed: 0 }
    agentPoints[userId].xp += xp
    agentPoints[userId].completed += 1
  }

  // Deterministic sort: XP desc, then missions completed desc, then agent_id asc.
  const sortedAgents = (agents || [])
    .map((agent) => ({
      agent_id: agent.id as string,
      agent_name: (agent.Name as string) || "Unknown",
      total_xp_earned: agentPoints[agent.id]?.xp || 0,
      missions_completed: agentPoints[agent.id]?.completed || 0,
    }))
    .sort((a, b) => {
      if (b.total_xp_earned !== a.total_xp_earned) return b.total_xp_earned - a.total_xp_earned
      if (b.missions_completed !== a.missions_completed) return b.missions_completed - a.missions_completed
      return a.agent_id.localeCompare(b.agent_id)
    })

  // Competition ranking: equal (xp, missions) share a rank; the next distinct value
  // jumps to its ordinal position.
  const rankings: RankingResult[] = []
  let previous: { xp: number; completed: number } | null = null
  let currentRank = 0
  sortedAgents.forEach((agent, index) => {
    if (
      !previous ||
      previous.xp !== agent.total_xp_earned ||
      previous.completed !== agent.missions_completed
    ) {
      currentRank = index + 1
      previous = { xp: agent.total_xp_earned, completed: agent.missions_completed }
    }
    rankings.push({ ...agent, rank: currentRank })
  })

  // Single bulk upsert keyed on the real unique constraint.
  const nowIso = new Date().toISOString()
  const { error: upsertError } = await supabase.from("monthly_agent_stats").upsert(
    rankings.map((r) => ({
      agent_id: r.agent_id,
      month_year: monthYear,
      total_xp_earned: r.total_xp_earned,
      missions_completed: r.missions_completed,
      rank: r.rank,
      updated_at: nowIso,
    })),
    { onConflict: "agent_id,month_year" },
  )

  if (upsertError) {
    throw new Error(`Failed to upsert monthly rankings: ${upsertError.message}`)
  }

  return rankings
}
