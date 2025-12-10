import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, Calendar, DollarSign, Clock, MapPin, User, Zap } from "lucide-react"
import { LeadStatusSelect } from "@/components/leads/lead-status-select"
import { LeadActivities } from "@/components/leads/lead-activities"
import { AddLeadActivityDialog } from "@/components/leads/add-lead-activity-dialog"
import { EnrollCampaignDialog } from "@/components/leads/enroll-campaign-dialog"
import { SavedPropertiesList } from "@/components/leads/saved-properties-list"
import { AddPropertyDialog } from "@/components/leads/add-property-dialog"

interface LeadPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).single()

  if (error || !lead) {
    notFound()
  }

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })

  const { data: enrollments } = await supabase
    .from("lead_campaign_enrollments")
    .select("*, campaign:campaigns(id, name)")
    .eq("lead_id", id)

  const { data: savedProperties } = await supabase
    .from("saved_properties")
    .select(`
      *,
      property_views (view_count, last_viewed_at)
    `)
    .eq("lead_id", id)
    .order("date_added", { ascending: false })

  const propertiesWithViews =
    savedProperties?.map((prop) => ({
      ...prop,
      view_count: prop.property_views?.[0]?.view_count || 0,
      last_viewed_at: prop.property_views?.[0]?.last_viewed_at || null,
    })) || []

  const enrolledCampaignIds = enrollments?.map((e) => e.campaign_id) || []

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    if (min && max) return `${fmt(min)} - ${fmt(max)}`
    if (min) return `${fmt(min)}+`
    if (max) return `Up to ${fmt(max)}`
    return null
  }

  const budgetDisplay = formatBudget(lead.budget_min, lead.budget_max)

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-purple-100 text-purple-800",
    qualified: "bg-emerald-100 text-emerald-800",
    nurturing: "bg-amber-100 text-amber-800",
    active: "bg-green-100 text-green-800",
    under_contract: "bg-indigo-100 text-indigo-800",
    closed_won: "bg-emerald-100 text-emerald-800",
    closed_lost: "bg-red-100 text-red-800",
  }

  const typeColors: Record<string, string> = {
    buyer: "bg-blue-50 text-blue-700",
    seller: "bg-emerald-50 text-emerald-700",
    both: "bg-amber-50 text-amber-700",
    investor: "bg-purple-50 text-purple-700",
    renter: "bg-gray-50 text-gray-700",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {lead.first_name} {lead.last_name}
            </h1>
            <Badge className={statusColors[lead.status] || "bg-gray-100"}>{lead.status.replace("_", " ")}</Badge>
            <Badge variant="outline" className={typeColors[lead.lead_type] || ""}>
              {lead.lead_type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Added {new Date(lead.created_at).toLocaleDateString()} via {lead.source}
          </p>
        </div>
        <AddPropertyDialog leadId={id} agentId={agent.id} />
        <EnrollCampaignDialog
          leadId={id}
          leadName={`${lead.first_name} ${lead.last_name}`}
          enrolledCampaignIds={enrolledCampaignIds}
        />
        <AddLeadActivityDialog leadId={id} agentId={agent.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Lead Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-sm hover:underline text-blue-600">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-sm hover:underline text-blue-600">
                    {lead.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Created {new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
              {lead.last_contacted_at && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Last contacted {new Date(lead.last_contacted_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetDisplay && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-medium">{budgetDisplay}</p>
                  </div>
                </div>
              )}
              {lead.timeline && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                    <p className="text-sm font-medium">{lead.timeline}</p>
                  </div>
                </div>
              )}
              {lead.property_interest && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Property Interest</p>
                    <p className="text-sm">{lead.property_interest}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-medium capitalize">{lead.source.replace("_", " ")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusSelect lead={lead} agentId={agent.id} />
            </CardContent>
          </Card>

          {enrollments && enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Active Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{enrollment.campaign?.name}</p>
                      <p className="text-xs text-muted-foreground">Step {enrollment.current_step}</p>
                    </div>
                    <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                      {enrollment.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Activities, Properties & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes Card */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Alert */}
          {lead.next_follow_up && new Date(lead.next_follow_up) <= new Date() && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 text-lg">Follow-up Due</CardTitle>
                <CardDescription className="text-red-600">
                  Scheduled for {new Date(lead.next_follow_up).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Saved Properties */}
          <SavedPropertiesList
            properties={propertiesWithViews}
            leadId={id}
            leadName={`${lead.first_name} ${lead.last_name}`}
          />

          {/* Activities */}
          <LeadActivities activities={activities || []} />
        </div>
      </div>
    </div>
  )
}
