import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { LeadsView } from "@/components/leads/leads-view"
import { LeadActionsWidget } from "@/components/dashboard/lead-actions-widget"
import type { Lead } from "@/lib/types/database"

interface LeadsPageProps {
  searchParams: Promise<{ status?: string; source?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const agent = await requireAuth()
  const supabase = await createClient()

  let query = supabase.from("leads").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false })

  if (params.status) {
    query = query.eq("status", params.status)
  }

  const { data: leads } = await query

  // Get leads that need follow-up (next_follow_up is today or past)
  const today = new Date().toISOString().split("T")[0]
  const needsFollowUp =
    leads?.filter((lead) => lead.next_follow_up && new Date(lead.next_follow_up) <= new Date(today + "T23:59:59")) || []

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Lead Pipeline</h1>
        <p className="text-white/80 mt-1">Manage and track your leads through the sales process</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-sm text-white/80">Total Leads</p>
            <p className="text-xl font-bold">{leads?.length || 0}</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-sm text-white/80">Need Follow-up</p>
            <p className="text-xl font-bold">{needsFollowUp.length}</p>
          </div>
        </div>
      </div>

      <LeadActionsWidget agentId={agent.id} />

      <LeadsView leads={(leads as Lead[]) || []} agentId={agent.id} needsFollowUp={needsFollowUp as Lead[]} />
    </div>
  )
}
