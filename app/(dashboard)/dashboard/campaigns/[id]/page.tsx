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
  Clock,
  AlertCircle,
} from "lucide-react"
import { CampaignDetails } from "@/components/campaigns/campaign-details"
import { CampaignTimelineBuilder } from "@/components/campaigns/campaign-timeline-builder"
import { CampaignEnrollmentsList } from "@/components/campaigns/campaign-enrollments-list"
import { CampaignActivityLog } from "@/components/campaigns/campaign-activity-log"
import { CampaignLeadEnrollment } from "@/components/campaigns/campaign-lead-enrollment"
import { CampaignDetailTabs } from "@/components/campaigns/campaign-detail-tabs"
import { Badge } from "@/components/ui/badge"

interface CampaignPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params
  await requireAuth()
  const supabase = await createClient()

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single()
  if (!campaign) notFound()

  const [stepsRes, enrollRes, runsRes, logsRes] = await Promise.all([
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
    supabase
      .from("campaign_logs")
      .select("id, event, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
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

  const channelColor =
    campaign.channel === "SMS"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : campaign.channel === "BOTH"
      ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
      : "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"

  const analyticsStats = [
    {
      label: "Total Enrolled",
      value: enrollments.length,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      sub: `${activeCount} active · ${completedCount} done · ${pausedCount} paused`,
    },
    {
      label: "Messages Sent",
      value: totalSent.toLocaleString(),
      icon: Send,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      sub: totalFailed > 0 ? `${totalFailed} failed` : "no failures",
    },
    {
      label: "Delivery Rate",
      value: deliveryRate !== null ? `${deliveryRate}%` : "—",
      icon: CheckCircle2,
      color: deliveryRate === null ? "text-muted-foreground" : deliveryRate >= 90 ? "text-emerald-400" : deliveryRate >= 70 ? "text-amber-400" : "text-red-400",
      bg: "bg-white/[0.04]",
      sub: `${totalDelivered.toLocaleString()} delivered`,
    },
    {
      label: "Reply Rate",
      value: replyRate !== null ? `${replyRate}%` : "—",
      icon: TrendingUp,
      color: replyRate === null ? "text-muted-foreground" : replyRate > 5 ? "text-emerald-400" : "text-amber-400",
      bg: "bg-white/[0.04]",
      sub: `${totalReplies.toLocaleString()} replies · ${totalClicks} clicks`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{campaign.name}</h1>
            <Badge
              variant="outline"
              className={`text-xs border shrink-0 ${channelColor}`}
            >
              {campaign.channel === "SMS" ? (
                <><MessageSquare className="h-3 w-3 mr-1" />SMS</>
              ) : campaign.channel === "BOTH" ? (
                <><Mail className="h-3 w-3 mr-1" /><MessageSquare className="h-3 w-3 mr-1" />Email + SMS</>
              ) : (
                <><Mail className="h-3 w-3 mr-1" />Email</>
              )}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${campaign.is_active ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-white/[0.08] text-muted-foreground"}`}
            >
              <span className={`mr-1.5 inline-block w-1.5 h-1.5 rounded-full ${campaign.is_active ? "bg-emerald-400" : "bg-muted-foreground"}`} />
              {campaign.is_active ? "Active" : "Paused"}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{campaign.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {steps.length} steps · Created {new Date(campaign.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Analytics stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {analyticsStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3"
          >
            <div className={`rounded-lg p-2 ${stat.bg} shrink-0`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
              <p className="text-xs font-medium">{stat.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enrollment progress bar */}
      {enrollments.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Enrollment Progress</span>
            <span className="text-xs text-muted-foreground">
              {completedCount} of {enrollments.length} completed
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
              style={{ width: `${Math.round((completedCount / enrollments.length) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {activeCount} active
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {pausedCount} paused
            </span>
            <span className="flex items-center gap-1 text-[11px] text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              {completedCount} completed
            </span>
          </div>
        </div>
      )}

      {/* Tabbed content */}
      <CampaignDetailTabs
        campaign={campaign}
        steps={steps}
        enrollments={enrollments}
      />
    </div>
  )
}
