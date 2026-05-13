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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import type { MissionSetWithItems, MissionTemplate, MissionSetSegment } from "@/lib/types/database"

interface EditSetDialogProps {
  set: MissionSetWithItems
  templates: MissionTemplate[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSetDialog({ set, templates, open, onOpenChange }: EditSetDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(set.name)
  const [description, setDescription] = useState(set.description ?? "")
  const [segment, setSegment] = useState<MissionSetSegment>(set.segment)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(
    set.items?.map((item) => item.mission_template_id) ?? [],
  )

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

    // Update mission set
    await supabase
      .from("mission_sets")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        segment,
      })
      .eq("id", set.id)

    // Delete existing items and re-insert
    await supabase.from("mission_set_items").delete().eq("mission_set_id", set.id)

    const items = selectedTemplates.map((templateId) => ({
      mission_set_id: set.id,
      mission_template_id: templateId,
      weight: 1,
    }))

    await supabase.from("mission_set_items").insert(items)

    setLoading(false)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Mission Set</DialogTitle>
            <DialogDescription>Update mission set details and templates</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-segment">Target Segment</Label>
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
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${template.id}`}
                      checked={selectedTemplates.includes(template.id)}
                      onCheckedChange={() => toggleTemplate(template.id)}
                      disabled={!selectedTemplates.includes(template.id) && selectedTemplates.length >= 10}
                    />
                    <label htmlFor={`edit-${template.id}`} className="flex-1 cursor-pointer text-sm">
                      {template.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || selectedTemplates.length === 0}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
