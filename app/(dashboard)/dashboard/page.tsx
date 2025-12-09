import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Home, DollarSign, TrendingUp, CheckCircle2, Star } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome to McKinney One</h1>
        <p className="text-white/80 mt-1">Your real estate command center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Listings</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Home className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">8</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500">+2</span> new this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">YTD GCI</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">$45.2K</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500">+18%</span> vs last year
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Missions</CardTitle>
            <div className="p-2 bg-rose-100 rounded-lg">
              <Target className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">2/3</div>
            <p className="text-xs text-muted-foreground mt-1">Complete today's missions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                icon: CheckCircle2,
                color: "text-emerald-500 bg-emerald-100",
                text: "Completed mission: Call 5 leads",
                time: "2h ago",
              },
              {
                icon: Users,
                color: "text-blue-500 bg-blue-100",
                text: "New lead assigned: John Smith",
                time: "4h ago",
              },
              {
                icon: DollarSign,
                color: "text-amber-500 bg-amber-100",
                text: "Commission received: $2,450",
                time: "1d ago",
              },
              { icon: Home, color: "text-rose-500 bg-rose-100", text: "Listing viewed: 123 Oak St", time: "2d ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color.split(" ")[1]}`}>
                  <item.icon className={`h-4 w-4 ${item.color.split(" ")[0]}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Lead", color: "bg-blue-500 hover:bg-blue-600", icon: Users },
              { label: "View Missions", color: "bg-amber-500 hover:bg-amber-600", icon: Target },
              { label: "Search Properties", color: "bg-emerald-500 hover:bg-emerald-600", icon: Home },
              { label: "Check Earnings", color: "bg-rose-500 hover:bg-rose-600", icon: DollarSign },
            ].map((action, i) => (
              <button
                key={i}
                className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors`}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
