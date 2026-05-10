"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { DollarSign, Users, TrendingUp, Building } from "lucide-react"

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

interface FinancialsData {
  agentSummaries: any[]
  monthlyRevenue: { month: number; broker_share: number; gci: number }[]
  commissionPlans: any[]
  currentYear: number
}

export function BrokerRevenueDashboard({ data }: { data: FinancialsData }) {
  const router = useRouter()

  // Refresh server data every 30s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30000)
    return () => clearInterval(interval)
  }, [router])

  const { agentSummaries, monthlyRevenue, commissionPlans, currentYear } = data

  const totalBrokerShare = agentSummaries.reduce((sum, s) => sum + (s.total_broker_share || 0), 0)
  const totalGCI = agentSummaries.reduce((sum, s) => sum + (s.total_gci || 0), 0)
  const totalDeals = agentSummaries.reduce((sum, s) => sum + (s.total_deals || 0), 0)

  const chartData = monthlyRevenue.map((m, i) => ({
    name: monthNames[i],
    "Broker Share": m.broker_share,
    "Total GCI": m.gci,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Company Dollar</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalBrokerShare)}</div>
            <p className="text-xs text-muted-foreground">YTD {currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total GCI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalGCI)}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Company dollar vs total GCI by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
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
              <CardDescription>Company dollar generated per agent this year</CardDescription>
            </CardHeader>
            <CardContent>
              {agentSummaries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No closed transactions yet this year.</p>
              ) : (
                <div className="overflow-x-auto">
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
                      {agentSummaries.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right">{s.total_deals}</TableCell>
                          <TableCell className="text-right">{fmt(s.total_volume)}</TableCell>
                          <TableCell className="text-right">{fmt(s.total_gci)}</TableCell>
                          <TableCell className="text-right font-medium text-primary">{fmt(s.total_broker_share)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Split</TableHead>
                      <TableHead className="text-right">Cap</TableHead>
                      <TableHead className="text-right">Trans Fee</TableHead>
                      <TableHead className="text-right">Monthly Fee</TableHead>
                      <TableHead>Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionPlans.map((plan: any) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>
                          {Math.round(Number(plan.split_percentage) * 100)}/{Math.round((1 - Number(plan.split_percentage)) * 100)}
                        </TableCell>
                        <TableCell className="text-right">{plan.cap_amount ? fmt(Number(plan.cap_amount)) : "No cap"}</TableCell>
                        <TableCell className="text-right">{fmt(Number(plan.transaction_fee) || 0)}</TableCell>
                        <TableCell className="text-right">{fmt(Number(plan.monthly_fee) || 0)}</TableCell>
                        <TableCell>{plan.is_default ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
