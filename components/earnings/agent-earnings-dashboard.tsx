"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Target, Award } from "lucide-react"
import type {
  Agent,
  AgentAnnualSummary,
  CommissionPlan,
  AgentCommissionPlan,
  DealFinancialsWithRelations,
} from "@/lib/types/database"

interface AgentEarningsDashboardProps {
  agent: Agent
  annualSummary: AgentAnnualSummary | null
  commissionPlan: CommissionPlan | null
  agentPlanOverrides: AgentCommissionPlan | null
  recentDeals: (DealFinancialsWithRelations & {
    transaction?: { contact?: { full_name: string }; property?: { address: string } | null }
  })[]
  currentYear: number
}

export function AgentEarningsDashboard({
  agent,
  annualSummary,
  commissionPlan,
  agentPlanOverrides,
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

  const effectiveSplit = agentPlanOverrides?.override_split_percent ?? commissionPlan?.default_split_percent ?? 70
  const effectiveCap = agentPlanOverrides?.override_annual_cap ?? commissionPlan?.annual_cap ?? 0
  const capProgress = effectiveCap > 0 ? ((annualSummary?.amount_toward_cap || 0) / effectiveCap) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">YTD GCI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(annualSummary?.total_gci || 0)}</div>
            <p className="text-xs text-muted-foreground">{annualSummary?.total_deals || 0} deals closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agent Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(annualSummary?.total_agent_earnings || 0)}</div>
            <p className="text-xs text-muted-foreground">After {effectiveSplit}% split</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Company Dollar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(annualSummary?.total_broker_share || 0)}</div>
            <p className="text-xs text-muted-foreground">Broker share paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(annualSummary?.total_volume || 0)}</div>
            <p className="text-xs text-muted-foreground">Sales volume {currentYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cap Progress */}
      {effectiveCap > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progress to Cap
            </CardTitle>
            <CardDescription>
              {annualSummary?.is_capped ? (
                <Badge className="bg-green-600">Cap Reached!</Badge>
              ) : (
                `${formatCurrency(effectiveCap - (annualSummary?.amount_toward_cap || 0))} remaining to cap`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={Math.min(capProgress, 100)} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(annualSummary?.amount_toward_cap || 0)}</span>
              <span>{formatCurrency(effectiveCap)}</span>
            </div>
            {annualSummary?.cap_reached_date && (
              <p className="text-sm text-green-600">
                Cap reached on {new Date(annualSummary.cap_reached_date).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commission Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Your Commission Plan</CardTitle>
          <CardDescription>{commissionPlan?.name || "Default Plan"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Split</p>
              <p className="text-lg font-semibold">{effectiveSplit}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transaction Fee</p>
              <p className="text-lg font-semibold">
                {formatCurrency(agentPlanOverrides?.override_transaction_fee ?? commissionPlan?.transaction_fee ?? 395)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E&O Fee</p>
              <p className="text-lg font-semibold">{formatCurrency(commissionPlan?.e_and_o_fee ?? 40)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tech Fee</p>
              <p className="text-lg font-semibold">{formatCurrency(commissionPlan?.tech_fee ?? 25)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Closings */}
      <Card>
        <CardHeader>
          <CardTitle>Last 10 Closings</CardTitle>
          <CardDescription>Your most recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDeals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No closings yet this year</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">GCI</TableHead>
                  <TableHead className="text-right">Your Share</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>{deal.closed_date ? new Date(deal.closed_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{deal.transaction?.contact?.full_name || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {deal.transaction?.property?.address || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(deal.gross_commission)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(deal.agent_share)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(deal.net_agent_amount)}</TableCell>
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
