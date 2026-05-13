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
import { PropertyEngagementAnalytics } from "@/components/leads/property-engagement-analytics"
import { LeadCRMActions } from "@/components/leads/lead-crm-actions"

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
    .select(`
      *,
      campaign:campaigns(id, name, description, is_active)
    `)
    .eq("lead_id", id)
    .order("created_at", { ascending: false })

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

  const { data: propertyViews } = await supabase
    .from("property_views")
    .select(`
      *,
      saved_property:saved_properties(
        id,
        address,
        city,
        state,
        price,
        photo_url
      )
    `)
    .eq("lead_id", id)

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

      <LeadCRMActions lead={lead} agentId={agent.id} />

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

          {/* Active Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Active Campaigns
              </CardTitle>
              <CardDescription>
                {enrollments && enrollments.length > 0
                  ? `${enrollments.length} campaign${enrollments.length !== 1 ? "s" : ""} enrolled`
                  : "No campaigns enrolled yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {enrollments && enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {enrollment.campaign?.name || "Unknown Campaign"}
                      </p>
                      {enrollment.campaign?.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{enrollment.campaign.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Step {enrollment.current_step || 1}
                        </Badge>
                        {enrollment.next_run_at && (
                          <span className="text-xs text-muted-foreground">
                            Next: {new Date(enrollment.next_run_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={enrollment.status === "active" ? "default" : "secondary"}
                      className={
                        enrollment.status === "active"
                          ? "bg-green-500 hover:bg-green-600"
                          : enrollment.status === "paused"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-gray-500"
                      }
                    >
                      {enrollment.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No campaigns enrolled</p>
                  <p className="text-xs mt-1">Click "Enroll in Campaign" above to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
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

          {/* Property Engagement Analytics */}
          {propertyViews && propertyViews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Engagement</CardTitle>
                <CardDescription>Track which properties {lead.first_name} is interested in</CardDescription>
              </CardHeader>
              <CardContent>
                <PropertyEngagementAnalytics leadId={id} propertyViews={propertyViews} />
              </CardContent>
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
