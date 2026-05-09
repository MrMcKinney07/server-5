"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Target, Award, Megaphone } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

export function AgentEarningsDashboard() {
  const { data, isLoading } = useSWR("/api/agent/earnings", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  })

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    )
  }

  const {
    ytdStats,
    splitPercent,
    brokerPercent,
    transactionFee,
    planName,
    capAmount,
    marketingThreshold,
    hasReachedThreshold,
    recentDeals,
    currentYear,
  } = data

  const thresholdProgress = Math.min(ytdStats.brokerShare, marketingThreshold)
  const thresholdPct = marketingThreshold > 0 ? (thresholdProgress / marketingThreshold) * 100 : 0

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
            <div className="text-2xl font-bold text-emerald-600">{fmt(ytdStats.totalGCI)}</div>
            <p className="text-xs text-muted-foreground">{ytdStats.totalDeals} deals closed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{fmt(ytdStats.agentEarnings)}</div>
            <p className="text-xs text-muted-foreground">{splitPercent}/{brokerPercent} split · {fmt(transactionFee)} fee/deal</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Marketing Budget</CardTitle>
            <Megaphone className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{fmt(ytdStats.marketingBudget)}</div>
            <p className="text-xs text-muted-foreground">
              {hasReachedThreshold
                ? "10% of broker dollars above cap"
                : `Unlocks at ${fmt(marketingThreshold)} broker dollars`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{fmt(ytdStats.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">Sales volume {currentYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Threshold */}
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
              `${fmt(marketingThreshold - thresholdProgress)} in broker dollars remaining to unlock`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={Math.min(thresholdPct, 100)} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{fmt(thresholdProgress)} broker dollars paid</span>
            <span>{fmt(marketingThreshold)} threshold</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Calculated from broker-received funds only ({brokerPercent}% of each deal&apos;s GCI).
            {capAmount ? ` Your cap is ${fmt(capAmount)}.` : ""}
          </p>
          {hasReachedThreshold && (
            <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                You&apos;ve unlocked your marketing budget — 10% of all broker dollars above {fmt(marketingThreshold)}.
              </p>
              <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                Current marketing budget: {fmt(ytdStats.marketingBudget)}
              </p>
            </div>
          )}
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Note:</span> Threshold resets annually on January 1st. Progress shown is for {currentYear}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Commission Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Your Commission Plan</CardTitle>
          <CardDescription>{planName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Your Split</p>
              <p className="text-2xl font-bold text-emerald-600">{splitPercent}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Marketing Threshold (Broker $)</p>
              <p className="text-2xl font-bold">{fmt(marketingThreshold)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Transaction Fee</p>
              <p className="text-2xl font-bold">{fmt(transactionFee)}</p>
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
              <p className="text-sm text-muted-foreground">
                Closed transactions appear here after your broker marks a check as sent
              </p>
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
                  <TableHead className="text-right">Broker Paid</TableHead>
                  <TableHead className="text-right">Your Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeals.map((deal: any) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      {deal.closing_date ? new Date(deal.closing_date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-medium">
                      {deal.property_address || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {deal.transaction_type || "buyer"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{fmt(Number(deal.sale_price) || 0)}</TableCell>
                    <TableCell className="text-right">{fmt(Number(deal.gross_commission) || 0)}</TableCell>
                    <TableCell className="text-right text-rose-500">{fmt(Number(deal.broker_commission) || 0)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">{fmt(Number(deal.agent_commission) || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
