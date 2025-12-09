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

  const { data: completedMissions } = await supabase
    .from("agent_missions")
    .select("points_earned, completed_at, template_id, mission_templates(title, category, points)")
    .eq("agent_id", agent.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  // Calculate total XP from missions
  const totalXP = completedMissions?.reduce((sum, m) => sum + (m.points_earned || 0), 0) || 0

  // Get this month's XP
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthlyXP =
    completedMissions
      ?.filter((m) => m.completed_at && new Date(m.completed_at) >= startOfMonth)
      .reduce((sum, m) => sum + (m.points_earned || 0), 0) || 0

  // Get XP leaderboard from all agents' completed missions
  const { data: allAgentMissions } = await supabase
    .from("agent_missions")
    .select("agent_id, points_earned, agents(id, Name, Email)")
    .eq("status", "completed")

  // Aggregate XP by agent for leaderboard
  const agentXPMap = new Map<string, { agent: any; total_xp: number }>()
  allAgentMissions?.forEach((m) => {
    if (m.agent_id && m.agents) {
      const existing = agentXPMap.get(m.agent_id)
      if (existing) {
        existing.total_xp += m.points_earned || 0
      } else {
        agentXPMap.set(m.agent_id, {
          agent: m.agents,
          total_xp: m.points_earned || 0,
        })
      }
    }
  })

  const xpLeaderboard = Array.from(agentXPMap.values())
    .sort((a, b) => b.total_xp - a.total_xp)
    .slice(0, 10)

  // Create agentXP object from calculated data
  const agentXP = {
    total_xp: totalXP,
    monthly_xp: monthlyXP,
    level: Math.floor(totalXP / 100) + 1,
    missions_completed: completedMissions?.length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Rewards & Achievements</h1>
        <p className="text-muted-foreground">Track your XP, badges, and mission progress</p>
      </div>

      <RewardsDashboard
        agent={agent}
        agentXP={agentXP}
        completedMissions={completedMissions || []}
        xpLeaderboard={xpLeaderboard}
      />
    </div>
  )
}
