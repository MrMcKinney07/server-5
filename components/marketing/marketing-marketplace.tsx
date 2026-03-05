"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, ShoppingCart, Zap, MapPin, TrendingUp, Users, ArrowRight, Package } from "lucide-react"
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

interface VAPackage {
  id: string
  name: string
  hours: number
  price: number
  hourlyRate: number
  features: string[]
  popular?: boolean
}

interface PhysicalProduct {
  id: string
  name: string
  category: string
  description: string
  price: number
  quantity?: string
  features: string[]
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
]

const VA_PACKAGES: VAPackage[] = [
  {
    id: "va-20hrs",
    name: "Part-Time",
    hours: 20,
    price: 149,
    hourlyRate: 7.25,
    features: ["Lead follow-ups", "Email management", "Calendar scheduling", "Basic data entry"],
    popular: false,
  },
  {
    id: "va-40hrs",
    name: "Full-Time",
    hours: 40,
    price: 299,
    hourlyRate: 7.25,
    features: ["Lead qualification", "Transaction support", "CRM management", "Team coordination", "Unlimited support"],
    popular: true,
  },
]

const PHYSICAL_PRODUCTS: PhysicalProduct[] = [
  {
    id: "sign-24x36",
    name: "Yard Signs",
    category: "signs",
    description: "Professional real estate yard signs",
    price: 12,
    quantity: "per sign",
    features: ["Full color printing", "Weather resistant", "Standard design included", "Free shipping (50+)"],
    popular: true,
  },
  {
    id: "cards-500",
    name: "Business Cards",
    category: "cards",
    description: "Premium business cards",
    price: 25,
    quantity: "per 500",
    features: ["Glossy or matte", "Custom design", "Quick turnaround", "Free design consultation"],
    popular: true,
  },
  {
    id: "flyers-500",
    name: "Property Flyers",
    category: "flyers",
    description: "Full-color property listing flyers",
    price: 35,
    quantity: "per 500",
    features: ["High-quality print", "MLS integration ready", "Multiple templates", "Digital version included"],
  },
  {
    id: "postcards-500",
    name: "Direct Mail Postcards",
    category: "postcards",
    description: "Targeted direct mail postcards",
    price: 45,
    quantity: "per 500",
    features: ["Full color", "Personalized options", "Address printing", "Postage assistance"],
  },
  {
    id: "banners-vinyl",
    name: "Vinyl Banners",
    category: "banners",
    description: "Large format vinyl banners",
    price: 55,
    quantity: "per 10x3ft",
    features: ["Custom design", "Weather-proof", "Free design", "Installation hardware included"],
  },
  {
    id: "door-hangers",
    name: "Door Hangers",
    category: "hangers",
    description: "Durable door hangers for prospecting",
    price: 30,
    quantity: "per 500",
    features: ["Full color", "Die-cut design", "Tear-off contact card", "Recyclable material"],
  },
]

export function MarketingMarketplace() {
  const [activeTab, setActiveTab] = useState("zip-codes")
  const [selectedZip, setSelectedZip] = useState<ZipCodeListing | null>(null)
  const [selectedVA, setSelectedVA] = useState<VAPackage | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PhysicalProduct | null>(null)
  const [cart, setCart] = useState<(ZipCodeListing | VAPackage | PhysicalProduct)[]>([])
  const [activeMarket, setActiveMarket] = useState<"all" | "high" | "medium" | "low">("all")
  const { toast } = useToast()

  const filteredZips =
    activeMarket === "all" ? ZIP_CODE_LISTINGS : ZIP_CODE_LISTINGS.filter((z) => z.marketDemand === activeMarket)

  const cartTotal = cart.reduce((sum, item) => sum + (item as any).price, 0)

  const handleAddToCart = (item: any, type: string) => {
    setCart([...cart, item])
    const name = item.name || `${item.zipCode} - ${item.area}` || "Item"
    toast({
      title: "Added to cart",
      description: `${name} has been added`,
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
          <h1 className="text-4xl font-bold mb-3 text-white">Marketing Hub</h1>
          <p className="text-lg text-slate-300 mb-4">
            Scale your business with territories, virtual assistants, and professional marketing materials
          </p>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>Everything you need to grow your real estate business</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger value="zip-codes">Zip Codes</TabsTrigger>
          <TabsTrigger value="va">Virtual Assistants</TabsTrigger>
          <TabsTrigger value="physical">Physical Materials</TabsTrigger>
        </TabsList>

        {/* ZIP CODES TAB */}
        <TabsContent value="zip-codes" className="space-y-8 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Exclusive Territories</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">High Demand</Badge>
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={(v) => setActiveMarket(v as any)} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4 bg-white/5 border border-white/10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high">High</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="low">Low</TabsTrigger>
            </TabsList>

            <TabsContent value={activeMarket} className="space-y-8 mt-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredZips.map((zip) => (
                  <Card
                    key={zip.id}
                    className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                      zip.popular ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
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
                      {zip.marketDemand.charAt(0).toUpperCase() + zip.marketDemand.slice(1)}
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
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Avg Home Price</span>
                          <span className="text-white font-semibold">${(zip.avgHomePrice / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Leads/Month</span>
                          <span className="text-primary font-semibold">{zip.monthlyLeads}+</span>
                        </div>
                      </div>

                      <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">${zip.price}</span>
                          <span className="text-sm text-slate-400">/mo</span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            handleAddToCart(zip, "zip")
                            setSelectedZip(zip)
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* VA TAB */}
        <TabsContent value="va" className="space-y-8 mt-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Virtual Assistants</h2>
            <p className="text-slate-400">Hire dedicated VAs at $7.25/hour - choose your hours</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {VA_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                  pkg.popular ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {pkg.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white z-10">Popular</Badge>
                )}

                <div className="relative flex-1 p-6 space-y-6 flex flex-col">
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-white">{pkg.name}</p>
                    <p className="text-sm text-slate-400">{pkg.hours} hours/month</p>
                  </div>

                  <div className="space-y-3 bg-white/5 rounded-lg p-4">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                    <div>
                      <div className="text-3xl font-bold text-white">${pkg.price}</div>
                      <p className="text-sm text-slate-400">${pkg.hourlyRate}/hr ({pkg.hours}hrs)</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleAddToCart(pkg, "va")
                        setSelectedVA(pkg)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PHYSICAL MATERIALS TAB */}
        <TabsContent value="physical" className="space-y-8 mt-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Physical Marketing Materials</h2>
            <p className="text-slate-400">Professional signs, cards, flyers, and more</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PHYSICAL_PRODUCTS.map((product) => (
              <Card
                key={product.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                  product.popular ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {product.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white z-10">Popular</Badge>
                )}

                <Badge variant="outline" className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm border-white/20 text-white z-10 capitalize">
                  {product.category}
                </Badge>

                <div className="relative flex-1 p-6 space-y-6 flex flex-col">
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-white">{product.name}</p>
                    <p className="text-sm text-slate-400">{product.description}</p>
                  </div>

                  <div className="space-y-2 bg-white/5 rounded-lg p-4">
                    {product.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                    <div>
                      <div className="text-3xl font-bold text-white">${product.price}</div>
                      <p className="text-sm text-slate-400">{product.quantity}</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleAddToCart(product, "physical")
                        setSelectedProduct(product)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
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
                {cart.length} item{cart.length !== 1 ? "s" : ""} in cart
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
    </div>
  )
}
