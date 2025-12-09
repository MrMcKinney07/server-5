"use client"

import type { Lead } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface LeadsTableProps {
  leads: Lead[]
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-amber-100 text-amber-800 border-amber-200",
  qualified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  nurturing: "bg-purple-100 text-purple-800 border-purple-200",
  active: "bg-green-100 text-green-800 border-green-200",
  under_contract: "bg-cyan-100 text-cyan-800 border-cyan-200",
  closed_won: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed_lost: "bg-rose-100 text-rose-800 border-rose-200",
}

const typeColors: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-800 border-blue-200",
  seller: "bg-emerald-100 text-emerald-800 border-emerald-200",
  both: "bg-amber-100 text-amber-800 border-amber-200",
  investor: "bg-purple-100 text-purple-800 border-purple-200",
  renter: "bg-gray-100 text-gray-800 border-gray-200",
}

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No leads found. Create your first lead to get started.
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link href={`/dashboard/leads/${lead.id}`} className="font-medium hover:underline text-blue-600">
                  {lead.first_name} {lead.last_name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{lead.email || lead.phone || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={typeColors[lead.lead_type] || ""}>
                  {lead.lead_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {lead.source?.replace("_", " ") || "manual"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[lead.status] || ""}>
                  {lead.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lead.next_follow_up ? formatDistanceToNow(new Date(lead.next_follow_up), { addSuffix: true }) : "-"}
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
