"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Users, Target, Award } from "lucide-react"
import type { Agent, TeamWithLeader, MonthlyAgentStats, AgentDailyMission } from "@/lib/types/database"

interface PodDashboardProps {
  team: TeamWithLeader
  members: Agent[]
  memberStats: MonthlyAgentStats[]
  recentMissions: AgentDailyMission[]
  currentAgent: Agent
}

export function PodDashboard({ team, members, memberStats, recentMissions, currentAgent }: PodDashboardProps) {
  const getAgentStats = (agentId: string) => memberStats.find((s) => s.agent_id === agentId)

  const getAgentMissionCompletion = (agentId: string) => {
    const agentMissions = recentMissions.filter((m) => m.agent_id === agentId)
    if (agentMissions.length === 0) return 0

    let completed = 0
    let total = 0
    agentMissions.forEach((m) => {
      if (m.mission1_completed) completed++
      if (m.mission2_completed) completed++
      if (m.mission3_completed) completed++
      total += 3
    })
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const totalPoints = memberStats.reduce((sum, s) => sum + (s.total_points || 0), 0)
  const avgCompletion =
    members.length > 0
      ? Math.round(members.reduce((sum, m) => sum + getAgentMissionCompletion(m.id), 0) / members.length)
      : 0

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            {team.leader && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Led by {team.leader.full_name}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mission Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletion}%</div>
            <p className="text-xs text-muted-foreground">Last 3 days avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Member Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Individual member stats and mission completion</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Mission Completion (3 days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const stats = getAgentStats(member.id)
                const completion = getAgentMissionCompletion(member.id)
                const isCurrentUser = member.id === currentAgent.id
                const isLeader = member.id === team.leader_agent_id

                return (
                  <TableRow key={member.id} className={isCurrentUser ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {member.full_name}
                        {isLeader && <Crown className="h-3 w-3 text-yellow-500" />}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.segment}</Badge>
                    </TableCell>
                    <TableCell>{stats?.rank || "-"}</TableCell>
                    <TableCell>{stats?.total_points || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={completion} className="h-2 w-24" />
                        <span className="text-sm text-muted-foreground">{completion}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
