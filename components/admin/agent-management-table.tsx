"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreVertical, UserX, UserCheck, Key, FileText, Phone, Mail, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Agent {
  id: string
  Name: string
  Email: string
  Phone: string | null
  Role: string
  profile_picture_url: string | null
  is_active: boolean
  last_sign_in_at: string | null
  created_at: string
  notes: string | null
  contract_date: string | null
}

interface AgentManagementTableProps {
  agents: Agent[]
}

export function AgentManagementTable({ agents }: AgentManagementTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [notesDialog, setNotesDialog] = useState(false)
  const [disableDialog, setDisableDialog] = useState(false)
  const [disableReason, setDisableReason] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordResetDialog, setPasswordResetDialog] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [deleteDialog, setDeleteDialog] = useState(false)

  const filteredAgents = agents.filter(
    (agent) =>
      agent.Name?.toLowerCase().includes(search.toLowerCase()) ||
      agent.Email?.toLowerCase().includes(search.toLowerCase()) ||
      agent.Phone?.includes(search),
  )

  const roleColors: Record<string, string> = {
    broker: "bg-amber-100 text-amber-800 border-amber-200",
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    agent: "bg-blue-100 text-blue-800 border-blue-200",
  }

  const handlePasswordReset = (agent: Agent) => {
    setSelectedAgent(agent)
    const generatedPassword =
      Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase() + "!1"
    setNewPassword(generatedPassword)
    setPasswordResetDialog(true)
  }

  const handleDisableAgent = async () => {
    if (!selectedAgent) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/agents/${selectedAgent.id}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disableReason }),
      })

      if (!response.ok) throw new Error("Failed to disable agent")

      toast.success(`${selectedAgent.Name}'s account has been disabled`)
      setDisableDialog(false)
      setDisableReason("")
      router.refresh()
    } catch (error) {
      console.error("Error disabling agent:", error)
      toast.error("Failed to disable agent account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableAgent = async (agentId: string, agentName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/agents/${agentId}/enable`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to enable agent")

      toast.success(`${agentName}'s account has been enabled`)
      router.refresh()
    } catch (error) {
      console.error("Error enabling agent:", error)
      toast.error("Failed to enable agent account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedAgent) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/agents/${selectedAgent.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) throw new Error("Failed to update notes")

      toast.success("Notes updated successfully")
      setNotesDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating notes:", error)
      toast.error("Failed to update notes")
    } finally {
      setIsLoading(false)
    }
  }

  const confirmPasswordReset = async () => {
    if (!selectedAgent) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/agents/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          newPassword,
        }),
      })

      if (!response.ok) throw new Error("Failed to reset password")

      toast.success(`Password reset for ${selectedAgent.Name}`)
      setPasswordResetDialog(false)
      setNewPassword("")
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword)
    toast.success("Password copied to clipboard")
  }

  const openNotesDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setNotes(agent.notes || "")
    setNotesDialog(true)
  }

  const openDisableDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setDisableDialog(true)
  }

  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setDeleteDialog(true)
  }

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/agents/${selectedAgent.id}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete agent")
      }

      toast.success(`${selectedAgent.Name} has been permanently deleted from the system`)
      setDeleteDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting agent:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete agent")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredAgents.length} of {agents.length} agents
      </p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent.id} className={!agent.is_active ? "opacity-60 bg-muted/30" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={agent.profile_picture_url || undefined} />
                        <AvatarFallback>
                          {agent.Name?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{agent.Name || "Unnamed"}</div>
                        {agent.contract_date && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Contract: {new Date(agent.contract_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{agent.Email}</span>
                      </div>
                      {agent.Phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{agent.Phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[agent.Role] || roleColors.agent}>
                      {agent.Role || "agent"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agent.is_active ? "default" : "secondary"}>
                      {agent.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {agent.last_sign_in_at ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(agent.last_sign_in_at).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-xs">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isLoading}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Manage Agent</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openNotesDialog(agent)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View/Edit Notes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePasswordReset(agent)}>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {agent.is_active ? (
                          <DropdownMenuItem onClick={() => openDisableDialog(agent)} className="text-red-600">
                            <UserX className="h-4 w-4 mr-2" />
                            Disable Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleEnableAgent(agent.id, agent.Name)}
                            className="text-green-600"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Enable Account
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDeleteDialog(agent)} className="text-red-600">
                          <UserX className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Notes Dialog */}
      <Dialog open={notesDialog} onOpenChange={setNotesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent Notes - {selectedAgent?.Name}</DialogTitle>
            <DialogDescription>Internal notes about this agent (not visible to the agent)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add internal notes about this agent..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={disableDialog} onOpenChange={setDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Agent Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable {selectedAgent?.Name}'s account? They will not be able to sign in until
              re-enabled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Why are you disabling this account?"
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                rows={3}
                className="resize-none mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisableAgent} disabled={isLoading}>
              {isLoading ? "Disabling..." : "Disable Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialog} onOpenChange={setPasswordResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password - {selectedAgent?.Name}</DialogTitle>
            <DialogDescription>
              Set a new temporary password for this agent. They should change it after signing in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Temporary Password</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="text"
                  className="font-mono"
                />
                <Button variant="outline" onClick={copyPassword} size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Copy this password and share it with the agent securely. They will also receive it via email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordResetDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={confirmPasswordReset} disabled={isLoading || !newPassword}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedAgent?.Name}? This will remove their account, auth
              credentials, and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800 font-medium">⚠️ Warning: This is a destructive action</p>
            <p className="text-xs text-red-700 mt-1">
              The agent will be completely removed from the system and will not be able to sign in.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
