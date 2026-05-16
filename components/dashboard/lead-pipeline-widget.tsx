"use client"

import { useEffect, useState, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Users, ArrowRight, Phone, Mail, Clock } from "lucide-react"
import Link from "next/link"

interface Lead {
  id: string
  first_name: string
  last_name: string
  status: string
  phone: string | null
  email: string | null
  next_follow_up: string | null
  created_at: string
}

interface PipelineStage {
  status: string
  label: string
  color: string
  dot: string
  textColor: string
}

const STAGES: PipelineStage[] = [
  { status: "new",           label: "New",        color: "bg-blue-500/15 border-blue-500/30",    dot: "bg-blue-400",    textColor: "text-blue-300" },
  { status: "contacted",     label: "Contacted",  color: "bg-cyan-500/15 border-cyan-500/30",    dot: "bg-cyan-400",    textColor: "text-cyan-300" },
  { status: "qualified",     label: "Qualified",  color: "bg-violet-500/15 border-violet-500/30",dot: "bg-violet-400",  textColor: "text-violet-300" },
  { status: "showing",       label: "Showing",    color: "bg-amber-500/15 border-amber-500/30",  dot: "bg-amber-400",   textColor: "text-amber-300" },
  { status: "under_contract",label: "Under Contract", color: "bg-orange-500/15 border-orange-500/30", dot: "bg-orange-400", textColor: "text-orange-300" },
  { status: "closed",        label: "Closed",     color: "bg-emerald-500/15 border-emerald-500/30", dot: "bg-emerald-400", textColor: "text-emerald-300" },
]

interface LeadPipelineWidgetProps {
  agentId: string
}

export function LeadPipelineWidget({ agentId }: LeadPipelineWidgetProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>("new")
  const supabase = createBrowserClient()

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("leads")
      .select("id, first_name, last_name, status, phone, email, next_follow_up, created_at")
      .eq("agent_id", agentId)
      .not("status", "eq", "lost")
      .order("created_at", { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }, [agentId, supabase])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const byStatus = (status: string) => leads.filter((l) => l.status === status)
  const total = leads.length

  const selectedLeads = byStatus(selected)
  const selectedStage = STAGES.find((s) => s.status === selected)

  const isOverdue = (lead: Lead) =>
    lead.next_follow_up && new Date(lead.next_follow_up) < new Date()

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-cyan-400" />
            Lead Pipeline
            <Badge variant="outline" className="text-xs border-white/10 text-slate-400">
              {total} total
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white h-7 gap-1">
                All Leads <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLeads} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1">
        {/* Stage tabs with counts */}
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {STAGES.map((stage) => {
            const count = byStatus(stage.status).length
            const isActive = selected === stage.status
            return (
              <button
                key={stage.status}
                onClick={() => setSelected(stage.status)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${
                  isActive
                    ? stage.color + " " + stage.textColor
                    : "border-transparent bg-white/3 text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <span className="text-lg font-bold leading-none">{count}</span>
                <span className="text-[10px] font-medium leading-tight">{stage.label}</span>
              </button>
            )
          })}
        </div>

        {/* Lead cards for selected stage */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px] pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : selectedLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${selectedStage?.color}`}>
                <Users className={`h-5 w-5 ${selectedStage?.textColor}`} />
              </div>
              <p className="text-sm text-slate-400">No leads in {selectedStage?.label}</p>
              <Link href="/dashboard/leads">
                <Button variant="ghost" size="sm" className="mt-2 text-xs text-slate-500 hover:text-white">
                  Add a lead
                </Button>
              </Link>
            </div>
          ) : (
            selectedLeads.map((lead) => {
              const overdue = isOverdue(lead)
              return (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}>
                  <div className="group flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10 transition-all">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${selectedStage?.color} ${selectedStage?.textColor}`}>
                      {lead.first_name?.[0]}{lead.last_name?.[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lead.phone && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                            <Phone className="h-2.5 w-2.5" />{lead.phone}
                          </span>
                        )}
                        {!lead.phone && lead.email && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                            <Mail className="h-2.5 w-2.5" />{lead.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Follow-up indicator */}
                    {lead.next_follow_up && (
                      <div className={`shrink-0 flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-red-400" : "text-amber-400"}`}>
                        <Clock className="h-3 w-3" />
                        {overdue
                          ? "Overdue"
                          : new Date(lead.next_follow_up).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    )}

                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
