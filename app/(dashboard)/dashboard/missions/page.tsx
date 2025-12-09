import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { MissionsView } from "@/components/missions/missions-view"

export default async function MissionsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]

  // Fetch today's missions for the current agent
  const { data: todayMissions } = await supabase
    .from("agent_missions")
    .select("*, template:mission_templates(*)")
    .eq("agent_id", agent.id)
    .eq("mission_date", today)
    .order("created_at")

  // Fetch total points this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const { data: monthMissions } = await supabase
    .from("agent_missions")
    .select("points_earned")
    .eq("agent_id", agent.id)
    .gte("mission_date", startOfMonth.toISOString().split("T")[0])
    .eq("status", "completed")

  const monthlyPoints = monthMissions?.reduce((sum, m) => sum + (m.points_earned || 0), 0) || 0

  // Fetch available mission templates for self-assignment
  const { data: templates } = await supabase
    .from("mission_templates")
    .select("*")
    .eq("is_active", true)
    .order("category")

  const completedCount = todayMissions?.filter((m) => m.status === "completed").length || 0
  const totalSelected = todayMissions?.length || 0
  const hasSelectedMissions = totalSelected >= 3

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Daily Missions</h1>
        <p className="text-white/80 mt-1">
          {hasSelectedMissions
            ? "Complete your 3 missions to earn points and climb the rankings"
            : "Select 3 missions to get started today"}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-sm text-white/80">Today's Progress</p>
            <p className="text-xl font-bold">
              {completedCount}/{totalSelected || 3}
            </p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-sm text-white/80">Monthly Points</p>
            <p className="text-xl font-bold">{monthlyPoints}</p>
          </div>
          {hasSelectedMissions ? (
            completedCount === 3 ? (
              <div className="bg-emerald-500 rounded-lg px-4 py-2">
                <p className="text-sm font-medium">All Complete!</p>
              </div>
            ) : null
          ) : (
            <div className="bg-white/30 rounded-lg px-4 py-2">
              <p className="text-sm font-medium">Select Missions</p>
            </div>
          )}
        </div>
      </div>

      <MissionsView todayMissions={todayMissions || []} templates={templates || []} agentId={agent.id} today={today} />
    </div>
  )
}
