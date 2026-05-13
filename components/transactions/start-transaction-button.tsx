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
import { FileText } from "lucide-react"
import type { Property } from "@/lib/types/database"

interface StartTransactionButtonProps {
  contactId: string
  leadId?: string | null
  agentId: string
  properties?: Property[]
}

export function StartTransactionButton({ contactId, leadId, agentId, properties = [] }: StartTransactionButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    const supabase = createBrowserClient()

    // Create the transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        contact_id: contactId,
        lead_id: leadId || null,
        property_id: selectedProperty || null,
        agent_id: agentId,
        status: "new",
      })
      .select()
      .single()

    if (txError || !transaction) {
      setCreating(false)
      return
    }

    // Log activity
    await supabase.from("activities").insert({
      contact_id: contactId,
      lead_id: leadId || null,
      agent_id: agentId,
      type: "other",
      description: `Transaction created${selectedProperty ? " with property" : ""}`,
    })

    setCreating(false)
    setOpen(false)
    router.push(`/dashboard/transactions/${transaction.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Start Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Transaction</DialogTitle>
          <DialogDescription>Create a new transaction for this {leadId ? "lead" : "contact"}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {properties.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="property">Link Property (Optional)</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger id="property">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No property</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} - ${property.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            This will create a new transaction record in the system for tracking.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
