import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { MissionAssignmentForm } from "@/components/admin/missions/assignment-form"

export default async function MissionAssignPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch mission sets with their items
  const { data: missionSets } = await supabase
    .from("mission_sets")
    .select(`
      *,
      items:mission_set_items(
        mission_template_id
      )
    `)
    .order("name")

  // Fetch all active agents
  const { data: agents, error: agentsError } = await supabase.from("agents").select("*").order("full_name")
  console.log("[v0] Agents fetched:", agents?.length, "error:", agentsError?.message)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assign Missions</h1>
        <p className="text-muted-foreground">Generate weekly mission schedules for agents</p>
      </div>

      <MissionAssignmentForm missionSets={missionSets ?? []} agents={agents ?? []} />
    </div>
  )
}
