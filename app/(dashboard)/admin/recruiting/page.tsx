import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RecruitingPipeline } from "@/components/admin/recruiting/recruiting-pipeline"

export default async function AdminRecruitingPage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent || agent.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: recruits } = await supabase
    .from("recruits")
    .select("*, sponsor_agent:agents!recruits_sponsor_agent_id_fkey(*)")
    .order("created_at", { ascending: false })

  const { data: agents } = await supabase.from("agents").select("*").eq("is_active", true).order("full_name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Recruiting Pipeline</h1>
        <p className="text-muted-foreground">Track and manage prospective agents</p>
      </div>

      <RecruitingPipeline recruits={recruits || []} agents={agents || []} />
    </div>
  )
}
