"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { CampaignTimelineBuilder } from "@/components/campaigns/campaign-timeline-builder"
import { CampaignEnrollmentsList } from "@/components/campaigns/campaign-enrollments-list"
import { CampaignActivityLog } from "@/components/campaigns/campaign-activity-log"
import { CampaignLeadEnrollment } from "@/components/campaigns/campaign-lead-enrollment"
import { CampaignDetails } from "@/components/campaigns/campaign-details"
import { BarChart2, ListOrdered, Users, Activity, Settings, Send, CheckCircle2, TrendingUp, XCircle } from "lucide-react"

interface Campaign {
  id: string
  name: string
  description: string | null
  is_active: boolean
  channel?: string
  type?: string
  send_time_local?: string
  quiet_hours_start?: string
  quiet_hours_end?: string
  stop_on_reply?: boolean
  throttle_per_minute?: number
  dedupe_window_days?: number
  audience_filter?: { send_days?: string[] }
  created_at: string
  owner?: { full_name: string; email: string; Name?: string } | null
}

interface Step {
  id: string
  step_number: number
  type: string
  subject?: string
  body?: string
  delay_hours?: number
  [key: string]: unknown
}

interface Enrollment {
  id: string
  lead_id: string
  campaign_id: string
  current_step: number
  status: "active" | "paused" | "completed"
  next_run_at: string | null
  created_at: string
  lead: { first_name: string; last_name: string; email: string; phone: string | null } | null
}

interface CampaignRun {
  id: string
  sent: number
  delivered: number
  failed: number
  clicks: number
  replies: number
  run_at: string
  step_id?: string
}

interface CampaignDetailTabsProps {
  campaign: Campaign
  steps: Step[]
  enrollments: Enrollment[]
  runs?: CampaignRun[]
}

const tabs = [
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "sequence", label: "Sequence", icon: ListOrdered },
  { id: "enrollments", label: "Enrollments", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f1623] border border-white/[0.1] rounded-lg p-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function AnalyticsTab({ runs, enrollments }: { runs: CampaignRun[]; enrollments: Enrollment[] }) {
  const totalSent = runs.reduce((s, r) => s + (r.sent || 0), 0)
  const totalDelivered = runs.reduce((s, r) => s + (r.delivered || 0), 0)
  const totalFailed = runs.reduce((s, r) => s + (r.failed || 0), 0)
  const totalReplies = runs.reduce((s, r) => s + (r.replies || 0), 0)
  const totalClicks = runs.reduce((s, r) => s + (r.clicks || 0), 0)
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0
  const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0
  const failRate = totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0

  const activeEnrollments = enrollments.filter((e) => e.status === "active").length
  const completedEnrollments = enrollments.filter((e) => e.status === "completed").length

  // Build chart data — group runs by date
  const byDate = runs.reduce<Record<string, { sent: number; delivered: number; replies: number; failed: number }>>((acc, r) => {
    const date = new Date(r.run_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (!acc[date]) acc[date] = { sent: 0, delivered: 0, replies: 0, failed: 0 }
    acc[date].sent += r.sent || 0
    acc[date].delivered += r.delivered || 0
    acc[date].replies += r.replies || 0
    acc[date].failed += r.failed || 0
    return acc
  }, {})

  const chartData = Object.entries(byDate)
    .slice(-30)
    .map(([date, vals]) => ({ date, ...vals }))

  const statCards = [
    { label: "Sent", value: totalSent.toLocaleString(), icon: Send, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Delivered", value: `${deliveryRate}%`, sub: `${totalDelivered.toLocaleString()} msgs`, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Replies", value: `${replyRate}%`, sub: `${totalReplies.toLocaleString()} total`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Failed", value: `${failRate}%`, sub: `${totalFailed.toLocaleString()} msgs`, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  ]

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-start gap-3 ${s.bg}`}>
            <div className="rounded-lg p-2 bg-white/[0.04] shrink-0">
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs font-medium text-foreground/80">{s.label}</p>
              {s.sub && <p className="text-[11px] text-muted-foreground">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Enrollment split */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Enrollment Progress</p>
          <span className="text-xs text-muted-foreground">{enrollments.length} total</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {activeEnrollments > 0 && (
            <div className="bg-emerald-500 rounded-full" style={{ width: `${(activeEnrollments / enrollments.length) * 100}%` }} title={`${activeEnrollments} active`} />
          )}
          {completedEnrollments > 0 && (
            <div className="bg-cyan-500 rounded-full" style={{ width: `${(completedEnrollments / enrollments.length) * 100}%` }} title={`${completedEnrollments} completed`} />
          )}
          {(enrollments.length - activeEnrollments - completedEnrollments) > 0 && (
            <div className="bg-white/[0.08] rounded-full flex-1" title="paused" />
          )}
        </div>
        <div className="flex items-center gap-4 mt-2.5">
          {[
            { label: "Active", count: activeEnrollments, color: "bg-emerald-400" },
            { label: "Completed", count: completedEnrollments, color: "bg-cyan-400" },
            { label: "Paused", count: enrollments.length - activeEnrollments - completedEnrollments, color: "bg-white/30" },
          ].map(({ label, count, color }) => count > 0 && (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {count} {label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Message Activity</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {[
                { key: "delivered", color: "#22d3ee", label: "Delivered" },
                { key: "replies", color: "#f59e0b", label: "Replies" },
                { key: "failed", color: "#f87171", label: "Failed" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {[
                  { id: "delivered", color: "#22d3ee" },
                  { id: "replies", color: "#f59e0b" },
                  { id: "failed", color: "#f87171" },
                ].map(({ id, color }) => (
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#22d3ee" strokeWidth={1.5} fill="url(#grad-delivered)" />
              <Area type="monotone" dataKey="replies" name="Replies" stroke="#f59e0b" strokeWidth={1.5} fill="url(#grad-replies)" />
              <Area type="monotone" dataKey="failed" name="Failed" stroke="#f87171" strokeWidth={1.5} fill="url(#grad-failed)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center">
          <BarChart2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Analytics will appear once the campaign starts sending</p>
        </div>
      )}
    </div>
  )
}

export function CampaignDetailTabs({ campaign, steps, enrollments: initialEnrollments, runs = [] }: CampaignDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("analytics")
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const supabase = createBrowserClient()

  const refreshEnrollments = useCallback(async () => {
    const { data } = await supabase
      .from("lead_campaign_enrollments")
      .select("*, lead:leads(first_name, last_name, email, phone)")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(100)
    if (data) setEnrollments(data as typeof initialEnrollments)
  }, [campaign.id, supabase])

  // Also listen for the window event so tab counter and analytics update immediately
  useEffect(() => {
    const handler = () => refreshEnrollments()
    window.addEventListener("campaign-enrollment-updated", handler)
    return () => window.removeEventListener("campaign-enrollment-updated", handler)
  }, [refreshEnrollments])

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.id === "enrollments" ? `${tab.label} (${enrollments.length})` : tab.label}
          </button>
        ))}
      </div>

      {activeTab === "analytics" && <AnalyticsTab runs={runs} enrollments={enrollments} />}
      {activeTab === "sequence" && (
        <CampaignTimelineBuilder steps={steps} campaignId={campaign.id} />
      )}
      {activeTab === "enrollments" && (
        <div className="space-y-6">
          <CampaignLeadEnrollment campaignId={campaign.id} campaignName={campaign.name} onEnrolled={refreshEnrollments} />
          <CampaignEnrollmentsList enrollments={enrollments} />
        </div>
      )}
      {activeTab === "activity" && <CampaignActivityLog campaignId={campaign.id} />}
      {activeTab === "settings" && <CampaignDetails campaign={campaign} />}
    </div>
  )
}
