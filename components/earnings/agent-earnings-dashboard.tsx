"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Target, Award, Building2 } from "lucide-react"

interface AgentEarningsDashboardProps {
  agent: { id: string; Name: string }
  ytdStats: {
    totalGCI: number
    totalVolume: number
    totalDeals: number
    agentEarnings: number
    brokerShare: number
  }
  splitPercent: number
  capAmount: number
  capProgress: number
  isCapped: boolean
  recentDeals: Array<{
    id: string
    property_address: string
    sale_price: number | null
    gross_commission: number | null
    closing_date: string | null
    transaction_type: string | null
  }>
  currentYear: number
}

export function AgentEarningsDashboard({
  agent,
  ytdStats,
  splitPercent,
  capAmount,
  capProgress,
  isCapped,
  recentDeals,
  currentYear,
}: AgentEarningsDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const capPercentage = capAmount > 0 ? (capProgress / capAmount) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">YTD GCI</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(ytdStats.totalGCI)}</div>
            <p className="text-xs text-muted-foreground">{ytdStats.totalDeals} deals closed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(ytdStats.agentEarnings)}</div>
            <p className="text-xs text-muted-foreground">After {splitPercent}% split</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Company Dollar</CardTitle>
            <Building2 className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(ytdStats.brokerShare)}</div>
            <p className="text-xs text-muted-foreground">Broker share paid</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(ytdStats.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">Sales volume {currentYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cap Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Progress to Cap
          </CardTitle>
          <CardDescription>
            {isCapped ? (
              <Badge className="bg-emerald-600">Cap Reached! You keep 100%</Badge>
            ) : (
              `${formatCurrency(capAmount - capProgress)} remaining to cap`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={Math.min(capPercentage, 100)} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(capProgress)}</span>
            <span>{formatCurrency(capAmount)}</span>
          </div>
          {isCapped && (
            <p className="text-sm text-emerald-600 font-medium">
              Congratulations! All future commission is 100% yours!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Commission Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Your Commission Plan</CardTitle>
          <CardDescription>Standard McKinney One Plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Your Split</p>
              <p className="text-2xl font-bold text-emerald-600">{splitPercent}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Annual Cap</p>
              <p className="text-2xl font-bold">{formatCurrency(capAmount)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Transaction Fee</p>
              <p className="text-2xl font-bold">{formatCurrency(495)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">E&O Fee</p>
              <p className="text-2xl font-bold">{formatCurrency(40)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Closings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Closings</CardTitle>
          <CardDescription>Your most recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDeals.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No closings yet this year</p>
              <p className="text-sm text-muted-foreground">Closed transactions will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">GCI</TableHead>
                  <TableHead className="text-right">Your Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeals.map((deal) => {
                  const gci = Number(deal.gross_commission) || 0
                  const agentShare = gci * (splitPercent / 100)
                  return (
                    <TableRow key={deal.id}>
                      <TableCell>
                        {deal.closing_date ? new Date(deal.closing_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {deal.property_address || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {deal.transaction_type || "buyer"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(deal.sale_price) || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(gci)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(agentShare)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
