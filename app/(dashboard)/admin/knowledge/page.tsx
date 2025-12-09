import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminKnowledgeManager } from "@/components/admin/knowledge/admin-knowledge-manager"

export default async function AdminKnowledgePage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent || agent.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: articles } = await supabase
    .from("knowledge_articles")
    .select("*, created_by_agent:agents(*), related_mission_template:mission_templates(*)")
    .order("created_at", { ascending: false })

  const { data: missionTemplates } = await supabase
    .from("mission_templates")
    .select("*")
    .eq("is_active", true)
    .order("title")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Knowledge Base Management</h1>
        <p className="text-muted-foreground">Create and manage SOPs and articles</p>
      </div>

      <AdminKnowledgeManager articles={articles || []} missionTemplates={missionTemplates || []} />
    </div>
  )
}
