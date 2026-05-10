import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { AgentEarningsDashboard } from "@/components/earnings/agent-earnings-dashboard"
import { redirect } from "next/navigation"

export default async function EarningsPage() {
  const agent = await getCurrentAgent()
  if (!agent) redirect("/auth/login")

  const supabase = createServiceClient()
  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01`
  const endOfYear = `${currentYear}-12-31`

  // Fetch commission plan
  const { data: agentPlan } = await supabase
    .from("agent_commission_plans")
    .select("id, plan:commission_plans(id, name, split_percentage, cap_amount, transaction_fee)")
    .eq("agent_id", agent.id)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  let agentFraction = 0.70
  let capAmount: number | null = null
  let transactionFee = 499
  let planName = "Standard Plan"
  const marketingThreshold = 20000

  const plan = (agentPlan?.plan as any)
  if (plan) {
    agentFraction = Number(plan.split_percentage) || 0.70
    capAmount = plan.cap_amount ? Number(plan.cap_amount) : null
    transactionFee = Number(plan.transaction_fee) || 499
    planName = plan.name || planName
  } else {
    const { data: defaultPlan } = await supabase
      .from("commission_plans")
      .select("id, name, split_percentage, cap_amount, transaction_fee")
      .eq("is_default", true)
      .maybeSingle()
    if (defaultPlan) {
      agentFraction = Number(defaultPlan.split_percentage) || 0.70
      capAmount = defaultPlan.cap_amount ? Number(defaultPlan.cap_amount) : null
      transactionFee = Number(defaultPlan.transaction_fee) || 499
      planName = defaultPlan.name || planName
    }
  }

  const splitPct = Math.round(agentFraction * 100)
  const brokerPct = 100 - splitPct

  // Fetch closed transactions
  const { data: closedTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("status", "closed")
    .gte("closing_date", startOfYear)
    .lte("closing_date", endOfYear)
    .order("closing_date", { ascending: false })

  const transactions = closedTransactions || []
  const totalGCI = transactions.reduce((sum, t: any) => sum + (Number(t.gross_commission) || 0), 0)
  const totalVolume = transactions.reduce((sum, t: any) => sum + (Number(t.sale_price) || 0), 0)
  const totalDeals = transactions.length
  const totalBrokerPaid = transactions.reduce((sum, t: any) => sum + (Number(t.broker_commission) || 0), 0)
  const totalAgentEarnings = transactions.reduce((sum, t: any) => sum + (Number(t.agent_commission) || 0), 0)
  const hasReachedThreshold = totalBrokerPaid >= marketingThreshold
  const marketingBudget = hasReachedThreshold ? (totalBrokerPaid - marketingThreshold) * 0.1 : 0

  const earningsData = {
    ytdStats: { totalGCI, totalVolume, totalDeals, agentEarnings: totalAgentEarnings, brokerShare: totalBrokerPaid, marketingBudget },
    splitPercent: splitPct,
    brokerPercent: brokerPct,
    transactionFee,
    planName,
    capAmount,
    marketingThreshold,
    hasReachedThreshold,
    recentDeals: transactions.slice(0, 10),
    currentYear,
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-semibold">My Earnings</h1>
        <p className="text-emerald-100">Track your commission, marketing budget progress, and recent closings</p>
      </div>
      <AgentEarningsDashboard data={earningsData} />
    </div>
  )
}
