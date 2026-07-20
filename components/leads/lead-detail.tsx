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
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  contacted: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  qualified: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  nurturing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  under_contract: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  closed_won: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  closed_lost: "bg-red-500/20 text-red-300 border-red-500/30",
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

    // Parse date-only string as local noon to avoid UTC midnight shifting the date back a day
    const followUpDate = nextFollowUp
      ? (() => {
          const [y, m, d] = nextFollowUp.split("-").map(Number)
          const local = new Date(y, m - 1, d, 12, 0, 0)
          return local.toISOString()
        })()
      : null

    const { error } = await supabase
      .from("leads")
      .update({
        status,
        next_follow_up: followUpDate,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id)

    // If follow-up date was set/changed, create an activity task for it
    if (!error && followUpDate && followUpDate !== lead.next_follow_up) {
      // Mark any existing pending follow-up activities as completed
      await supabase
        .from("activities")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("lead_id", lead.id)
        .eq("activity_type", "follow_up")
        .eq("completed", false)

      // Create new follow-up activity
      await supabase.from("activities").insert({
        agent_id: agentId,
        lead_id: lead.id,
        activity_type: "follow_up",
        subject: `Follow up with ${lead.first_name} ${lead.last_name}`,
        description: notes || null,
        due_at: followUpDate,
        completed: false,
      })
    }

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

  const isOverdue = lead.next_follow_up && new Date(lead.next_follow_up) <= new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {lead.first_name} {lead.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusColors[lead.status]}>
                {lead.status.replace("_", " ")}
              </Badge>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 capitalize">{lead.lead_type}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActivityDialogOpen(true)}
            className="border-white/10 text-slate-300 hover:text-white bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
          <Button onClick={() => setEditDialogOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="border-white/10 bg-slate-900/50 border-l-4 border-l-cyan-500">
          <CardHeader>
            <CardTitle className="text-base text-white">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <Mail className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <a href={`mailto:${lead.email}`} className="text-cyan-400 hover:underline text-sm">
                    {lead.email}
                  </a>
                </div>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Phone className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <a href={`tel:${lead.phone}`} className="text-emerald-400 hover:underline text-sm">
                    {lead.phone}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-500/10 rounded-lg border border-slate-500/20">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm text-slate-300">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card className="border-white/10 bg-slate-900/50 border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="text-base text-white">Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.property_interest && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Home className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Property Interest</p>
                  <p className="text-sm text-slate-300">{lead.property_interest}</p>
                </div>
              </div>
            )}
            {(lead.budget_min || lead.budget_max) && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <DollarSign className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Budget</p>
                  <p className="text-sm text-slate-300">
                    {lead.budget_min ? `$${lead.budget_min.toLocaleString()}` : "$0"} -{" "}
                    {lead.budget_max ? `$${lead.budget_max.toLocaleString()}` : "No max"}
                  </p>
                </div>
              </div>
            )}
            {lead.timeline && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Timeline</p>
                  <p className="text-sm text-slate-300">{lead.timeline}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1">Source</p>
              <Badge variant="outline" className="text-slate-300 border-white/20">
                {lead.source}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Card */}
        <Card
          className={`border-white/10 bg-slate-900/50 border-l-4 ${
            isOverdue ? "border-l-red-500" : "border-l-amber-500"
          }`}
        >
          <CardHeader>
            <CardTitle className="text-base text-white">Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border ${
                  isOverdue
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                }`}
              >
                <Calendar
                  className={`h-4 w-4 ${isOverdue ? "text-red-400" : "text-amber-400"}`}
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Next Follow-up</p>
                <p className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-slate-300"}`}>
                  {lead.next_follow_up
                    ? new Date(lead.next_follow_up).toLocaleDateString()
                    : "Not scheduled"}
                </p>
                {isOverdue && (
                  <p className="text-xs text-red-500 mt-0.5">Overdue — click Edit to reschedule</p>
                )}
              </div>
            </div>
            {lead.last_contacted_at && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-500/10 rounded-lg border border-slate-500/20">
                  <Clock className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Contacted</p>
                  <p className="text-sm text-slate-300">
                    {formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full border-white/10 text-slate-300 hover:text-white bg-transparent"
              onClick={() => setEditDialogOpen(true)}
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {lead.next_follow_up ? "Reschedule Follow-up" : "Schedule Follow-up"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {lead.notes && (
        <Card className="border-white/10 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base text-white">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-slate-300 text-sm">{lead.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Activity History */}
      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base text-white">Activity History</CardTitle>
          <CardDescription className="text-slate-400">All interactions with this lead</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.activity_type] || Clock
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="p-2 bg-slate-700 rounded-lg border border-white/10">
                      <Icon className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize text-xs border-white/20 text-slate-300">
                          {activity.activity_type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                        {activity.due_at && !activity.completed && (
                          <span className="text-xs text-amber-400">
                            Due {new Date(activity.due_at).toLocaleDateString()}
                          </span>
                        )}
                        {activity.completed && (
                          <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </span>
                        )}
                      </div>
                      {activity.subject && (
                        <p className="font-medium mt-1 text-sm text-white">{activity.subject}</p>
                      )}
                      {activity.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{activity.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-slate-400">No activity logged yet</p>
              <p className="text-sm text-slate-500">Log a call, email, or meeting to track your interactions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead status and follow-up date</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label>Next Follow-up Date</Label>
              <Input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Setting a date will create a follow-up task that appears in your dashboard widget.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateLead} disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogActivity} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? "Logging..." : "Log Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
