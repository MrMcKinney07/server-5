import { createClient } from "@/lib/supabase/server"
import { getPrestigeTier } from "@/lib/xp-constants"

export async function grantXP(userId: string, amount: number, reason: string, type = "MISSION") {
  const supabase = await createClient()
  const currentSeason = new Date().toISOString().slice(0, 7) // YYYY-MM

  // Get current agent data
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("exp_season, exp_bank, lifetime_xp, prestige_tier, season_id, last_season_reset")
    .eq("id", userId)
    .single()

  if (agentError || !agent) {
    console.error("[XP Service] Failed to fetch agent:", agentError)
    return { success: false, error: "Agent not found" }
  }

  // Check if season needs reset (automatic reset on 1st of month)
  let seasonXP = agent.exp_season || 0
  if (agent.season_id !== currentSeason) {
    seasonXP = 0 // Reset for new season
  }

  // Calculate new values
  const newSeasonXP = seasonXP + amount
  const newLifetimeXP = (agent.lifetime_xp || 0) + amount
  const newBankXP = (agent.exp_bank || 0) + amount
  const newPrestigeTier = getPrestigeTier(newLifetimeXP)

  const { error: updateError } = await supabase
    .from("agents")
    .update({
      exp_season: newSeasonXP,
      lifetime_xp: newLifetimeXP,
      exp_bank: newBankXP,
      prestige_tier: newPrestigeTier,
      season_id: currentSeason,
      last_season_reset: agent.season_id !== currentSeason ? new Date().toISOString() : agent.last_season_reset,
    })
    .eq("id", userId)

  if (updateError) {
    console.error("[XP Service] Failed to update agent:", updateError)
    return { success: false, error: "Failed to update XP" }
  }

  // Log to xp_events (season tracking)
  await supabase.from("xp_events").insert({
    user_id: userId,
    amount,
    reason,
    type,
    season_id: currentSeason,
  })

  const monthYear = currentSeason
  const { data: existingStats } = await supabase
    .from("monthly_agent_stats")
    .select("id, total_xp_earned, missions_completed")
    .eq("agent_id", userId)
    .eq("month_year", monthYear)
    .maybeSingle()

  if (existingStats) {
    // Update existing stats
    await supabase
      .from("monthly_agent_stats")
      .update({
        total_xp_earned: existingStats.total_xp_earned + amount,
        missions_completed:
          type === "MISSION" ? existingStats.missions_completed + 1 : existingStats.missions_completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingStats.id)
  } else {
    // Create new stats entry
    await supabase.from("monthly_agent_stats").insert({
      agent_id: userId,
      month_year: monthYear,
      total_xp_earned: amount,
      missions_completed: type === "MISSION" ? 1 : 0,
      rank: 0, // Will be recalculated
    })
  }

  // Recalculate ranks for all agents this month
  const { data: allStats } = await supabase
    .from("monthly_agent_stats")
    .select("id, total_xp_earned")
    .eq("month_year", monthYear)
    .order("total_xp_earned", { ascending: false })

  if (allStats) {
    for (let i = 0; i < allStats.length; i++) {
      await supabase
        .from("monthly_agent_stats")
        .update({ rank: i + 1 })
        .eq("id", allStats[i].id)
    }
  }

  return {
    success: true,
    newSeasonXP,
    newLifetimeXP,
    newBankXP,
    prestigeTier: newPrestigeTier,
    tierChanged: newPrestigeTier !== agent.prestige_tier,
  }
}

export const addXP = grantXP
