import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PodDashboard } from "@/components/team/pod-dashboard"

export default async function TeamDashboardPage() {
  const supabase = await createClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  // Get agent's team
  const { data: team } = agent.team_id
    ? await supabase.from("teams").select("*, leader:agents!leader_agent_id(*)").eq("id", agent.team_id).single()
    : { data: null }

  // Get team members
  const { data: members } = agent.team_id
    ? await supabase.from("agents").select("*").eq("team_id", agent.team_id)
    : { data: [] }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`

  const { data: memberMissionSets } = agent.team_id
    ? await supabase
        .from("daily_mission_sets")
        .select(`
          user_id,
          daily_mission_items(status, mission_templates(xp_reward))
        `)
        .in(
          "user_id",
          (members || []).map((m) => m.id),
        )
        .gte("mission_date", startOfMonth)
    : { data: [] }

  const memberStats = (members || []).map((m) => {
    const agentSets = (memberMissionSets || []).filter((set) => set.user_id === m.id)
    const allItems = agentSets.flatMap((set) => set.daily_mission_items || [])
    const completedItems = allItems.filter((item: any) => item.status === "completed")
    return {
      agent_id: m.id,
      missions_completed: completedItems.length,
      points_earned: completedItems.reduce(
        (sum: number, item: any) => sum + (item.mission_templates?.xp_reward || 0),
        0,
      ),
    }
  })

  const today = new Date().toISOString().split("T")[0]
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const { data: recentMissionSets } = agent.team_id
    ? await supabase
        .from("daily_mission_sets")
        .select(`
          *,
          daily_mission_items(*, mission_templates(*))
        `)
        .in(
          "user_id",
          (members || []).map((m) => m.id),
        )
        .gte("mission_date", threeDaysAgo)
        .lte("mission_date", today)
    : { data: [] }

  // Flatten the structure for the component
  const recentMissions =
    recentMissionSets?.flatMap((set) =>
      (set.daily_mission_items || []).map((item: any) => ({
        ...item,
        agent_id: set.user_id,
        mission_date: set.mission_date,
        template: item.mission_templates,
      })),
    ) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Team</h1>
        <p className="text-muted-foreground">
          {team ? `${team.name} - Team performance and stats` : "You are not assigned to a team yet"}
        </p>
      </div>

      {team ? (
        <PodDashboard
          team={team}
          members={members || []}
          memberStats={memberStats || []}
          recentMissions={recentMissions || []}
          currentAgent={agent}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">Contact your admin to be assigned to a team.</div>
      )}
    </div>
  )
}
