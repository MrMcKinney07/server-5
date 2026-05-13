import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminCompetitionsManager } from "@/components/admin/competitions/admin-competitions-manager"

export default async function AdminCompetitionsPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent || agent.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .order("start_date", { ascending: false })

  const { data: agents } = await supabase.from("agents").select("*").eq("is_active", true).order("full_name")

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
