import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CommissionPlansManager } from "@/components/admin/commission-plans-manager"

export default async function AdminCommissionPlansPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent || agent.Role !== "broker") {
    redirect("/dashboard")
  }

  const { data: commissionPlans } = await supabase
    .from("commission_plans")
    .select("*")
    .order("split_percentage", { ascending: false })

  const { data: agents } = await supabase.from("agents").select("*").order("Name")

  const { data: agentPlans } = await supabase
    .from("agent_commission_plans")
    .select("*, plan:commission_plans(*), agent:agents(*)")
    .order("effective_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Commission Plans</h1>
        <p className="text-muted-foreground">Manage commission splits and assign plans to agents</p>
      </div>

      <CommissionPlansManager
        commissionPlans={commissionPlans || []}
        agents={agents || []}
        agentPlans={agentPlans || []}
      />
    </div>
  )
}
