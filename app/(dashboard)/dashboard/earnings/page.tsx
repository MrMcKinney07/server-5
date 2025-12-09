import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Target, Award } from "lucide-react"

export default async function EarningsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const currentYear = new Date().getFullYear()

  // Get agent's commission plan
  const { data: agentPlan } = await supabase
    .from("agent_commission_plans")
    .select("*, plan:commission_plans(*)")
    .eq("agent_id", agent.id)
    .maybeSingle()

  // Get default plan if no agent-specific plan
  let commissionPlan = agentPlan?.plan
  if (!commissionPlan) {
    const { data: defaultPlan } = await supabase
      .from("commission_plans")
      .select("*")
      .eq("is_default", true)
      .maybeSingle()
    commissionPlan = defaultPlan
  }

  // Get closed transactions for this year
  const startOfYear = `${currentYear}-01-01`
  const { data: closedTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("status", "closed")
    .gte("closing_date", startOfYear)
    .order("closing_date", { ascending: false })

  // Calculate totals
  const totalGCI = closedTransactions?.reduce((sum, t) => sum + (t.gross_commission || 0), 0) || 0
  const totalAgentEarnings = closedTransactions?.reduce((sum, t) => sum + (t.agent_commission || 0), 0) || 0
  const totalBrokerShare = closedTransactions?.reduce((sum, t) => sum + (t.broker_commission || 0), 0) || 0
  const totalVolume = closedTransactions?.reduce((sum, t) => sum + (t.sale_price || 0), 0) || 0
  const totalDeals = closedTransactions?.length || 0

  const effectiveSplit = commissionPlan?.split_percentage ? commissionPlan.split_percentage * 100 : 70
  const effectiveCap = commissionPlan?.cap_amount || 0
  const capProgress = effectiveCap > 0 ? Math.min((totalBrokerShare / effectiveCap) * 100, 100) : 0
  const isCapped = effectiveCap > 0 && totalBrokerShare >= effectiveCap

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Earnings</h1>
        <p className="text-muted-foreground">Track your commission, cap progress, and recent closings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">YTD GCI</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalGCI)}</div>
            <p className="text-xs text-muted-foreground">{totalDeals} deals closed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agent Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAgentEarnings)}</div>
            <p className="text-xs text-muted-foreground">After {effectiveSplit.toFixed(0)}% split</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Company Dollar</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalBrokerShare)}</div>
            <p className="text-xs text-muted-foreground">Broker share paid</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Award className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalVolume)}</div>
            <p className="text-xs text-muted-foreground">Sales volume {currentYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cap Progress */}
      {effectiveCap > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Progress to Cap
            </CardTitle>
            <CardDescription>
              {isCapped ? (
                <Badge className="bg-emerald-600">Cap Reached!</Badge>
              ) : (
                `${formatCurrency(effectiveCap - totalBrokerShare)} remaining to cap`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={capProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(totalBrokerShare)}</span>
              <span>{formatCurrency(effectiveCap)}</span>
            </div>
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
          {commissionPlan ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Split</p>
                <p className="text-lg font-semibold">{effectiveSplit.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaction Fee</p>
                <p className="text-lg font-semibold">{formatCurrency(commissionPlan.transaction_fee || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Fee</p>
                <p className="text-lg font-semibold">{formatCurrency(commissionPlan.monthly_fee || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Cap</p>
                <p className="text-lg font-semibold">
                  {commissionPlan.cap_amount ? formatCurrency(commissionPlan.cap_amount) : "No Cap"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No commission plan assigned. Contact your broker.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Closings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Closings</CardTitle>
          <CardDescription>Your most recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {closedTransactions && closedTransactions.length > 0 ? (
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
                {closedTransactions.slice(0, 10).map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>{deal.closing_date ? new Date(deal.closing_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{deal.property_address || "N/A"}</TableCell>
                    <TableCell className="capitalize">{deal.transaction_type}</TableCell>
                    <TableCell className="text-right">{formatCurrency(deal.sale_price || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(deal.gross_commission || 0)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatCurrency(deal.agent_commission || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No closings yet this year</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
