"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BookOpen, Target } from "lucide-react"
import type { KnowledgeArticleWithRelations } from "@/lib/types/database"

interface KnowledgeBaseListProps {
  articles: KnowledgeArticleWithRelations[]
  categories: { id: string; label: string }[]
}

export function KnowledgeBaseList({ articles, categories }: KnowledgeBaseListProps) {
  const [search, setSearch] = useState("")

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()),
  )

  const getArticlesByCategory = (categoryId: string) => filteredArticles.filter((a) => a.category === categoryId)

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {filteredArticles.length === 0 && <p className="text-muted-foreground text-center py-8">No articles found</p>}
        </TabsContent>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getArticlesByCategory(cat.id).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            {getArticlesByCategory(cat.id).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No articles in this category</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ArticleCard({ article }: { article: KnowledgeArticleWithRelations }) {
  const categoryLabels: Record<string, string> = {
    lead_handling: "Lead Mastery",
    listings: "Listing Excellence",
    transactions: "Deal Management",
    open_house: "Open House Strategies",
    training: "Agent Development",
    general: "Quick Reference",
  }

  return (
    <Link href={`/dashboard/knowledge/${article.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2">{article.title}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
          <CardDescription>
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[article.category] || article.category}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{article.content.substring(0, 150)}...</p>
          {article.related_mission_template && (
            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Related mission: {article.related_mission_template.title}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
