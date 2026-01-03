import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Target, TrendingUp, DollarSign } from "lucide-react"
import { AllLeadsTable } from "@/components/admin/all-leads-table"
import { BrokerAnalytics } from "@/components/admin/broker-analytics"
import { ExportTools } from "@/components/admin/export-tools"
import { ImportLeadsTool } from "@/components/admin/import-leads-tool"

export default async function BrokerToolsPage() {
  const agent = await requireAdmin()

  if (agent.role !== "broker") {
    redirect("/dashboard/admin")
  }

  const supabase = await createClient()

  // Fetch all leads with agent info
  const { data: allLeads } = await supabase
    .from("leads")
    .select("*, agent:agents(id, Name, Email)")
    .order("created_at", { ascending: false })

  // Fetch all transactions
  const { data: allTransactions } = await supabase
    .from("transactions")
    .select("*, agent:agents(id, Name, Email)")
    .order("created_at", { ascending: false })

  const { data: allAgents } = await supabase.from("agents").select("id, Name, Email, Role, lifetime_xp").order("Name")

  // Fetch all missions for this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const { data: monthMissions } = await supabase
    .from("daily_mission_sets")
    .select(`
      *,
      agent:agents(id, Name, Email),
      daily_mission_items(
        *,
        mission_templates(title, xp_reward)
      )
    `)
    .gte("mission_date", startOfMonth.toISOString().split("T")[0])

  const totalLeads = allLeads?.length || 0
  const newLeads = allLeads?.filter((l) => l.status === "new").length || 0
  const closedLeads = allLeads?.filter((l) => l.status === "closed_won").length || 0
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0

  const totalVolume =
    allTransactions?.filter((t) => t.status === "closed").reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0) || 0

  const totalGCI =
    allTransactions
      ?.filter((t) => t.status === "closed")
      .reduce((sum, t) => sum + (Number(t.gross_commission) || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Broker Tools</h1>
            <p className="text-white/80">Full access to all leads, analytics, and export tools</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allAgents?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">{newLeads} new</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalVolume / 1000000).toFixed(1)}M</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total GCI</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalGCI / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="leads">All Leads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>All Team Leads</CardTitle>
              <CardDescription>View and manage leads across all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <AllLeadsTable leads={allLeads || []} agents={allAgents || []} adminId={agent.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <BrokerAnalytics
            agents={allAgents || []}
            leads={allLeads || []}
            transactions={allTransactions || []}
            missions={monthMissions || []}
          />
        </TabsContent>

        <TabsContent value="export">
          <ExportTools leads={allLeads || []} transactions={allTransactions || []} agents={allAgents || []} />
        </TabsContent>

        <TabsContent value="import">
          <ImportLeadsTool agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
