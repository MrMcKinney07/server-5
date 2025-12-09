import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RewardsDashboard } from "@/components/rewards/rewards-dashboard"

export default async function RewardsPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  // Get agent's XP
  const { data: agentXP } = await supabase.from("agent_xp").select("*").eq("agent_id", agent.id).single()

  // Get agent's badges
  const { data: agentBadges } = await supabase
    .from("agent_badges")
    .select("*, badge:badges(*)")
    .eq("agent_id", agent.id)
    .order("earned_at", { ascending: false })

  // Get all badges for display
  const { data: allBadges } = await supabase.from("badges").select("*").order("xp_reward")

  // Get active competitions
  const today = new Date().toISOString().split("T")[0]
  const { data: activeCompetitions } = await supabase
    .from("competitions")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)

  // Get agent's competition entries
  const { data: competitionEntries } = await supabase
    .from("competition_entries")
    .select("*, competition:competitions(*)")
    .eq("agent_id", agent.id)

  // Get leaderboard for XP
  const { data: xpLeaderboard } = await supabase
    .from("agent_xp")
    .select("*, agent:agents(*)")
    .order("total_xp", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Rewards & Achievements</h1>
        <p className="text-muted-foreground">Track your XP, badges, and competition progress</p>
      </div>

      <RewardsDashboard
        agent={agent}
        agentXP={agentXP}
        agentBadges={agentBadges || []}
        allBadges={allBadges || []}
        activeCompetitions={activeCompetitions || []}
        competitionEntries={competitionEntries || []}
        xpLeaderboard={xpLeaderboard || []}
      />
    </div>
  )
}
