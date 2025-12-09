import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AgentEarningsDashboard } from "@/components/earnings/agent-earnings-dashboard"

export default async function EarningsPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  const currentYear = new Date().getFullYear()

  // Get agent's annual summary
  const { data: annualSummary } = await supabase
    .from("agent_annual_summaries")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("year", currentYear)
    .single()

  // Get agent's commission plan
  const { data: agentPlan } = await supabase
    .from("agent_commission_plans")
    .select("*, commission_plan:commission_plans(*)")
    .eq("agent_id", agent.id)
    .single()

  // Get default plan if no agent-specific plan
  let commissionPlan = agentPlan?.commission_plan
  if (!commissionPlan) {
    const { data: defaultPlan } = await supabase.from("commission_plans").select("*").eq("is_default", true).single()
    commissionPlan = defaultPlan
  }

  // Get last 10 closings
  const { data: recentDeals } = await supabase
    .from("deal_financials")
    .select("*, transaction:transactions(*, contact:contacts(*), property:properties(*))")
    .eq("agent_id", agent.id)
    .order("closed_date", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Earnings</h1>
        <p className="text-muted-foreground">Track your commission, cap progress, and recent closings</p>
      </div>

      <AgentEarningsDashboard
        agent={agent}
        annualSummary={annualSummary}
        commissionPlan={commissionPlan}
        agentPlanOverrides={agentPlan}
        recentDeals={recentDeals || []}
        currentYear={currentYear}
      />
    </div>
  )
}
