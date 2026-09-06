import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { LeadsView } from "@/components/leads/leads-view"
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

  // Single source of truth: a follow-up is "due" if it falls on or before the end of today.
  // Both the header count and the list use this same predicate so they never disagree.
  const endOfToday = new Date(new Date().toISOString().split("T")[0] + "T23:59:59")
  const isDue = (lead: Lead) => !!lead.next_follow_up && new Date(lead.next_follow_up) <= endOfToday

  const needsFollowUp = leads?.filter(isDue) || []
  const followUpCount = needsFollowUp.length
  const upcomingCount =
    leads?.filter((lead) => lead.next_follow_up && new Date(lead.next_follow_up) > endOfToday).length || 0

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 text-white border border-white/10">
        <h1 className="text-xl font-bold">Lead Pipeline</h1>
        <p className="text-white/60 text-sm mt-0.5">Manage and track your leads through the sales process</p>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="bg-white/10 rounded-lg px-4 py-2 border border-white/10">
            <p className="text-xs text-white/60">Total Leads</p>
            <p className="text-xl font-bold">{leads?.length || 0}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg px-4 py-2 border border-red-500/20">
            <p className="text-xs text-red-300/80">Need Follow-up</p>
            <p className="text-xl font-bold text-red-300">{followUpCount}</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg px-4 py-2 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">Upcoming</p>
            <p className="text-xl font-bold text-amber-300">{upcomingCount}</p>
          </div>
        </div>
      </div>

      <LeadsView leads={(leads as Lead[]) || []} agentId={agent.id} needsFollowUp={needsFollowUp as Lead[]} />
    </div>
  )
}
