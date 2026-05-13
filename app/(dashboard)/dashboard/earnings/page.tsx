import { requireAuth } from "@/lib/auth"
import { AgentEarningsDashboard } from "@/components/earnings/agent-earnings-dashboard"

export default async function EarningsPage() {
  // requireAuth is already called in the layout — this just gets the cached agent
  const agent = await requireAuth()

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-semibold">My Earnings</h1>
        <p className="text-emerald-100 text-sm">Track your commission, marketing budget progress, and recent closings</p>
      </div>
      <AgentEarningsDashboard agentId={agent.id} />
    </div>
  )
}
