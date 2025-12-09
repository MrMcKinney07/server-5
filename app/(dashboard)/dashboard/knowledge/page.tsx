import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { KnowledgeBaseList } from "@/components/knowledge/knowledge-base-list"

export default async function KnowledgeBasePage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  const { data: articles } = await supabase
    .from("knowledge_articles")
    .select(
      "*, created_by_agent:agents!created_by(*), related_mission_template:mission_templates!related_mission_template_id(*)",
    )
    .eq("is_published", true)
    .order("category")
    .order("title")

  const categories = [
    { id: "lead_handling", label: "Lead Handling" },
    { id: "listings", label: "Listings" },
    { id: "transactions", label: "Transactions" },
    { id: "open_house", label: "Open Houses" },
    { id: "training", label: "Training" },
    { id: "general", label: "General" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
        <p className="text-muted-foreground">SOPs, guides, and best practices</p>
      </div>

      <KnowledgeBaseList articles={articles || []} categories={categories} />
    </div>
  )
}
