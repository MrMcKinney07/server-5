"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Tag, Search, CheckCircle2, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

interface Lead {
  id: string
  contact: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    tags: string[] | null
  }
  status: string
}

interface CampaignLeadEnrollmentProps {
  campaignId: string
  campaignName: string
}

export function CampaignLeadEnrollment({ campaignId, campaignName }: CampaignLeadEnrollmentProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [enrolledLeadIds, setEnrolledLeadIds] = useState<string[]>([])
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchData()
  }, [campaignId])

  async function fetchData() {
    setLoading(true)

    // Get current user's leads
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return

    const userId = sessionData.session.user.id

    // Fetch all leads with contacts
    const { data: leadsData } = await supabase
      .from("leads")
      .select(
        `
        id,
        status,
        contact:contacts(
          id,
          first_name,
          last_name,
          email,
          phone,
          tags
        )
      `,
      )
      .eq("agent_id", userId)
      .order("created_at", { ascending: false })

    // Fetch already enrolled leads
    const { data: enrollmentsData } = await supabase
      .from("lead_campaign_enrollments")
      .select("lead_id")
      .eq("campaign_id", campaignId)

    // Extract all unique tags
    const tags = new Set<string>()
    leadsData?.forEach((lead: any) => {
      lead.contact?.tags?.forEach((tag: string) => tags.add(tag))
    })

    setLeads(leadsData || [])
    setEnrolledLeadIds(enrollmentsData?.map((e) => e.lead_id) || [])
    setAllTags(Array.from(tags).sort())
    setLoading(false)
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) => (prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]))
  }

  const toggleTagSelection = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const selectAllByTags = () => {
    if (selectedTags.length === 0) {
      toast.error("Please select at least one tag first")
      return
    }

    const leadsWithTags = leads.filter(
      (lead) => !enrolledLeadIds.includes(lead.id) && lead.contact?.tags?.some((tag) => selectedTags.includes(tag)),
    )

    setSelectedLeadIds(leadsWithTags.map((l) => l.id))
    toast.success(`Selected ${leadsWithTags.length} leads with chosen tags`)
  }

  const clearSelection = () => {
    setSelectedLeadIds([])
    setSelectedTags([])
  }

  async function handleEnrollSelected() {
    if (selectedLeadIds.length === 0) {
      toast.error("Please select at least one lead to enroll")
      return
    }

    setEnrolling(true)

    // Get the first step's delay to calculate next_run_at
    const { data: firstStep } = await supabase
      .from("campaign_steps")
      .select("delay_hours")
      .eq("campaign_id", campaignId)
      .eq("step_number", 1)
      .maybeSingle()

    const nextRunAt = new Date()
    nextRunAt.setHours(nextRunAt.getHours() + (firstStep?.delay_hours || 0))

    // Prepare enrollment data
    const enrollments = selectedLeadIds.map((leadId) => ({
      lead_id: leadId,
      campaign_id: campaignId,
      current_step: 0,
      status: "active",
      next_run_at: nextRunAt.toISOString(),
    }))

    const { error } = await supabase.from("lead_campaign_enrollments").insert(enrollments)

    if (error) {
      toast.error("Failed to enroll leads: " + error.message)
    } else {
      // Log the enrollments
      const logs = selectedLeadIds.map((leadId) => ({
        lead_id: leadId,
        campaign_id: campaignId,
        event: "enrolled",
        info: { enrolled_by: "bulk_manual" },
      }))
      await supabase.from("campaign_logs").insert(logs)

      toast.success(`Successfully enrolled ${selectedLeadIds.length} leads in ${campaignName}`)
      setSelectedLeadIds([])
      setSelectedTags([])
      fetchData()
    }

    setEnrolling(false)
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      lead.contact?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const isNotEnrolled = !enrolledLeadIds.includes(lead.id)

    return matchesSearch && isNotEnrolled
  })

  const leadsFilteredByTags = selectedTags.length
    ? filteredLeads.filter((lead) => lead.contact?.tags?.some((tag) => selectedTags.includes(tag)))
    : filteredLeads

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Enroll Leads
        </CardTitle>
        <CardDescription>Select individual leads or use tags to enroll groups into this campaign</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual Leads</TabsTrigger>
            <TabsTrigger value="tags">By Tags</TabsTrigger>
          </TabsList>

          {/* INDIVIDUAL LEADS TAB */}
          <TabsContent value="individual" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {selectedLeadIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleEnrollSelected} disabled={enrolling}>
                    {enrolling ? "Enrolling..." : "Enroll Selected"}
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="h-[400px] border rounded-lg p-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {leads.length === enrolledLeadIds.length
                    ? "All your leads are already enrolled in this campaign"
                    : "No leads found matching your search"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => toggleLeadSelection(lead.id)}
                    >
                      <Checkbox
                        checked={selectedLeadIds.includes(lead.id)}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {lead.contact?.first_name || lead.contact?.last_name
                            ? `${lead.contact.first_name || ""} ${lead.contact.last_name || ""}`.trim()
                            : "Unnamed Contact"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {lead.contact?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.contact.email}
                            </span>
                          )}
                          {lead.contact?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.contact.phone}
                            </span>
                          )}
                        </div>
                        {lead.contact?.tags && lead.contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lead.contact.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* BY TAGS TAB */}
          <TabsContent value="tags" className="space-y-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Select Tags
              </Label>
              {allTags.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No tags found on your contacts</p>
                  <p className="text-xs text-muted-foreground mt-1">Add tags to contacts to use group enrollment</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-sm px-3 py-1.5"
                      onClick={() => toggleTagSelection(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {selectedTags.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    {leadsFilteredByTags.length} lead{leadsFilteredByTags.length !== 1 ? "s" : ""} with{" "}
                    {selectedTags.length} selected tag{selectedTags.length !== 1 ? "s" : ""}
                  </span>
                  <Button size="sm" onClick={selectAllByTags}>
                    Select All
                  </Button>
                </div>

                <ScrollArea className="h-[300px] border rounded-lg p-2">
                  {leadsFilteredByTags.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No available leads found with selected tags
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leadsFilteredByTags.map((lead) => (
                        <div key={lead.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {lead.contact?.first_name || lead.contact?.last_name
                                ? `${lead.contact.first_name || ""} ${lead.contact.last_name || ""}`.trim()
                                : "Unnamed Contact"}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lead.contact?.tags
                                ?.filter((tag) => selectedTags.includes(tag))
                                .map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {selectedLeadIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? "s" : ""} ready to enroll
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleEnrollSelected} disabled={enrolling}>
                    {enrolling ? "Enrolling..." : "Enroll Selected"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
