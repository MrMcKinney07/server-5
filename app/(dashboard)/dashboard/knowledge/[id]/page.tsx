import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { KnowledgeArticleView } from "@/components/knowledge/knowledge-article-view"

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const agent = await requireAuth()

  if (!agent) {
    redirect("/auth/login")
  }

  const { data: article } = await supabase
    .from("knowledge_articles")
    .select("*, created_by_agent:agents(*), related_mission_template:mission_templates(*)")
    .eq("id", id)
    .eq("is_published", true)
    .single()

  if (!article) {
    notFound()
  }

  const { data: relatedArticles } = await supabase
    .from("knowledge_articles")
    .select("id, title")
    .eq("category", article.category)
    .eq("is_published", true)
    .neq("id", article.id)
    .limit(5)

  return <KnowledgeArticleView article={article} relatedArticles={relatedArticles || []} />
}
