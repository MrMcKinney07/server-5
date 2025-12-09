import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadsFilters } from "@/components/leads/leads-filters"
import type { Lead, Contact, Agent } from "@/lib/types/database"

interface LeadsPageProps {
  searchParams: Promise<{ status?: string; source?: string; agent?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const agent = await requireAuth()
  const supabase = await createClient()

  let query = supabase
    .from("leads")
    .select("*, contact:contacts(*), assigned_agent:agents(*)")
    .order("created_at", { ascending: false })

  if (params.status) {
    query = query.eq("status", params.status)
  }
  if (params.source) {
    query = query.eq("source", params.source)
  }
  if (params.agent) {
    query = query.eq("assigned_agent_id", params.agent)
  }

  const [{ data: leads }, { data: agents }] = await Promise.all([
    query,
    supabase.from("agents").select("id, full_name, email").eq("is_active", true),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">Manage and track your leads pipeline</p>
      </div>
      <LeadsFilters agents={(agents as Agent[]) || []} />
      <LeadsTable
        leads={(leads as (Lead & { contact: Contact; assigned_agent: Agent | null })[]) || []}
        currentAgentId={agent.id}
      />
    </div>
  )
}
