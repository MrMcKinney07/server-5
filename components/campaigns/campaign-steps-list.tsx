"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Mail, MessageSquare, Home, Trash2, ArrowUp, ArrowDown, Sparkles } from "lucide-react"

interface CampaignStep {
  id: string
  campaign_id: string
  step_number: number
  type: "email" | "sms" | "property_recommendation"
  subject: string | null
  body: string | null
  delay_hours: number
  ai_personalize: boolean
  criteria: Record<string, unknown> | null
}

interface CampaignStepsListProps {
  steps: CampaignStep[]
  campaignId: string
}

const typeIcons: Record<string, React.ElementType> = {
  email: Mail,
  sms: MessageSquare,
  property_recommendation: Home,
}

const typeColors: Record<string, string> = {
  email: "bg-blue-100 text-blue-700",
  sms: "bg-green-100 text-green-700",
  property_recommendation: "bg-purple-100 text-purple-700",
}

const typeLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  property_recommendation: "Property Rec",
}

function formatDelay(hours: number): string {
  if (hours === 0) return "Immediately"
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""}`
}

export function CampaignStepsList({ steps, campaignId }: CampaignStepsListProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  async function deleteStep(stepId: string) {
    if (!confirm("Are you sure you want to delete this step?")) return
    await supabase.from("campaign_steps").delete().eq("id", stepId)
    router.refresh()
  }

  async function toggleAiPersonalize(stepId: string, currentValue: boolean) {
    await supabase.from("campaign_steps").update({ ai_personalize: !currentValue }).eq("id", stepId)
    router.refresh()
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    const currentStep = steps.find((s) => s.id === stepId)
    if (!currentStep) return

    const targetNumber = direction === "up" ? currentStep.step_number - 1 : currentStep.step_number + 1
    const targetStep = steps.find((s) => s.step_number === targetNumber)

    if (!targetStep) return

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
          const Icon = typeIcons[step.type] || Mail
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="secondary" className={typeColors[step.type]}>
                    <Icon className="h-3 w-3 mr-1" />
                    {typeLabels[step.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDelay(step.delay_hours)} after previous</span>
                  {step.ai_personalize && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                {step.subject && <p className="font-medium text-sm">{step.subject}</p>}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {step.body || "Property recommendations based on lead preferences"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">AI Personalize:</span>
                  <Switch
                    checked={step.ai_personalize}
                    onCheckedChange={() => toggleAiPersonalize(step.id, step.ai_personalize)}
                    className="scale-75"
                  />
                </div>
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
