"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Lead } from "@/lib/types/database"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, Phone, Mail, Calendar, Search, FileUp, Clock, ArrowRight, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"
import { ImportLeadsTool } from "@/components/admin/import-leads-tool"

interface LeadsViewProps {
  leads: Lead[]
  agentId: string
  needsFollowUp: Lead[]
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

const typeColors: Record<string, string> = {
  buyer: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  seller: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  both: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  investor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  renter: "bg-slate-500/20 text-slate-300 border-slate-500/30",
}

export function LeadsView({ leads, agentId, needsFollowUp }: LeadsViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    lead_type: "buyer",
    source: "manual",
    notes: "",
    property_interest: "",
    budget_min: "",
    budget_max: "",
    timeline: "",
  })
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleCompleteFollowUp = async (e: React.MouseEvent, lead: Lead) => {
    e.preventDefault()
    e.stopPropagation()
    setCompletingId(lead.id)
    try {
      // Log a completed follow-up activity
      await supabase.from("activities").insert({
        agent_id: agentId,
        lead_id: lead.id,
        activity_type: "follow_up",
        subject: "Follow-up completed",
        description: `Follow-up with ${lead.first_name} ${lead.last_name} marked complete`,
        completed: true,
        completed_at: new Date().toISOString(),
        due_at: lead.next_follow_up,
      })
      // Clear the follow-up date on the lead
      await supabase
        .from("leads")
        .update({ next_follow_up: null, last_contacted_at: new Date().toISOString() })
        .eq("id", lead.id)
      setCompletedIds((prev) => new Set(prev).add(lead.id))
      toast.success(`Follow-up with ${lead.first_name} ${lead.last_name} marked complete`)
      router.refresh()
    } catch {
      toast.error("Failed to complete follow-up")
    }
    setCompletingId(null)
  }

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.first_name?.toLowerCase().includes(query) ||
      lead.last_name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query) ||
      lead.source?.toLowerCase().includes(query) ||
      lead.property_interest?.toLowerCase().includes(query)
    )
  })

  // Follow-up leads: due today or past
  const followUpLeads = leads.filter(
    (lead) => lead.next_follow_up && new Date(lead.next_follow_up) <= new Date()
  ).sort((a, b) => new Date(a.next_follow_up!).getTime() - new Date(b.next_follow_up!).getTime())

  // Upcoming follow-ups: due in future
  const upcomingLeads = leads.filter(
    (lead) => lead.next_follow_up && new Date(lead.next_follow_up) > new Date()
  ).sort((a, b) => new Date(a.next_follow_up!).getTime() - new Date(b.next_follow_up!).getTime())

  const handleCreateLead = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Please enter first and last name")
      return
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      toast.error("Please provide at least an email or phone number")
      return
    }

    setIsLoading(true)
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from("leads")
      .insert({
        agent_id: agentId,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        lead_type: formData.lead_type,
        source: formData.source,
        notes: formData.notes.trim() || null,
        property_interest: formData.property_interest.trim() || null,
        budget_min: formData.budget_min ? Number.parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? Number.parseFloat(formData.budget_max) : null,
        timeline: formData.timeline.trim() || null,
        status: "new",
      })
      .select()

    if (error) {
      toast.error(`Failed to create lead: ${error.message}`)
      setIsLoading(false)
      return
    }

    if (!error && data) {
      toast.success("Lead created successfully!")
      setCreateDialogOpen(false)
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        lead_type: "buyer",
        source: "manual",
        notes: "",
        property_interest: "",
        budget_min: "",
        budget_max: "",
        timeline: "",
      })
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleRowClick = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/leads/${leadId}`)
  }

  const renderLeadRow = (lead: Lead) => (
    <TableRow
      key={lead.id}
      className="hover:bg-white/5 cursor-pointer border-white/5 transition-colors"
      onClick={(e) => handleRowClick(lead.id, e)}
    >
      <TableCell>
        <Link
          href={`/dashboard/leads/${lead.id}`}
          className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.first_name} {lead.last_name}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {lead.email && (
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {lead.email}
            </span>
          )}
          {lead.phone && (
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={typeColors[lead.lead_type]}>
          {lead.lead_type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={statusColors[lead.status]}>
          {lead.status.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell className="text-slate-400 text-sm">{lead.source}</TableCell>
      <TableCell>
        {lead.next_follow_up ? (
          <span
            className={`text-sm flex items-center gap-1 ${
              new Date(lead.next_follow_up) <= new Date()
                ? "text-red-400 font-medium"
                : "text-slate-400"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(lead.next_follow_up).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-slate-600">-</span>
        )}
      </TableCell>
      <TableCell className="text-slate-400 text-sm">
        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
      </TableCell>
    </TableRow>
  )

  const renderFollowUpCard = (lead: Lead) => {
    const isOverdue = new Date(lead.next_follow_up!) <= new Date()
    const daysAgo = Math.floor(
      (new Date().getTime() - new Date(lead.next_follow_up!).getTime()) / (1000 * 60 * 60 * 24)
    )
    const isDone = completedIds.has(lead.id)

    if (isDone) return null

    return (
      <div
        key={lead.id}
        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
          isOverdue
            ? "border-red-500/30 bg-red-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isOverdue ? "bg-red-500/20" : "bg-amber-500/20"
          }`}
        >
          <Clock className={`h-5 w-5 ${isOverdue ? "text-red-400" : "text-amber-400"}`} />
        </div>

        {/* Lead info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">
            {lead.first_name} {lead.last_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className={statusColors[lead.status] + " text-xs"}>
              {lead.status.replace("_", " ")}
            </Badge>
            {lead.phone && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Phone className="h-3 w-3" /> {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Mail className="h-3 w-3" /> {lead.email}
              </span>
            )}
          </div>
        </div>

        {/* Due date */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className={`text-sm font-semibold ${isOverdue ? "text-red-400" : "text-amber-400"}`}>
            {isOverdue
              ? daysAgo === 0
                ? "Due today"
                : `${daysAgo}d overdue`
              : new Date(lead.next_follow_up!).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(lead.next_follow_up!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/dashboard/leads/${lead.id}`}>
            <Button size="sm" variant="outline" className="text-xs border-white/10 bg-transparent hover:bg-white/5">
              <ArrowRight className="h-3 w-3 mr-1" />
              Open
            </Button>
          </Link>
          <Button
            size="sm"
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={(e) => handleCompleteFollowUp(e, lead)}
            disabled={completingId === lead.id}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {completingId === lead.id ? "Saving..." : "Complete"}
          </Button>
        </div>
      </div>
    )
  }

  const tableHeaders = (
    <TableRow className="border-white/5">
      <TableHead className="text-slate-400">Name</TableHead>
      <TableHead className="text-slate-400">Contact</TableHead>
      <TableHead className="text-slate-400">Type</TableHead>
      <TableHead className="text-slate-400">Status</TableHead>
      <TableHead className="text-slate-400">Source</TableHead>
      <TableHead className="text-slate-400">Follow-up</TableHead>
      <TableHead className="text-slate-400">Created</TableHead>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      {/* Leads Table */}
      <Card className="border-white/10 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-cyan-400" />
              Lead Pipeline
            </CardTitle>
            <CardDescription className="text-slate-400">Manage and track your leads</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setImportDialogOpen(true)}
              variant="outline"
              className="border-white/10 text-slate-300 hover:text-white bg-transparent"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search leads by name, email, phone, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-slate-500 mt-2">
                Found {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <Tabs defaultValue="followup">
            <TabsList className="mb-4 bg-white/5 border border-white/10">
              <TabsTrigger value="followup" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
                Follow-up{followUpLeads.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {followUpLeads.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                Upcoming ({upcomingLeads.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
                All ({filteredLeads.length})
              </TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-white/10">
                New ({filteredLeads.filter((l) => l.status === "new").length})
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-white/10">
                Active ({filteredLeads.filter((l) => l.status === "active").length})
              </TabsTrigger>
              <TabsTrigger value="nurturing" className="data-[state=active]:bg-white/10">
                Nurturing ({filteredLeads.filter((l) => l.status === "nurturing").length})
              </TabsTrigger>
            </TabsList>

            {/* FOLLOW-UP TAB */}
            <TabsContent value="followup">
              {followUpLeads.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 mb-3">
                    {followUpLeads.length} lead{followUpLeads.length !== 1 ? "s" : ""} need your attention now. Click a lead to open and reschedule or log a call.
                  </p>
                  {followUpLeads.map(renderFollowUpCard)}
                </div>
              ) : (
                <div className="text-center py-14 text-muted-foreground">
                  <CheckCircle2 className="h-14 w-14 mx-auto mb-3 text-emerald-500 opacity-80" />
                  <p className="text-lg font-medium text-emerald-400">All caught up!</p>
                  <p className="text-sm text-slate-500 mt-1">No follow-ups are overdue right now.</p>
                </div>
              )}
            </TabsContent>

            {/* UPCOMING TAB */}
            <TabsContent value="upcoming">
              {upcomingLeads.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 mb-3">
                    {upcomingLeads.length} scheduled follow-up{upcomingLeads.length !== 1 ? "s" : ""} coming up.
                  </p>
                  {upcomingLeads.map((lead) => renderFollowUpCard(lead))}
                </div>
              ) : (
                <div className="text-center py-14 text-muted-foreground">
                  <Calendar className="h-14 w-14 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium text-white">No upcoming follow-ups</p>
                  <p className="text-sm text-slate-500 mt-1">Open a lead and set a follow-up date to see it here.</p>
                </div>
              )}
            </TabsContent>

            {/* ALL TAB */}
            <TabsContent value="all">
              {filteredLeads.length > 0 ? (
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>{tableHeaders}</TableHeader>
                    <TableBody>{filteredLeads.map(renderLeadRow)}</TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-white">{searchQuery ? "No leads found" : "No leads yet"}</p>
                  <p className="text-sm text-slate-500">
                    {searchQuery ? "Try adjusting your search" : 'Click "Add Lead" to create your first lead'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* NEW TAB */}
            <TabsContent value="new">
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>{tableHeaders}</TableHeader>
                  <TableBody>{filteredLeads.filter((l) => l.status === "new").map(renderLeadRow)}</TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ACTIVE TAB */}
            <TabsContent value="active">
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>{tableHeaders}</TableHeader>
                  <TableBody>{filteredLeads.filter((l) => l.status === "active").map(renderLeadRow)}</TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* NURTURING TAB */}
            <TabsContent value="nurturing">
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>{tableHeaders}</TableHeader>
                  <TableBody>{filteredLeads.filter((l) => l.status === "nurturing").map(renderLeadRow)}</TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Lead Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isLoading) setCreateDialogOpen(false)
        }}
      >
        <DialogContent
          className="max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => { if (!isLoading) setCreateDialogOpen(false) }}
        >
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the lead's information. At least a name and one contact method (email or phone) is required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Smith"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead Type</Label>
                <Select value={formData.lead_type} onValueChange={(v) => setFormData({ ...formData, lead_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="both">Buyer & Seller</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="renter">Renter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="zillow">Zillow</SelectItem>
                    <SelectItem value="realtor">Realtor.com</SelectItem>
                    <SelectItem value="open_house">Open House</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Budget Min</Label>
                <Input
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                  placeholder="200000"
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Max</Label>
                <Input
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  placeholder="400000"
                />
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Input
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  placeholder="3-6 months"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Property Interest</Label>
              <Input
                value={formData.property_interest}
                onChange={(e) => setFormData({ ...formData, property_interest: e.target.value })}
                placeholder="3BR/2BA in North Dallas"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateLead}
              disabled={
                isLoading ||
                !formData.first_name.trim() ||
                !formData.last_name.trim() ||
                (!formData.email.trim() && !formData.phone.trim())
              }
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoading ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportLeadsTool
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        agentId={agentId}
        onImportComplete={() => {
          setImportDialogOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
