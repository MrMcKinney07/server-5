"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UserPlus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Agent {
  id: string
  full_name: string | null
  email: string
  tier: number
  is_active: boolean
}

interface ManualAssignDialogProps {
  leadId: string
  currentAgentId?: string | null
  agents: Agent[]
  adminId: string
  mode?: "assign" | "reassign"
}

export function ManualAssignDialog({
  leadId,
  currentAgentId,
  agents,
  adminId,
  mode = "assign",
}: ManualAssignDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const isReassign = mode === "reassign" && currentAgentId

  const handleSubmit = async () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent")
      return
    }

    setIsLoading(true)
    try {
      const endpoint = isReassign ? `/api/leads/${leadId}/reassign` : `/api/leads/${leadId}/manual-assign`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isReassign ? "newAgentId" : "agentId"]: selectedAgentId,
          reason: isReassign ? reason : undefined,
          adminId,
        }),
      })

      if (!response.ok) throw new Error("Failed to assign lead")

      toast.success(isReassign ? "Lead reassigned successfully" : "Lead assigned successfully")
      setOpen(false)
      setSelectedAgentId("")
      setReason("")
      router.refresh()
    } catch (error) {
      console.error("Error assigning lead:", error)
      toast.error(isReassign ? "Failed to reassign lead" : "Failed to assign lead")
    } finally {
      setIsLoading(false)
    }
  }

  const activeAgents = agents
    .filter((a) => a.is_active)
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      return (a.full_name || a.email).localeCompare(b.full_name || b.email)
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isReassign ? "outline" : "default"} size="sm">
          {isReassign ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reassign
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Agent
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isReassign ? "Reassign Lead" : "Assign Lead to Agent"}</DialogTitle>
          <DialogDescription>
            {isReassign ? "Transfer this lead to a different agent" : "Manually assign this lead to a specific agent"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger id="agent">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                {activeAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id} disabled={currentAgentId === agent.id}>
                    <div className="flex items-center gap-2">
                      <span>{agent.full_name || agent.email}</span>
                      <span className="text-xs text-muted-foreground">(Tier {agent.tier})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isReassign && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why are you reassigning this lead?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedAgentId}>
            {isLoading ? "Assigning..." : isReassign ? "Reassign Lead" : "Assign Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
