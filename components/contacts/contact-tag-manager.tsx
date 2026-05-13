"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"

interface ContactTagManagerProps {
  contactId: string
  currentTags: string[]
  onUpdate: () => void
}

export function ContactTagManager({ contactId, currentTags, onUpdate }: ContactTagManagerProps) {
  const [tags, setTags] = useState<string[]>(currentTags || [])
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)
  const supabase = createBrowserClient()

  async function handleAddTag() {
    if (!newTag.trim()) return

    const tag = newTag.trim().toLowerCase()
    if (tags.includes(tag)) {
      toast.error("Tag already exists")
      return
    }

    const updatedTags = [...tags, tag]
    setTags(updatedTags)
    setNewTag("")
    await saveTags(updatedTags)
  }

  async function handleRemoveTag(tag: string) {
    const updatedTags = tags.filter((t) => t !== tag)
    setTags(updatedTags)
    await saveTags(updatedTags)
  }

  async function saveTags(updatedTags: string[]) {
    setSaving(true)
    const { error } = await supabase.from("contacts").update({ tags: updatedTags }).eq("id", contactId)

    if (error) {
      toast.error("Failed to update tags")
    } else {
      toast.success("Tags updated")
      onUpdate()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Add tag (e.g., buyer, seller, hot-lead)"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
          disabled={saving}
        />
        <Button onClick={handleAddTag} disabled={!newTag.trim() || saving} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-sm pl-3 pr-1 py-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                disabled={saving}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
