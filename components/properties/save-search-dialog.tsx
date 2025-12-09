"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bookmark } from "lucide-react"
import type { PropertySearchQuery } from "@/lib/types/database"

interface SaveSearchDialogProps {
  query: PropertySearchQuery
  agentId: string
}

export function SaveSearchDialog({ query, agentId }: SaveSearchDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("saved_searches").insert({
      agent_id: agentId,
      name: name.trim(),
      query,
    })

    setSaving(false)

    if (!error) {
      setOpen(false)
      setName("")
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bookmark className="h-4 w-4 mr-2" />
          Save Search
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
          <DialogDescription>Save this search to quickly access it later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="searchName">Search Name</Label>
              <Input
                id="searchName"
                placeholder="e.g., McKinney 4+ beds under 500k"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Current filters:</p>
              <ul className="list-disc list-inside space-y-1">
                {query.location && <li>Location: {query.location}</li>}
                {query.minPrice && <li>Min price: ${query.minPrice.toLocaleString()}</li>}
                {query.maxPrice && <li>Max price: ${query.maxPrice.toLocaleString()}</li>}
                {query.minBeds && <li>Min beds: {query.minBeds}+</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save Search"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
