"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Send, Home, X } from "lucide-react"
import { toast } from "sonner"
import { PropertySearch } from "@/components/properties/property-search"
import type { RapidAPIProperty } from "@/lib/types/property"

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

function rapidApiToCart(p: RapidAPIProperty): CartProperty {
  return {
    id: p.property_id,
    address: p.address.line || "Unknown address",
    city: p.address.city,
    state: p.address.state_code,
    zip: p.address.postal_code,
    price: p.price,
    beds: p.beds,
    baths: p.baths_full ?? p.baths,
    mls_number: p.mls_id,
    idx_url: p.rdc_web_url || `https://www.realtor.com/realestateandhomes-detail/${p.property_id}`,
    photo_url: p.thumbnail || p.photos?.[0]?.href,
  }
}

function formatPrice(price?: number) {
  if (!price) return null
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price)
}

export function PropertyCart({ leads, agentId }: PropertyCartProps) {
  const [cart, setCart] = useState<CartProperty[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string>("")
  const router = useRouter()

  const cartIds = cart.map((p) => p.id)

  const addToCart = (property: RapidAPIProperty) => {
    if (cartIds.includes(property.property_id)) return
    setCart((prev) => [...prev, rapidApiToCart(property)])
    toast.success("Added to cart")
  }

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((p) => p.id !== id))
  const clearCart = () => setCart([])

  const sendToLead = async () => {
    if (!selectedLeadId) { toast.error("Please select a lead"); return }
    if (cart.length === 0) { toast.error("Cart is empty"); return }

    setIsSending(true)
    const supabase = createBrowserClient()

    try {
      const rows = cart.map((p) => ({
        lead_id: selectedLeadId,
        agent_id: agentId,
        address: p.address,
        city: p.city || null,
        state: p.state || null,
        zip: p.zip || null,
        price: p.price || null,
        beds: p.beds || null,
        baths: p.baths || null,
        mls_number: p.mls_number || null,
        idx_url: p.idx_url,
        photo_url: p.photo_url || null,
      }))

      const { error } = await supabase.from("saved_properties").insert(rows)
      if (error) throw error

      toast.success(`${cart.length} ${cart.length === 1 ? "property" : "properties"} saved to lead`)
      clearCart()
      setSelectedLeadId("")
      setIsOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to save properties")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {cart.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col overflow-hidden p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Property Cart
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-1">{cart.length}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>Search listings and add them to send to a lead</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="search" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="mx-6 mt-4 flex-shrink-0 w-auto self-start">
            <TabsTrigger value="search">Search Listings</TabsTrigger>
            <TabsTrigger value="cart">
              Cart
              {cart.length > 0 && <Badge className="ml-1.5 h-5 px-1.5 text-xs">{cart.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ---- SEARCH TAB ---- */}
          <TabsContent value="search" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
            <PropertySearch
              onAddToCart={addToCart}
              cartIds={cartIds}
              compact={true}
            />
          </TabsContent>

          {/* ---- CART TAB ---- */}
          <TabsContent value="cart" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 flex flex-col gap-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg border-dashed">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Your cart is empty</p>
                <p className="text-sm mt-1">Search for listings and click &quot;Add to Cart&quot;</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{cart.length} {cart.length === 1 ? "property" : "properties"} selected</p>
                  <Button variant="ghost" size="sm" onClick={clearCart}>Clear all</Button>
                </div>

                <div className="space-y-2">
                  {cart.map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <div className="w-14 h-14 rounded bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.address} className="w-full h-full object-cover" />
                        ) : (
                          <Home className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.city, p.state, p.zip].filter(Boolean).join(", ")}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {p.price && <span className="font-semibold text-foreground">{formatPrice(p.price)}</span>}
                          {p.beds && <span>{p.beds} bd</span>}
                          {p.baths && <span>{p.baths} ba</span>}
                          {p.mls_number && <span>MLS# {p.mls_number}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={() => removeFromCart(p.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Card className="p-4 mt-auto">
                  <h3 className="font-medium mb-3 text-sm">Send to Lead</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Select Lead</Label>
                      <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a lead..." />
                        </SelectTrigger>
                        <SelectContent>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.first_name} {lead.last_name}
                              {lead.email ? ` — ${lead.email}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={sendToLead}
                      disabled={!selectedLeadId || isSending}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? "Saving..." : `Save ${cart.length} ${cart.length === 1 ? "Property" : "Properties"} to Lead`}
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
