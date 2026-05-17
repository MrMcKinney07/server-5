"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Users, Send, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react"

interface Props {
  campaignId: string
  initialEnrollments: { status: string }[]
  totalSent: number
  totalDelivered: number
  totalReplies: number
  totalClicks: number
  totalFailed: number
  deliveryRate: number | null
  replyRate: number | null
}

export function CampaignEnrollmentStats({
  campaignId,
  initialEnrollments,
  totalSent: initialTotalSent,
  totalDelivered: initialTotalDelivered,
  totalReplies: initialTotalReplies,
  totalClicks: initialTotalClicks,
  totalFailed: initialTotalFailed,
  deliveryRate: initialDeliveryRate,
  replyRate: initialReplyRate,
}: Props) {
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const supabase = createBrowserClient()

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("lead_campaign_enrollments")
      .select("status")
      .eq("campaign_id", campaignId)
    if (data) setEnrollments(data)
  }, [campaignId, supabase])

  // Listen for custom event fired by CampaignLeadEnrollment after successful enrollment
  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener("campaign-enrollment-updated", handler)
    return () => window.removeEventListener("campaign-enrollment-updated", handler)
  }, [refresh])

  const totalSent = initialTotalSent
  const totalDelivered = initialTotalDelivered
  const totalReplies = initialTotalReplies
  const totalClicks = initialTotalClicks
  const totalFailed = initialTotalFailed
  const deliveryRate = initialDeliveryRate
  const replyRate = initialReplyRate

  const activeCount = enrollments.filter((e) => e.status === "active").length
  const completedCount = enrollments.filter((e) => e.status === "completed").length
  const pausedCount = enrollments.filter((e) => e.status === "paused").length
  const completionPct = enrollments.length > 0
    ? Math.round((completedCount / enrollments.length) * 100)
    : 0

  const analyticsStats = [
    {
      label: "Total Enrolled",
      display: enrollments.length.toLocaleString(),
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
      sub: `${activeCount} active · ${completedCount} completed · ${pausedCount} paused`,
    },
    {
      label: "Sent",
      display: totalSent.toLocaleString(),
      icon: Send,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      sub: totalFailed > 0 ? `${totalFailed} failed sends` : "no failures",
      subColor: totalFailed > 0 ? "text-red-400" : undefined,
    },
    {
      label: "Delivery Rate",
      display: deliveryRate !== null ? `${deliveryRate}%` : "—",
      icon: CheckCircle2,
      color: deliveryRate === null ? "text-muted-foreground" : deliveryRate >= 90 ? "text-emerald-400" : deliveryRate >= 70 ? "text-amber-400" : "text-red-400",
      bg: "bg-white/[0.03] border-white/[0.06]",
      sub: `${totalDelivered.toLocaleString()} delivered`,
    },
    {
      label: "Reply Rate",
      display: replyRate !== null ? `${replyRate}%` : "—",
      icon: TrendingUp,
      color: replyRate === null ? "text-muted-foreground" : replyRate > 5 ? "text-emerald-400" : "text-amber-400",
      bg: "bg-white/[0.03] border-white/[0.06]",
      sub: `${totalReplies.toLocaleString()} replies · ${totalClicks} clicks`,
    },
  ]

  return (
    <>
      {/* Analytics stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {analyticsStats.map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 flex items-start gap-3 ${stat.bg}`}>
            <div className="rounded-lg p-2 bg-white/[0.04] shrink-0">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.display}</p>
              <p className="text-xs font-medium text-foreground/80">{stat.label}</p>
              <p className={`text-[11px] truncate ${stat.subColor ?? "text-muted-foreground"}`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enrollment progress */}
      {enrollments.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium">Enrollment Progress</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {completedCount} of {enrollments.length} completed
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex items-center gap-5 mt-2.5">
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-medium">{activeCount}</span>
              <span className="text-muted-foreground">active</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-medium">{pausedCount}</span>
              <span className="text-muted-foreground">paused</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-cyan-400 font-medium">{completedCount}</span>
              <span className="text-muted-foreground">completed</span>
            </span>
            {totalFailed > 0 && (
              <span className="flex items-center gap-1.5 text-xs">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span className="text-red-400 font-medium">{totalFailed}</span>
                <span className="text-muted-foreground">failed</span>
              </span>
            )}
          </div>
        </div>
      )}
    </>
  )
}
