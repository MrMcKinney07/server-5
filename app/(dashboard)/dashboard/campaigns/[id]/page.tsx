import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Users,
  Send,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  MousePointerClick,
} from "lucide-react"
import { CampaignDetailTabs } from "@/components/campaigns/campaign-detail-tabs"

interface CampaignPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params
  await requireAuth()
  const supabase = await createClient()

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single()
  if (!campaign) notFound()

  const [stepsRes, enrollRes, runsRes] = await Promise.all([
    supabase
      .from("campaign_steps")
      .select("*")
      .eq("campaign_id", id)
      .order("step_number", { ascending: true }),
    supabase
      .from("lead_campaign_enrollments")
      .select("*, lead:leads(first_name, last_name, email, phone)")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("campaign_runs")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false }),
  ])

  const steps = stepsRes.data || []
  const enrollments = enrollRes.data || []
  const runs = runsRes.data || []

  const activeCount = enrollments.filter((e) => e.status === "active").length
  const completedCount = enrollments.filter((e) => e.status === "completed").length
  const pausedCount = enrollments.filter((e) => e.status === "paused").length

  const totalSent = runs.reduce((s, r) => s + (r.sent || 0), 0)
  const totalDelivered = runs.reduce((s, r) => s + (r.delivered || 0), 0)
  const totalReplies = runs.reduce((s, r) => s + (r.replies || 0), 0)
  const totalClicks = runs.reduce((s, r) => s + (r.clicks || 0), 0)
  const totalFailed = runs.reduce((s, r) => s + (r.failed || 0), 0)
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : null
  const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : null
  const clickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : null

  const channelLabel =
    campaign.channel === "SMS" ? "SMS" :
    campaign.channel === "BOTH" ? "Email + SMS" : "Email"

  const channelStyle =
    campaign.channel === "SMS" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    campaign.channel === "BOTH" ? "text-violet-400 bg-violet-500/10 border-violet-500/20" :
    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"

  const analyticsStats = [
    {
      label: "Total Enrolled",
      value: enrollments.length,
      display: enrollments.length.toLocaleString(),
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
      sub: `${activeCount} active · ${completedCount} completed · ${pausedCount} paused`,
    },
    {
      label: "Sent",
      value: totalSent,
      display: totalSent.toLocaleString(),
      icon: Send,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      sub: totalFailed > 0 ? `${totalFailed} failed sends` : "no failures",
      subColor: totalFailed > 0 ? "text-red-400" : undefined,
    },
    {
      label: "Delivery Rate",
      value: deliveryRate,
      display: deliveryRate !== null ? `${deliveryRate}%` : "—",
      icon: CheckCircle2,
      color: deliveryRate === null ? "text-muted-foreground" : deliveryRate >= 90 ? "text-emerald-400" : deliveryRate >= 70 ? "text-amber-400" : "text-red-400",
      bg: "bg-white/[0.03] border-white/[0.06]",
      sub: `${totalDelivered.toLocaleString()} delivered`,
    },
    {
      label: "Reply Rate",
      value: replyRate,
      display: replyRate !== null ? `${replyRate}%` : "—",
      icon: TrendingUp,
      color: replyRate === null ? "text-muted-foreground" : replyRate > 5 ? "text-emerald-400" : "text-amber-400",
      bg: "bg-white/[0.03] border-white/[0.06]",
      sub: `${totalReplies.toLocaleString()} replies · ${totalClicks} clicks`,
    },
  ]

  const completionPct = enrollments.length > 0
    ? Math.round((completedCount / enrollments.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-lg border ${channelStyle}`}>
              {campaign.channel === "SMS" ? <MessageSquare className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
              {channelLabel}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-lg border ${
              campaign.is_active
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                : "border-white/[0.08] text-muted-foreground bg-white/[0.03]"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${campaign.is_active ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
              {campaign.is_active ? "Active" : "Paused"}
            </span>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {steps.length} {steps.length === 1 ? "step" : "steps"} · Created{" "}
            {new Date(campaign.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

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

      {/* Tabbed content */}
      <CampaignDetailTabs campaign={campaign} steps={steps} enrollments={enrollments} />
    </div>
  )
}
