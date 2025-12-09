"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Users, Crown } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Agent, TeamWithLeader } from "@/lib/types/database"

interface TeamsManagementProps {
  teams: (TeamWithLeader & { members: Agent[] })[]
  agents: Agent[]
}

export function TeamsManagement({ teams, agents }: TeamsManagementProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const { error } = await supabase.from("teams").insert({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      leader_agent_id: (formData.get("leader_agent_id") as string) || null,
    })

    setIsLoading(false)
    if (!error) {
      setIsAddOpen(false)
      router.refresh()
    }
  }

  const handleAssignAgent = async (agentId: string, teamId: string | null) => {
    await supabase.from("agents").update({ team_id: teamId }).eq("id", agentId)
    router.refresh()
  }

  const unassignedAgents = agents.filter((a) => !a.team_id)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>Create a new team/pod for agents</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTeam}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leader_agent_id">Team Leader</Label>
                  <Select name="leader_agent_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select leader" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Team"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {team.name}
              </CardTitle>
              {team.leader && (
                <CardDescription className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Leader: {team.leader.full_name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <Badge variant="secondary">{team.members.length}</Badge>
                </div>
                {team.members.length > 0 ? (
                  <ul className="space-y-1">
                    {team.members.map((member) => (
                      <li key={member.id} className="flex items-center justify-between text-sm">
                        <span>{member.full_name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleAssignAgent(member.id, null)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unassigned Agents */}
      {unassignedAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Agents</CardTitle>
            <CardDescription>Agents not yet assigned to a team</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Assign to Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.segment}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => handleAssignAgent(agent.id, v)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
