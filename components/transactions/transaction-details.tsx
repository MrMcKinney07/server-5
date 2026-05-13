import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Home, FileText, Calendar } from "lucide-react"
import type { Transaction, Contact, Property, Agent, Lead, Activity } from "@/lib/types/database"

interface TransactionDetailsProps {
  transaction: Transaction & {
    contact: Contact
    property: Property | null
    agent: Agent
    lead: Lead | null
  }
  activities: (Activity & { agent: { full_name: string; email: string } })[]
}

export function TransactionDetails({ transaction, activities }: TransactionDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/dashboard/contacts/${transaction.contact_id}`} className="font-medium hover:underline">
              {transaction.contact.full_name}
            </Link>
            {transaction.contact.email && <p className="text-sm text-muted-foreground">{transaction.contact.email}</p>}
            {transaction.contact.phone && <p className="text-sm text-muted-foreground">{transaction.contact.phone}</p>}
          </CardContent>
        </Card>

        {transaction.property && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" />
                Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/properties/${transaction.property_id}`} className="font-medium hover:underline">
                {transaction.property.address}
              </Link>
              <p className="text-sm text-muted-foreground">
                {transaction.property.city}, {transaction.property.state} {transaction.property.zip}
              </p>
              <p className="text-sm font-medium mt-1">${transaction.property.price.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}

        {transaction.lead && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/leads/${transaction.lead_id}`} className="font-medium hover:underline">
                View Original Lead
              </Link>
              <p className="text-sm text-muted-foreground mt-1">Source: {transaction.lead.source}</p>
            </CardContent>
          </Card>
        )}

        {transaction.external_system && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">External System</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="capitalize">
                {transaction.external_system}
              </Badge>
              {transaction.external_id && (
                <p className="text-sm text-muted-foreground mt-2">ID: {transaction.external_id}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p>{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.agent.full_name} • {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
