"use client"

import type { Lead, Contact, Agent } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface LeadsTableProps {
  leads: (Lead & { contact: Contact; assigned_agent: Agent | null })[]
  currentAgentId: string
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  assigned: "secondary",
  claimed: "secondary",
  contacted: "secondary",
  nurture: "outline",
  closed: "default",
  lost: "destructive",
  unclaimed_expired: "destructive",
}

export function LeadsTable({ leads, currentAgentId }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No leads found. Adjust your filters or wait for new leads.
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link href={`/dashboard/leads/${lead.id}`} className="font-medium hover:underline">
                  {lead.contact.full_name}
                </Link>
                {lead.contact.email && <p className="text-xs text-muted-foreground">{lead.contact.email}</p>}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {lead.source.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[lead.status] || "secondary"} className="capitalize">
                  {lead.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lead.assigned_agent ? (
                  <span className={lead.assigned_agent_id === currentAgentId ? "font-medium text-foreground" : ""}>
                    {lead.assigned_agent.full_name || lead.assigned_agent.email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
