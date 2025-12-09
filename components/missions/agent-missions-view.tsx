"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import type { AgentDailyMissionWithTemplates } from "@/lib/types/database"
import { CheckCircle2, Target } from "lucide-react"
import { useRouter } from "next/navigation"

interface AgentMissionsViewProps {
  mission: AgentDailyMissionWithTemplates | null
  agentId: string
  today: string
}

export function AgentMissionsView({ mission, agentId, today }: AgentMissionsViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)

  if (!mission) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Missions Available</h3>
          <p className="text-sm text-muted-foreground">
            Your missions for today haven't been released yet. Check back at 7:00 AM EST.
          </p>
        </CardContent>
      </Card>
    )
  }

  const missions = [
    {
      num: 1,
      template: mission.mission1_template,
      completed: mission.mission1_completed,
      field: "mission1_completed" as const,
    },
    {
      num: 2,
      template: mission.mission2_template,
      completed: mission.mission2_completed,
      field: "mission2_completed" as const,
    },
    {
      num: 3,
      template: mission.mission3_template,
      completed: mission.mission3_completed,
      field: "mission3_completed" as const,
    },
  ]

  const completedCount = missions.filter((m) => m.completed).length
  const totalPoints = completedCount

  async function toggleMission(
    missionNum: number,
    field: "mission1_completed" | "mission2_completed" | "mission3_completed",
    currentValue: boolean,
  ) {
    setLoading(missionNum)
    const supabase = createClient()

    const { error } = await supabase
      .from("agent_daily_missions")
      .update({ [field]: !currentValue })
      .eq("id", mission!.id)

    if (error) {
      console.error("Failed to update mission:", error)
    }

    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Progress</p>
              <p className="text-2xl font-semibold text-foreground">{completedCount} / 3 Missions</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Points Earned</p>
              <p className="text-2xl font-semibold text-foreground">{totalPoints} pts</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mission cards */}
      <div className="grid gap-4">
        {missions.map((m) => (
          <Card key={m.num} className={m.completed ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      m.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{m.num}</span>
                    )}
                  </div>
                  <CardTitle className={`text-base ${m.completed ? "text-primary" : "text-foreground"}`}>
                    {m.template?.title || `Mission ${m.num}`}
                  </CardTitle>
                </div>
                <Checkbox
                  checked={m.completed}
                  disabled={loading === m.num}
                  onCheckedChange={() => toggleMission(m.num, m.field, m.completed)}
                  className="h-5 w-5"
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${m.completed ? "text-primary/70" : "text-muted-foreground"}`}>
                {m.template?.description || "Complete this mission to earn 1 point."}
              </p>
              {m.completed && <p className="text-xs text-primary mt-2 font-medium">+1 point earned</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
