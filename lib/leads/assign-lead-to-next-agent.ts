import { createClient } from "@/lib/supabase/server"
import type { Agent } from "@/lib/types/database"

interface EligibleAgent extends Agent {
  rank: number
}

/**
 * Assigns a lead to the next eligible agent based on performance-based round-robin.
 *
 * Eligibility rules:
 * - agents.is_active = true
 * - agents.tier = 1
 * - monthly_agent_stats.total_points > 0 this month
 * - agent has completed at least 1 mission within last 3 days
 *
 * Returns the assigned agent ID or null if no eligible agents.
 */
export async function assignLeadToNextAgent(leadId: string): Promise<string | null> {
  const supabase = await createClient()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Get or create lead_assign_state for current month
  let { data: assignState } = await supabase.from("lead_assign_state").select("*").eq("id", 1).single()

  // If month/year changed, reset last_rank_assigned
  if (assignState && (assignState.year !== currentYear || assignState.month !== currentMonth)) {
    await supabase
      .from("lead_assign_state")
      .update({
        year: currentYear,
        month: currentMonth,
        last_rank_assigned: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)

    assignState = {
      ...assignState,
      year: currentYear,
      month: currentMonth,
      last_rank_assigned: 0,
    }
  }

  const lastRankAssigned = assignState?.last_rank_assigned ?? 0

  // 2. Get agents who have completed at least 1 mission in last 3 days
  const { data: recentMissionAgents } = await supabase
    .from("agent_daily_missions")
    .select("agent_id")
    .gte("date", threeDaysAgo.split("T")[0])
    .or("mission1_completed.eq.true,mission2_completed.eq.true,mission3_completed.eq.true")

  const agentIdsWithRecentMissions = new Set((recentMissionAgents || []).map((m) => m.agent_id))

  // 3. Get eligible agents with their rankings
  const { data: statsWithAgents } = await supabase
    .from("monthly_agent_stats")
    .select(`
      agent_id,
      rank,
      total_points,
      agent:agents(*)
    `)
    .eq("year", currentYear)
    .eq("month", currentMonth)
    .gt("total_points", 0)
    .not("rank", "is", null)
    .order("rank", { ascending: true })

  if (!statsWithAgents || statsWithAgents.length === 0) {
    return null
  }

  // Filter to eligible agents
  const eligibleAgents: EligibleAgent[] = []
  for (const stat of statsWithAgents) {
    const agent = stat.agent as unknown as Agent
    if (agent && agent.is_active && agent.tier === 1 && agentIdsWithRecentMissions.has(stat.agent_id)) {
      eligibleAgents.push({
        ...agent,
        rank: stat.rank as number,
      })
    }
  }

  if (eligibleAgents.length === 0) {
    return null
  }

  // 4. Find next agent based on rank > last_rank_assigned, or wrap around
  let nextAgent = eligibleAgents.find((a) => a.rank > lastRankAssigned)

  // If no agent with higher rank, wrap around to the top
  if (!nextAgent) {
    nextAgent = eligibleAgents[0]
  }

  // 5. Update the lead
  const claimExpiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString() // 30 minutes from now

  const { error: leadError } = await supabase
    .from("leads")
    .update({
      assigned_agent_id: nextAgent.id,
      assigned_at: now.toISOString(),
      claim_expires_at: claimExpiresAt,
      status: "assigned",
    })
    .eq("id", leadId)

  if (leadError) {
    console.error("Error updating lead:", leadError)
    return null
  }

  // 6. Update lead_assign_state
  await supabase
    .from("lead_assign_state")
    .update({
      last_rank_assigned: nextAgent.rank,
      updated_at: now.toISOString(),
    })
    .eq("id", 1)

  // 7. Create activity record for assignment
  const { data: lead } = await supabase.from("leads").select("contact_id").eq("id", leadId).single()

  if (lead) {
    await supabase.from("activities").insert({
      contact_id: lead.contact_id,
      lead_id: leadId,
      agent_id: nextAgent.id,
      type: "assignment",
      description: `Lead auto-assigned to ${nextAgent.full_name || nextAgent.email} (Rank #${nextAgent.rank})`,
    })
  }

  return nextAgent.id
}
