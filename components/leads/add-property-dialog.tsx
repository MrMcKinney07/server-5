"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Home, Plus } from "lucide-react"
import { toast } from "sonner"
import { PropertySearch } from "@/components/properties/property-search"
import type { RapidAPIProperty } from "@/lib/types/property"

interface AddPropertyDialogProps {
  leadId: string
  agentId: string
}

export function AddPropertyDialog({ leadId, agentId }: AddPropertyDialogProps) {
  const [open, setOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const router = useRouter()

  const handleAddProperty = async (property: RapidAPIProperty) => {
    if (savedIds.includes(property.property_id)) return

    const supabase = createBrowserClient()
    const { error } = await supabase.from("saved_properties").insert({
      lead_id: leadId,
      agent_id: agentId,
      address: property.address.line || "Unknown address",
      city: property.address.city || null,
      state: property.address.state_code || null,
      zip: property.address.postal_code || null,
      price: property.price || null,
      beds: property.beds || null,
      baths: property.baths_full ?? property.baths ?? null,
      mls_number: property.mls_id || null,
      idx_url: property.rdc_web_url || `https://www.realtor.com/realestateandhomes-detail/${property.property_id}`,
      photo_url: property.thumbnail || property.photos?.[0]?.href || null,
    })

    if (error) {
      toast.error("Failed to save property")
    } else {
      setSavedIds((prev) => [...prev, property.property_id])
      toast.success("Property saved to lead")
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Add Property to Lead
          </DialogTitle>
          <DialogDescription>
            Search for listings and click &quot;Add to Cart&quot; to save them to this lead
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          <PropertySearch
            onAddToCart={handleAddProperty}
            cartIds={savedIds}
            compact={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
