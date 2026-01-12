import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LeadAssignmentView } from "@/components/admin/lead-assignment-view"

export default async function AdminLeadsPage() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      status,
      lead_type,
      source,
      created_at,
      agent_id,
      budget_min,
      budget_max,
      timeline,
      property_interest,
      notes,
      last_contacted_at,
      next_follow_up
    `)
    .order("created_at", { ascending: false })

  const { data: agents } = await supabase
    .from("agents")
    .select("id, Name, Email, Role, is_active")
    .eq("is_active", true)
    .order("Name")

  const agentMap = new Map(agents?.map((a) => [a.id, a]) || [])

  const formattedLeads = (leads || []).map((lead) => ({
    ...lead,
    agent: lead.agent_id ? agentMap.get(lead.agent_id) || null : null,
  }))

  const formattedAgents =
    agents
      ?.filter((a) => a.Role !== "broker")
      .map((a) => ({
        id: a.id,
        full_name: a.Name,
        email: a.Email,
        tier: 1,
        is_active: true,
      })) || []

  console.log("[v0] Leads count:", leads?.length, "Error:", leadsError?.message)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Lead Assignment</h1>
          <p className="text-muted-foreground">Manually assign and distribute leads to agents</p>
        </div>
      </div>

      <LeadAssignmentView leads={formattedLeads} agents={formattedAgents} adminId={admin.id} />
    </div>
  )
}
