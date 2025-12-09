import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BrokerRevenueDashboard } from "@/components/admin/financials/broker-revenue-dashboard"

export default async function AdminFinancialsPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent || agent.role !== "admin") {
    redirect("/dashboard")
  }

  const currentYear = new Date().getFullYear()

  // Get all agent summaries for current year
  const { data: agentSummaries } = await supabase
    .from("agent_annual_summaries")
    .select("*, agent:agents(*)")
    .eq("year", currentYear)
    .order("total_broker_share", { ascending: false })

  // Get monthly revenue data
  const { data: monthlyDeals } = await supabase
    .from("deal_financials")
    .select("*")
    .gte("closed_date", `${currentYear}-01-01`)
    .lte("closed_date", `${currentYear}-12-31`)

  // Aggregate by month
  const monthlyRevenue: { month: number; broker_share: number; gci: number }[] = []
  for (let i = 1; i <= 12; i++) {
    monthlyRevenue.push({ month: i, broker_share: 0, gci: 0 })
  }
  monthlyDeals?.forEach((deal) => {
    if (deal.closed_date) {
      const month = new Date(deal.closed_date).getMonth()
      monthlyRevenue[month].broker_share += deal.broker_share || 0
      monthlyRevenue[month].gci += deal.gross_commission || 0
    }
  })

  // Get commission plans
  const { data: commissionPlans } = await supabase.from("commission_plans").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Broker Financials</h1>
        <p className="text-muted-foreground">Revenue tracking and agent profitability</p>
      </div>

      <BrokerRevenueDashboard
        agentSummaries={agentSummaries || []}
        monthlyRevenue={monthlyRevenue}
        commissionPlans={commissionPlans || []}
        currentYear={currentYear}
      />
    </div>
  )
}
