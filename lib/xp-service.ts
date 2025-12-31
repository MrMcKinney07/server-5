import { createClient } from "@/lib/supabase/server"

export const PRESTIGE_TIERS = {
  1: {
    name: "Bronze",
    min: 0,
    max: 9999,
    icon: "/images/3c16b4fb-dbe6-4656-a916.jpeg",
    color: "from-amber-700 to-amber-900",
  },
  2: {
    name: "Silver",
    min: 10000,
    max: 24999,
    icon: "/images/f2bb9722-b820-4840-9c40.jpeg",
    color: "from-slate-300 to-slate-500",
  },
  3: {
    name: "Gold",
    min: 25000,
    max: 49999,
    icon: "/images/819b9862-0cd7-4d17-8f1b.jpeg",
    color: "from-amber-400 to-yellow-600",
  },
  4: {
    name: "Platinum",
    min: 50000,
    max: 99999,
    icon: "/images/f2bb9722-b820-4840-9c40.jpeg",
    color: "from-slate-400 to-slate-600",
  },
  5: {
    name: "Diamond",
    min: 100000,
    max: Number.POSITIVE_INFINITY,
    icon: "/images/04e7c452-75ef-424e-9c71.jpeg",
    color: "from-cyan-400 to-blue-600",
  },
} as const

export function getPrestigeTier(lifetimeXP: number): number {
  if (lifetimeXP >= 100000) return 5
  if (lifetimeXP >= 50000) return 4
  if (lifetimeXP >= 25000) return 3
  if (lifetimeXP >= 10000) return 2
  return 1
}

export function getPrestigeTierInfo(tier: number) {
  return PRESTIGE_TIERS[tier as keyof typeof PRESTIGE_TIERS] || PRESTIGE_TIERS[1]
}

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

  // Check if season needs reset
  let seasonXP = agent.exp_season || 0
  if (agent.season_id !== currentSeason) {
    seasonXP = 0 // Reset for new season
  }

  // Calculate new values
  const newSeasonXP = seasonXP + amount
  const newBankXP = (agent.exp_bank || 0) + amount
  const newLifetimeXP = (agent.lifetime_xp || 0) + amount
  const newPrestigeTier = getPrestigeTier(newLifetimeXP)

  // Update agent
  const { error: updateError } = await supabase
    .from("agents")
    .update({
      exp_season: newSeasonXP,
      exp_bank: newBankXP,
      lifetime_xp: newLifetimeXP,
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

  // Log to xp_ledger (bank tracking)
  await supabase.from("xp_ledger").insert({
    user_id: userId,
    amount,
    kind: "EARN",
    season_id: currentSeason,
    source: type,
    note: reason,
  })

  return {
    success: true,
    newSeasonXP,
    newBankXP,
    newLifetimeXP,
    prestigeTier: newPrestigeTier,
    tierChanged: newPrestigeTier !== agent.prestige_tier,
  }
}
