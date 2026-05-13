import { requireAuth } from "@/lib/auth"
import { MissionsHeader } from "@/components/missions/missions-header"
import { MissionsView } from "@/components/missions/missions-view"
import { getTodaysMissions, autoAssignMissionsIfNeeded } from "@/app/actions/missions"

export default async function MissionsPage() {
  const agent = await requireAuth()

  await autoAssignMissionsIfNeeded()

  const { missions, templates, isNewAgent } = await getTodaysMissions()

  const completedCount = missions.filter((m: any) => m.status === "completed").length
  const totalSelected = missions.length
  const hasSelectedMissions = totalSelected >= 3

  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <MissionsHeader
        dateString={dateString}
        completedCount={completedCount}
        totalSelected={totalSelected}
        hasSelectedMissions={hasSelectedMissions}
      />

      <MissionsView missions={missions} templates={templates} isNewAgent={isNewAgent} />
    </div>
  )
}
