"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Eye, EyeOff } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { KnowledgeArticleWithRelations, MissionTemplate } from "@/lib/types/database"

interface AdminKnowledgeManagerProps {
  articles: KnowledgeArticleWithRelations[]
  missionTemplates: MissionTemplate[]
}

const categories = [
  { id: "lead_handling", label: "Lead Handling" },
  { id: "listings", label: "Listings" },
  { id: "transactions", label: "Transactions" },
  { id: "open_house", label: "Open Houses" },
  { id: "training", label: "Training" },
  { id: "general", label: "General" },
]

export function AdminKnowledgeManager({ articles, missionTemplates }: AdminKnowledgeManagerProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticleWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleAddArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string

    const { error } = await supabase.from("knowledge_articles").insert({
      title,
      slug: generateSlug(title),
      content: formData.get("content") as string,
      category: formData.get("category") as string,
      related_mission_template_id: (formData.get("related_mission_template_id") as string) || null,
      related_transaction_stage: (formData.get("related_transaction_stage") as string) || null,
      is_published: formData.get("is_published") === "on",
    })

    setIsLoading(false)
    if (!error) {
      setIsAddOpen(false)
      router.refresh()
    }
  }

  const handleUpdateArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingArticle) return
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    const { error } = await supabase
      .from("knowledge_articles")
      .update({
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        related_mission_template_id: (formData.get("related_mission_template_id") as string) || null,
        related_transaction_stage: (formData.get("related_transaction_stage") as string) || null,
        is_published: formData.get("is_published") === "on",
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingArticle.id)

    setIsLoading(false)
    if (!error) {
      setEditingArticle(null)
      router.refresh()
    }
  }

  const togglePublished = async (articleId: string, currentState: boolean) => {
    await supabase
      .from("knowledge_articles")
      .update({ is_published: !currentState, updated_at: new Date().toISOString() })
      .eq("id", articleId)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Article</DialogTitle>
              <DialogDescription>Add a new knowledge base article or SOP</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddArticle}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" required defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="related_mission_template_id">Related Mission</Label>
                    <Select name="related_mission_template_id">
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        {missionTemplates.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea id="content" name="content" required rows={10} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="is_published" name="is_published" />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Article"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categories.find((c) => c.id === article.category)?.label || article.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {article.is_published ? (
                      <Badge className="bg-green-600">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(article.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublished(article.id, article.is_published)}
                      >
                        {article.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingArticle(article)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          {editingArticle && (
            <form onSubmit={handleUpdateArticle}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input id="edit-title" name="title" defaultValue={editingArticle.title} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select name="category" defaultValue={editingArticle.category}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-mission">Related Mission</Label>
                    <Select
                      name="related_mission_template_id"
                      defaultValue={editingArticle.related_mission_template_id || undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        {missionTemplates.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Content *</Label>
                  <Textarea id="edit-content" name="content" defaultValue={editingArticle.content} required rows={10} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="edit-is_published" name="is_published" defaultChecked={editingArticle.is_published} />
                  <Label htmlFor="edit-is_published">Published</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
