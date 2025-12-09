"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface AddLeadActivityDialogProps {
  leadId: string
  agentId: string
}

export function AddLeadActivityDialog({ leadId, agentId }: AddLeadActivityDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    activity_type: "call",
    subject: "",
    description: "",
  })
  const router = useRouter()

  const handleSubmit = async () => {
    if (!formData.subject) return
    setIsLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("activities").insert({
      lead_id: leadId,
      agent_id: agentId,
      activity_type: formData.activity_type,
      subject: formData.subject,
      description: formData.description || null,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    if (!error) {
      // Update lead's last_contacted_at
      await supabase.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", leadId)

      setOpen(false)
      setFormData({ activity_type: "call", subject: "", description: "" })
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>Record a call, email, meeting, or other interaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <Select
              value={formData.activity_type}
              onValueChange={(v) => setFormData({ ...formData, activity_type: v })}
            >
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
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Initial call - discussed preferences"
            />
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional notes..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.subject}>
            {isLoading ? "Saving..." : "Log Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
