"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { Campaign } from "@/lib/types/database"

interface CampaignDetailsProps {
  campaign: Campaign & { created_by_agent: { full_name: string; email: string } | null }
}

export function CampaignDetails({ campaign }: CampaignDetailsProps) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description || "")
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleSave() {
    setLoading(true)
    await supabase
      .from("campaigns")
      .update({ name, description: description || null })
      .eq("id", campaign.id)
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  async function toggleActive() {
    await supabase.from("campaigns").update({ is_active: !campaign.is_active }).eq("id", campaign.id)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Campaign Details</CardTitle>
        <Badge variant={campaign.is_active ? "default" : "secondary"}>
          {campaign.is_active ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{campaign.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{campaign.description || "No description"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Created By</p>
              <p className="text-sm text-muted-foreground">
                {campaign.created_by_agent?.full_name || campaign.created_by_agent?.email || "System"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">{new Date(campaign.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active-toggle" className="text-sm">
                Active
              </Label>
              <Switch id="active-toggle" checked={campaign.is_active} onCheckedChange={toggleActive} />
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="w-full">
              Edit Details
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
