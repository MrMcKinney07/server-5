import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AgentEarningsDashboard } from "@/components/earnings/agent-earnings-dashboard"

export default async function EarningsPage() {
  const supabase = await createClient()
  const agent = await requireAuth()

  if (!agent) redirect("/auth/login")

  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01`
  const endOfYear = `${currentYear}-12-31`

  // Fetch agent's active commission plan
  const { data: agentPlan } = await supabase
    .from("agent_commission_plans")
    .select("*, plan:commission_plans(*)")
    .eq("agent_id", agent.id)
    .order("effective_date", { ascending: false })
    .limit(1)
    .single()

  // Fall back to default plan
  let splitPct = 70
  let capAmount: number | null = null
  let transactionFee = 499
  let marketingThreshold = 15000
  let planName = "Default (70/30)"

  if (agentPlan?.plan) {
    splitPct = Number(agentPlan.plan.split_percentage)
    capAmount = agentPlan.plan.cap_amount ? Number(agentPlan.plan.cap_amount) : null
    transactionFee = Number(agentPlan.plan.transaction_fee) || 499
    planName = agentPlan.plan.name || planName
    // Marketing threshold: cap_amount if set, otherwise $15k in broker dollars
    marketingThreshold = capAmount ?? 15000
  } else {
    const { data: defaultPlan } = await supabase
      .from("commission_plans")
      .select("*")
      .eq("is_default", true)
      .single()
    if (defaultPlan) {
      splitPct = Number(defaultPlan.split_percentage)
      capAmount = defaultPlan.cap_amount ? Number(defaultPlan.cap_amount) : null
      transactionFee = Number(defaultPlan.transaction_fee) || 499
      planName = defaultPlan.name || planName
      marketingThreshold = capAmount ?? 15000
    }
  }

  // Fetch all closed transactions for this year
  const { data: closedTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("status", "closed")
    .gte("closing_date", startOfYear)
    .lte("closing_date", endOfYear)
    .order("closing_date", { ascending: false })

  const transactions = closedTransactions || []

  // Aggregate stats using real broker_commission column for threshold
  const totalGCI = transactions.reduce((sum, t) => sum + (Number(t.gross_commission) || 0), 0)
  const totalVolume = transactions.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0)
  const totalDeals = transactions.length
  // Use stored broker_commission (what broker actually received) for threshold calc
  const totalBrokerPaid = transactions.reduce((sum, t) => sum + (Number(t.broker_commission) || 0), 0)
  const totalAgentEarnings = transactions.reduce((sum, t) => sum + (Number(t.agent_commission) || 0), 0)

  // Marketing budget: 10% of broker dollars above the threshold (cap amount)
  const hasReachedThreshold = totalBrokerPaid >= marketingThreshold
  const marketingBudget = hasReachedThreshold
    ? (totalBrokerPaid - marketingThreshold) * 0.1
    : 0

  const ytdStats = {
    totalGCI,
    totalVolume,
    totalDeals,
    agentEarnings: totalAgentEarnings || totalGCI * (splitPct / 100),
    brokerShare: totalBrokerPaid || totalGCI - totalGCI * (splitPct / 100),
    marketingBudget,
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-semibold">My Earnings</h1>
        <p className="text-emerald-100">Track your commission, marketing budget progress, and recent closings</p>
      </div>

      <AgentEarningsDashboard
        agent={agent}
        ytdStats={ytdStats}
        splitPercent={splitPct}
        transactionFee={transactionFee}
        planName={planName}
        capAmount={capAmount}
        marketingThreshold={marketingThreshold}
        hasReachedThreshold={hasReachedThreshold}
        recentDeals={transactions.slice(0, 10)}
        currentYear={currentYear}
      />
    </div>
  )
}
