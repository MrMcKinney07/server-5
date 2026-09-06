import { createServerClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { TeamsManagement } from "@/components/admin/teams/teams-management"

export default async function AdminTeamsPage() {
  await requireAdmin()
  const supabase = await createServerClient()

  const { data: teams } = await supabase
    .from("teams")
    .select("*, leader:agents!teams_leader_agent_id_fkey(*)")
    .order("name")

  const { data: agents } = await supabase.from("agents").select("*").eq("is_active", true).order("Name")

  // Get team members
  const teamsWithMembers = await Promise.all(
    (teams || []).map(async (team) => {
      const { data: members } = await supabase.from("agents").select("*").eq("team_id", team.id)
      return { ...team, members: members || [] }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Teams / Pods</h1>
        <p className="text-muted-foreground">Manage agent teams and pod structure</p>
      </div>

      <TeamsManagement teams={teamsWithMembers} agents={agents || []} />
    </div>
  )
}
