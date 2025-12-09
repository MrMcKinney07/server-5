"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Star, Trophy, Ticket, Zap, Medal, Lock } from "lucide-react"
import type {
  Agent,
  AgentXP,
  AgentBadgeWithDetails,
  Badge as BadgeType,
  Competition,
  CompetitionEntryWithDetails,
} from "@/lib/types/database"

interface RewardsDashboardProps {
  agent: Agent
  agentXP: AgentXP | null
  agentBadges: AgentBadgeWithDetails[]
  allBadges: BadgeType[]
  activeCompetitions: Competition[]
  competitionEntries: CompetitionEntryWithDetails[]
  xpLeaderboard: (AgentXP & { agent?: Agent })[]
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000]

export function RewardsDashboard({
  agent,
  agentXP,
  agentBadges,
  allBadges,
  activeCompetitions,
  competitionEntries,
  xpLeaderboard,
}: RewardsDashboardProps) {
  const currentXP = agentXP?.total_xp || 0
  const currentLevel = agentXP?.level || 1
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const prevLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0
  const progressToNextLevel = ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100

  const earnedBadgeIds = agentBadges.map((ab) => ab.badge_id)
  const unearnedBadges = allBadges.filter((b) => !earnedBadgeIds.includes(b.id))

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
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentBadges.length}</div>
            <p className="text-xs text-muted-foreground">of {allBadges.length} available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Raffle Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentXP?.raffle_tickets || 0}</div>
            <p className="text-xs text-muted-foreground">Available for drawings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="badges">
        <TabsList>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          <TabsTrigger value="leaderboard">XP Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-6">
          <div className="space-y-6">
            {agentBadges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Earned Badges</CardTitle>
                  <CardDescription>Your achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {agentBadges.map((ab) => (
                      <div
                        key={ab.id}
                        className="flex flex-col items-center p-4 rounded-lg border bg-gradient-to-b from-yellow-50 to-transparent dark:from-yellow-950/20"
                      >
                        <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center mb-2">
                          <Trophy className="h-6 w-6 text-yellow-600" />
                        </div>
                        <span className="font-medium text-sm text-center">{ab.badge?.name}</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">{ab.badge?.description}</span>
                        <Badge variant="secondary" className="mt-2">
                          +{ab.badge?.xp_reward} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Available Badges</CardTitle>
                <CardDescription>Badges you can still earn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {unearnedBadges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center p-4 rounded-lg border opacity-60">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm text-center">{badge.name}</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">{badge.description}</span>
                      <Badge variant="outline" className="mt-2">
                        +{badge.xp_reward} XP
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Competitions</CardTitle>
              <CardDescription>Current challenges you can participate in</CardDescription>
            </CardHeader>
            <CardContent>
              {activeCompetitions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active competitions right now</p>
              ) : (
                <div className="space-y-4">
                  {activeCompetitions.map((comp) => {
                    const entry = competitionEntries.find((e) => e.competition_id === comp.id)
                    return (
                      <div key={comp.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{comp.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{comp.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(comp.start_date).toLocaleDateString()} -{" "}
                              {new Date(comp.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            {entry ? (
                              <>
                                <div className="text-2xl font-bold">{entry.score}</div>
                                <p className="text-xs text-muted-foreground">Your Score</p>
                                {entry.rank && <Badge className="mt-1">Rank #{entry.rank}</Badge>}
                              </>
                            ) : (
                              <Badge variant="outline">Not Entered</Badge>
                            )}
                          </div>
                        </div>
                        {comp.prize_description && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">Prize:</span> {comp.prize_description}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Level</TableHead>
                    <TableHead className="text-right">Total XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {xpLeaderboard.map((entry, index) => {
                    const isCurrentUser = entry.agent_id === agent.id
                    return (
                      <TableRow key={entry.id} className={isCurrentUser ? "bg-muted/50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                            {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                            {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                            {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.agent?.full_name}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">Lv. {entry.level}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{entry.total_xp.toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
