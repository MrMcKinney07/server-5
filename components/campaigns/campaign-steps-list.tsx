"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare, ClipboardList, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import type { CampaignStep, CampaignStepActionType } from "@/lib/types/database"

interface CampaignStepsListProps {
  steps: CampaignStep[]
  campaignId: string
}

const actionIcons: Record<CampaignStepActionType, React.ElementType> = {
  email: Mail,
  sms: MessageSquare,
  task: ClipboardList,
}

const actionColors: Record<CampaignStepActionType, string> = {
  email: "bg-blue-100 text-blue-700",
  sms: "bg-green-100 text-green-700",
  task: "bg-orange-100 text-orange-700",
}

function formatDelay(minutes: number): string {
  if (minutes === 0) return "Immediately"
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours`
  return `${Math.round(minutes / 1440)} days`
}

export function CampaignStepsList({ steps, campaignId }: CampaignStepsListProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  async function deleteStep(stepId: string) {
    if (!confirm("Are you sure you want to delete this step?")) return
    await supabase.from("campaign_steps").delete().eq("id", stepId)
    router.refresh()
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    const currentStep = steps.find((s) => s.id === stepId)
    if (!currentStep) return

    const targetNumber = direction === "up" ? currentStep.step_number - 1 : currentStep.step_number + 1
    const targetStep = steps.find((s) => s.step_number === targetNumber)

    if (!targetStep) return

    // Swap step numbers
    await supabase.from("campaign_steps").update({ step_number: targetNumber }).eq("id", stepId)
    await supabase.from("campaign_steps").update({ step_number: currentStep.step_number }).eq("id", targetStep.id)
    router.refresh()
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Campaign Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-dashed rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No steps yet. Add your first step to build the drip sequence.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Campaign Steps ({steps.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const Icon = actionIcons[step.action_type]
          return (
            <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => moveStep(step.id, "up")}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <span className="text-xs font-medium text-muted-foreground">#{step.step_number}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(step.id, "down")}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={actionColors[step.action_type]}>
                    <Icon className="h-3 w-3 mr-1" />
                    {step.action_type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDelay(step.delay_minutes)} after enrollment
                  </span>
                </div>
                {step.subject && <p className="font-medium text-sm">{step.subject}</p>}
                <p className="text-sm text-muted-foreground line-clamp-2">{step.body}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteStep(step.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
