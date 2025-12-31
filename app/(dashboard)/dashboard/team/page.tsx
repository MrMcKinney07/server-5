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

  // Get team stats - simplified query
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`

  const { data: memberMissions } = agent.team_id
    ? await supabase
        .from("agent_missions")
        .select("agent_id, points_earned, status")
        .in(
          "agent_id",
          (members || []).map((m) => m.id),
        )
        .gte("mission_date", startOfMonth)
    : { data: [] }

  // Calculate member stats from missions
  const memberStats = (members || []).map((m) => {
    const agentMissions = (memberMissions || []).filter((mission) => mission.agent_id === m.id)
    const completedMissions = agentMissions.filter((mission) => mission.status === "completed")
    return {
      agent_id: m.id,
      missions_completed: completedMissions.length,
      points_earned: completedMissions.reduce((sum, mission) => sum + (mission.points_earned || 0), 0),
    }
  })

  // Get recent missions completion
  const today = new Date().toISOString().split("T")[0]
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const { data: recentMissions } = agent.team_id
    ? await supabase
        .from("agent_missions")
        .select("*, template:mission_templates(*)")
        .in(
          "agent_id",
          (members || []).map((m) => m.id),
        )
        .gte("mission_date", threeDaysAgo)
        .lte("mission_date", today)
    : { data: [] }

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
