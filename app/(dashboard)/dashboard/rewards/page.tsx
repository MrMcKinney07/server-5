import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RewardsDashboard } from "@/components/rewards/rewards-dashboard"
import { PrizesShowcase } from "@/components/rewards/prizes-showcase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function RewardsPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  const { data: completedMissionItems } = await supabase
    .from("daily_mission_items")
    .select(`
      *,
      completed_at,
      mission_templates(title, category, xp_reward),
      daily_mission_sets!inner(user_id)
    `)
    .eq("daily_mission_sets.user_id", agent.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  const totalXP = completedMissionItems?.reduce((sum, item) => sum + (item.mission_templates?.xp_reward || 0), 0) || 0

  // Get this month's XP
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthlyXP =
    completedMissionItems
      ?.filter((item) => item.completed_at && new Date(item.completed_at) >= startOfMonth)
      .reduce((sum, item) => sum + (item.mission_templates?.xp_reward || 0), 0) || 0

  const { data: allCompletedItems } = await supabase
    .from("daily_mission_items")
    .select(`
      *,
      mission_templates(xp_reward),
      daily_mission_sets!inner(user_id, agents(id, Name, Email))
    `)
    .eq("status", "completed")

  // Aggregate XP by agent for leaderboard
  const agentXPMap = new Map<string, { agent: any; total_xp: number }>()
  allCompletedItems?.forEach((item) => {
    const userId = (item.daily_mission_sets as any)?.user_id
    const agent = (item.daily_mission_sets as any)?.agents
    if (userId && agent) {
      const existing = agentXPMap.get(userId)
      if (existing) {
        existing.total_xp += item.mission_templates?.xp_reward || 0
      } else {
        agentXPMap.set(userId, {
          agent,
          total_xp: item.mission_templates?.xp_reward || 0,
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
    missions_completed: completedMissionItems?.length || 0,
  }

  const { data: agentData } = await supabase.from("agents").select("exp_bank, lifetime_xp").eq("id", agent.id).single()
  const currentAgentXP = agentData?.exp_bank || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Rewards & Achievements</h1>
        <p className="text-muted-foreground">Track your XP, badges, mission progress, and redeem prizes</p>
      </div>

      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="prizes">Prize Shop</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-6">
          <RewardsDashboard
            agent={agent}
            agentXP={agentXP}
            completedMissions={completedMissionItems || []}
            xpLeaderboard={xpLeaderboard}
          />
        </TabsContent>

        <TabsContent value="prizes" className="space-y-6">
          <PrizesShowcase agentXP={currentAgentXP} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
