"use client"

import type React from "react"
import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

interface AddLeadActivityDialogProps {
  leadId: string
  agentId: string
}

const activityTypes = [
  { value: "call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text Message" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
  { value: "task", label: "Task" },
  { value: "follow_up", label: "Follow-up" },
]

export function AddLeadActivityDialog({ leadId, agentId }: AddLeadActivityDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activityType, setActivityType] = useState("call")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createBrowserClient()
    const { error } = await supabase.from("activities").insert({
      lead_id: leadId,
      agent_id: agentId,
      activity_type: activityType,
      subject: subject || null,
      description: description || null,
      completed: activityType !== "task" && activityType !== "follow_up",
    })

    if (!error) {
      // Also update the lead's last_contacted_at if it's a contact activity
      if (["call", "email", "text", "meeting"].includes(activityType)) {
        await supabase.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", leadId)
      }

      setOpen(false)
      setActivityType("call")
      setSubject("")
      setDescription("")
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
          <DialogDescription>Record an interaction with this lead.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the activity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Details</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes about this activity..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Saving..." : "Log Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
