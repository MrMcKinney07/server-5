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
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
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

function ChannelIcon({ channel }: { channel?: string }) {
  if (channel === "SMS") return <MessageSquare className="h-3.5 w-3.5" />
  if (channel === "BOTH") return (
    <div className="flex gap-0.5">
      <Mail className="h-3.5 w-3.5" />
      <MessageSquare className="h-3.5 w-3.5" />
    </div>
  )
  return <Mail className="h-3.5 w-3.5" />
}

function channelLabel(channel?: string) {
  if (channel === "SMS") return "SMS"
  if (channel === "BOTH") return "Email + SMS"
  return "Email"
}

function channelColor(channel?: string) {
  if (channel === "SMS") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  if (channel === "BOTH") return "text-violet-400 bg-violet-500/10 border-violet-500/20"
  return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
}

function StatPill({ label, value, color = "text-foreground" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
      <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  )
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

  // Sort: active first, then by enrollment count
  const sorted = [...campaigns].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    return b.enrollmentsCount - a.enrollmentsCount
  })

  return (
    <div className="space-y-3">
      {sorted.map((campaign) => (
        <div
          key={campaign.id}
          className={`rounded-xl border transition-colors ${
            campaign.is_active
              ? "border-white/[0.08] bg-white/[0.02]"
              : "border-white/[0.04] bg-transparent opacity-70"
          }`}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Left: icon + status dot */}
              <div className="relative shrink-0 mt-0.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${channelColor(campaign.channel)} border`}>
                  <ChannelIcon channel={campaign.channel} />
                </div>
                {campaign.is_active && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                )}
              </div>

              {/* Center: name, meta, stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="font-semibold text-sm hover:text-cyan-400 transition-colors"
                  >
                    {campaign.name}
                  </Link>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 border ${channelColor(campaign.channel)}`}
                  >
                    {channelLabel(campaign.channel)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border border-white/[0.08] text-muted-foreground"
                  >
                    {campaign.type === "BROADCAST" ? "Broadcast" : "Sequence"}
                  </Badge>
                </div>

                {campaign.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{campaign.description}</p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <StatPill label="Steps" value={campaign.stepsCount} />
                  <StatPill
                    label="Enrolled"
                    value={campaign.enrollmentsCount}
                    color={campaign.enrollmentsCount > 0 ? "text-violet-400" : "text-foreground"}
                  />
                  <StatPill
                    label="Active"
                    value={campaign.activeCount}
                    color={campaign.activeCount > 0 ? "text-emerald-400" : "text-foreground"}
                  />
                  <StatPill
                    label="Completed"
                    value={campaign.completedCount}
                    color={campaign.completedCount > 0 ? "text-cyan-400" : "text-foreground"}
                  />
                  {campaign.totalSent > 0 && (
                    <>
                      <StatPill label="Sent" value={campaign.totalSent.toLocaleString()} />
                      {campaign.deliveryRate !== null && (
                        <StatPill
                          label="Delivered"
                          value={`${campaign.deliveryRate}%`}
                          color={campaign.deliveryRate >= 90 ? "text-emerald-400" : campaign.deliveryRate >= 70 ? "text-amber-400" : "text-red-400"}
                        />
                      )}
                      {campaign.replyRate !== null && (
                        <StatPill
                          label="Reply Rate"
                          value={`${campaign.replyRate}%`}
                          color={campaign.replyRate > 0 ? "text-amber-400" : "text-foreground"}
                        />
                      )}
                      {campaign.totalClicks > 0 && (
                        <StatPill label="Clicks" value={campaign.totalClicks} color="text-cyan-400" />
                      )}
                    </>
                  )}
                </div>

                {/* Progress bar for active enrollments */}
                {campaign.enrollmentsCount > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        style={{
                          width: `${Math.round((campaign.completedCount / campaign.enrollmentsCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {Math.round((campaign.completedCount / campaign.enrollmentsCount) * 100)}% completed
                    </span>
                  </div>
                )}
              </div>

              {/* Right: controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {campaign.is_active ? "Active" : "Paused"}
                  </span>
                  <Switch
                    checked={campaign.is_active}
                    onCheckedChange={() => toggleActive(campaign.id, campaign.is_active)}
                    className="scale-90"
                  />
                </div>
                <Link href={`/dashboard/campaigns/${campaign.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
          </div>

          {/* Footer bar */}
          <div className="px-5 py-2 border-t border-white/[0.04] flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {new Date(campaign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {campaign.activityCount > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" />
                {campaign.activityCount} activity events
              </span>
            )}
            {campaign.totalFailed > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                {campaign.totalFailed} failed sends
              </span>
            )}
            {campaign.totalSent === 0 && campaign.stepsCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground/60">No sends yet</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
