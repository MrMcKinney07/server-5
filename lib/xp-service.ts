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
