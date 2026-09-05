import { createServiceClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Mail,
  MessageSquare,
} from "lucide-react"
import { CampaignDetailTabs } from "@/components/campaigns/campaign-detail-tabs"
import { CampaignStatusToggle } from "@/components/campaigns/campaign-status-toggle"
import { CampaignEnrollmentStats } from "@/components/campaigns/campaign-enrollment-stats"

interface CampaignPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params
  const agent = await requireAuth()
  const supabase = createServiceClient()

  // Try owner_id first, fall back to agent_id for older schema
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .or(`owner_id.eq.${agent.id},agent_id.eq.${agent.id}`)
    .single()
  if (!campaign) notFound()

  const [stepsRes, enrollRes, logsRes] = await Promise.all([
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
    // campaign_logs only records send/failure events — no delivery/click/reply tracking.
    supabase.from("campaign_logs").select("event").eq("campaign_id", id),
  ])

  const steps = stepsRes.data || []
  const enrollments = enrollRes.data || []
  const logs = logsRes.data || []

  const activeCount = enrollments.filter((e) => e.status === "active").length
  const completedCount = enrollments.filter((e) => e.status === "completed").length

  const totalSent = logs.filter((l) => l.event === "email_sent" || l.event === "sms_sent").length
  const totalFailed = logs.filter(
    (l) =>
      typeof l.event === "string" &&
      (l.event.includes("fail") || l.event.includes("error") || l.event.includes("bounce")),
  ).length
  // Not tracked — rendered as "—" by CampaignEnrollmentStats.
  const totalDelivered = 0
  const totalReplies = 0
  const totalClicks = 0
  const deliveryRate = null
  const replyRate = null
  const channelLabel =
    campaign.channel === "SMS" ? "SMS" :
    campaign.channel === "BOTH" ? "Email + SMS" : "Email"

  const channelStyle =
    campaign.channel === "SMS" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    campaign.channel === "BOTH" ? "text-violet-400 bg-violet-500/10 border-violet-500/20" :
    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"

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
            <div className="ml-auto shrink-0">
              <CampaignStatusToggle campaignId={campaign.id} isActive={campaign.is_active} />
            </div>
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

      <CampaignEnrollmentStats
        campaignId={campaign.id}
        initialEnrollments={enrollments.map((e) => ({ status: e.status }))}
        totalSent={totalSent}
        totalDelivered={totalDelivered}
        totalReplies={totalReplies}
        totalClicks={totalClicks}
        totalFailed={totalFailed}
        deliveryRate={deliveryRate}
        replyRate={replyRate}
      />

      {/* Tabbed content */}
      <CampaignDetailTabs campaign={campaign} steps={steps} enrollments={enrollments} runs={[]} />
    </div>
  )
}
