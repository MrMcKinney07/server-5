import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { AgentMissionsView } from "@/components/missions/agent-missions-view"
import type { AgentDailyMissionWithTemplates } from "@/lib/types/database"

export default async function MissionsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  // Calculate "today" in America/New_York timezone
  const nowInNY = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
  const nyDate = new Date(nowInNY)
  const today = nyDate.toISOString().split("T")[0]

  // Fetch today's released missions for the current agent
  const { data: todaysMission } = await supabase
    .from("agent_daily_missions")
    .select(
      `
      *,
      mission1_template:mission_templates!agent_daily_missions_mission1_template_id_fkey(*),
      mission2_template:mission_templates!agent_daily_missions_mission2_template_id_fkey(*),
      mission3_template:mission_templates!agent_daily_missions_mission3_template_id_fkey(*)
    `,
    )
    .eq("agent_id", agent.id)
    .eq("date", today)
    .not("released_at", "is", null)
    .single()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Today's Missions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete your daily missions to earn points and climb the rankings
        </p>
      </div>

      <AgentMissionsView
        mission={todaysMission as AgentDailyMissionWithTemplates | null}
        agentId={agent.id}
        today={today}
      />
    </div>
  )
}
