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
import { Plus, Users, Phone, Mail, Calendar, AlertCircle, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"

interface LeadsViewProps {
  leads: Lead[]
  agentId: string
  needsFollowUp: Lead[]
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-purple-100 text-purple-800 border-purple-200",
  qualified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  nurturing: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-green-100 text-green-800 border-green-200",
  under_contract: "bg-indigo-100 text-indigo-800 border-indigo-200",
  closed_won: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed_lost: "bg-red-100 text-red-800 border-red-200",
}

const typeColors: Record<string, string> = {
  buyer: "bg-blue-50 text-blue-700",
  seller: "bg-emerald-50 text-emerald-700",
  both: "bg-amber-50 text-amber-700",
  investor: "bg-purple-50 text-purple-700",
  renter: "bg-gray-50 text-gray-700",
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
  const router = useRouter()

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
    <TableRow key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={(e) => handleRowClick(lead.id, e)}>
      <TableCell>
        <Link
          href={`/dashboard/leads/${lead.id}`}
          className="font-medium text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.first_name} {lead.last_name}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {lead.email && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {lead.email}
            </span>
          )}
          {lead.phone && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
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
      <TableCell className="text-muted-foreground text-sm">{lead.source}</TableCell>
      <TableCell>
        {lead.next_follow_up ? (
          <span
            className={`text-sm flex items-center gap-1 ${new Date(lead.next_follow_up) <= new Date() ? "text-red-600 font-medium" : "text-muted-foreground"}`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(lead.next_follow_up).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      {/* Follow-up Alert */}
      {needsFollowUp.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Follow-ups Due ({needsFollowUp.length})
            </CardTitle>
            <CardDescription className="text-red-600">These leads need your attention today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {needsFollowUp.slice(0, 5).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="bg-white border border-red-200 rounded-lg px-3 py-2 text-sm hover:bg-red-100 transition-colors"
                >
                  <span className="font-medium">
                    {lead.first_name} {lead.last_name}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {lead.next_follow_up && new Date(lead.next_follow_up).toLocaleDateString()}
                  </span>
                </Link>
              ))}
              {needsFollowUp.length > 5 && (
                <span className="text-sm text-red-600 self-center">+{needsFollowUp.length - 5} more</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              All Leads
            </CardTitle>
            <CardDescription>Your complete lead pipeline</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
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
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({filteredLeads.length})</TabsTrigger>
              <TabsTrigger value="new">New ({filteredLeads.filter((l) => l.status === "new").length})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({filteredLeads.filter((l) => l.status === "active").length})
              </TabsTrigger>
              <TabsTrigger value="nurturing">
                Nurturing ({filteredLeads.filter((l) => l.status === "nurturing").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {filteredLeads.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Follow-up</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{filteredLeads.map(renderLeadRow)}</TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">{searchQuery ? "No leads found" : "No leads yet"}</p>
                  <p className="text-sm">
                    {searchQuery ? "Try adjusting your search" : 'Click "Add Lead" to create your first lead'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="new">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{filteredLeads.filter((l) => l.status === "new").map(renderLeadRow)}</TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{filteredLeads.filter((l) => l.status === "active").map(renderLeadRow)}</TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="nurturing">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
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
          // Only allow closing via Cancel button or successful submission
          if (!open && !isLoading) {
            setCreateDialogOpen(false)
          }
        }}
      >
        <DialogContent
          className="max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (!isLoading) {
              setCreateDialogOpen(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the lead's information to add them to your pipeline. At least name and one contact method (email or
              phone) required.
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
                  onFocus={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Smith"
                  onFocus={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  onFocus={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  onFocus={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead Type</Label>
                <Select value={formData.lead_type} onValueChange={(v) => setFormData({ ...formData, lead_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  placeholder="$200,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Max</Label>
                <Input
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  placeholder="$400,000"
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
                placeholder="3BR/2BA in North Dallas, close to schools"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this lead..."
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
