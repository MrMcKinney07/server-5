"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, User, TrendingUp } from "lucide-react"
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
  agent_id: string
  assigned_agent_id?: string | null
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
  new: "bg-blue-100 text-blue-800",
  assigned: "bg-purple-100 text-purple-800",
  contacted: "bg-cyan-100 text-cyan-800",
  qualified: "bg-amber-100 text-amber-800",
}

export function LeadAssignmentView({ leads, agents, adminId }: LeadAssignmentViewProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate agent stats
  const agentStats = agents.map((agent) => {
    const agentLeads = leads.filter((l) => l.agent_id === agent.id || l.assigned_agent_id === agent.id)
    const newLeads = agentLeads.filter((l) => l.status === "new" || l.status === "assigned").length
    return {
      ...agent,
      totalLeads: agentLeads.length,
      newLeads,
    }
  })

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Agent Stats Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Agent Load
            </CardTitle>
            <CardDescription>Current lead distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentStats
              .sort((a, b) => b.totalLeads - a.totalLeads)
              .map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{agent.full_name || agent.email}</div>
                      <div className="text-xs text-muted-foreground">{agent.newLeads} new leads</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{agent.totalLeads}</div>
                    <div className="text-xs text-muted-foreground">total</div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Manual Lead Assignment</CardTitle>
            <CardDescription>Assign or reassign leads to specific agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">
              Showing {filteredLeads.length} of {leads.length} leads
            </p>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.slice(0, 50).map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.email || lead.phone || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[lead.status] || "bg-gray-100"}>
                            {lead.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.agent?.Name || "Unassigned"}</span>
                        </TableCell>
                        <TableCell>
                          <ManualAssignDialog
                            leadId={lead.id}
                            currentAgentId={lead.assigned_agent_id || lead.agent_id}
                            agents={agents}
                            adminId={adminId}
                            mode={lead.assigned_agent_id || lead.agent_id ? "reassign" : "assign"}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
