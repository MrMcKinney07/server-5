import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BrokerRevenueDashboard } from "@/components/admin/financials/broker-revenue-dashboard"

export default async function AdminFinancialsPage() {
  const supabase = await createClient()
  const agent = await requireAuth()

  if (!agent || (agent.role !== "admin" && agent.role !== "broker")) {
    redirect("/dashboard")
  }

  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01`
  const endOfYear = `${currentYear}-12-31`

  // All closed transactions for this year with agent info
  const { data: allTransactions } = await supabase
    .from("transactions")
    .select("*, agent:agents(id, Name, Email)")
    .eq("status", "closed")
    .gte("closing_date", startOfYear)
    .lte("closing_date", endOfYear)

  const transactions = allTransactions || []

  // Aggregate by agent
  const agentMap = new Map<string, {
    id: string
    name: string
    total_deals: number
    total_volume: number
    total_gci: number
    total_broker_share: number
    total_agent_commission: number
  }>()

  transactions.forEach((t) => {
    const agentId = t.agent_id
    const agentName = t.agent?.Name || "Unknown"
    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, {
        id: agentId,
        name: agentName,
        total_deals: 0,
        total_volume: 0,
        total_gci: 0,
        total_broker_share: 0,
        total_agent_commission: 0,
      })
    }
    const row = agentMap.get(agentId)!
    row.total_deals += 1
    row.total_volume += Number(t.sale_price) || 0
    row.total_gci += Number(t.gross_commission) || 0
    row.total_broker_share += Number(t.broker_commission) || 0
    row.total_agent_commission += Number(t.agent_commission) || 0
  })

  const agentSummaries = Array.from(agentMap.values()).sort((a, b) => b.total_broker_share - a.total_broker_share)

  // Aggregate by month
  const monthlyRevenue: { month: number; broker_share: number; gci: number }[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    broker_share: 0,
    gci: 0,
  }))

  transactions.forEach((t) => {
    if (t.closing_date) {
      const month = new Date(t.closing_date).getMonth()
      monthlyRevenue[month].broker_share += Number(t.broker_commission) || 0
      monthlyRevenue[month].gci += Number(t.gross_commission) || 0
    }
  })

  // Get commission plans
  const { data: commissionPlans } = await supabase
    .from("commission_plans")
    .select("*")
    .eq("is_active", true)
    .order("split_percentage", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Broker Financials</h1>
        <p className="text-muted-foreground">Revenue tracking and agent profitability</p>
      </div>

      <BrokerRevenueDashboard
        agentSummaries={agentSummaries}
        monthlyRevenue={monthlyRevenue}
        commissionPlans={commissionPlans || []}
        currentYear={currentYear}
      />
    </div>
  )
}
