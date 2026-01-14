import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LeadAssignmentView } from "@/components/admin/lead-assignment-view"

export default async function AdminLeadsPage() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  // Get all leads with agent info
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      *,
      agent:agents!leads_agent_id_fkey(id, Name, Email)
    `)
    .order("created_at", { ascending: false })

  // Get active agents for assignment
  const { data: agents } = await supabase
    .from("agents")
    .select("id, Name as full_name, Email as email, Role")
    .eq("is_active", true)
    .neq("Role", "broker")
    .order("Name")

  const formattedAgents =
    agents?.map((a) => ({
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

      <LeadAssignmentView leads={leads || []} agents={formattedAgents} adminId={admin.id} />
    </div>
  )
}
