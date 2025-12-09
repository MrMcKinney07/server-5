"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Star, Trophy, Zap, Medal, Target, CheckCircle } from "lucide-react"
import type { Agent } from "@/lib/types/database"

interface AgentXPData {
  total_xp: number
  monthly_xp: number
  level: number
  missions_completed: number
}

interface CompletedMission {
  points_earned: number
  completed_at: string | null
  template_id: string
  mission_templates: {
    title: string
    category: string
    points: number
  } | null
}

interface LeaderboardEntry {
  agent: {
    id: string
    Name: string
    Email: string
  }
  total_xp: number
}

interface RewardsDashboardProps {
  agent: Agent
  agentXP: AgentXPData
  completedMissions: CompletedMission[]
  xpLeaderboard: LeaderboardEntry[]
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000]

function calculateAchievements(missions: CompletedMission[], totalXP: number) {
  const achievements = []

  if (missions.length >= 1) {
    achievements.push({ name: "First Mission", description: "Complete your first mission", icon: Target })
  }
  if (missions.length >= 10) {
    achievements.push({ name: "Getting Started", description: "Complete 10 missions", icon: CheckCircle })
  }
  if (missions.length >= 50) {
    achievements.push({ name: "Mission Master", description: "Complete 50 missions", icon: Trophy })
  }
  if (missions.length >= 100) {
    achievements.push({ name: "Century Club", description: "Complete 100 missions", icon: Award })
  }
  if (totalXP >= 500) {
    achievements.push({ name: "XP Hunter", description: "Earn 500 XP", icon: Zap })
  }
  if (totalXP >= 1000) {
    achievements.push({ name: "XP Champion", description: "Earn 1000 XP", icon: Star })
  }

  return achievements
}

export function RewardsDashboard({ agent, agentXP, completedMissions, xpLeaderboard }: RewardsDashboardProps) {
  const currentXP = agentXP?.total_xp || 0
  const currentLevel = agentXP?.level || 1
  const nextLevelXP = LEVEL_THRESHOLDS[Math.min(currentLevel, LEVEL_THRESHOLDS.length - 1)] || 5000
  const prevLevelXP = LEVEL_THRESHOLDS[Math.max(0, currentLevel - 1)] || 0
  const progressToNextLevel =
    nextLevelXP > prevLevelXP ? ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100 : 100

  const achievements = calculateAchievements(completedMissions || [], currentXP)

  // Group missions by category for stats
  const missionsByCategory = (completedMissions || []).reduce(
    (acc, m) => {
      const category = m.mission_templates?.category || "general"
      acc[category] = (acc[category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      {/* XP & Level Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentLevel}</div>
            <Progress value={progressToNextLevel} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {currentXP} / {nextLevelXP} XP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly XP</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(agentXP?.monthly_xp || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Missions Done</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentXP?.missions_completed || 0}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="achievements">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history">Mission History</TabsTrigger>
          <TabsTrigger value="leaderboard">XP Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>Badges earned through your hard work</CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Complete missions to earn your first achievement!
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.name}
                      className="flex flex-col items-center p-4 rounded-lg border bg-gradient-to-b from-yellow-50 to-transparent dark:from-yellow-950/20"
                    >
                      <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center mb-2">
                        <achievement.icon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <span className="font-medium text-sm text-center">{achievement.name}</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">{achievement.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mission Stats by Category */}
          {Object.keys(missionsByCategory).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Mission Stats</CardTitle>
                <CardDescription>Missions completed by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(missionsByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="capitalize font-medium">{category}</span>
                      <Badge variant="secondary">{count} completed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Missions</CardTitle>
              <CardDescription>Your completed mission history</CardDescription>
            </CardHeader>
            <CardContent>
              {(completedMissions || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No completed missions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mission</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">XP Earned</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(completedMissions || []).slice(0, 20).map((mission, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{mission.mission_templates?.title || "Mission"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {mission.mission_templates?.category || "general"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">+{mission.points_earned} XP</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {mission.completed_at ? new Date(mission.completed_at).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>XP Leaderboard</CardTitle>
              <CardDescription>Top agents by total XP</CardDescription>
            </CardHeader>
            <CardContent>
              {(xpLeaderboard || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No leaderboard data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Total XP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(xpLeaderboard || []).map((entry, index) => {
                      const isCurrentUser = entry.agent?.id === agent.id
                      return (
                        <TableRow key={entry.agent?.id || index} className={isCurrentUser ? "bg-muted/50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {index === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                              {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                              {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                              {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.agent?.Name || "Unknown Agent"}
                            {isCurrentUser && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{entry.total_xp.toLocaleString()} XP</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
