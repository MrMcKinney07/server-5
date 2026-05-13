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
    .select("*")
    .order("created_at", { ascending: false })

  console.log("[v0] Admin leads page - Leads count:", leads?.length)
  console.log("[v0] Admin leads page - Leads error:", leadsError)
  console.log("[v0] Admin leads page - Sample leads:", leads?.slice(0, 2))

  // Get agent mapping
  const { data: agents } = await supabase.from("agents").select("id, Name, Email")

  const agentMap = new Map(agents?.map((a) => [a.id, a]) || [])
  const leadsWithAgents = (leads || []).map((lead) => ({
    ...lead,
    agent: lead.agent_id ? agentMap.get(lead.agent_id) : null,
  }))

  // Get active agents for assignment
  const { data: activeAgents } = await supabase
    .from("agents")
    .select("id, Name as full_name, Email as email, Role")
    .eq("is_active", true)
    .neq("Role", "broker")
    .order("Name")

  const formattedAgents =
    activeAgents?.map((a) => ({
      id: a.id,
      full_name: a.full_name,
      email: a.email,
      tier: 1,
      is_active: true,
    })) || []

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

      <LeadAssignmentView leads={leadsWithAgents} agents={formattedAgents} adminId={admin.id} />
    </div>
  )
}
