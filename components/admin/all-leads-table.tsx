"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, User, Phone, Mail } from "lucide-react"
import Link from "next/link"
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

interface AllLeadsTableProps {
  leads: Lead[]
  agents?: Array<{
    id: string
    full_name: string | null
    email: string
    tier: number
    is_active: boolean
  }>
  adminId?: string
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  qualified: "bg-amber-100 text-amber-800",
  nurturing: "bg-cyan-100 text-cyan-800",
  active: "bg-emerald-100 text-emerald-800",
  under_contract: "bg-green-100 text-green-800",
  closed_won: "bg-green-500 text-white",
  closed_lost: "bg-red-100 text-red-800",
  assigned: "bg-blue-100 text-blue-800",
}

export function AllLeadsTable({ leads, agents = [], adminId }: AllLeadsTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")

  // Get unique agents from leads
  const leadsAgents = Array.from(new Map(leads.filter((l) => l.agent).map((l) => [l.agent!.id, l.agent!])).values())

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search)

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesAgent = agentFilter === "all" || lead.agent_id === agentFilter

    return matchesSearch && matchesStatus && matchesAgent
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
            <SelectItem value="nurturing">Nurturing</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="under_contract">Under Contract</SelectItem>
            <SelectItem value="closed_won">Closed Won</SelectItem>
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {leadsAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
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
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              {/* Actions column */}
              {agents.length > 0 && adminId && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={agents.length > 0 && adminId ? 8 : 7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="font-medium hover:text-blue-600 hover:underline"
                    >
                      {lead.first_name} {lead.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {lead.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lead.agent?.Name || "Unassigned"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.status] || "bg-gray-100"}>
                      {lead.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{lead.lead_type}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.source || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                  {/* Manual assignment controls */}
                  {agents.length > 0 && adminId && (
                    <TableCell>
                      <ManualAssignDialog
                        leadId={lead.id}
                        currentAgentId={lead.assigned_agent_id || lead.agent_id}
                        agents={agents}
                        adminId={adminId}
                        mode={lead.assigned_agent_id || lead.agent_id ? "reassign" : "assign"}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
