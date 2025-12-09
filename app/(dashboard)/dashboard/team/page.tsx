import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PodDashboard } from "@/components/team/pod-dashboard"

export default async function TeamDashboardPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  // Get agent's team
  const { data: team } = agent.team_id
    ? await supabase
        .from("teams")
        .select("*, leader:agents!teams_leader_agent_id_fkey(*)")
        .eq("id", agent.team_id)
        .single()
    : { data: null }

  // Get team members
  const { data: members } = agent.team_id
    ? await supabase.from("agents").select("*").eq("team_id", agent.team_id).eq("is_active", true)
    : { data: [] }

  // Get team stats
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const { data: memberStats } = agent.team_id
    ? await supabase
        .from("monthly_agent_stats")
        .select("*")
        .in(
          "agent_id",
          (members || []).map((m) => m.id),
        )
        .eq("year", currentYear)
        .eq("month", currentMonth)
    : { data: [] }

  // Get recent missions completion
  const today = new Date().toISOString().split("T")[0]
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const { data: recentMissions } = agent.team_id
    ? await supabase
        .from("agent_daily_missions")
        .select("*")
        .in(
          "agent_id",
          (members || []).map((m) => m.id),
        )
        .gte("date", threeDaysAgo)
        .lte("date", today)
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
