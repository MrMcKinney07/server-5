"use client"

import { useEffect, useState } from "react"
import { createClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import { Mail, MessageSquare, Home, CheckCircle2, XCircle, Clock, Sparkles, Zap, Filter } from "lucide-react"
import { format } from "date-fns"

interface CampaignLog {
  id: string
  lead_id: string
  campaign_id: string
  step_id: string | null
  event: string
  info: Record<string, unknown>
  created_at: string
  lead?: { first_name: string; last_name: string; email: string }
}

interface CampaignActivityLogProps {
  campaignId: string
}

const eventConfig: Record<string, { label: string; icon: React.ElementType; class: string; dot: string }> = {
  email_sent: { label: "Email Sent", icon: Mail, class: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", dot: "bg-cyan-400" },
  sms_sent: { label: "SMS Sent", icon: MessageSquare, class: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  property_recommendation_sent: { label: "Properties Sent", icon: Home, class: "text-violet-400 bg-violet-500/10 border-violet-500/20", dot: "bg-violet-400" },
  task_sent: { label: "Task Created", icon: CheckCircle2, class: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  email_failed: { label: "Email Failed", icon: XCircle, class: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  sms_failed: { label: "SMS Failed", icon: XCircle, class: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  skipped_no_contact: { label: "Skipped (no contact info)", icon: Clock, class: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  send_gave_up: { label: "Gave up after retries", icon: XCircle, class: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  completed: { label: "Completed", icon: CheckCircle2, class: "text-slate-400 bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400" },
  campaign_completed: { label: "Completed", icon: CheckCircle2, class: "text-slate-400 bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400" },
  enrolled: { label: "Enrolled", icon: Zap, class: "text-violet-400 bg-violet-500/10 border-violet-500/20", dot: "bg-violet-400" },
  error: { label: "Error", icon: XCircle, class: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
}

const fallbackConfig = { label: "Event", icon: Clock, class: "text-slate-400 bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400" }

const ALL_EVENTS = "all"

export function CampaignActivityLog({ campaignId }: CampaignActivityLogProps) {
  const [logs, setLogs] = useState<CampaignLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(ALL_EVENTS)
  const [liveCount, setLiveCount] = useState(0)

  useEffect(() => {
    if (!hasSupabaseCredentials()) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchLogs() {
      const { data } = await supabase
        .from("campaign_logs")
        .select("*, lead:leads(first_name, last_name, email)")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(100)
      setLogs((data as CampaignLog[]) || [])
      setLoading(false)
    }

    fetchLogs()

    const channel = supabase
      .channel(`campaign-logs-${campaignId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "campaign_logs",
        filter: `campaign_id=eq.${campaignId}`,
      }, (payload) => {
        setLogs((prev) => [payload.new as CampaignLog, ...prev])
        setLiveCount((c) => c + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  const eventTypes = [...new Set(logs.map((l) => l.event))].filter((e) => eventConfig[e])
  const filtered = filter === ALL_EVENTS ? logs : logs.filter((l) => l.event === filter)

  // Aggregate counts for mini stats
  const counts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.event] = (acc[l.event] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mini stat row */}
      {logs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(counts).map(([event, count]) => {
            const cfg = eventConfig[event] || fallbackConfig
            return (
              <button
                key={event}
                onClick={() => setFilter(filter === event ? ALL_EVENTS : event)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  filter === event ? cfg.class + " ring-1 ring-current/30" : "text-muted-foreground bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <cfg.icon className="h-3 w-3" />
                <span className="font-medium">{count}</span>
                <span>{cfg.label}</span>
              </button>
            )
          })}
          {liveCount > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {liveCount} new live
            </div>
          )}
          {filter !== ALL_EVENTS && (
            <button
              onClick={() => setFilter(ALL_EVENTS)}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <Filter className="h-3 w-3" />
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No activity yet</p>
          <p className="text-xs text-muted-foreground">Events will appear here in real-time as the campaign runs.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
          {filtered.map((log, i) => {
            const cfg = eventConfig[log.event] || fallbackConfig
            const Icon = cfg.icon
            const isFirst = i === 0 && liveCount > 0
            return (
              <div
                key={log.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${
                  isFirst ? "bg-emerald-500/5 border-l-2 border-emerald-500/40" : ""
                }`}
              >
                {/* Icon */}
                <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center ${cfg.class}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${cfg.class}`}>
                      {cfg.label}
                    </span>
                    {(log.info?.step_number as number) && (
                      <span className="text-[11px] text-muted-foreground">Step #{log.info.step_number as number}</span>
                    )}
                    {(log.info?.ai_personalized as boolean) && (
                      <span className="text-[11px] flex items-center gap-0.5 text-amber-400">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-sm">
                    {log.lead?.first_name} {log.lead?.last_name}
                    {log.lead?.email && (
                      <span className="text-muted-foreground ml-1.5 text-xs">{log.lead.email}</span>
                    )}
                  </p>
                </div>

                {/* Time */}
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {filtered.length} of {logs.length} events · Live updates enabled
        </p>
      )}
    </div>
  )
}
