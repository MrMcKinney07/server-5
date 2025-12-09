"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Lead, Activity } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Home,
  Clock,
  Plus,
  Edit,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface LeadDetailProps {
  lead: Lead
  activities: Activity[]
  agentId: string
}

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

const activityIcons: Record<string, any> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  meeting: Calendar,
  note: Edit,
  task: CheckCircle2,
  follow_up: Clock,
  showing: Home,
}

export function LeadDetail({ lead, activities, agentId }: LeadDetailProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(lead.status)
  const [nextFollowUp, setNextFollowUp] = useState(lead.next_follow_up?.split("T")[0] || "")
  const [notes, setNotes] = useState(lead.notes || "")

  const [activityType, setActivityType] = useState("call")
  const [activitySubject, setActivitySubject] = useState("")
  const [activityDescription, setActivityDescription] = useState("")

  const router = useRouter()

  const handleUpdateLead = async () => {
    setIsLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase
      .from("leads")
      .update({
        status,
        next_follow_up: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id)

    if (!error) {
      setEditDialogOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleLogActivity = async () => {
    setIsLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("activities").insert({
      agent_id: agentId,
      lead_id: lead.id,
      activity_type: activityType,
      subject: activitySubject || null,
      description: activityDescription || null,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    // Also update last_contacted_at on the lead
    if (!error) {
      await supabase
        .from("leads")
        .update({
          last_contacted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id)

      setActivityDialogOpen(false)
      setActivitySubject("")
      setActivityDescription("")
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {lead.first_name} {lead.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[lead.status]}>{lead.status.replace("_", " ")}</Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground capitalize">{lead.lead_type}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActivityDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
          <Button onClick={() => setEditDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                    {lead.email}
                  </a>
                </div>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Phone className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${lead.phone}`} className="text-emerald-600 hover:underline">
                    {lead.phone}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="text-lg">Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.property_interest && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Home className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property Interest</p>
                  <p>{lead.property_interest}</p>
                </div>
              </div>
            )}
            {(lead.budget_min || lead.budget_max) && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p>
                    {lead.budget_min ? `$${lead.budget_min.toLocaleString()}` : "$0"} -{" "}
                    {lead.budget_max ? `$${lead.budget_max.toLocaleString()}` : "No max"}
                  </p>
                </div>
              </div>
            )}
            {lead.timeline && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p>{lead.timeline}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Source</p>
              <Badge variant="outline">{lead.source}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Card */}
        <Card
          className={`border-l-4 ${lead.next_follow_up && new Date(lead.next_follow_up) <= new Date() ? "border-l-red-500 bg-red-50" : "border-l-amber-500"}`}
        >
          <CardHeader>
            <CardTitle className="text-lg">Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${lead.next_follow_up && new Date(lead.next_follow_up) <= new Date() ? "bg-red-100" : "bg-amber-100"}`}
              >
                <Calendar
                  className={`h-4 w-4 ${lead.next_follow_up && new Date(lead.next_follow_up) <= new Date() ? "text-red-600" : "text-amber-600"}`}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Follow-up</p>
                <p
                  className={
                    lead.next_follow_up && new Date(lead.next_follow_up) <= new Date() ? "text-red-600 font-medium" : ""
                  }
                >
                  {lead.next_follow_up ? new Date(lead.next_follow_up).toLocaleDateString() : "Not scheduled"}
                </p>
              </div>
            </div>
            {lead.last_contacted_at && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Contacted</p>
                  <p>{formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {lead.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{lead.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
          <CardDescription>All interactions with this lead</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.activity_type] || Clock
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="p-2 bg-white rounded-lg border">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {activity.activity_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {activity.subject && <p className="font-medium mt-1">{activity.subject}</p>}
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No activity logged yet</p>
              <p className="text-sm">Log a call, email, or meeting to track your interactions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead status and follow-up</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="nurturing">Nurturing</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_contract">Under Contract</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Follow-up</Label>
              <Input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLead} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Record an interaction with this lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="showing">Property Showing</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={activitySubject}
                onChange={(e) => setActivitySubject(e.target.value)}
                placeholder="Brief summary"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Details about this interaction..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogActivity} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? "Logging..." : "Log Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
