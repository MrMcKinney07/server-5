"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Target, Award, Megaphone } from "lucide-react"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch earnings")
  return res.json()
}

export function AgentEarningsDashboard({ agentId }: { agentId: string }) {
  const { data, isLoading, error } = useSWR(
    `/api/agent/earnings?agentId=${agentId}`,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-4 w-20" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="pt-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <p className="text-muted-foreground">Unable to load earnings data. Please refresh the page.</p>
        </CardContent>
      </Card>
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
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">YTD GCI</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{fmt(ytdStats.totalGCI)}</div>
            <p className="text-xs text-muted-foreground">{ytdStats.totalDeals} deal{ytdStats.totalDeals !== 1 ? "s" : ""} closed</p>
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
              {hasReachedThreshold ? "10% of broker dollars above cap" : `Unlocks at ${fmt(marketingThreshold)} broker $`}
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

      {/* Marketing Budget Threshold */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-pink-600" />
            Marketing Budget Threshold
          </CardTitle>
          <CardDescription>
            {hasReachedThreshold ? (
              <Badge className="bg-pink-600">Threshold Reached — Earning 10% Marketing Budget</Badge>
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
          {hasReachedThreshold && (
            <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                You&apos;ve unlocked your marketing budget — 10% of broker dollars above {fmt(marketingThreshold)}.
              </p>
              <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                Current marketing budget: {fmt(ytdStats.marketingBudget)}
              </p>
            </div>
          )}
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
          <CardDescription>Your closed transactions for {currentYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDeals.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No closings yet this year</p>
              <p className="text-sm text-muted-foreground mt-1">
                Transactions appear here after your broker marks a check as sent
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell className="whitespace-nowrap">
                        {deal.closing_date ? new Date(deal.closing_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate font-medium">
                        {deal.property_address || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{deal.transaction_type || "buy"}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">{fmt(Number(deal.sale_price) || 0)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{fmt(Number(deal.gross_commission) || 0)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-rose-500">{fmt(Number(deal.broker_commission) || 0)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium text-emerald-600">{fmt(Number(deal.agent_commission) || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
