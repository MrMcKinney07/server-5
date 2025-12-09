"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MissionTemplate, MissionSetSegment } from "@/lib/types/database"

interface CreateSetDialogProps {
  templates: MissionTemplate[]
}

export function CreateSetDialog({ templates }: CreateSetDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [segment, setSegment] = useState<MissionSetSegment>("custom")
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])

  function toggleTemplate(templateId: string) {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : prev.length < 10
          ? [...prev, templateId]
          : prev,
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || selectedTemplates.length === 0) return

    setLoading(true)
    const supabase = createClient()

    // Create the mission set
    const { data: newSet, error: setError } = await supabase
      .from("mission_sets")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        segment,
      })
      .select()
      .single()

    if (setError || !newSet) {
      setLoading(false)
      return
    }

    // Add the mission set items
    const items = selectedTemplates.map((templateId) => ({
      mission_set_id: newSet.id,
      mission_template_id: templateId,
      weight: 1,
    }))

    await supabase.from("mission_set_items").insert(items)

    setLoading(false)
    setOpen(false)
    setName("")
    setDescription("")
    setSegment("custom")
    setSelectedTemplates([])
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Mission Set
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Mission Set</DialogTitle>
            <DialogDescription>Group mission templates together for weekly assignment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., New Agent – Week 1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="segment">Target Segment</Label>
              <Select value={segment} onValueChange={(v) => setSegment(v as MissionSetSegment)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Agents</SelectItem>
                  <SelectItem value="seasoned">Seasoned Agents</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Select Templates ({selectedTemplates.length}/10)</Label>
              <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border p-3">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active templates available</p>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={template.id}
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={() => toggleTemplate(template.id)}
                        disabled={!selectedTemplates.includes(template.id) && selectedTemplates.length >= 10}
                      />
                      <label htmlFor={template.id} className="flex-1 cursor-pointer text-sm">
                        {template.title}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || selectedTemplates.length === 0}>
              {loading ? "Creating..." : "Create Set"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
