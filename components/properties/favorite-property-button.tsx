"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Heart } from "lucide-react"
import type { Contact } from "@/lib/types/database"

interface FavoritePropertyButtonProps {
  propertyId: string
  contacts: Contact[]
  agentId: string
}

export function FavoritePropertyButton({ propertyId, contacts, agentId }: FavoritePropertyButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedContact) return

    setSaving(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("favorite_properties").insert({
      contact_id: selectedContact,
      property_id: propertyId,
      saved_by_agent_id: agentId,
    })

    setSaving(false)

    if (!error) {
      setOpen(false)
      setSelectedContact("")
      router.refresh()
    }
  }

  if (contacts.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Heart className="h-4 w-4 mr-2" />
          Save for Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save for Client</DialogTitle>
          <DialogDescription>Add this property to a client&apos;s favorites list.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Select Client</Label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger id="contact">
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedContact}>
            {saving ? "Saving..." : "Add to Favorites"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
