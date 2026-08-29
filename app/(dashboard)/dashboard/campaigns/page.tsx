import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { CampaignCards } from "@/components/campaigns/campaign-cards"
import { CampaignTemplatesGallery } from "@/components/campaigns/campaign-templates-gallery"
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog"
import { Megaphone, Users, Send, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CampaignsPage() {
  try {
    const agent = await requireAuth()
    const supabase = await createClient()
    const serviceClient = createServiceClient()

    // Fetch campaigns + templates in parallel
    const [campaignsRes, templatesRes] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      serviceClient
        .from("campaign_templates")
        .select("id, name, description, category, channel, type, tags, step_count")
        .eq("is_active", true)
        .order("category")
        .order("name"),
    ])

    console.log("[v0] campaignsRes error:", campaignsRes.error?.message)
    console.log("[v0] templatesRes error:", templatesRes.error?.message)
    console.log("[v0] campaigns count:", campaignsRes.data?.length)

    const campaigns = campaignsRes.data || []
    const filteredCampaigns =
      agent.Role === "broker"
        ? campaigns
        : campaigns.filter((c) => c.owner_id === agent.id)

    const enriched = await Promise.all(
      filteredCampaigns.map(async (campaign) => {
        const [stepsRes, enrollRes] = await Promise.all([
          supabase
            .from("campaign_steps")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", campaign.id),
          supabase
            .from("lead_campaign_enrollments")
            .select("id, status")
            .eq("campaign_id", campaign.id),
        ])

        const enrollments = enrollRes.data || []
        const totalSent = 0
        const totalDelivered = totalSent
        const totalClicks = 0
        const totalReplies = 0
        const totalFailed = 0

        return {
          ...campaign,
          stepsCount: stepsRes.count || 0,
          enrollmentsCount: enrollments.length,
          activeCount: enrollments.filter((e) => e.status === "active").length,
          completedCount: enrollments.filter((e) => e.status === "completed").length,
          totalSent,
          totalDelivered,
          totalClicks,
          totalReplies,
          totalFailed,
          deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : null,
          replyRate: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : null,
          activityCount: totalSent,
        }
      }),
    )

    const templates = templatesRes.data || []

    // Aggregate stats
    const totalEnrolled = enriched.reduce((s, c) => s + c.enrollmentsCount, 0)
    const totalSentAll = enriched.reduce((s, c) => s + c.totalSent, 0)
    const totalRepliesAll = enriched.reduce((s, c) => s + c.totalReplies, 0)
    const totalDeliveredAll = enriched.reduce((s, c) => s + c.totalDelivered, 0)
    const activeCampaigns = enriched.filter((c) => c.is_active).length
    const overallDeliveryRate = totalSentAll > 0 ? Math.round((totalDeliveredAll / totalSentAll) * 100) : null
    const overallReplyRate = totalSentAll > 0 ? Math.round((totalRepliesAll / totalSentAll) * 100) : null

    const stats = [
      {
        label: "Active Campaigns",
        value: activeCampaigns,
        sub: `${enriched.length - activeCampaigns} paused`,
        icon: Megaphone,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10 border-cyan-500/20",
        valueColor: "text-cyan-400",
      },
      {
        label: "Total Enrolled",
        value: totalEnrolled.toLocaleString(),
        sub: "leads across all campaigns",
        icon: Users,
        color: "text-violet-400",
        bg: "bg-violet-500/10 border-violet-500/20",
        valueColor: "text-violet-400",
      },
      {
        label: "Messages Sent",
        value: totalSentAll.toLocaleString(),
        sub: overallDeliveryRate !== null ? `${overallDeliveryRate}% delivery rate` : "no sends yet",
        icon: Send,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        valueColor: "text-emerald-400",
      },
      {
        label: "Reply Rate",
        value: overallReplyRate !== null ? `${overallReplyRate}%` : "—",
        sub: `${totalRepliesAll.toLocaleString()} total replies`,
        icon: TrendingUp,
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        valueColor:
          overallReplyRate !== null
            ? overallReplyRate > 5
              ? "text-emerald-400"
              : "text-amber-400"
            : "text-muted-foreground",
      },
    ]

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated drip sequences for lead nurturing
            </p>
          </div>
          <CreateCampaignDialog />
        </div>

        {/* Stats bar — only shown if campaigns exist */}
        {enriched.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border p-4 flex items-start gap-3 ${stat.bg}`}
              >
                <div className="rounded-lg p-2 bg-white/[0.04] shrink-0">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl font-bold tabular-nums ${stat.valueColor}`}>{stat.value}</p>
                  <p className="text-xs font-medium text-foreground/80">{stat.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs: My Campaigns + Templates */}
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">
              My Campaigns
              {enriched.length > 0 && (
                <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
                  {enriched.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates">
              Templates
              {templates.length > 0 && (
                <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
                  {templates.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* MY CAMPAIGNS */}
          <TabsContent value="campaigns" className="mt-5">
            {enriched.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] p-16 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                  <Megaphone className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-2 max-w-sm mx-auto">
                  Start from scratch or pick a pre-built template from the Templates tab.
                </p>
                <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto">
                  Templates come with professionally written email and SMS sequences — ready to use in minutes.
                </p>
                <CreateCampaignDialog />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {enriched.length} campaign{enriched.length !== 1 ? "s" : ""}
                  {activeCampaigns > 0 && ` · ${activeCampaigns} active`}
                </p>
                <CampaignCards campaigns={enriched} />
              </>
            )}
          </TabsContent>

          {/* TEMPLATES */}
          <TabsContent value="templates" className="mt-5">
            <CampaignTemplatesGallery templates={templates} />
          </TabsContent>
        </Tabs>
      </div>
    )
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error
    if (typeof error === "object" && error !== null && "digest" in error) {
      const d = (error as { digest?: string }).digest
      if (d?.startsWith("NEXT_REDIRECT")) throw error
    }
    console.log("[v0] Campaigns page error:", error instanceof Error ? error.message : JSON.stringify(error))
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Campaigns</h1>
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
