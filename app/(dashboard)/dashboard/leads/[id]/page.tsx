import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Phone, Mail, Calendar, DollarSign, MapPin, Clock } from "lucide-react"
import { LeadStatusSelect } from "@/components/leads/lead-status-select"
import { LeadActivities } from "@/components/leads/lead-activities"
import { AddLeadActivityDialog } from "@/components/leads/add-lead-activity-dialog"
import type { Lead, Activity } from "@/lib/types/database"

interface LeadPageProps {
  params: Promise<{ id: string }>
}

const typeColors: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-800 border-blue-200",
  seller: "bg-emerald-100 text-emerald-800 border-emerald-200",
  both: "bg-amber-100 text-amber-800 border-amber-200",
  investor: "bg-purple-100 text-purple-800 border-purple-200",
  renter: "bg-gray-100 text-gray-800 border-gray-200",
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).eq("agent_id", agent.id).single()

  if (!lead) {
    notFound()
  }

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })

  const typedLead = lead as Lead

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {typedLead.first_name} {typedLead.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Lead from {typedLead.source || "manual"} • Created {new Date(typedLead.created_at).toLocaleDateString()}
          </p>
        </div>
        <AddLeadActivityDialog leadId={id} agentId={agent.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          {/* Lead Details Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-600">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={typeColors[typedLead.lead_type] || ""}>
                  {typedLead.lead_type}
                </Badge>
              </div>
              {typedLead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${typedLead.email}`} className="text-blue-600 hover:underline">
                    {typedLead.email}
                  </a>
                </div>
              )}
              {typedLead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${typedLead.phone}`} className="text-blue-600 hover:underline">
                    {typedLead.phone}
                  </a>
                </div>
              )}
              {typedLead.property_interest && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{typedLead.property_interest}</span>
                </div>
              )}
              {(typedLead.budget_min || typedLead.budget_max) && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {typedLead.budget_min ? `$${typedLead.budget_min.toLocaleString()}` : "$0"} -{" "}
                    {typedLead.budget_max ? `$${typedLead.budget_max.toLocaleString()}` : "No max"}
                  </span>
                </div>
              )}
              {typedLead.timeline && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{typedLead.timeline}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-amber-600">Status</CardTitle>
              <CardDescription>Update the lead status</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadStatusSelect lead={typedLead} />
            </CardContent>
          </Card>

          {/* Follow-up Card */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="text-emerald-600">Next Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              {typedLead.next_follow_up ? (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(typedLead.next_follow_up).toLocaleString()}</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No follow-up scheduled</p>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          {typedLead.notes && (
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader>
                <CardTitle className="text-rose-600">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{typedLead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <LeadActivities activities={(activities as Activity[]) || []} leadId={id} agentId={agent.id} />
        </div>
      </div>
    </div>
  )
}
