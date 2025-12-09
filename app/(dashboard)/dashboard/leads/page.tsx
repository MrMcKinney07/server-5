import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { LeadsTable } from "@/components/leads/leads-table"
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog"
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
  if (params.source) {
    query = query.eq("source", params.source)
  }

  const { data: leads } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage and track your leads pipeline</p>
        </div>
        <CreateLeadDialog agentId={agent.id} />
      </div>
      <LeadsTable leads={(leads as Lead[]) || []} />
    </div>
  )
}
