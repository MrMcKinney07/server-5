"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { MissionTemplate } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Target } from "lucide-react"

interface MissionTemplatesManagerProps {
  templates: MissionTemplate[]
}

const categoryColors: Record<string, string> = {
  prospecting: "bg-blue-100 text-blue-800",
  follow_up: "bg-purple-100 text-purple-800",
  learning: "bg-emerald-100 text-emerald-800",
  marketing: "bg-amber-100 text-amber-800",
  general: "bg-gray-100 text-gray-800",
}

export function MissionTemplatesManager({ templates }: MissionTemplatesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MissionTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points: 10,
    category: "general",
    requires_photo: false,
  })
  const router = useRouter()

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormData({
      title: "",
      description: "",
      points: 10,
      category: "general",
      requires_photo: false,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (template: MissionTemplate) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      description: template.description || "",
      points: template.points,
      category: template.category,
      requires_photo: template.requires_photo,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title) return
    setIsLoading(true)
    const supabase = createBrowserClient()

    if (editingTemplate) {
      await supabase
        .from("mission_templates")
        .update({
          title: formData.title,
          description: formData.description || null,
          points: formData.points,
          category: formData.category,
          requires_photo: formData.requires_photo,
        })
        .eq("id", editingTemplate.id)
    } else {
      await supabase.from("mission_templates").insert({
        title: formData.title,
        description: formData.description || null,
        points: formData.points,
        category: formData.category,
        requires_photo: formData.requires_photo,
        is_active: true,
      })
    }

    setDialogOpen(false)
    setIsLoading(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    const supabase = createBrowserClient()
    await supabase.from("mission_templates").delete().eq("id", id)
    router.refresh()
  }

  // Group templates by category
  const groupedTemplates = templates.reduce(
    (acc, template) => {
      const cat = template.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(template)
      return acc
    },
    {} as Record<string, MissionTemplate[]>,
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            Mission Templates
          </CardTitle>
          <CardDescription>{templates.length} active templates</CardDescription>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="bg-amber-500 hover:bg-amber-600">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{category.replace("_", " ")}</h4>
            <div className="space-y-2">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{template.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {template.points} pts
                      </Badge>
                      {template.requires_photo && (
                        <Badge variant="outline" className="text-xs">
                          Photo
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{template.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(template)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No mission templates yet</p>
            <p className="text-sm">Create your first template to get started</p>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Mission Template" : "Create Mission Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update this mission template" : "Define a new mission for agents to complete"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Make 5 Prospecting Calls"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what the agent needs to do..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 10 })}
                  min={1}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecting">Prospecting</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.requires_photo}
                onCheckedChange={(v) => setFormData({ ...formData, requires_photo: v })}
              />
              <Label>Requires photo proof</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !formData.title}>
              {isLoading ? "Saving..." : editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
