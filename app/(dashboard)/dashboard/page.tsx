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
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { LeadActionsWidget } from "@/components/dashboard/lead-actions-widget"
import { OfficeLeaderboardHero } from "@/components/dashboard/office-leaderboard-hero"
import { UserBadgeName } from "@/components/prestige/user-badge-name"
import { getPrestigeTierInfo } from "@/lib/xp-constants"
import { HustleStreakBadge } from "@/components/dashboard/hustle-streak-badge"

const PRESTIGE_LEVELS = [
  {
    name: "Bronze",
    minPoints: 0,
    icon: Shield,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  {
    name: "Silver",
    minPoints: 150,
    icon: Star,
    color: "text-slate-500",
    bg: "bg-slate-50",
  },
  {
    name: "Gold",
    minPoints: 350,
    icon: Trophy,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    name: "Platinum",
    minPoints: 600,
    icon: Crown,
    color: "text-cyan-400",
    bg: "bg-cyan-50",
  },
]

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

function getPrestigeLevel(points: number) {
  let level = PRESTIGE_LEVELS[0]
  for (const l of PRESTIGE_LEVELS) {
    if (points >= l.minPoints) level = l
  }
  return level
}

function getPrestigeTier(lifetimeXP: number) {
  // Prestige levels: Bronze 1-9 (0-90), Silver 10-24 (100-240), Gold 25-49 (250-490), etc.
  // Each level = 10 XP
  const levelIndex = Math.floor(lifetimeXP / 10)
  const level = PRESTIGE_LEVELS.find((l) => levelIndex >= l.minPoints / 10) || PRESTIGE_LEVELS[0]
  return { levelIndex, level }
}

export default async function DashboardPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthYear = `${year}-${String(month).padStart(2, "0")}`
  const today = new Date().toISOString().split("T")[0]

  const [
    { count: leadsCount },
    { data: todayMissionSet },
    { data: recentActivities },
    monthlyRankingsResponse,
    { data: knowledgeArticles },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("agent_id", agent.id),
    supabase
      .from("daily_mission_sets")
      .select(`
        id,
        mission_date,
        daily_mission_items(
          id,
          status,
          completed_at,
          mission_templates(id, title, description, xp_reward)
        )
      `)
      .eq("user_id", agent.id)
      .eq("mission_date", today)
      .maybeSingle(),
    supabase.from("activities").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(5),
    supabase
      .from("monthly_agent_stats")
      .select(`
        agent_id,
        total_xp_earned,
        missions_completed,
        rank,
        agents(Name, lifetime_xp, profile_picture_url)
      `)
      .eq("month_year", monthYear)
      .order("rank", { ascending: true })
      .limit(10),
    supabase
      .from("knowledge_articles")
      .select("id, title, category, content")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  const { data: monthlyRankings } = monthlyRankingsResponse
  const { count: totalCompletedMissions } = await supabase
    .from("daily_mission_items")
    .select("*, daily_mission_sets!inner(user_id)", { count: "exact", head: true })
    .eq("daily_mission_sets.user_id", agent.id)
    .eq("status", "completed")

  let leaderboardData = monthlyRankings || []
  if (!leaderboardData || leaderboardData.length === 0) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]

    const { data: missionStats } = await supabase
      .from("daily_mission_items")
      .select(`
        mission_templates(xp_reward),
        daily_mission_sets!inner(
          user_id,
          mission_date,
          agents(Name, lifetime_xp, profile_picture_url)
        )
      `)
      .eq("status", "completed")
      .gte("daily_mission_sets.mission_date", startOfMonth)
      .lte("daily_mission_sets.mission_date", endOfMonth)

    const agentStats = new Map()
    missionStats?.forEach((item: any) => {
      const userId = item.daily_mission_sets.user_id
      const xp = item.mission_templates?.xp_reward || 0
      const name = item.daily_mission_sets.agents?.Name || "Unknown"
      const lifetimeXp = item.daily_mission_sets.agents?.lifetime_xp || 0
      const profilePicture = item.daily_mission_sets.agents?.profile_picture_url || null

      if (!agentStats.has(userId)) {
        agentStats.set(userId, {
          agent_id: userId,
          total_xp_earned: 0,
          missions_completed: 0,
          name,
          lifetimeXp,
          profilePicture,
        })
      }
      const stats = agentStats.get(userId)
      stats.total_xp_earned += xp
      stats.missions_completed += 1
    })

    leaderboardData = Array.from(agentStats.values())
      .sort((a, b) => b.total_xp_earned - a.total_xp_earned)
      .slice(0, 10)
      .map((stat, index) => ({
        agent_id: stat.agent_id,
        total_xp_earned: stat.total_xp_earned,
        missions_completed: stat.missions_completed,
        rank: index + 1,
        agents: { Name: stat.name, lifetime_xp: stat.lifetimeXp, profile_picture_url: stat.profilePicture },
      }))
  }

  const sortedLeaderboard = leaderboardData.map((entry) => ({
    id: entry.agent_id,
    name: entry.agents?.Name || `Agent ${entry.agent_id?.slice(0, 6) || "Unknown"}`,
    points: entry.total_xp_earned,
    level: getPrestigeTier(entry.agents?.lifetime_xp || 1).level,
    profilePicture: entry.agents?.profile_picture_url || null,
  }))

  const { data: myMonthlyStats } = await supabase
    .from("monthly_agent_stats")
    .select("rank, total_xp_earned")
    .eq("agent_id", agent.id)
    .eq("month_year", monthYear)
    .maybeSingle()

  const myRank = myMonthlyStats?.rank || 0
  const myPoints = myMonthlyStats?.total_xp_earned || 0

  const myPrestige = getPrestigeLevel(myPoints)
  const PrestigeIcon = myPrestige.icon
  const prestigeTierInfo = getPrestigeTierInfo(agent.lifetime_xp || 0)

  const completedMissions =
    todayMissionSet?.daily_mission_items?.filter((m: any) => m.status === "completed").length || 0
  const totalMissions = todayMissionSet?.daily_mission_items?.length || 0

  const earnedAchievements = MILESTONES.filter((m) => {
    if (m.type === "points") return myPoints >= m.requirement
    return (totalCompletedMissions || 0) >= m.requirement
  })

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserBadgeName
              name={agent.full_name || "Agent"}
              prestigeTier={agent.lifetime_xp || 0}
              size="lg"
              showName={false}
            />
            <div>
              <h1 className="text-xl font-bold">Welcome back, {agent.full_name || "Agent"}!</h1>
              <p className="text-white/70 text-sm">Your real estate command center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Hustle Streak Badge */}
            <HustleStreakBadge />
            <div className="text-right">
              <p className="text-xs text-white/60">Prestige Level</p>
              <p className="font-bold text-sm text-cyan-400">{prestigeTierInfo.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Monthly Rank</p>
              <p className="font-bold text-sm text-amber-400">{myRank > 0 ? `#${myRank}` : "--"}</p>
            </div>
          </div>
        </div>
      </div>

      <OfficeLeaderboardHero
        leaderboard={sortedLeaderboard}
        currentUserId={agent.id}
        currentUserRank={myRank}
        currentUserPoints={myPoints}
      />

      <Link href="/dashboard/missions" className="block">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Today's Missions
              <span className="ml-auto text-sm font-normal text-amber-500">Click to manage</span>
            </CardTitle>
            <CardDescription>Complete your daily missions to earn points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayMissionSet && todayMissionSet.daily_mission_items.length > 0 ? (
              todayMissionSet.daily_mission_items.slice(0, 3).map((mission: any) => (
                <div
                  key={mission.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    mission.status === "completed" ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      mission.status === "completed" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {mission.status === "completed" ? "✓" : mission.mission_templates?.xp_reward || 10}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${mission.status === "completed" ? "line-through text-gray-500" : ""}`}>
                      {mission.mission_templates?.title || "Mission"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {mission.mission_templates?.description}
                    </p>
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

      <LeadActionsWidget agentId={agent.id} />

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
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
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
            View All Achievements
          </Link>
        </CardContent>
      </Card>

      {/* Knowledge Base Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Knowledge Base
          </CardTitle>
          <CardDescription>Training materials and best practices</CardDescription>
        </CardHeader>
        <CardContent>
          {knowledgeArticles && knowledgeArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {knowledgeArticles.map((article: any) => {
                const categoryLabels: Record<string, string> = {
                  lead_handling: "Lead Handling",
                  listings: "Listings",
                  transactions: "Transactions",
                  open_house: "Open Houses",
                  training: "Training",
                  general: "General",
                }
                return (
                  <Link
                    key={article.id}
                    href={`/dashboard/knowledge/${article.id}`}
                    className="block p-3 rounded-lg border hover:shadow-md hover:border-blue-200 transition-all bg-gradient-to-br from-white to-blue-50/50"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{article.content?.substring(0, 80)}...</p>
                    <span className="inline-block mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {categoryLabels[article.category] || article.category}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No articles available yet</p>
            </div>
          )}
          <Link
            href="/dashboard/knowledge"
            className="block text-center text-sm text-blue-600 hover:underline font-medium mt-4"
          >
            Browse All Articles
          </Link>
        </CardContent>
      </Card>

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
                {recentActivities.map((activity: any) => {
                  const Icon =
                    activity.type === "call"
                      ? Phone
                      : activity.type === "email"
                        ? Mail
                        : activity.type === "meeting"
                          ? Calendar
                          : TrendingUp
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === "call"
                            ? "bg-blue-100 text-blue-600"
                            : activity.type === "email"
                              ? "bg-emerald-100 text-emerald-600"
                              : activity.type === "meeting"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{activity.description || activity.notes}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
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
  )
}
