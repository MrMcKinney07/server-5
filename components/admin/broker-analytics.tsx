"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, Target, TrendingUp, Award } from "lucide-react"

interface Agent {
  id: string
  Name: string
  Email: string
  Role: string
}

interface Lead {
  id: string
  status: string
  agent_id: string
  created_at: string
}

interface Transaction {
  id: string
  status: string
  sale_price: number
  gross_commission: number
  agent_id: string
}

interface Mission {
  id: string
  status: string
  agent_id: string
  points_earned: number
  agent?: { id: string; Name: string }
}

interface Props {
  agents: Agent[]
  leads: Lead[]
  transactions: Transaction[]
  missions: Mission[]
}

export function BrokerAnalytics({ agents, leads, transactions, missions }: Props) {
  // Calculate per-agent stats
  const agentStats = agents.map((agent) => {
    const agentLeads = leads.filter((l) => l.agent_id === agent.id)
    const agentTransactions = transactions.filter((t) => t.agent_id === agent.id)
    const agentMissions = missions.filter((m) => m.agent_id === agent.id)

    const totalLeads = agentLeads.length
    const closedLeads = agentLeads.filter((l) => l.status === "closed_won").length
    const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0

    const closedTransactions = agentTransactions.filter((t) => t.status === "closed")
    const totalVolume = closedTransactions.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0)
    const totalGCI = closedTransactions.reduce((sum, t) => sum + (Number(t.gross_commission) || 0), 0)

    const completedMissions = agentMissions.filter((m) => m.status === "completed").length
    const totalPoints = agentMissions.reduce((sum, m) => sum + (m.points_earned || 0), 0)

    return {
      ...agent,
      totalLeads,
      closedLeads,
      conversionRate,
      totalVolume,
      totalGCI,
      completedMissions,
      totalPoints,
    }
  })

  // Sort by GCI for top performers
  const topByGCI = [...agentStats].sort((a, b) => b.totalGCI - a.totalGCI).slice(0, 5)
  const topByMissions = [...agentStats].sort((a, b) => b.completedMissions - a.completedMissions).slice(0, 5)
  const topByLeads = [...agentStats].sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 5)

  // Lead status distribution
  const statusCounts = {
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    active: leads.filter((l) => l.status === "active" || l.status === "nurturing").length,
    closed_won: leads.filter((l) => l.status === "closed_won").length,
    closed_lost: leads.filter((l) => l.status === "closed_lost").length,
  }

  const maxStatus = Math.max(...Object.values(statusCounts))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top Performers by GCI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Top Performers by GCI
          </CardTitle>
          <CardDescription>Year-to-date gross commission income</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topByGCI.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{agent.Name}</p>
                  <p className="text-sm text-muted-foreground">{agent.closedLeads} closings</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">${(agent.totalGCI / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-muted-foreground">${(agent.totalVolume / 1000000).toFixed(2)}M vol</p>
                </div>
              </div>
            ))}
            {topByGCI.length === 0 && <p className="text-center text-muted-foreground py-4">No transactions yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* Top by Mission Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Top Mission Performers
          </CardTitle>
          <CardDescription>This month's mission completion leaders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topByMissions.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{agent.Name}</p>
                  <p className="text-sm text-muted-foreground">{agent.totalPoints} points</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{agent.completedMissions}</p>
                  <p className="text-xs text-muted-foreground">missions</p>
                </div>
              </div>
            ))}
            {topByMissions.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No missions completed yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lead Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Lead Pipeline
          </CardTitle>
          <CardDescription>Distribution of leads by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{status.replace("_", " ")}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <Progress value={maxStatus > 0 ? (count / maxStatus) * 100 : 0} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Agent Lead Activity
          </CardTitle>
          <CardDescription>Leads assigned per agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topByLeads.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{agent.Name}</p>
                  <p className="text-sm text-muted-foreground">{agent.conversionRate}% conversion</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{agent.totalLeads}</p>
                  <p className="text-xs text-muted-foreground">leads</p>
                </div>
              </div>
            ))}
            {topByLeads.length === 0 && <p className="text-center text-muted-foreground py-4">No leads assigned yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
