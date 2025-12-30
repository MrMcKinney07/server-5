"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Send, Home, X } from "lucide-react"
import { toast } from "sonner"

interface CartProperty {
  id: string
  address: string
  city?: string
  state?: string
  zip?: string
  price?: number
  beds?: number
  baths?: number
  mls_number?: string
  idx_url: string
  photo_url?: string
}

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

interface PropertyCartProps {
  leads: Lead[]
  agentId: string
}

export function PropertyCart({ leads, agentId }: PropertyCartProps) {
  const [cart, setCart] = useState<CartProperty[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string>("")

  // Quick add form
  const [quickAddData, setQuickAddData] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    price: "",
    beds: "",
    baths: "",
    mls_number: "",
    idx_url: "",
    photo_url: "",
  })

  const router = useRouter()

  const addToCart = () => {
    if (!quickAddData.address || !quickAddData.idx_url) {
      toast.error("Address and Property URL are required")
      return
    }

    const newProperty: CartProperty = {
      id: Date.now().toString(),
      address: quickAddData.address,
      city: quickAddData.city || undefined,
      state: quickAddData.state || undefined,
      zip: quickAddData.zip || undefined,
      price: quickAddData.price ? Number.parseFloat(quickAddData.price) : undefined,
      beds: quickAddData.beds ? Number.parseInt(quickAddData.beds) : undefined,
      baths: quickAddData.baths ? Number.parseFloat(quickAddData.baths) : undefined,
      mls_number: quickAddData.mls_number || undefined,
      idx_url: quickAddData.idx_url,
      photo_url: quickAddData.photo_url || undefined,
    }

    setCart([...cart, newProperty])

    // Reset form
    setQuickAddData({
      address: "",
      city: "",
      state: "",
      zip: "",
      price: "",
      beds: "",
      baths: "",
      mls_number: "",
      idx_url: "",
      photo_url: "",
    })

    toast.success("Added to cart!")
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((p) => p.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const sendToLead = async () => {
    if (!selectedLeadId) {
      toast.error("Please select a lead")
      return
    }

    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    setIsSending(true)
    const supabase = createBrowserClient()

    try {
      // Save all properties to the selected lead
      const propertiesToSave = cart.map((property) => ({
        lead_id: selectedLeadId,
        agent_id: agentId,
        address: property.address,
        city: property.city || null,
        state: property.state || null,
        zip: property.zip || null,
        price: property.price || null,
        beds: property.beds || null,
        baths: property.baths || null,
        mls_number: property.mls_number || null,
        idx_url: property.idx_url,
        photo_url: property.photo_url || null,
      }))

      const { error } = await supabase.from("saved_properties").insert(propertiesToSave)

      if (error) throw error

      toast.success(`${cart.length} properties sent to lead!`)
      clearCart()
      setSelectedLeadId("")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to send properties:", error)
      toast.error("Failed to send properties")
    } finally {
      setIsSending(false)
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return null
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {cart.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Property Cart ({cart.length})
          </SheetTitle>
          <SheetDescription>Add properties and send them to a lead</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Add Form */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Quick Add Property
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="address" className="text-xs">
                    Address *
                  </Label>
                  <Input
                    id="address"
                    value={quickAddData.address}
                    onChange={(e) => setQuickAddData({ ...quickAddData, address: e.target.value })}
                    placeholder="123 Main St"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-xs">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={quickAddData.city}
                    onChange={(e) => setQuickAddData({ ...quickAddData, city: e.target.value })}
                    placeholder="Austin"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="state" className="text-xs">
                      State
                    </Label>
                    <Input
                      id="state"
                      value={quickAddData.state}
                      onChange={(e) => setQuickAddData({ ...quickAddData, state: e.target.value })}
                      placeholder="TX"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip" className="text-xs">
                      ZIP
                    </Label>
                    <Input
                      id="zip"
                      value={quickAddData.zip}
                      onChange={(e) => setQuickAddData({ ...quickAddData, zip: e.target.value })}
                      placeholder="78701"
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="price" className="text-xs">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={quickAddData.price}
                    onChange={(e) => setQuickAddData({ ...quickAddData, price: e.target.value })}
                    placeholder="450000"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="beds" className="text-xs">
                      Beds
                    </Label>
                    <Input
                      id="beds"
                      type="number"
                      value={quickAddData.beds}
                      onChange={(e) => setQuickAddData({ ...quickAddData, beds: e.target.value })}
                      placeholder="3"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="baths" className="text-xs">
                      Baths
                    </Label>
                    <Input
                      id="baths"
                      type="number"
                      step="0.5"
                      value={quickAddData.baths}
                      onChange={(e) => setQuickAddData({ ...quickAddData, baths: e.target.value })}
                      placeholder="2"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="mls" className="text-xs">
                    MLS Number
                  </Label>
                  <Input
                    id="mls"
                    value={quickAddData.mls_number}
                    onChange={(e) => setQuickAddData({ ...quickAddData, mls_number: e.target.value })}
                    placeholder="12345678"
                    className="h-9"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="idx_url" className="text-xs">
                    Property URL *
                  </Label>
                  <Input
                    id="idx_url"
                    type="url"
                    value={quickAddData.idx_url}
                    onChange={(e) => setQuickAddData({ ...quickAddData, idx_url: e.target.value })}
                    placeholder="https://mckinneyrealtyco.idxbroker.com/..."
                    className="h-9"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="photo_url" className="text-xs">
                    Photo URL
                  </Label>
                  <Input
                    id="photo_url"
                    type="url"
                    value={quickAddData.photo_url}
                    onChange={(e) => setQuickAddData({ ...quickAddData, photo_url: e.target.value })}
                    placeholder="https://..."
                    className="h-9"
                  />
                </div>
              </div>
              <Button onClick={addToCart} className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </Card>

          {/* Cart Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Properties in Cart</h3>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  Clear All
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Cart is empty</p>
                <p className="text-sm">Add properties to send to a lead</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((property) => (
                  <div key={property.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="w-16 h-16 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                      {property.photo_url ? (
                        <img
                          src={property.photo_url || "/placeholder.svg"}
                          alt={property.address}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Home className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{property.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {[property.city, property.state].filter(Boolean).join(", ")}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {property.price && (
                          <span className="font-medium text-emerald-600">{formatPrice(property.price)}</span>
                        )}
                        {property.beds && <span>{property.beds}bd</span>}
                        {property.baths && <span>{property.baths}ba</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(property.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send to Lead */}
          {cart.length > 0 && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20">
              <h3 className="font-medium mb-3">Send to Lead</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="lead-select" className="text-xs">
                    Select Lead
                  </Label>
                  <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger id="lead-select">
                      <SelectValue placeholder="Choose a lead..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.first_name} {lead.last_name}
                          {lead.email && ` (${lead.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={sendToLead}
                  disabled={!selectedLeadId || isSending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? "Sending..." : `Send ${cart.length} ${cart.length === 1 ? "Property" : "Properties"}`}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
