import type { Lead, Contact, Agent } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar } from "lucide-react"
import Link from "next/link"

interface LeadDetailsProps {
  lead: Lead & { contact: Contact; assigned_agent: Agent | null }
}

export function LeadDetails({ lead }: LeadDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Link href={`/dashboard/contacts/${lead.contact_id}`} className="font-medium hover:underline">
            {lead.contact.full_name}
          </Link>
        </div>
        {lead.contact.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${lead.contact.email}`} className="text-sm hover:underline">
              {lead.contact.email}
            </a>
          </div>
        )}
        {lead.contact.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${lead.contact.phone}`} className="text-sm hover:underline">
              {lead.contact.phone}
            </a>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Created {new Date(lead.created_at).toLocaleDateString()}</span>
        </div>
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Source</p>
          <Badge variant="outline" className="capitalize">
            {lead.source.replace("_", " ")}
          </Badge>
        </div>
        {lead.contact.tags && lead.contact.tags.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {lead.contact.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
