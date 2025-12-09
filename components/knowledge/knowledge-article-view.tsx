"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Target, Calendar } from "lucide-react"
import type { KnowledgeArticleWithRelations } from "@/lib/types/database"

interface KnowledgeArticleViewProps {
  article: KnowledgeArticleWithRelations
  relatedArticles: { id: string; title: string; slug: string }[]
}

export function KnowledgeArticleView({ article, relatedArticles }: KnowledgeArticleViewProps) {
  const categoryLabels: Record<string, string> = {
    lead_handling: "Lead Handling",
    listings: "Listings",
    transactions: "Transactions",
    open_house: "Open Houses",
    training: "Training",
    general: "General",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/knowledge">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{article.title}</CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="secondary">{categoryLabels[article.category] || article.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                  {article.created_by_agent && <span>By {article.created_by_agent.full_name}</span>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {article.content.split("\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {article.related_mission_template && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Related Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{article.related_mission_template.title}</p>
                {article.related_mission_template.description && (
                  <p className="text-xs text-muted-foreground mt-1">{article.related_mission_template.description}</p>
                )}
              </CardContent>
            </Card>
          )}

          {relatedArticles.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Related Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {relatedArticles.map((related) => (
                    <li key={related.id}>
                      <Link
                        href={`/dashboard/knowledge/${related.slug}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {related.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
