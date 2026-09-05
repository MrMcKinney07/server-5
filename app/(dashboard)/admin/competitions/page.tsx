import { createServerClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { AdminCompetitionsManager } from "@/components/admin/competitions/admin-competitions-manager"

export default async function AdminCompetitionsPage() {
  await requireAdmin()
  const supabase = await createServerClient()

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .order("start_date", { ascending: false })

  const { data: agents } = await supabase.from("agents").select("*").eq("is_active", true).order("Name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Competitions Management</h1>
        <p className="text-muted-foreground">Create and manage agent competitions</p>
      </div>

      <AdminCompetitionsManager competitions={competitions || []} agents={agents || []} />
    </div>
  )
}
