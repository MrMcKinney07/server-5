import type { Lead } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog"

interface ContactLeadsProps {
  leads: Lead[]
  contactId: string
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

export function ContactLeads({ leads, contactId }: ContactLeadsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Leads ({leads.length})</CardTitle>
        <CreateLeadDialog contactId={contactId} />
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads for this contact yet.</p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[lead.status] || "secondary"}>{lead.status.replace("_", " ")}</Badge>
                    <span className="text-sm text-muted-foreground capitalize">{lead.source}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
