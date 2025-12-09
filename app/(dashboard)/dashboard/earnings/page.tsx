import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EarningsDashboard } from "@/components/earnings/earnings-dashboard"

export default async function EarningsPage() {
  const supabase = await createClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01`
  const endOfYear = `${currentYear}-12-31`

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("agent_id", agent.id)
    .gte("closing_date", startOfYear)
    .lte("closing_date", endOfYear)
    .order("closing_date", { ascending: false })

  // Calculate YTD stats from transactions
  const closedTransactions = (transactions || []).filter((t) => t.status === "closed")

  const ytdStats = {
    totalGCI: closedTransactions.reduce((sum, t) => sum + (Number(t.gross_commission) || 0), 0),
    totalVolume: closedTransactions.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0),
    totalDeals: closedTransactions.length,
  }

  // Default commission plan values (70/30 split, $25k cap)
  const commissionPlan = {
    name: "Standard Plan",
    splitPercentage: 0.7,
    capAmount: 25000,
    transactionFee: 495,
  }

  // Calculate agent earnings (split applied to GCI)
  const agentEarnings = ytdStats.totalGCI * commissionPlan.splitPercentage
  const brokerShare = ytdStats.totalGCI * (1 - commissionPlan.splitPercentage)
  const capProgress = Math.min((brokerShare / commissionPlan.capAmount) * 100, 100)
  const isCapped = brokerShare >= commissionPlan.capAmount

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">My Earnings</h1>
        <p className="text-emerald-100">Track your commission, cap progress, and recent closings</p>
      </div>

      <EarningsDashboard
        ytdStats={ytdStats}
        agentEarnings={agentEarnings}
        brokerShare={brokerShare}
        commissionPlan={commissionPlan}
        capProgress={capProgress}
        isCapped={isCapped}
        recentTransactions={closedTransactions.slice(0, 10)}
        currentYear={currentYear}
      />
    </div>
  )
}
