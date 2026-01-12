"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, User, TrendingUp, Mail, Phone, DollarSign } from "lucide-react"
import { ManualAssignDialog } from "./manual-assign-dialog"

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: string
  lead_type: string
  source: string | null
  created_at: string
  agent_id: string | null
  budget_min?: number | null
  budget_max?: number | null
  timeline?: string | null
  property_interest?: string | null
  notes?: string | null
  last_contacted_at?: string | null
  next_follow_up?: string | null
  agent?: { id: string; Name: string; Email: string } | null
}

interface Agent {
  id: string
  full_name: string | null
  email: string
  tier: number
  is_active: boolean
}

interface LeadAssignmentViewProps {
  leads: Lead[]
  agents: Agent[]
  adminId: string
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  assigned: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  contacted: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  qualified: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  nurturing: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  under_contract: "bg-green-500/20 text-green-400 border-green-500/30",
  closed_won: "bg-green-600/30 text-green-300 border-green-500/30",
  closed_lost: "bg-red-500/20 text-red-400 border-red-500/30",
}

export function LeadAssignmentView({ leads, agents, adminId }: LeadAssignmentViewProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("all")

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search)

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesAgent =
      agentFilter === "all" || lead.agent_id === agentFilter || (agentFilter === "unassigned" && !lead.agent_id)

    return matchesSearch && matchesStatus && matchesAgent
  })

  // Calculate agent stats
  const agentStats = agents.map((agent) => {
    const agentLeads = leads.filter((l) => l.agent_id === agent.id)
    const newLeads = agentLeads.filter((l) => l.status === "new" || l.status === "assigned").length
    return {
      ...agent,
      totalLeads: agentLeads.length,
      newLeads,
    }
  })

  // Count unassigned leads
  const unassignedCount = leads.filter((l) => !l.agent_id).length

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Agent Stats Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Agent Load
            </CardTitle>
            <CardDescription className="text-slate-400">Current lead distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Unassigned leads */}
            {unassignedCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="font-medium text-sm text-red-400">Unassigned</div>
                    <div className="text-xs text-red-400/70">Needs assignment</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-400">{unassignedCount}</div>
                  <div className="text-xs text-red-400/70">leads</div>
                </div>
              </div>
            )}

            {agentStats
              .sort((a, b) => b.totalLeads - a.totalLeads)
              .map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-medium text-sm text-white">{agent.full_name || agent.email}</div>
                      <div className="text-xs text-slate-400">{agent.newLeads} new leads</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{agent.totalLeads}</div>
                    <div className="text-xs text-slate-400">total</div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <div className="lg:col-span-2">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Manual Lead Assignment</CardTitle>
            <CardDescription className="text-slate-400">Assign or reassign leads to specific agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="nurturing">Nurturing</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_contract">Under Contract</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name || agent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-slate-400">
              Showing {filteredLeads.length} of {leads.length} leads
            </p>

            {/* Table */}
            <div className="rounded-md border border-slate-700/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Lead</TableHead>
                    <TableHead className="text-slate-300">Contact</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Budget</TableHead>
                    <TableHead className="text-slate-300">Assigned To</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.slice(0, 100).map((lead) => (
                      <TableRow key={lead.id} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell>
                          <div className="font-medium text-white">
                            {lead.first_name} {lead.last_name}
                          </div>
                          {lead.source && <div className="text-xs text-slate-400">via {lead.source}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            {lead.email && (
                              <div className="flex items-center gap-1 text-slate-300">
                                <Mail className="h-3 w-3 text-slate-500" />
                                {lead.email}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-slate-300">
                                <Phone className="h-3 w-3 text-slate-500" />
                                {lead.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[lead.status] || "bg-slate-500/20 text-slate-400"} border`}>
                            {lead.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-slate-300">{lead.lead_type || "-"}</TableCell>
                        <TableCell>
                          {lead.budget_min || lead.budget_max ? (
                            <div className="flex items-center gap-1 text-slate-300">
                              <DollarSign className="h-3 w-3 text-green-400" />
                              {lead.budget_min && lead.budget_max
                                ? `${(lead.budget_min / 1000).toFixed(0)}k - ${(lead.budget_max / 1000).toFixed(0)}k`
                                : lead.budget_max
                                  ? `Up to ${(lead.budget_max / 1000).toFixed(0)}k`
                                  : `${(lead.budget_min! / 1000).toFixed(0)}k+`}
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span className={`text-sm ${lead.agent ? "text-white" : "text-red-400"}`}>
                              {lead.agent?.Name || "Unassigned"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ManualAssignDialog
                            leadId={lead.id}
                            currentAgentId={lead.agent_id || undefined}
                            agents={agents}
                            adminId={adminId}
                            mode={lead.agent_id ? "reassign" : "assign"}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredLeads.length > 100 && (
              <p className="text-sm text-slate-400 text-center">
                Showing first 100 leads. Use filters to narrow results.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
