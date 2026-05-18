import { createClient, createServiceClient } from "@/lib/supabase/server"
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
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { LeadPipelineWidget } from "@/components/leads/lead-pipeline-widget"
import { OfficeLeaderboardHero } from "@/components/dashboard/office-leaderboard-hero"
import { UserBadgeName } from "@/components/prestige/user-badge-name"
import { getPrestigeTierInfo } from "@/lib/xp-constants"
import { HustleStreakBadge } from "@/components/dashboard/hustle-streak-badge"
import { DashboardCalendar, type CalendarEvent } from "@/components/dashboard/dashboard-calendar"
import { RecommendedVideos } from "@/components/knowledge/recommended-videos"

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

  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0]
  const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString().split("T")[0]

  const [
    { count: leadsCount },
    { data: todayMissionSet },
    { data: recentActivities },
    monthlyRankingsResponse,
    { data: knowledgeArticles },
    { data: appointmentNotifs },
    { data: upcomingClosings },
    { data: recommendedVideos },
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
    // Appointment notifications with a scheduled_at in metadata
    supabase
      .from("agent_notifications")
      .select("id, title, metadata, created_at")
      .eq("agent_id", agent.id)
      .eq("type", "appointment")
      .order("created_at", { ascending: false })
      .limit(30),
    // Upcoming closings from executed_contracts
    supabase
      .from("executed_contracts")
      .select("id, property_address, expected_closing_date")
      .eq("agent_id", agent.id)
      .gte("expected_closing_date", threeMonthsAgo)
      .lte("expected_closing_date", threeMonthsAhead)
      .not("expected_closing_date", "is", null),
    // Recommended videos
    supabase
      .from("recommended_videos")
      .select("id, title, youtube_url, description, category, sort_order")
      .order("sort_order", { ascending: true })
      .limit(8),
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
    points: entry.total_xp_earned || 0,
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

  // Quarterly closer leaderboard — bypass RLS with service client
  const serviceClient = createServiceClient()
  const quarterStartMonth = Math.floor((now.getMonth()) / 3) * 3 // 0, 3, 6, or 9
  const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split("T")[0]
  const endOfQuarter = new Date(now.getFullYear(), quarterStartMonth + 3, 0).toISOString().split("T")[0]
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1

  // Listing leaderboard — listing agreements uploaded this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const { data: listingUploads } = await serviceClient
    .from("contract_documents")
    .select(`
      contract_id,
      uploaded_at,
      executed_contracts!inner(agent_id, agents("Name", profile_picture_url))
    `)
    .eq("document_key", "listing_agreement")
    .not("uploaded_at", "is", null)
    .gte("uploaded_at", startOfMonth)
    .lte("uploaded_at", endOfMonth + "T23:59:59")

  const listingMap = new Map<string, { name: string; profilePicture: string | null; listingCount: number }>()
  listingUploads?.forEach((row: any) => {
    const agentId = row.executed_contracts?.agent_id
    if (!agentId) return
    const name = (row.executed_contracts?.agents as any)?.Name || "Unknown"
    const pic = (row.executed_contracts?.agents as any)?.profile_picture_url || null
    if (!listingMap.has(agentId)) listingMap.set(agentId, { name, profilePicture: pic, listingCount: 0 })
    listingMap.get(agentId)!.listingCount += 1
  })

  const sortedListings = Array.from(listingMap.entries())
    .map(([agentId, data]) => ({ agentId, ...data, isCurrentUser: agentId === agent.id }))
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 10)

  const [{ data: closedContracts }, { data: closedTransactions }] = await Promise.all([
    serviceClient
      .from("executed_contracts")
      .select("agent_id, sale_price, agents(Name, profile_picture_url)")
      .eq("status", "closed")
      .gte("contract_date", startOfQuarter)
      .lte("contract_date", endOfQuarter),
    serviceClient
      .from("transactions")
      .select("agent_id, sale_price, agents(Name, profile_picture_url)")
      .eq("status", "closed")
      .gte("contract_date", startOfQuarter)
      .lte("contract_date", endOfQuarter),
  ])

  const closerMap = new Map<string, { name: string; profilePicture: string | null; closedCount: number; closedVolume: number }>()
  const processClosing = (row: any) => {
    const id = row.agent_id
    if (!id) return
    const agentName = (row.agents as any)?.Name || "Unknown"
    const pic = (row.agents as any)?.profile_picture_url || null
    const price = Number(row.sale_price) || 0
    if (!closerMap.has(id)) {
      closerMap.set(id, { name: agentName, profilePicture: pic, closedCount: 0, closedVolume: 0 })
    }
    const entry = closerMap.get(id)!
    entry.closedCount += 1
    entry.closedVolume += price
    if (!entry.profilePicture && pic) entry.profilePicture = pic
  }
  closedContracts?.forEach(processClosing)
  closedTransactions?.forEach(processClosing)
  const sortedClosers = Array.from(closerMap.entries())
    .map(([agentId, data]) => ({ agentId, ...data, isCurrentUser: agentId === agent.id }))
    .sort((a, b) => b.closedCount !== a.closedCount ? b.closedCount - a.closedCount : b.closedVolume - a.closedVolume)
    .slice(0, 10)

  // Build calendar events
  const calendarEvents: CalendarEvent[] = []
  appointmentNotifs?.forEach((n) => {
    const dt = n.metadata?.event_start_time || n.metadata?.scheduled_at || n.created_at
    calendarEvents.push({
      id: n.id,
      type: "appointment",
      title: n.title || "Appointment",
      date: new Date(dt),
      link: "/dashboard/calendar",
    })
  })
  upcomingClosings?.forEach((c) => {
    calendarEvents.push({
      id: c.id,
      type: "closing",
      title: c.property_address || "Closing",
      date: new Date(c.expected_closing_date),
      link: "/dashboard/transactions",
    })
  })

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
      {/* Welcome header */}
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

      {/* ROW 1: Today's Missions */}
      <Link href="/dashboard/missions" className="block">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-amber-500" />
                {"Today's Missions"}
                {totalMissions > 0 && (
                  <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${
                    completedMissions === totalMissions
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {completedMissions}/{totalMissions} done
                  </span>
                )}
              </CardTitle>
              <span className="text-xs text-amber-500 font-medium">Manage missions</span>
            </div>
          </CardHeader>
          <CardContent>
            {todayMissionSet && todayMissionSet.daily_mission_items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {todayMissionSet.daily_mission_items.slice(0, 3).map((mission: any, index: number) => (
                  <div
                    key={mission.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      mission.status === "completed"
                        ? "bg-emerald-500/8 border-emerald-200 dark:border-emerald-900/40"
                        : "bg-amber-500/5 border-amber-200 dark:border-amber-900/30"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      mission.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500/20 text-amber-600"
                    }`}>
                      {mission.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        mission.status === "completed" ? "line-through text-muted-foreground" : ""
                      }`}>
                        {mission.mission_templates?.title || "Mission"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{mission.mission_templates?.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No missions selected for today</p>
                <p className="text-sm text-amber-500 font-medium mt-1">Click to select your 3 daily missions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* ROW 2: Lead Pipeline (left) + Calendar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <LeadPipelineWidget agentId={agent.id} />
        <DashboardCalendar events={calendarEvents} agentId={agent.id} />
      </div>

      {/* ROW 3: Office leaderboard */}
      <OfficeLeaderboardHero
        leaderboard={sortedLeaderboard}
        currentUserId={agent.id}
        currentUserRank={myRank}
        currentUserPoints={myPoints}
      />

      {/* ROW 4: Achievement bar */}
      {earnedAchievements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-amber-500" />
                Achievements
                <span className="text-xs font-normal text-muted-foreground">
                  {earnedAchievements.length}/{MILESTONES.length} unlocked
                </span>
              </CardTitle>
              <Link href="/dashboard/prestige" className="text-xs text-amber-500 font-medium hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {MILESTONES.map((milestone) => {
                const isEarned = earnedAchievements.some((a) => a.id === milestone.id)
                const Icon = milestone.icon
                return (
                  <div
                    key={milestone.id}
                    title={`${milestone.name}: ${milestone.description}`}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all w-[72px] ${
                      isEarned
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                        : "bg-muted/40 border-border opacity-40 grayscale"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isEarned ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-medium text-center leading-tight line-clamp-2">{milestone.name}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROW 3b: Knowledge video showcase */}
      {(recommendedVideos ?? []).length > 0 && (
        <RecommendedVideos
          videos={recommendedVideos ?? []}
          agentId={agent.id}
          isBroker={agent.role === "broker" || agent.role === "admin"}
        />
      )}


    </div>
  )
}
