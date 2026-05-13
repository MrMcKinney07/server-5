"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { createClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Mail, MessageSquare, Home, Trash2, ArrowUp, ArrowDown,
  Sparkles, Clock, Zap, Calendar, CalendarDays, Paperclip, Link2, ImageIcon,
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

const typeConfig = {
  email: { icon: Mail, label: "Email", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", line: "bg-cyan-500/30" },
  sms: { icon: MessageSquare, label: "SMS", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", line: "bg-emerald-500/30" },
  property_recommendation: { icon: Home, label: "Properties", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", line: "bg-violet-500/30" },
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function formatDelay(hours: number): string {
  if (hours === 0) return "Immediately"
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  const rem = hours % 24
  return rem === 0 ? `${days}d` : `${days}d ${rem}h`
}

function getSchedule(step: CampaignStep): { icon: React.ElementType; text: string; sub?: string } {
  const t = step.schedule_type || "delay"
  if (t === "weekly" && step.schedule_day_of_week != null) {
    return { icon: Calendar, text: `Every ${DAYS_OF_WEEK[step.schedule_day_of_week]}`, sub: `at ${step.schedule_time || "10:00"}` }
  }
  if (t === "monthly" && step.schedule_day_of_month) {
    const d = step.schedule_day_of_month
    const s = d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"
    return { icon: CalendarDays, text: `${d}${s} of month`, sub: `at ${step.schedule_time || "10:00"}` }
  }
  return { icon: Clock, text: step.delay_hours === 0 ? "Immediately" : `After ${formatDelay(step.delay_hours)}` }
}

function getCumulativeDelay(steps: CampaignStep[], idx: number): number {
  let total = 0
  for (let i = 0; i <= idx; i++) {
    if (!steps[i].schedule_type || steps[i].schedule_type === "delay") total += steps[i].delay_hours
  }
  return total
}

export function CampaignStepsList({ steps, campaignId }: CampaignStepsListProps) {
  const router = useRouter()

  async function deleteStep(stepId: string) {
    if (!confirm("Delete this step?")) return
    if (!hasSupabaseCredentials()) return
    const supabase = createClient()
    await supabase.from("campaign_steps").delete().eq("id", stepId)
    router.refresh()
  }

  async function toggleAi(stepId: string, current: boolean) {
    if (!hasSupabaseCredentials()) return
    const supabase = createClient()
    await supabase.from("campaign_steps").update({ ai_personalize: !current }).eq("id", stepId)
    router.refresh()
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    if (!hasSupabaseCredentials()) return
    const current = steps.find((s) => s.id === stepId)
    if (!current) return
    const targetNum = direction === "up" ? current.step_number - 1 : current.step_number + 1
    const target = steps.find((s) => s.step_number === targetNum)
    if (!target) return
    const supabase = createClient()
    await supabase.from("campaign_steps").update({ step_number: targetNum }).eq("id", stepId)
    await supabase.from("campaign_steps").update({ step_number: current.step_number }).eq("id", target.id)
    router.refresh()
  }

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
          <Zap className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1.5">Build your sequence</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          Add steps to create an automated drip — emails, texts, or property recommendations.
        </p>
        <AddStepDialog campaignId={campaignId} nextStepNumber={1} />
        <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-wrap gap-2 justify-center">
          {[
            { icon: Mail, text: "Welcome Email → Day 1", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
            { icon: MessageSquare, text: "Follow-up SMS → Day 3", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
            { icon: Home, text: "Property Match → Day 7", color: "text-violet-400 border-violet-500/20 bg-violet-500/5" },
          ].map(({ icon: Icon, text, color }) => (
            <span key={text} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${color}`}>
              <Icon className="h-3 w-3" />
              {text}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-4">
        {Object.entries(typeConfig).map(([type, cfg]) => (
          <div key={type} className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
            <cfg.icon className="h-3 w-3" />
            {cfg.label}
          </div>
        ))}
        <div className="ml-auto">
          <AddStepDialog campaignId={campaignId} nextStepNumber={steps.length + 1} />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0 relative">
        {steps.map((step, index) => {
          const cfg = typeConfig[step.type] || typeConfig.email
          const Icon = cfg.icon
          const schedule = getSchedule(step)
          const ScheduleIcon = schedule.icon
          const cumulative = getCumulativeDelay(steps, index)
          const attachments = step.attachments || []
          const links = step.links || []
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="relative flex gap-4">
              {/* Timeline column */}
              <div className="flex flex-col items-center shrink-0 w-10">
                {/* Step number badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-sm font-bold shrink-0 z-10 ${cfg.bg} ${cfg.color}`}>
                  {step.step_number}
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[16px] my-1 ${cfg.line}`} />
                )}
              </div>

              {/* Card */}
              <div className={`flex-1 mb-3 rounded-xl border bg-white/[0.02] hover:bg-white/[0.035] transition-colors ${cfg.bg.replace("bg-", "border-").replace("/10", "/20")}`}>
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
                        <ScheduleIcon className="h-3 w-3" />
                        {schedule.text}
                        {schedule.sub && <span className="text-muted-foreground/60">{schedule.sub}</span>}
                      </span>
                      {(!step.schedule_type || step.schedule_type === "delay") && index > 0 && cumulative > 0 && (
                        <span className="text-[11px] text-muted-foreground/60">
                          ({formatDelay(cumulative)} from start)
                        </span>
                      )}
                      {step.ai_personalize && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      )}
                    </div>

                    {/* Step controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" disabled={index === 0} onClick={() => moveStep(step.id, "up")}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" disabled={isLast} onClick={() => moveStep(step.id, "down")}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={() => deleteStep(step.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  {step.subject && (
                    <p className="text-sm font-medium mb-1 text-foreground/90">
                      <span className="text-muted-foreground text-xs mr-1">Subject:</span>
                      {step.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {step.body || "Property recommendations based on lead preferences"}
                  </p>

                  {/* Attachments / links */}
                  {(attachments.length > 0 || links.length > 0) && (
                    <div className="flex items-center gap-2 mt-2">
                      {attachments.some((a) => a.type?.startsWith("image/")) && (
                        <span className="flex items-center gap-1 text-[11px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                          <ImageIcon className="h-3 w-3" />
                          {attachments.filter((a) => a.type?.startsWith("image/")).length}
                        </span>
                      )}
                      {attachments.some((a) => !a.type?.startsWith("image/")) && (
                        <span className="flex items-center gap-1 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                          <Paperclip className="h-3 w-3" />
                          {attachments.filter((a) => !a.type?.startsWith("image/")).length}
                        </span>
                      )}
                      {links.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded">
                          <Link2 className="h-3 w-3" />
                          {links.length} link{links.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                    <span className="text-xs text-muted-foreground">AI Personalize</span>
                    <Switch
                      checked={step.ai_personalize}
                      onCheckedChange={() => toggleAi(step.id, step.ai_personalize)}
                      className="scale-75 origin-left"
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add step CTA */}
        <div className="flex gap-4">
          <div className="w-10 flex justify-center">
            <div className="w-0.5 h-4 bg-white/[0.06]" />
          </div>
          <div className="flex-1 mb-2">
            <div className="rounded-xl border border-dashed border-white/[0.08] p-4 text-center hover:border-white/[0.16] hover:bg-white/[0.02] transition-colors">
              <AddStepDialog campaignId={campaignId} nextStepNumber={steps.length + 1} />
              <p className="text-xs text-muted-foreground mt-1.5">Add step #{steps.length + 1} to continue the sequence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
