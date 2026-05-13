"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Mail,
  MessageSquare,
  Home,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Clock,
  Zap,
  Calendar,
  CalendarDays,
  Paperclip,
  Link2,
  ImageIcon,
} from "lucide-react"
import { AddStepDialog } from "./add-step-dialog"

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
  schedule_type?: "delay" | "weekly" | "monthly"
  schedule_day_of_week?: number | null
  schedule_day_of_month?: number | null
  schedule_time?: string | null
  attachments?: Array<{ name: string; url: string; type: string }>
  links?: Array<{ text: string; url: string }>
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
  email: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  sms: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
  property_recommendation:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
}

const typeLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  property_recommendation: "Property Rec",
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function formatDelay(hours: number): string {
  if (hours === 0) return "Immediately"
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (remainingHours === 0) return `${days} day${days > 1 ? "s" : ""}`
  return `${days}d ${remainingHours}h`
}

function formatSchedule(step: CampaignStep): { icon: React.ElementType; text: string; subtext?: string } {
  const scheduleType = step.schedule_type || "delay"

  if (scheduleType === "weekly" && step.schedule_day_of_week !== null && step.schedule_day_of_week !== undefined) {
    const dayName = DAYS_OF_WEEK[step.schedule_day_of_week]
    const time = step.schedule_time || "10:00"
    return {
      icon: Calendar,
      text: `Every ${dayName}`,
      subtext: `at ${time}`,
    }
  }

  if (scheduleType === "monthly" && step.schedule_day_of_month) {
    const day = step.schedule_day_of_month
    const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"
    const time = step.schedule_time || "10:00"
    return {
      icon: CalendarDays,
      text: `${day}${suffix} of month`,
      subtext: `at ${time}`,
    }
  }

  // Default: delay
  return {
    icon: Clock,
    text: step.delay_hours === 0 ? "Immediately" : `After ${formatDelay(step.delay_hours)}`,
  }
}

function getCumulativeDelay(steps: CampaignStep[], currentIndex: number): number {
  let total = 0
  for (let i = 0; i <= currentIndex; i++) {
    if (steps[i].schedule_type === "delay" || !steps[i].schedule_type) {
      total += steps[i].delay_hours
    }
  }
  return total
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
          <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Build Your Drip Sequence</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add steps to create an automated sequence. Each step can send an email, SMS, or property recommendations
              at your chosen intervals.
            </p>
            <AddStepDialog campaignId={campaignId} nextStepNumber={1} />

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground mb-3">Quick Start Ideas:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Welcome Email → Day 1
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Follow-up SMS → Day 3
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Home className="h-3 w-3 mr-1" />
                  Property Match → Day 7
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-medium">Campaign Steps ({steps.length})</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200 dark:bg-blue-950 dark:border-blue-800" />
              Email
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200 dark:bg-green-950 dark:border-green-800" />
              SMS
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200 dark:bg-purple-950 dark:border-purple-800" />
              Properties
            </span>
          </div>
        </div>
        <AddStepDialog campaignId={campaignId} nextStepNumber={steps.length + 1} />
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const Icon = typeIcons[step.type] || Mail
          const cumulativeDelay = getCumulativeDelay(steps, index)
          const schedule = formatSchedule(step)
          const ScheduleIcon = schedule.icon
          const attachments = step.attachments || []
          const links = step.links || []

          return (
            <div key={step.id} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-[26px] top-[60px] bottom-[-12px] w-0.5 bg-border" />
              )}

              <div
                className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-colors ${
                  step.type === "email"
                    ? "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20"
                    : step.type === "sms"
                      ? "border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20"
                      : "border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/20"
                }`}
              >
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
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${typeColors[step.type]}`}
                  >
                    {step.step_number}
                  </div>
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
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="secondary" className={typeColors[step.type]}>
                      <Icon className="h-3 w-3 mr-1" />
                      {typeLabels[step.type]}
                    </Badge>

                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                      <ScheduleIcon className="h-3 w-3" />
                      <span className="font-medium">{schedule.text}</span>
                      {schedule.subtext && <span className="text-muted-foreground">{schedule.subtext}</span>}
                    </div>

                    {/* Show cumulative delay only for delay-based steps */}
                    {(step.schedule_type === "delay" || !step.schedule_type) && index > 0 && cumulativeDelay > 0 && (
                      <span className="text-xs text-muted-foreground">({formatDelay(cumulativeDelay)} from start)</span>
                    )}

                    {step.ai_personalize && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>

                  {step.subject && (
                    <p className="font-medium text-sm mb-1">
                      <span className="text-muted-foreground">Subject:</span> {step.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {step.body || "Property recommendations based on lead preferences"}
                  </p>

                  {(attachments.length > 0 || links.length > 0) && (
                    <div className="flex items-center gap-3 mt-2">
                      {attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {attachments.some((a) => a.type?.startsWith("image/")) && (
                            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">
                              <ImageIcon className="h-3 w-3" />
                              {attachments.filter((a) => a.type?.startsWith("image/")).length}
                            </span>
                          )}
                          {attachments.some((a) => !a.type?.startsWith("image/")) && (
                            <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded">
                              <Paperclip className="h-3 w-3" />
                              {attachments.filter((a) => !a.type?.startsWith("image/")).length}
                            </span>
                          )}
                        </div>
                      )}
                      {links.length > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded text-cyan-700 dark:text-cyan-300">
                          <Link2 className="h-3 w-3" />
                          {links.length} link{links.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-dashed">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">AI Personalize:</span>
                      <Switch
                        checked={step.ai_personalize}
                        onCheckedChange={() => toggleAiPersonalize(step.id, step.ai_personalize)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteStep(step.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          )
        })}

        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
          <AddStepDialog campaignId={campaignId} nextStepNumber={steps.length + 1} />
          <p className="text-xs text-muted-foreground mt-2">Add step #{steps.length + 1} to continue the sequence</p>
        </div>
      </CardContent>
    </Card>
  )
}
