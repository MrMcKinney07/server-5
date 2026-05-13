"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Lead, Contact, Agent, LeadStatus } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface LeadStatusPanelProps {
  lead: Lead & { contact: Contact; assigned_agent: Agent | null }
  agents: Agent[]
  currentAgentId: string
}

const statuses: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "claimed", label: "Claimed" },
  { value: "contacted", label: "Contacted" },
  { value: "nurture", label: "Nurture" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
]

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  assigned: "secondary",
  claimed: "secondary",
  contacted: "secondary",
  nurture: "outline",
  closed: "default",
  lost: "destructive",
}

export function LeadStatusPanel({ lead, agents, currentAgentId }: LeadStatusPanelProps) {
  const [status, setStatus] = useState<LeadStatus>(lead.status as LeadStatus)
  const [assignedAgentId, setAssignedAgentId] = useState(lead.assigned_agent_id || "")
  const [notes, setNotes] = useState(lead.notes || "")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const updates: Partial<Lead> = {
      status,
      notes,
      assigned_agent_id: assignedAgentId || null,
    }

    if (status !== lead.status) {
      if (status === "assigned" && assignedAgentId) {
        updates.assigned_at = new Date().toISOString()
      }
      if (status === "claimed") {
        updates.claimed_at = new Date().toISOString()
      }
    }

    await supabase.from("leads").update(updates).eq("id", lead.id)

    // Log activity for status change
    if (status !== lead.status) {
      await supabase.from("activities").insert({
        contact_id: lead.contact_id,
        lead_id: lead.id,
        agent_id: currentAgentId,
        type: "status_change",
        description: `Status changed from "${lead.status}" to "${status}"`,
      })
    }

    // Log activity for notes update
    if (notes !== lead.notes && notes) {
      await supabase.from("activities").insert({
        contact_id: lead.contact_id,
        lead_id: lead.id,
        agent_id: currentAgentId,
        type: "note",
        description: notes,
      })
    }

    setIsLoading(false)
    router.refresh()
  }

  const hasChanges =
    status !== lead.status || assignedAgentId !== (lead.assigned_agent_id || "") || notes !== (lead.notes || "")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Lead Status
          <Badge variant={statusColors[lead.status] || "secondary"} className="capitalize">
            {lead.status.replace("_", " ")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
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

        <div className="grid gap-2">
          <Label>Assigned Agent</Label>
          <Select value={assignedAgentId} onValueChange={setAssignedAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name || agent.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
            rows={4}
          />
        </div>

        <Button onClick={handleUpdate} disabled={isLoading || !hasChanges} className="w-full">
          {isLoading ? "Updating..." : "Update Lead"}
        </Button>
      </CardContent>
    </Card>
  )
}
