import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { AgentEarningsDashboard } from "@/components/earnings/agent-earnings-dashboard"
import { redirect } from "next/navigation"

export default async function EarningsPage() {
  const agent = await getCurrentAgent()
  if (!agent) redirect("/auth/login")

  // Pass only the agent ID to the client — all data fetching happens client-side
  // via a single lightweight API call using the service client (no GoTrueClient)
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-semibold">My Earnings</h1>
        <p className="text-emerald-100">Track your commission, marketing budget progress, and recent closings</p>
      </div>
      <AgentEarningsDashboard agentId={agent.id} />
    </div>
  )
}
