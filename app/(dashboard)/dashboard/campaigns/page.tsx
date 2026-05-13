import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { CampaignCards } from "@/components/campaigns/campaign-cards"
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog"
import { Megaphone, Users, Send, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function CampaignsPage() {
  try {
    const agent = await requireAuth()
    const supabase = await createClient()

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })

    const filteredCampaigns =
      agent.Role === "broker"
        ? campaigns || []
        : (campaigns || []).filter((c) => c.owner_id === agent.id)

    // Enrich each campaign with step count, enrollment count, and run stats
    const enriched = await Promise.all(
      filteredCampaigns.map(async (campaign) => {
        const [stepsRes, enrollRes, runsRes, logsRes] = await Promise.all([
          supabase
            .from("campaign_steps")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", campaign.id),
          supabase
            .from("lead_campaign_enrollments")
            .select("id, status", { count: "exact" })
            .eq("campaign_id", campaign.id),
          supabase
            .from("campaign_runs")
            .select("sent, delivered, failed, clicks, replies")
            .eq("campaign_id", campaign.id),
          supabase
            .from("campaign_logs")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", campaign.id),
        ])

        const enrollments = enrollRes.data || []
        const runs = runsRes.data || []
        const totalSent = runs.reduce((s, r) => s + (r.sent || 0), 0)
        const totalDelivered = runs.reduce((s, r) => s + (r.delivered || 0), 0)
        const totalClicks = runs.reduce((s, r) => s + (r.clicks || 0), 0)
        const totalReplies = runs.reduce((s, r) => s + (r.replies || 0), 0)
        const totalFailed = runs.reduce((s, r) => s + (r.failed || 0), 0)

        return {
          ...campaign,
          stepsCount: stepsRes.count || 0,
          enrollmentsCount: enrollRes.count || 0,
          activeCount: enrollments.filter((e) => e.status === "active").length,
          completedCount: enrollments.filter((e) => e.status === "completed").length,
          totalSent,
          totalDelivered,
          totalClicks,
          totalReplies,
          totalFailed,
          deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : null,
          replyRate: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : null,
          activityCount: logsRes.count || 0,
        }
      }),
    )

    // Aggregate totals for top stats
    const totalEnrolled = enriched.reduce((s, c) => s + c.enrollmentsCount, 0)
    const totalSentAll = enriched.reduce((s, c) => s + c.totalSent, 0)
    const totalRepliesAll = enriched.reduce((s, c) => s + c.totalReplies, 0)
    const activeCampaigns = enriched.filter((c) => c.is_active).length

    const stats = [
      {
        label: "Active Campaigns",
        value: activeCampaigns,
        sub: `of ${enriched.length} total`,
        icon: Megaphone,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
      },
      {
        label: "Total Enrolled",
        value: totalEnrolled,
        sub: "leads across all campaigns",
        icon: Users,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
      {
        label: "Messages Sent",
        value: totalSentAll,
        sub: "emails & texts",
        icon: Send,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        label: "Total Replies",
        value: totalRepliesAll,
        sub: totalSentAll > 0 ? `${Math.round((totalRepliesAll / totalSentAll) * 100)}% reply rate` : "no sends yet",
        icon: TrendingUp,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
    ]

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Drip Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated email and SMS sequences for lead nurturing
            </p>
          </div>
          <CreateCampaignDialog />
        </div>

        {/* Top stats */}
        {enriched.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3"
              >
                <div className={`rounded-lg p-2 ${stat.bg} shrink-0`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold tabular-nums">{stat.value.toLocaleString()}</p>
                  <p className="text-xs font-medium text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campaign list */}
        {enriched.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] p-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first drip campaign to automatically nurture leads with personalized emails and texts.
            </p>
            <CreateCampaignDialog />
          </div>
        ) : (
          <CampaignCards campaigns={enriched} />
        )}
      </div>
    )
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error
    if (typeof error === "object" && error !== null && "digest" in error) {
      const d = (error as { digest?: string }).digest
      if (d?.startsWith("NEXT_REDIRECT")) throw error
    }
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Drip Campaigns</h1>
        </div>
        <div className="rounded-xl border border-dashed border-destructive/30 p-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Unable to load campaigns. Please refresh.</p>
          <Link href="/dashboard/campaigns" className="text-sm underline underline-offset-4">
            Refresh
          </Link>
        </div>
      </div>
    )
  }
}
