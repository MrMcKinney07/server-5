"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Target, Calendar } from "lucide-react"
import type { KnowledgeArticleWithRelations } from "@/lib/types/database"

interface KnowledgeArticleViewProps {
  article: KnowledgeArticleWithRelations
  relatedArticles: { id: string; title: string }[]
}

// Renders inline markdown: **bold** and *italic*
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}

function renderContent(content: string) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="space-y-1.5 my-3 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Bullet list item
    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2))
      continue
    }

    flushList()

    // Blank line — spacer
    if (trimmed === "") {
      elements.push(<div key={key++} className="h-2" />)
      continue
    }

    // Bold-only line = section heading (e.g. **The goal:**)
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      elements.push(
        <p key={key++} className="text-sm font-semibold text-foreground mt-4 mb-1">
          {trimmed.slice(2, -2)}
        </p>
      )
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-sm leading-relaxed text-foreground/90">
        {renderInline(trimmed)}
      </p>
    )
  }

  flushList()
  return elements
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
            <div className="space-y-0.5">
              {renderContent(article.content)}
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
                        href={`/dashboard/knowledge/${related.id}`}
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
