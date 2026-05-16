"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Mail,
  MessageSquare,
  Users,
  Send,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  description: string | null
  is_active: boolean
  channel?: string
  type?: string
  created_at: string
  stepsCount: number
  enrollmentsCount: number
  activeCount: number
  completedCount: number
  totalSent: number
  totalDelivered: number
  totalClicks: number
  totalReplies: number
  totalFailed: number
  deliveryRate: number | null
  replyRate: number | null
  activityCount: number
}

interface CampaignCardsProps {
  campaigns: Campaign[]
}

function channelLabel(channel?: string) {
  if (channel === "SMS") return "SMS"
  if (channel === "BOTH") return "Email + SMS"
  return "Email"
}

function channelStyle(channel?: string) {
  if (channel === "SMS") return { dot: "bg-emerald-400", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
  if (channel === "BOTH") return { dot: "bg-violet-400", badge: "text-violet-400 bg-violet-500/10 border-violet-500/20" }
  return { dot: "bg-cyan-400", badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }
}

function ChannelIcon({ channel }: { channel?: string }) {
  if (channel === "SMS") return <MessageSquare className="h-3.5 w-3.5" />
  return <Mail className="h-3.5 w-3.5" />
}

export function CampaignCards({ campaigns }: CampaignCardsProps) {
  const router = useRouter()

  async function toggleActive(id: string, current: boolean) {
    if (!hasSupabaseCredentials()) return
    const supabase = createClient()
    await supabase.from("campaigns").update({ is_active: !current }).eq("id", id)
    router.refresh()
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign? All steps and enrollments will also be removed.")) return
    if (!hasSupabaseCredentials()) return
    const supabase = createClient()
    await supabase.from("campaigns").delete().eq("id", id)
    router.refresh()
  }

  const sorted = [...campaigns].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    return b.enrollmentsCount - a.enrollmentsCount
  })

  return (
    <div className="space-y-2">
      {sorted.map((campaign) => {
        const style = channelStyle(campaign.channel)
        const completionPct = campaign.enrollmentsCount > 0
          ? Math.round((campaign.completedCount / campaign.enrollmentsCount) * 100)
          : 0

        return (
          <div
            key={campaign.id}
            className={`group rounded-xl border transition-all ${
              campaign.is_active
                ? "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]"
                : "border-white/[0.04] bg-white/[0.01] opacity-60 hover:opacity-80"
            }`}
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Status indicator + icon */}
                <div className="shrink-0 mt-0.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${style.badge}`}>
                    <ChannelIcon channel={campaign.channel} />
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/dashboard/campaigns/${campaign.id}`}
                          className="font-semibold text-sm hover:text-white transition-colors"
                        >
                          {campaign.name}
                        </Link>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${campaign.is_active ? "animate-pulse" : ""}`} />
                          {campaign.is_active ? "Active" : "Paused"}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md">
                          {channelLabel(campaign.channel)}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md">
                          {campaign.type === "BROADCAST" ? "Broadcast" : "Sequence"}
                        </span>
                      </div>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{campaign.description}</p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={campaign.is_active}
                        onCheckedChange={() => toggleActive(campaign.id, campaign.is_active)}
                        className="scale-90"
                      />
                      <Link href={`/dashboard/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/campaigns/${campaign.id}`} className="flex items-center gap-2">
                              <ArrowRight className="h-3.5 w-3.5" />
                              View Campaign
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteCampaign(campaign.id)}
                            className="text-destructive focus:text-destructive flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="flex items-center gap-3 flex-wrap mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.06] flex items-center justify-center">
                        <span className="text-[9px] font-bold">{campaign.stepsCount}</span>
                      </div>
                      <span>{campaign.stepsCount === 1 ? "step" : "steps"}</span>
                    </div>
                    <div className="w-px h-3 bg-white/[0.08]" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{campaign.enrollmentsCount.toLocaleString()} enrolled</span>
                    </div>
                    {campaign.activeCount > 0 && (
                      <>
                        <div className="w-px h-3 bg-white/[0.08]" />
                        <div className="flex items-center gap-1 text-xs text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {campaign.activeCount} active
                        </div>
                      </>
                    )}
                    {campaign.totalSent > 0 && (
                      <>
                        <div className="w-px h-3 bg-white/[0.08]" />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Send className="h-3 w-3" />
                          <span>{campaign.totalSent.toLocaleString()} sent</span>
                        </div>
                        {campaign.deliveryRate !== null && (
                          <>
                            <div className="w-px h-3 bg-white/[0.08]" />
                            <div className={`flex items-center gap-1 text-xs ${
                              campaign.deliveryRate >= 90 ? "text-emerald-400" :
                              campaign.deliveryRate >= 70 ? "text-amber-400" : "text-red-400"
                            }`}>
                              <CheckCircle2 className="h-3 w-3" />
                              {campaign.deliveryRate}% delivered
                            </div>
                          </>
                        )}
                        {campaign.replyRate !== null && campaign.replyRate > 0 && (
                          <>
                            <div className="w-px h-3 bg-white/[0.08]" />
                            <div className="flex items-center gap-1 text-xs text-amber-400">
                              <TrendingUp className="h-3 w-3" />
                              {campaign.replyRate}% replied
                            </div>
                          </>
                        )}
                        {campaign.totalFailed > 0 && (
                          <>
                            <div className="w-px h-3 bg-white/[0.08]" />
                            <div className="flex items-center gap-1 text-xs text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              {campaign.totalFailed} failed
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="w-px h-3 bg-white/[0.08]" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(campaign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  {/* Completion progress */}
                  {campaign.enrollmentsCount > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                        {completionPct}% complete
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
