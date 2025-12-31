"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { DollarSign, Users, TrendingUp, Building } from "lucide-react"
import type { AgentAnnualSummaryWithAgent, CommissionPlan } from "@/lib/types/database"

interface BrokerRevenueDashboardProps {
  agentSummaries: AgentAnnualSummaryWithAgent[]
  monthlyRevenue: { month: number; broker_share: number; gci: number }[]
  commissionPlans: CommissionPlan[]
  currentYear: number
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function BrokerRevenueDashboard({
  agentSummaries,
  monthlyRevenue,
  commissionPlans,
  currentYear,
}: BrokerRevenueDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalBrokerShare = agentSummaries.reduce((sum, s) => sum + (s.total_broker_share || 0), 0)
  const totalGCI = agentSummaries.reduce((sum, s) => sum + (s.total_gci || 0), 0)
  const totalDeals = agentSummaries.reduce((sum, s) => sum + (s.total_deals || 0), 0)
  const totalVolume = agentSummaries.reduce((sum, s) => sum + (s.total_volume || 0), 0)

  const chartData = monthlyRevenue.map((m, i) => ({
    name: monthNames[i],
    "Broker Share": m.broker_share,
    "Total GCI": m.gci,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Company Dollar</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBrokerShare)}</div>
            <p className="text-xs text-muted-foreground">YTD {currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total GCI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGCI)}</div>
            <p className="text-xs text-muted-foreground">Gross commission income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
            <p className="text-xs text-muted-foreground">Closed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentSummaries.length}</div>
            <p className="text-xs text-muted-foreground">With production</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Company dollar by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
                <Bar dataKey="Broker Share" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total GCI" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Profit by Agent</TabsTrigger>
          <TabsTrigger value="plans">Commission Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Profitability</CardTitle>
              <CardDescription>Company dollar generated per agent</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">GCI</TableHead>
                    <TableHead className="text-right">Company $</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentSummaries.map((summary) => (
                    <TableRow key={summary.id}>
                      <TableCell className="font-medium">{summary.agent?.full_name || "Unknown"}</TableCell>
                      <TableCell className="text-right">{summary.total_deals}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.total_volume)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.total_gci)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(summary.total_broker_share)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Commission Plans</CardTitle>
              <CardDescription>Available commission structures</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Split</TableHead>
                    <TableHead className="text-right">Cap</TableHead>
                    <TableHead className="text-right">Trans Fee</TableHead>
                    <TableHead className="text-right">Monthly Fee</TableHead>
                    <TableHead>Default</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.split_percentage}% / {100 - Number(plan.split_percentage)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.cap_amount ? formatCurrency(Number(plan.cap_amount)) : "No cap"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(plan.transaction_fee) || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(plan.monthly_fee) || 0)}</TableCell>
                      <TableCell>{plan.is_default ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
