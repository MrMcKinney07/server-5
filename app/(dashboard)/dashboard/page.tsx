import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Home, DollarSign, TrendingUp, Star, Phone, Mail, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function DashboardPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  // Fetch real data
  const [{ count: leadsCount }, { count: contactsCount }, { data: todayMissions }, { data: recentActivities }] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("agent_id", agent.id),
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("agent_id", agent.id),
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
    ])

  const completedMissions = todayMissions?.filter((m) => m.status === "completed").length || 0
  const totalMissions = todayMissions?.length || 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {agent.full_name || "Agent"}!</h1>
        <p className="text-white/80 mt-1">Your real estate command center</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Home className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{contactsCount || 0}</div>
            <Link href="/dashboard/contacts" className="text-xs text-emerald-500 hover:underline">
              View all contacts
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
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
            <Link href="/dashboard/missions" className="text-xs text-amber-500 hover:underline">
              View missions
            </Link>
          </CardContent>
        </Card>

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
        {/* Today's Missions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Today's Missions
            </CardTitle>
            <CardDescription>Complete your daily missions to earn points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayMissions && todayMissions.length > 0 ? (
              todayMissions.map((mission: any) => (
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
                    {mission.status === "completed" ? "✓" : mission.template?.points || 10}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${mission.status === "completed" ? "line-through text-gray-500" : ""}`}>
                      {mission.template?.title || "Mission"}
                    </p>
                    <p className="text-xs text-muted-foreground">{mission.template?.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No missions assigned for today</p>
                <p className="text-sm">Check back tomorrow or contact your admin</p>
              </div>
            )}
            <Link
              href="/dashboard/missions"
              className="block text-center text-sm text-amber-600 hover:underline font-medium mt-2"
            >
              Go to Missions Page →
            </Link>
          </CardContent>
        </Card>

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
              href="/dashboard/contacts"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Add Contact</span>
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
        <Card className="lg:col-span-2">
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
                      <p className="text-sm font-medium">{activity.subject || activity.description || "Activity"}</p>
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
                <p className="text-sm">Start by adding a contact or completing a mission</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
