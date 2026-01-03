import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, Target, Users, CheckCircle, TrendingUp, Gift } from "lucide-react"
import Link from "next/link"
import { MissionTemplatesManager } from "@/components/admin/mission-templates-manager"
import { AgentLeaderboard } from "@/components/admin/agent-leaderboard"

export default async function AdminDashboardPage() {
  const agent = await requireAdmin()
  const supabase = await createClient()
  const isBroker = agent.role === "broker"

  const today = new Date().toISOString().split("T")[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const startOfMonth = new Date()
  startOfMonth.setDate(1)

  // Fetch mission stats for today
  const [{ data: todayMissionSets }, { data: allAgents }, { data: missionTemplates }, { data: weekMissionSets }] =
    await Promise.all([
      supabase.from("daily_mission_sets").select("*, daily_mission_items(*)").eq("mission_date", today),
      supabase.from("agents").select("*"),
      supabase.from("mission_templates").select("*").eq("is_active", true).order("category"),
      supabase
        .from("daily_mission_sets")
        .select(`
          *,
          agent:agents(id, Name, Email),
          daily_mission_items(*, mission_templates(xp_reward))
        `)
        .gte("mission_date", startOfWeek.toISOString().split("T")[0]),
    ])

  const totalTodayMissions =
    todayMissionSets?.reduce((sum, set) => sum + (set.daily_mission_items?.length || 0), 0) || 0
  const completedTodayMissions =
    todayMissionSets?.reduce(
      (sum, set) => sum + (set.daily_mission_items?.filter((item: any) => item.status === "completed").length || 0),
      0,
    ) || 0
  const completionRate = totalTodayMissions > 0 ? Math.round((completedTodayMissions / totalTodayMissions) * 100) : 0

  const agentStats = new Map<string, { name: string; email: string; completed: number; points: number }>()

  weekMissionSets?.forEach((set) => {
    const completedItems = set.daily_mission_items?.filter((item: any) => item.status === "completed") || []
    if (completedItems.length > 0 && set.agent) {
      const agentId = set.user_id
      const current = agentStats.get(agentId) || {
        name: (set.agent as { Name?: string })?.Name || "Unknown",
        email: (set.agent as { Email?: string })?.Email || "",
        completed: 0,
        points: 0,
      }
      current.completed += completedItems.length
      current.points += completedItems.reduce(
        (sum: number, item: any) => sum + (item.mission_templates?.xp_reward || 0),
        0,
      )
      agentStats.set(agentId, current)
    }
  })

  const leaderboard = Array.from(agentStats.entries())
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-white/80">
              {isBroker ? "Broker Dashboard - Full Access" : "Admin Dashboard - Manage Missions & View Stats"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allAgents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Missions Today</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTodayMissions}</div>
            <p className="text-xs text-muted-foreground">Assigned to agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{completedTodayMissions}</div>
            <p className="text-xs text-muted-foreground">Missions finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Admin Navigation */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/admin/missions">
          <Card className="hover:border-amber-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Mission Management
              </CardTitle>
              <CardDescription>Create, edit, and assign mission templates</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/admin/agents">
          <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Agent Management
              </CardTitle>
              <CardDescription>View and manage agent accounts and roles</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/prizes">
          <Card className="hover:border-purple-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-500" />
                Prizes & Rewards
              </CardTitle>
              <CardDescription>Manage redeemable prizes for agents</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {isBroker && (
          <Link href="/dashboard/admin/broker">
            <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  Broker Tools
                </CardTitle>
                <CardDescription>All leads, analytics, and export tools</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mission Templates Manager */}
        <MissionTemplatesManager templates={missionTemplates || []} />

        {/* Agent Leaderboard */}
        <AgentLeaderboard leaderboard={leaderboard} title="This Week's Top Performers" />
      </div>
    </div>
  )
}
