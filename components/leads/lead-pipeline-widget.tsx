"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Users,
  RefreshCw,
} from "lucide-react"
import { createClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "sonner"

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: string
  next_follow_up: string | null
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  contacted: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  qualified: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  nurturing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  under_contract: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  closed_won: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  closed_lost: "bg-red-500/20 text-red-300 border-red-500/30",
}

interface LeadPipelineWidgetProps {
  agentId: string
}

export function LeadPipelineWidget({ agentId }: LeadPipelineWidgetProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const fetchLeads = useCallback(async () => {
    if (!hasSupabaseCredentials()) {
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, phone, status, next_follow_up")
      .eq("agent_id", agentId)
      .not("next_follow_up", "is", null)
      .order("next_follow_up", { ascending: true })

    if (data) setLeads(data)
    setLoading(false)
  }, [agentId])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const now = new Date()

  const followUpLeads = leads.filter(
    (l) => l.next_follow_up && new Date(l.next_follow_up) <= now && !completedIds.has(l.id)
  )
  const upcomingLeads = leads.filter(
    (l) => l.next_follow_up && new Date(l.next_follow_up) > now && !completedIds.has(l.id)
  )

  const handleCompleteFollowUp = async (lead: Lead) => {
    setCompletingId(lead.id)
    const supabase = createClient()
    try {
      await supabase.from("activities").insert({
        agent_id: agentId,
        lead_id: lead.id,
        activity_type: "follow_up",
        subject: "Follow-up completed",
        description: `Follow-up with ${lead.first_name} ${lead.last_name} marked complete`,
        completed: true,
        completed_at: new Date().toISOString(),
        due_at: lead.next_follow_up,
      })
      await supabase
        .from("leads")
        .update({ next_follow_up: null, last_contacted_at: new Date().toISOString() })
        .eq("id", lead.id)
      setCompletedIds((prev) => new Set(prev).add(lead.id))
      toast.success(`Follow-up with ${lead.first_name} ${lead.last_name} marked complete`)
    } catch {
      toast.error("Failed to complete follow-up")
    }
    setCompletingId(null)
  }

  const renderLeadCard = (lead: Lead) => {
    const isOverdue = new Date(lead.next_follow_up!) <= now
    const daysAgo = Math.floor(
      (now.getTime() - new Date(lead.next_follow_up!).getTime()) / (1000 * 60 * 60 * 24)
    )

    return (
      <div
        key={lead.id}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          isOverdue
            ? "border-red-500/30 bg-red-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isOverdue ? "bg-red-500/20" : "bg-amber-500/20"
          }`}
        >
          <Clock className={`h-4 w-4 ${isOverdue ? "text-red-400" : "text-amber-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-white truncate">
            {lead.first_name} {lead.last_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className={`${statusColors[lead.status]} text-xs py-0`}>
              {lead.status.replace("_", " ")}
            </Badge>
            {lead.phone && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <Phone className="h-2.5 w-2.5" /> {lead.phone}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className={`text-xs font-semibold ${isOverdue ? "text-red-400" : "text-amber-400"}`}>
            {isOverdue
              ? daysAgo === 0
                ? "Due today"
                : `${daysAgo}d overdue`
              : new Date(lead.next_follow_up!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link href={`/dashboard/leads/${lead.id}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-white/10 bg-transparent hover:bg-white/5">
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <Button
            size="sm"
            className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleCompleteFollowUp(lead)}
            disabled={completingId === lead.id}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {completingId === lead.id ? "..." : "Done"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-white/10 bg-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Users className="h-4 w-4 text-cyan-400" />
            Lead Pipeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLeads} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/dashboard/leads">
              <Button variant="outline" size="sm" className="h-7 text-xs border-white/10 bg-transparent hover:bg-white/5 text-slate-300">
                View All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="followup">
          <TabsList className="mb-3 bg-white/5 border border-white/10 w-full">
            <TabsTrigger
              value="followup"
              className="flex-1 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 text-xs"
            >
              Follow-up
              {followUpLeads.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {followUpLeads.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-xs"
            >
              Upcoming ({upcomingLeads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followup" className="mt-0">
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-sm">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
                Loading...
              </div>
            ) : followUpLeads.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {followUpLeads.map(renderLeadCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-80" />
                <p className="text-sm font-medium text-emerald-400">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1">No overdue follow-ups.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-0">
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-sm">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
                Loading...
              </div>
            ) : upcomingLeads.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {upcomingLeads.map(renderLeadCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-white">No upcoming follow-ups</p>
                <p className="text-xs text-slate-500 mt-1">Open a lead and set a follow-up date.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
