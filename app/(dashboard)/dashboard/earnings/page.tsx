import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AgentEarningsDashboard } from "@/components/earnings/agent-earnings-dashboard"

export default async function EarningsPage() {
  const supabase = await createClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01`
  const endOfYear = `${currentYear}-12-31`

  // Get all closed transactions for this year to calculate earnings
  const { data: closedTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("status", "closed")
    .gte("closing_date", startOfYear)
    .lte("closing_date", endOfYear)
    .order("closing_date", { ascending: false })

  // Calculate YTD stats from transactions
  const transactions = closedTransactions || []

  const ytdStats = {
    totalGCI: transactions.reduce((sum, t) => sum + (Number(t.gross_commission) || 0), 0),
    totalVolume: transactions.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0),
    totalDeals: transactions.length,
    agentEarnings: 0,
    brokerShare: 0,
  }

  // Apply 70/30 split (default) - agent gets 70%
  const splitPercent = 70
  ytdStats.agentEarnings = ytdStats.totalGCI * (splitPercent / 100)
  ytdStats.brokerShare = ytdStats.totalGCI - ytdStats.agentEarnings

  // Cap tracking - $25,000 default cap
  const capAmount = 25000
  const capProgress = Math.min(ytdStats.brokerShare, capAmount)
  const isCapped = ytdStats.brokerShare >= capAmount

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-semibold">My Earnings</h1>
        <p className="text-emerald-100">Track your commission, cap progress, and recent closings</p>
      </div>

      <AgentEarningsDashboard
        agent={agent}
        ytdStats={ytdStats}
        splitPercent={splitPercent}
        capAmount={capAmount}
        capProgress={capProgress}
        isCapped={isCapped}
        recentDeals={transactions.slice(0, 10)}
        currentYear={currentYear}
      />
    </div>
  )
}
