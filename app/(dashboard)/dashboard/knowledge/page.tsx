import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { KnowledgeBaseList } from "@/components/knowledge/knowledge-base-list"
import { RecommendedVideos } from "@/components/knowledge/recommended-videos"

export default async function KnowledgeBasePage() {
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  const [{ data: articles }, { data: videos }] = await Promise.all([
    supabase
      .from("knowledge_articles")
      .select("id, title, content, category, is_published, created_at, updated_at, file_url, file_name, file_type, related_mission_template_id")
      .eq("is_published", true)
      .order("category")
      .order("title"),
    supabase
      .from("recommended_videos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ])

  const categories = [
    { id: "lead_handling", label: "Lead Mastery" },
    { id: "listings", label: "Listing Excellence" },
    { id: "transactions", label: "Deal Management" },
    { id: "open_house", label: "Open House Strategies" },
    { id: "training", label: "Agent Development" },
    { id: "general", label: "Quick Reference" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
        <p className="text-muted-foreground">SOPs, guides, and best practices</p>
      </div>

      <RecommendedVideos
        videos={videos || []}
        agentId={agent.id}
        isBroker={agent.role === "broker" || agent.role === "admin"}
      />

      <KnowledgeBaseList articles={articles || []} categories={categories} />
    </div>
  )
}
