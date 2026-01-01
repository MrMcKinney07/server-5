"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mail, Zap } from "lucide-react"
import { toast } from "sonner"

interface Campaign {
  id: string
  name: string
  description: string | null
  is_active: boolean
}

interface EnrollCampaignDialogProps {
  leadId: string
  leadName: string
  enrolledCampaignIds: string[]
}

export function EnrollCampaignDialog({ leadId, leadName, enrolledCampaignIds }: EnrollCampaignDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchCampaigns() {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, description, is_active")
        .eq("is_active", true)
        .order("name")

      if (!error) {
        setCampaigns(data || [])
      }
    }
    if (open) {
      fetchCampaigns()
    }
  }, [open, supabase])

  const availableCampaigns = campaigns.filter((c) => !enrolledCampaignIds.includes(c.id))

  async function handleEnroll() {
    if (!selectedCampaignId) {
      return
    }
    setLoading(true)

    // Get the first step's delay to calculate next_run_at
    const { data: firstStep } = await supabase
      .from("campaign_steps")
      .select("delay_hours")
      .eq("campaign_id", selectedCampaignId)
      .eq("step_number", 1)
      .maybeSingle()

    const nextRunAt = new Date()
    nextRunAt.setHours(nextRunAt.getHours() + (firstStep?.delay_hours || 0))

    const { error } = await supabase.from("lead_campaign_enrollments").insert({
      lead_id: leadId,
      campaign_id: selectedCampaignId,
      current_step: 0,
      status: "active",
      next_run_at: nextRunAt.toISOString(),
    })

    // Log the enrollment
    if (!error) {
      await supabase.from("campaign_logs").insert({
        lead_id: leadId,
        campaign_id: selectedCampaignId,
        event: "enrolled",
        info: { enrolled_by: "manual" },
      })
      toast.success("Lead enrolled in campaign successfully!")
      setOpen(false)
      setSelectedCampaignId("")
      router.refresh()
    } else {
      toast.error("Failed to enroll: " + error.message)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Zap className="mr-2 h-4 w-4" />
          Enroll in Campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in Drip Campaign</DialogTitle>
          <DialogDescription>Add {leadName} to an automated drip campaign for nurturing.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {availableCampaigns.length === 0 ? (
            <div className="text-center py-6">
              <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {campaigns.length === 0
                  ? "No active campaigns available. Create a campaign first."
                  : "This lead is already enrolled in all available campaigns."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Campaign</Label>
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a campaign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <div className="flex items-center gap-2">
                          <span>{campaign.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCampaignId && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {campaigns.find((c) => c.id === selectedCampaignId)?.description || "No description"}
                  </p>
                </div>
              )}
            </div>
          )}

          {enrolledCampaignIds.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Currently enrolled in:</p>
              <div className="flex flex-wrap gap-1">
                {campaigns
                  .filter((c) => enrolledCampaignIds.includes(c.id))
                  .map((c) => (
                    <Badge key={c.id} variant="secondary" className="text-xs">
                      {c.name}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={loading || !selectedCampaignId}>
            {loading ? "Enrolling..." : "Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
