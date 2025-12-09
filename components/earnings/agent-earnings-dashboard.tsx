"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Target, Award, Building2, Megaphone } from "lucide-react"

interface AgentEarningsDashboardProps {
  agent: { id: string; Name: string }
  ytdStats: {
    totalGCI: number
    totalVolume: number
    totalDeals: number
    agentEarnings: number
    brokerShare: number
    marketingBudget: number
  }
  splitPercent: number
  marketingThreshold: number
  hasReachedThreshold: boolean
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
  marketingThreshold,
  hasReachedThreshold,
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

  const thresholdProgress = Math.min(ytdStats.brokerShare, marketingThreshold)
  const thresholdPercentage = marketingThreshold > 0 ? (thresholdProgress / marketingThreshold) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Marketing Budget</CardTitle>
            <Megaphone className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{formatCurrency(ytdStats.marketingBudget)}</div>
            <p className="text-xs text-muted-foreground">
              {hasReachedThreshold ? "10% of company share" : "Unlocks at $15k"}
            </p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-pink-600" />
            Marketing Budget Threshold
          </CardTitle>
          <CardDescription>
            {hasReachedThreshold ? (
              <Badge className="bg-pink-600">Threshold Reached! Earning 10% Marketing Budget</Badge>
            ) : (
              `${formatCurrency(marketingThreshold - thresholdProgress)} remaining to unlock marketing budget`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={Math.min(thresholdPercentage, 100)} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(thresholdProgress)} company dollar</span>
            <span>{formatCurrency(marketingThreshold)} threshold</span>
          </div>
          {hasReachedThreshold && (
            <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                Congratulations! You've unlocked your marketing budget. You now receive 10% of all future company dollar
                as marketing funds.
              </p>
              <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                Current marketing budget: {formatCurrency(ytdStats.marketingBudget)}
              </p>
            </div>
          )}
          {!hasReachedThreshold && (
            <p className="text-sm text-muted-foreground mt-2">
              After reaching {formatCurrency(marketingThreshold)} in company dollar, you'll earn a 10% marketing budget
              from future company share.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Commission Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Your Commission Plan</CardTitle>
          <CardDescription>McKinney Realty Commission Structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Your Split</p>
              <p className="text-2xl font-bold text-emerald-600">{splitPercent}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Marketing Threshold</p>
              <p className="text-2xl font-bold">{formatCurrency(marketingThreshold)}</p>
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
