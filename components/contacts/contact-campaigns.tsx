"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pause, Play, X } from "lucide-react"
import type { Campaign, CampaignEnrollment } from "@/lib/types/database"

interface ContactCampaignsProps {
  contactId: string
  agentId: string
  enrollments: (CampaignEnrollment & { campaign: Campaign })[]
  availableCampaigns: Campaign[]
}

export function ContactCampaigns({ contactId, agentId, enrollments, availableCampaigns }: ContactCampaignsProps) {
  const [showEnroll, setShowEnroll] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  // Filter out campaigns the contact is already enrolled in
  const unenrolledCampaigns = availableCampaigns.filter(
    (c) => c.is_active && !enrollments.some((e) => e.campaign_id === c.id),
  )

  async function enrollContact() {
    if (!selectedCampaignId) return
    setLoading(true)

    await supabase.from("campaign_enrollments").insert({
      campaign_id: selectedCampaignId,
      contact_id: contactId,
      agent_id: agentId,
    })

    setLoading(false)
    setShowEnroll(false)
    setSelectedCampaignId("")
    router.refresh()
  }

  async function togglePause(enrollmentId: string, currentPaused: boolean) {
    await supabase.from("campaign_enrollments").update({ is_paused: !currentPaused }).eq("id", enrollmentId)
    router.refresh()
  }

  async function unenroll(enrollmentId: string) {
    if (!confirm("Remove this contact from the campaign?")) return
    await supabase.from("campaign_enrollments").delete().eq("id", enrollmentId)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Campaign Enrollments</CardTitle>
        {unenrolledCampaigns.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowEnroll(!showEnroll)}>
            <Plus className="h-4 w-4 mr-1" />
            Enroll
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showEnroll && (
          <div className="p-3 border rounded-lg bg-muted/50 space-y-3">
            <div className="space-y-2">
              <Label>Select Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {unenrolledCampaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={enrollContact} disabled={!selectedCampaignId || loading}>
                {loading ? "Enrolling..." : "Enroll Contact"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowEnroll(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enrolled in any campaigns.</p>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{enrollment.campaign?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {enrollment.completed_at ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Completed
                      </Badge>
                    ) : enrollment.is_paused ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Paused
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Active
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Step {enrollment.last_step_executed || 0} completed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!enrollment.completed_at && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => togglePause(enrollment.id, enrollment.is_paused)}
                      title={enrollment.is_paused ? "Resume" : "Pause"}
                    >
                      {enrollment.is_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => unenroll(enrollment.id)} title="Remove">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
