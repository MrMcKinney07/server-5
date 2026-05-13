"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Lead } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface LeadStatusSelectProps {
  lead: Lead
  agentId: string
}

const statuses = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "nurturing", label: "Nurturing" },
  { value: "active", label: "Active" },
  { value: "under_contract", label: "Under Contract" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
]

export function LeadStatusSelect({ lead, agentId }: LeadStatusSelectProps) {
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState(lead.notes || "")
  const [nextFollowUp, setNextFollowUp] = useState<Date | undefined>(
    lead.next_follow_up ? new Date(lead.next_follow_up) : undefined,
  )
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    setIsLoading(true)
    const supabase = createBrowserClient()

    const updates: Partial<Lead> = {
      status: status as Lead["status"],
      notes,
      next_follow_up: nextFollowUp?.toISOString() || null,
      updated_at: new Date().toISOString(),
    }

    // If status changed, update last_contacted_at
    if (status !== lead.status && ["contacted", "qualified", "active"].includes(status)) {
      updates.last_contacted_at = new Date().toISOString()
    }

    const { error } = await supabase.from("leads").update(updates).eq("id", lead.id)

    if (!error) {
      // Log activity for status change
      if (status !== lead.status) {
        await supabase.from("activities").insert({
          lead_id: lead.id,
          agent_id: agentId,
          activity_type: "note",
          title: "Status Updated",
          description: `Status changed from "${lead.status}" to "${status}"`,
        })
      }
      router.refresh()
    }

    setIsLoading(false)
  }

  const hasChanges =
    status !== lead.status ||
    notes !== (lead.notes || "") ||
    (nextFollowUp?.toISOString() || null) !== lead.next_follow_up

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Next Follow-up</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !nextFollowUp && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {nextFollowUp ? format(nextFollowUp, "PPP") : "Set follow-up date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={nextFollowUp} onSelect={setNextFollowUp} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this lead..."
          rows={4}
        />
      </div>

      <Button onClick={handleUpdate} disabled={isLoading || !hasChanges} className="w-full">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
