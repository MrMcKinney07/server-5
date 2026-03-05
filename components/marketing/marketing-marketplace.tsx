"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, ShoppingCart, Zap, MapPin, TrendingUp, Users, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ZipCodeListing {
  id: string
  zipCode: string
  area: string
  state: string
  avgHomePrice: number
  activeListings: number
  monthlyLeads: number
  marketDemand: "high" | "medium" | "low"
  price: number
  icon: React.ReactNode
  popular?: boolean
}

const ZIP_CODE_LISTINGS: ZipCodeListing[] = [
  {
    id: "zip-90210",
    zipCode: "90210",
    area: "Beverly Hills",
    state: "CA",
    avgHomePrice: 2850000,
    activeListings: 157,
    monthlyLeads: 340,
    marketDemand: "high",
    price: 599,
    icon: <MapPin className="h-6 w-6" />,
    popular: true,
  },
  {
    id: "zip-10021",
    zipCode: "10021",
    area: "Manhattan",
    state: "NY",
    avgHomePrice: 3200000,
    activeListings: 203,
    monthlyLeads: 425,
    marketDemand: "high",
    price: 749,
    icon: <MapPin className="h-6 w-6" />,
    popular: true,
  },
  {
    id: "zip-33139",
    zipCode: "33139",
    area: "Miami Beach",
    state: "FL",
    avgHomePrice: 1850000,
    activeListings: 89,
    monthlyLeads: 210,
    marketDemand: "high",
    price: 449,
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    id: "zip-78701",
    zipCode: "78701",
    area: "Downtown Austin",
    state: "TX",
    avgHomePrice: 950000,
    activeListings: 112,
    monthlyLeads: 280,
    marketDemand: "medium",
    price: 299,
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    id: "zip-94301",
    zipCode: "94301",
    area: "Palo Alto",
    state: "CA",
    avgHomePrice: 2600000,
    activeListings: 134,
    monthlyLeads: 305,
    marketDemand: "high",
    price: 649,
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    id: "zip-60611",
    zipCode: "60611",
    area: "Gold Coast",
    state: "IL",
    avgHomePrice: 1200000,
    activeListings: 78,
    monthlyLeads: 190,
    marketDemand: "medium",
    price: 349,
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    id: "zip-75201",
    zipCode: "75201",
    area: "Dallas Downtown",
    state: "TX",
    avgHomePrice: 750000,
    activeListings: 95,
    monthlyLeads: 220,
    marketDemand: "medium",
    price: 249,
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    id: "zip-98102",
    zipCode: "98102",
    area: "Seattle Center",
    state: "WA",
    avgHomePrice: 1150000,
    activeListings: 67,
    monthlyLeads: 165,
    marketDemand: "low",
    price: 199,
    icon: <MapPin className="h-6 w-6" />,
  },
]

export function MarketingMarketplace() {
  const [selectedZip, setSelectedZip] = useState<ZipCodeListing | null>(null)
  const [cart, setCart] = useState<ZipCodeListing[]>([])
  const [activeMarket, setActiveMarket] = useState<"all" | "high" | "medium" | "low">("all")
  const { toast } = useToast()

  const filteredZips =
    activeMarket === "all" ? ZIP_CODE_LISTINGS : ZIP_CODE_LISTINGS.filter((z) => z.marketDemand === activeMarket)

  const cartTotal = cart.reduce((sum, z) => sum + z.price, 0)

  const handleAddToCart = (zip: ZipCodeListing) => {
    setCart([...cart, zip])
    toast({
      title: "Added to cart",
      description: `${zip.zipCode} - ${zip.area} has been added`,
    })
  }

  const handleRemoveFromCart = (index: number) => {
    const removed = cart[index]
    setCart(cart.filter((_, i) => i !== index))
    toast({
      title: "Removed from cart",
      description: `${removed.zipCode} has been removed`,
    })
  }

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "high":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-primary/20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-3 text-white">Zip Code Territory</h1>
          <p className="text-lg text-slate-300 mb-4">
            Secure exclusive market territories with proven lead generation and market data
          </p>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>Real-time market data & lead exclusivity</span>
          </div>
        </div>
      </div>

      {/* Market Demand Tabs */}
      <Tabs defaultValue="all" onValueChange={(v) => setActiveMarket(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 bg-white/5 border border-white/10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="high">High Demand</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="low">Low</TabsTrigger>
        </TabsList>

        <TabsContent value={activeMarket} className="space-y-8 mt-8">
          {/* Zip Codes Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredZips.map((zip) => (
              <Card
                key={zip.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                  zip.popular ? "md:col-span-2 lg:col-span-1 ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {zip.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white z-10">Premium</Badge>
                )}

                <Badge
                  variant="outline"
                  className={`absolute top-4 left-4 z-10 border ${getDemandColor(zip.marketDemand)}`}
                >
                  {zip.marketDemand === "high" && <TrendingUp className="h-3 w-3 mr-1" />}
                  {zip.marketDemand.charAt(0).toUpperCase() + zip.marketDemand.slice(1)} Demand
                </Badge>

                <div className="relative flex-1 p-6 space-y-6 flex flex-col">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-white">{zip.zipCode}</div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-primary">{zip.area}</p>
                      <p className="text-sm text-slate-400">{zip.state}</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Avg Home Price</span>
                      <span className="text-white font-semibold">${(zip.avgHomePrice / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Active Listings</span>
                      <span className="text-white font-semibold">{zip.activeListings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Monthly Leads</span>
                      <span className="text-primary font-semibold">{zip.monthlyLeads}+</span>
                    </div>
                  </div>

                  <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">${zip.price}</span>
                      <span className="text-sm text-slate-400">/month</span>
                    </div>
                    <Button
                      className="w-full group/btn"
                      onClick={() => {
                        handleAddToCart(zip)
                        setSelectedZip(zip)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Secure Territory
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="sticky bottom-0 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-300">
                {cart.length} zip code{cart.length !== 1 ? "s" : ""} selected
              </p>
              <p className="text-2xl font-bold text-white">
                ${cartTotal}
                <span className="text-lg text-slate-400 font-normal">/month</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCart([])}>
                Clear
              </Button>
              <Button className="gap-2">
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Zip Detail Dialog */}
      <Dialog open={!!selectedZip} onOpenChange={() => setSelectedZip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedZip?.zipCode} - {selectedZip?.area}
            </DialogTitle>
            <DialogDescription>{selectedZip?.state}</DialogDescription>
          </DialogHeader>

          {selectedZip && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">Avg Home Price</p>
                  <p className="text-2xl font-bold text-white">${(selectedZip.avgHomePrice / 1000000).toFixed(1)}M</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">Active Listings</p>
                  <p className="text-2xl font-bold text-white">{selectedZip.activeListings}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">Monthly Leads</p>
                  <p className="text-2xl font-bold text-primary">{selectedZip.monthlyLeads}+</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">Market Demand</p>
                  <p className="text-2xl font-bold text-white capitalize">{selectedZip.marketDemand}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Territory Includes
                </h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    Exclusive zip code territory rights
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    Real-time market analytics dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    Pre-qualified leads direct to your CRM
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    Competitor activity tracking
                  </li>
                </ul>
              </div>

              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Monthly Territory Fee:</span>
                  <span className="font-semibold text-white">${selectedZip.price}</span>
                </div>
                <p className="text-xs text-slate-400">Cancel anytime, no long-term commitment</p>
              </div>

              <Button className="w-full" size="lg">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Secure This Territory
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
