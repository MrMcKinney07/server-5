import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Target,
  Users,
  Trophy,
  DollarSign,
  TrendingUp,
  Star,
  Phone,
  Mail,
  Calendar,
  Plus,
  Receipt,
  Crown,
  Shield,
  Flame,
  Zap,
  Award,
  Medal,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

const PRESTIGE_LEVELS = [
  { name: "Rookie", minPoints: 0, icon: Shield, color: "text-gray-500", bg: "bg-gray-100" },
  { name: "Rising Star", minPoints: 50, icon: Star, color: "text-blue-500", bg: "bg-blue-100" },
  { name: "Achiever", minPoints: 150, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-100" },
  { name: "Champion", minPoints: 300, icon: Award, color: "text-amber-500", bg: "bg-amber-100" },
  { name: "Elite", minPoints: 500, icon: Flame, color: "text-orange-500", bg: "bg-orange-100" },
  { name: "Legend", minPoints: 750, icon: Crown, color: "text-purple-500", bg: "bg-purple-100" },
  { name: "Grand Master", minPoints: 1000, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100" },
]

function getPrestigeLevel(points: number) {
  let level = PRESTIGE_LEVELS[0]
  for (const l of PRESTIGE_LEVELS) {
    if (points >= l.minPoints) level = l
  }
  return level
}

const MILESTONES = [
  { id: "first_mission", name: "First Steps", description: "Complete your first mission", requirement: 1, icon: Star },
  { id: "five_missions", name: "Getting Started", description: "Complete 5 missions", requirement: 5, icon: Zap },
  { id: "ten_missions", name: "Dedicated", description: "Complete 10 missions", requirement: 10, icon: Target },
  { id: "twentyfive_missions", name: "Consistent", description: "Complete 25 missions", requirement: 25, icon: Award },
  { id: "fifty_missions", name: "Mission Master", description: "Complete 50 missions", requirement: 50, icon: Medal },
  { id: "hundred_missions", name: "Centurion", description: "Complete 100 missions", requirement: 100, icon: Shield },
  {
    id: "fifty_points",
    name: "Rising Star",
    description: "Earn 50 points in a month",
    requirement: 50,
    icon: Star,
    type: "points",
  },
  {
    id: "hundred_points",
    name: "Point Hunter",
    description: "Earn 100 points in a month",
    requirement: 100,
    icon: Flame,
    type: "points",
  },
  {
    id: "threehundred_points",
    name: "High Scorer",
    description: "Earn 300 points in a month",
    requirement: 300,
    icon: Crown,
    type: "points",
  },
  {
    id: "fivehundred_points",
    name: "Elite Performer",
    description: "Earn 500 points in a month",
    requirement: 500,
    icon: Trophy,
    type: "points",
  },
]

export default async function DashboardPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  // Fetch real data
  const [{ count: leadsCount }, { data: todayMissions }, { data: recentActivities }, { data: monthlyLeaderboard }] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("agent_id", agent.id),
      supabase
        .from("agent_missions")
        .select("*, template:mission_templates(*)")
        .eq("agent_id", agent.id)
        .eq("mission_date", new Date().toISOString().split("T")[0])
        .order("created_at"),
      supabase
        .from("activities")
        .select("*")
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("agent_missions")
        .select("agent_id, points_earned, agents(Name)")
        .eq("status", "completed")
        .gte("mission_date", startOfMonth)
        .lte("mission_date", endOfMonth),
    ])

  const { count: totalCompletedMissions } = await supabase
    .from("agent_missions")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", agent.id)
    .eq("status", "completed")

  const leaderboardMap = new Map<string, { name: string; points: number }>()
  monthlyLeaderboard?.forEach((mission: any) => {
    const agentId = mission.agent_id
    const agentName = mission.agents?.Name || "Unknown"
    const points = mission.points_earned || 0

    if (leaderboardMap.has(agentId)) {
      const existing = leaderboardMap.get(agentId)!
      leaderboardMap.set(agentId, { name: agentName, points: existing.points + points })
    } else {
      leaderboardMap.set(agentId, { name: agentName, points })
    }
  })

  const sortedLeaderboard = Array.from(leaderboardMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)

  // Find current agent's rank
  const allRanked = Array.from(leaderboardMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.points - a.points)
  const myRank = allRanked.findIndex((a) => a.id === agent.id) + 1
  const myPoints = leaderboardMap.get(agent.id)?.points || 0

  const myPrestige = getPrestigeLevel(myPoints)
  const PrestigeIcon = myPrestige.icon

  const completedMissions = todayMissions?.filter((m) => m.status === "completed").length || 0
  const totalMissions = todayMissions?.length || 0

  const earnedAchievements = MILESTONES.filter((m) => {
    if (m.type === "points") return myPoints >= m.requirement
    return (totalCompletedMissions || 0) >= m.requirement
  })

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {agent.full_name || "Agent"}!</h1>
            <p className="text-white/80 mt-1">Your real estate command center</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur`}>
            <PrestigeIcon className="h-6 w-6" />
            <div>
              <p className="text-xs text-white/70">Monthly Rank</p>
              <p className="font-bold">{myPrestige.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{leadsCount || 0}</div>
            <Link href="/dashboard/leads" className="text-xs text-blue-500 hover:underline">
              View all leads
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Rank</CardTitle>
            <div className={`p-2 rounded-lg ${myPrestige.bg}`}>
              <PrestigeIcon className={`h-4 w-4 ${myPrestige.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${myPrestige.color}`}>{myRank > 0 ? `#${myRank}` : "--"}</div>
            <p className="text-xs text-muted-foreground">
              {myPoints} pts - {myPrestige.name}
            </p>
          </CardContent>
        </Card>

        <Link href="/dashboard/missions" className="block">
          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Missions</CardTitle>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {completedMissions}/{totalMissions}
              </div>
              <span className="text-xs text-amber-500 hover:underline">Click to view missions</span>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-l-4 border-l-rose-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Earnings</CardTitle>
            <div className="p-2 bg-rose-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">$0</div>
            <Link href="/dashboard/earnings" className="text-xs text-rose-500 hover:underline">
              View earnings
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Missions and Leaderboard */}
        <div className="space-y-6">
          {/* Today's Missions - Clickable */}
          <Link href="/dashboard/missions" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  Today's Missions
                  <span className="ml-auto text-sm font-normal text-amber-500">Click to manage →</span>
                </CardTitle>
                <CardDescription>Complete your daily missions to earn points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayMissions && todayMissions.length > 0 ? (
                  todayMissions.slice(0, 3).map((mission: any) => (
                    <div
                      key={mission.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        mission.status === "completed"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          mission.status === "completed" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {mission.status === "completed" ? "✓" : mission.template?.points || 10}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${mission.status === "completed" ? "line-through text-gray-500" : ""}`}
                        >
                          {mission.template?.title || "Mission"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{mission.template?.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No missions selected for today</p>
                    <p className="text-sm text-amber-500 font-medium">Click to select your 3 daily missions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-500" />
                Monthly Leaderboard
              </CardTitle>
              <CardDescription>Top performers this month (resets monthly)</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedLeaderboard.length > 0 ? (
                <div className="space-y-3">
                  {sortedLeaderboard.map((entry, index) => {
                    const prestige = getPrestigeLevel(entry.points)
                    const EntryIcon = prestige.icon
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          entry.id === agent.id ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-lg"
                              : index === 1
                                ? "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700 shadow"
                                : index === 2
                                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow"
                                  : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {index === 0 ? <Crown className="h-5 w-5" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${entry.id === agent.id ? "text-emerald-700" : ""}`}>
                            {entry.name} {entry.id === agent.id && "(You)"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <EntryIcon className={`h-3 w-3 ${prestige.color}`} />
                            <span>{prestige.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-emerald-600">{entry.points} pts</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No completed missions this month</p>
                  <p className="text-sm">Complete missions to get on the leaderboard!</p>
                </div>
              )}
              <Link
                href="/dashboard/rewards"
                className="block text-center text-sm text-emerald-600 hover:underline font-medium mt-4"
              >
                View Full Rewards Page →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions, Achievements, Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/leads"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Add Lead</span>
              </Link>
              <Link
                href="/dashboard/transactions"
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors"
              >
                <Receipt className="h-6 w-6" />
                <span className="text-sm font-medium">Transactions</span>
              </Link>
              <Link
                href="/dashboard/missions"
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors"
              >
                <Target className="h-6 w-6" />
                <span className="text-sm font-medium">View Missions</span>
              </Link>
              <Link
                href="/dashboard/earnings"
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors"
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-sm font-medium">Check Earnings</span>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                Achievements
              </CardTitle>
              <CardDescription>
                {earnedAchievements.length} of {MILESTONES.length} unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {MILESTONES.slice(0, 10).map((milestone) => {
                  const MilestoneIcon = milestone.icon
                  const isEarned = earnedAchievements.some((a) => a.id === milestone.id)
                  return (
                    <div
                      key={milestone.id}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 ${
                        isEarned
                          ? "bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300"
                          : "bg-gray-100 opacity-40"
                      }`}
                      title={`${milestone.name}: ${milestone.description}`}
                    >
                      <MilestoneIcon className={`h-5 w-5 ${isEarned ? "text-purple-600" : "text-gray-400"}`} />
                    </div>
                  )
                })}
              </div>
              <Link
                href="/dashboard/rewards"
                className="block text-center text-sm text-purple-600 hover:underline font-medium mt-4"
              >
                View All Achievements →
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities && recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          activity.activity_type === "call"
                            ? "bg-blue-100"
                            : activity.activity_type === "email"
                              ? "bg-emerald-100"
                              : activity.activity_type === "meeting"
                                ? "bg-amber-100"
                                : "bg-gray-100"
                        }`}
                      >
                        {activity.activity_type === "call" ? (
                          <Phone className="h-4 w-4 text-blue-600" />
                        ) : activity.activity_type === "email" ? (
                          <Mail className="h-4 w-4 text-emerald-600" />
                        ) : activity.activity_type === "meeting" ? (
                          <Calendar className="h-4 w-4 text-amber-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title || activity.description || "Activity"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start by adding a lead or completing a mission</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
