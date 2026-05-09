import { AgentEarningsDashboard } from "@/components/earnings/agent-earnings-dashboard"

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-semibold">My Earnings</h1>
        <p className="text-emerald-100">Track your commission, marketing budget progress, and recent closings</p>
      </div>
      <AgentEarningsDashboard />
    </div>
  )
}
