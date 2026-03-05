"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, ShoppingCart, Zap, MapPin, TrendingUp, Users, ArrowRight, Package, Palette, Upload, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
  image: string
  spotsAvailable: number
  totalSpots: number
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
  customFields: string[]
}

interface ProductCustomization {
  agentName: string
  phone: string
  email: string
  brokerage: string
  tagline: string
  colorScheme: string
  logoUrl: string
  quantity: number
}

const ZIP_CODE_LISTINGS: ZipCodeListing[] = [
  // Miami & Beaches - Premium
  {
    id: "zip-33139",
    zipCode: "33139",
    area: "Miami Beach",
    state: "FL",
    avgHomePrice: 1850000,
    activeListings: 89,
    monthlyLeads: 210,
    marketDemand: "high",
    price: 349,
    icon: <MapPin className="h-6 w-6" />,
    popular: true,
    image: "/images/zip-codes/miami-beach.jpg",
    spotsAvailable: 1,
    totalSpots: 3,
  },
  {
    id: "zip-33109",
    zipCode: "33109",
    area: "Fisher Island",
    state: "FL",
    avgHomePrice: 3200000,
    activeListings: 45,
    monthlyLeads: 85,
    marketDemand: "high",
    price: 399,
    icon: <MapPin className="h-6 w-6" />,
    popular: true,
    image: "/images/zip-codes/fisher-island.jpg",
    spotsAvailable: 2,
    totalSpots: 3,
  },
  {
    id: "zip-33301",
    zipCode: "33301",
    area: "Fort Lauderdale Beach",
    state: "FL",
    avgHomePrice: 1250000,
    activeListings: 112,
    monthlyLeads: 185,
    marketDemand: "high",
    price: 299,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/fort-lauderdale.jpg",
    spotsAvailable: 3,
    totalSpots: 3,
  },
  {
    id: "zip-33480",
    zipCode: "33480",
    area: "Palm Beach",
    state: "FL",
    avgHomePrice: 2400000,
    activeListings: 78,
    monthlyLeads: 120,
    marketDemand: "high",
    price: 379,
    icon: <MapPin className="h-6 w-6" />,
    popular: true,
    image: "/images/zip-codes/palm-beach.jpg",
    spotsAvailable: 0,
    totalSpots: 3,
  },
  {
    id: "zip-33140",
    zipCode: "33140",
    area: "North Miami Beach",
    state: "FL",
    avgHomePrice: 950000,
    activeListings: 134,
    monthlyLeads: 165,
    marketDemand: "medium",
    price: 199,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/north-miami-beach.jpg",
    spotsAvailable: 2,
    totalSpots: 3,
  },
  {
    id: "zip-33304",
    zipCode: "33304",
    area: "Wilton Manors",
    state: "FL",
    avgHomePrice: 680000,
    activeListings: 95,
    monthlyLeads: 140,
    marketDemand: "medium",
    price: 179,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/wilton-manors.jpg",
    spotsAvailable: 3,
    totalSpots: 3,
  },
  // Central Florida - Orlando Area
  {
    id: "zip-32801",
    zipCode: "32801",
    area: "Downtown Orlando",
    state: "FL",
    avgHomePrice: 520000,
    activeListings: 156,
    monthlyLeads: 220,
    marketDemand: "high",
    price: 249,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/downtown-orlando.jpg",
    spotsAvailable: 1,
    totalSpots: 3,
  },
  {
    id: "zip-32789",
    zipCode: "32789",
    area: "Winter Park",
    state: "FL",
    avgHomePrice: 750000,
    activeListings: 98,
    monthlyLeads: 175,
    marketDemand: "high",
    price: 279,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/winter-park.jpg",
    spotsAvailable: 2,
    totalSpots: 3,
  },
  {
    id: "zip-34786",
    zipCode: "34786",
    area: "Windermere",
    state: "FL",
    avgHomePrice: 1100000,
    activeListings: 87,
    monthlyLeads: 145,
    marketDemand: "high",
    price: 329,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/windermere.jpg",
    spotsAvailable: 3,
    totalSpots: 3,
  },
  {
    id: "zip-32819",
    zipCode: "32819",
    area: "Dr. Phillips",
    state: "FL",
    avgHomePrice: 650000,
    activeListings: 124,
    monthlyLeads: 195,
    marketDemand: "medium",
    price: 189,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/dr-phillips.jpg",
    spotsAvailable: 1,
    totalSpots: 3,
  },
  {
    id: "zip-32836",
    zipCode: "32836",
    area: "Lake Buena Vista",
    state: "FL",
    avgHomePrice: 580000,
    activeListings: 89,
    monthlyLeads: 160,
    marketDemand: "medium",
    price: 169,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/lake-buena-vista.jpg",
    spotsAvailable: 2,
    totalSpots: 3,
  },
  {
    id: "zip-34747",
    zipCode: "34747",
    area: "Celebration",
    state: "FL",
    avgHomePrice: 620000,
    activeListings: 76,
    monthlyLeads: 130,
    marketDemand: "medium",
    price: 179,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/celebration.jpg",
    spotsAvailable: 3,
    totalSpots: 3,
  },
  // Surrounding Areas
  {
    id: "zip-32746",
    zipCode: "32746",
    area: "Lake Mary",
    state: "FL",
    avgHomePrice: 480000,
    activeListings: 145,
    monthlyLeads: 185,
    marketDemand: "medium",
    price: 149,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/lake-mary.jpg",
    spotsAvailable: 2,
    totalSpots: 3,
  },
  {
    id: "zip-34711",
    zipCode: "34711",
    area: "Clermont",
    state: "FL",
    avgHomePrice: 420000,
    activeListings: 178,
    monthlyLeads: 210,
    marketDemand: "medium",
    price: 129,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/clermont.jpg",
    spotsAvailable: 3,
    totalSpots: 3,
  },
  {
    id: "zip-32765",
    zipCode: "32765",
    area: "Oviedo",
    state: "FL",
    avgHomePrice: 450000,
    activeListings: 112,
    monthlyLeads: 155,
    marketDemand: "low",
    price: 99,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/oviedo.jpg",
    spotsAvailable: 3,
    totalSpots: 3,
  },
  {
    id: "zip-34744",
    zipCode: "34744",
    area: "Kissimmee",
    state: "FL",
    avgHomePrice: 380000,
    activeListings: 198,
    monthlyLeads: 240,
    marketDemand: "low",
    price: 90,
    icon: <MapPin className="h-6 w-6" />,
    image: "/images/zip-codes/kissimmee.jpg",
    spotsAvailable: 3,
    totalSpots: 3,
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
    customFields: ["agentName", "phone", "brokerage", "colorScheme", "logo"],
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
    customFields: ["agentName", "phone", "email", "brokerage", "tagline", "colorScheme", "logo"],
  },
  {
    id: "flyers-500",
    name: "Property Flyers",
    category: "flyers",
    description: "Full-color property listing flyers",
    price: 35,
    quantity: "per 500",
    features: ["High-quality print", "MLS integration ready", "Multiple templates", "Digital version included"],
    customFields: ["agentName", "phone", "email", "brokerage", "colorScheme", "logo"],
  },
  {
    id: "postcards-500",
    name: "Direct Mail Postcards",
    category: "postcards",
    description: "Targeted direct mail postcards",
    price: 45,
    quantity: "per 500",
    features: ["Full color", "Personalized options", "Address printing", "Postage assistance"],
    customFields: ["agentName", "phone", "email", "brokerage", "tagline", "colorScheme", "logo"],
  },
  {
    id: "banners-vinyl",
    name: "Vinyl Banners",
    category: "banners",
    description: "Large format vinyl banners",
    price: 55,
    quantity: "per 10x3ft",
    features: ["Custom design", "Weather-proof", "Free design", "Installation hardware included"],
    customFields: ["agentName", "phone", "brokerage", "tagline", "colorScheme", "logo"],
  },
  {
    id: "door-hangers",
    name: "Door Hangers",
    category: "hangers",
    description: "Durable door hangers for prospecting",
    price: 30,
    quantity: "per 500",
    features: ["Full color", "Die-cut design", "Tear-off contact card", "Recyclable material"],
    customFields: ["agentName", "phone", "email", "tagline", "colorScheme"],
  },
]

const COLOR_SCHEMES = [
  { id: "navy-gold", name: "Navy & Gold", primary: "#1e3a5f", secondary: "#d4af37" },
  { id: "black-red", name: "Black & Red", primary: "#1a1a1a", secondary: "#dc2626" },
  { id: "green-white", name: "Forest Green", primary: "#166534", secondary: "#ffffff" },
  { id: "blue-white", name: "Ocean Blue", primary: "#1d4ed8", secondary: "#ffffff" },
  { id: "burgundy-cream", name: "Burgundy & Cream", primary: "#7c2d12", secondary: "#fef3c7" },
  { id: "teal-coral", name: "Teal & Coral", primary: "#0d9488", secondary: "#fb7185" },
]

export function MarketingMarketplace() {
  const [activeTab, setActiveTab] = useState("zip-codes")
  const [selectedZip, setSelectedZip] = useState<ZipCodeListing | null>(null)
  const [selectedVA, setSelectedVA] = useState<VAPackage | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PhysicalProduct | null>(null)
  const [customizeProduct, setCustomizeProduct] = useState<PhysicalProduct | null>(null)
  const [cart, setCart] = useState<(ZipCodeListing | VAPackage | PhysicalProduct)[]>([])
  const [activeMarket, setActiveMarket] = useState<"all" | "high" | "medium" | "low">("all")
  const [customization, setCustomization] = useState<ProductCustomization>({
    agentName: "",
    phone: "",
    email: "",
    brokerage: "",
    tagline: "",
    colorScheme: "navy-gold",
    logoUrl: "",
    quantity: 1,
  })
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
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={zip.image} 
                        alt={`${zip.area}, ${zip.state}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {zip.popular && (
                        <Badge className="absolute top-3 right-3 bg-primary text-white z-10">Premium</Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={`absolute top-3 left-3 z-10 border ${getDemandColor(zip.marketDemand)}`}
                      >
                        {zip.marketDemand === "high" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {zip.marketDemand.charAt(0).toUpperCase() + zip.marketDemand.slice(1)}
                      </Badge>

                      <div className="absolute bottom-3 left-4">
                        <div className="text-3xl font-bold text-white drop-shadow-lg">{zip.zipCode}</div>
                      </div>
                    </div>

                    <div className="relative flex-1 p-5 space-y-4 flex flex-col">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-primary">{zip.area}</p>
                        <p className="text-sm text-slate-400">{zip.state}</p>
                      </div>

<div className="space-y-2 bg-white/5 rounded-lg p-3">
  <div className="flex justify-between items-center text-sm">
  <span className="text-slate-400">Avg Home Price</span>
  <span className="text-white font-semibold">${(zip.avgHomePrice / 1000000).toFixed(1)}M</span>
  </div>
  <div className="flex justify-between items-center text-sm">
  <span className="text-slate-400">Leads/Month</span>
  <span className="text-primary font-semibold">{zip.monthlyLeads}+</span>
  </div>
  <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
  <span className="text-slate-400">Spots Available</span>
  <div className="flex items-center gap-1.5">
    {[...Array(zip.totalSpots)].map((_, i) => (
      <div 
        key={i} 
        className={`w-2.5 h-2.5 rounded-full ${i < zip.spotsAvailable ? 'bg-emerald-500' : 'bg-slate-600'}`}
      />
    ))}
    <span className={`ml-1 font-semibold ${zip.spotsAvailable === 0 ? 'text-red-400' : zip.spotsAvailable === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
      {zip.spotsAvailable}/{zip.totalSpots}
    </span>
  </div>
  </div>
  </div>

                      <div className="space-y-3 mt-auto pt-3 border-t border-white/10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">${zip.price}</span>
                          <span className="text-sm text-slate-400">/mo</span>
                        </div>
                        {zip.spotsAvailable === 0 ? (
                          <Button className="w-full" variant="outline" disabled>
                            Sold Out
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => {
                              handleAddToCart(zip, "zip")
                              setSelectedZip(zip)
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {zip.spotsAvailable === 1 ? "Last Spot!" : "Claim Spot"}
                          </Button>
                        )}
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
                      onClick={() => setCustomizeProduct(product)}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Customize & Order
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

      {/* Product Customization Dialog */}
      <Dialog open={!!customizeProduct} onOpenChange={() => setCustomizeProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Customize Your {customizeProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Personalize your marketing materials with your branding
            </DialogDescription>
          </DialogHeader>

          {customizeProduct && (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Customization Form */}
              <div className="space-y-5">
                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">1</span>
                    Your Information
                  </h3>
                  
                  {customizeProduct.customFields.includes("agentName") && (
                    <div className="space-y-2">
                      <Label htmlFor="agentName">Agent Name</Label>
                      <Input
                        id="agentName"
                        placeholder="John Smith"
                        value={customization.agentName}
                        onChange={(e) => setCustomization({ ...customization, agentName: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("phone") && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        value={customization.phone}
                        onChange={(e) => setCustomization({ ...customization, phone: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("email") && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@realestate.com"
                        value={customization.email}
                        onChange={(e) => setCustomization({ ...customization, email: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("brokerage") && (
                    <div className="space-y-2">
                      <Label htmlFor="brokerage">Brokerage Name</Label>
                      <Input
                        id="brokerage"
                        placeholder="Premier Realty Group"
                        value={customization.brokerage}
                        onChange={(e) => setCustomization({ ...customization, brokerage: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("tagline") && (
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline / Slogan</Label>
                      <Textarea
                        id="tagline"
                        placeholder="Your dream home awaits..."
                        value={customization.tagline}
                        onChange={(e) => setCustomization({ ...customization, tagline: e.target.value })}
                        className="resize-none h-20"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">2</span>
                    Branding
                  </h3>

                  {customizeProduct.customFields.includes("colorScheme") && (
                    <div className="space-y-2">
                      <Label>Color Scheme</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {COLOR_SCHEMES.map((scheme) => (
                          <button
                            key={scheme.id}
                            onClick={() => setCustomization({ ...customization, colorScheme: scheme.id })}
                            className={`p-3 rounded-lg border transition-all ${
                              customization.colorScheme === scheme.id
                                ? "border-primary ring-2 ring-primary/50"
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            <div className="flex gap-1 mb-2">
                              <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: scheme.primary }}
                              />
                              <div
                                className="w-6 h-6 rounded border border-white/20"
                                style={{ backgroundColor: scheme.secondary }}
                              />
                            </div>
                            <p className="text-xs text-slate-300">{scheme.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {customizeProduct.customFields.includes("logo") && (
                    <div className="space-y-2">
                      <Label>Upload Logo</Label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-400">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">3</span>
                    Quantity
                  </h3>
                  <div className="flex items-center gap-4">
                    <Select
                      value={String(customization.quantity)}
                      onValueChange={(v) => setCustomization({ ...customization, quantity: Number(v) })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-slate-400">{customizeProduct.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </h3>
                
                <div 
                  className="rounded-xl overflow-hidden border border-white/10"
                  style={{ 
                    backgroundColor: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.primary || "#1e3a5f"
                  }}
                >
                  {/* Preview based on product type */}
                  {customizeProduct.category === "cards" && (
                    <div className="p-6 aspect-[3.5/2] flex flex-col justify-between">
                      <div>
                        <p 
                          className="text-xl font-bold"
                          style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                        >
                          {customization.agentName || "Your Name"}
                        </p>
                        <p className="text-white/80 text-sm mt-1">
                          {customization.brokerage || "Your Brokerage"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/90 text-sm">{customization.phone || "(555) 123-4567"}</p>
                        <p className="text-white/90 text-sm">{customization.email || "email@example.com"}</p>
                        {customization.tagline && (
                          <p 
                            className="text-xs italic mt-2"
                            style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                          >
                            "{customization.tagline}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {customizeProduct.category === "signs" && (
                    <div className="p-8 aspect-[3/4] flex flex-col items-center justify-center text-center">
                      <p 
                        className="text-3xl font-bold mb-2"
                        style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                      >
                        FOR SALE
                      </p>
                      <div className="my-4 py-4 border-t border-b border-white/30 w-full">
                        <p className="text-white text-xl font-semibold">
                          {customization.agentName || "Agent Name"}
                        </p>
                        <p className="text-white/80 text-lg mt-1">
                          {customization.phone || "(555) 123-4567"}
                        </p>
                      </div>
                      <p className="text-white/70 text-sm">
                        {customization.brokerage || "Brokerage Name"}
                      </p>
                    </div>
                  )}

                  {(customizeProduct.category === "flyers" || customizeProduct.category === "postcards") && (
                    <div className="p-6 aspect-[8.5/11] flex flex-col">
                      <div 
                        className="text-center py-4 mb-4"
                        style={{ borderBottom: `2px solid ${COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37"}` }}
                      >
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                        >
                          {customization.brokerage || "Your Brokerage"}
                        </p>
                      </div>
                      <div className="flex-1 bg-white/10 rounded-lg flex items-center justify-center">
                        <p className="text-white/50">Property Image</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
                        <div>
                          <p className="text-white font-semibold">{customization.agentName || "Agent Name"}</p>
                          <p className="text-white/80 text-sm">{customization.phone || "(555) 123-4567"}</p>
                        </div>
                        {customization.tagline && (
                          <p 
                            className="text-sm italic"
                            style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                          >
                            {customization.tagline}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(customizeProduct.category === "banners" || customizeProduct.category === "hangers") && (
                    <div className="p-6 aspect-[3/1] flex items-center justify-between">
                      <div>
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                        >
                          {customization.agentName || "Agent Name"}
                        </p>
                        <p className="text-white/80">{customization.brokerage || "Brokerage"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xl">{customization.phone || "(555) 123-4567"}</p>
                        {customization.tagline && (
                          <p className="text-white/70 text-sm italic">"{customization.tagline}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <Card className="p-4 bg-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Unit Price:</span>
                    <span className="text-white">${customizeProduct.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="text-white">{customization.quantity} x {customizeProduct.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${(customizeProduct.price * customization.quantity).toFixed(2)}
                    </span>
                  </div>
                </Card>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    handleAddToCart({ ...customizeProduct, customization }, "physical")
                    setCustomizeProduct(null)
                    setCustomization({
                      agentName: "",
                      phone: "",
                      email: "",
                      brokerage: "",
                      tagline: "",
                      colorScheme: "navy-gold",
                      logoUrl: "",
                      quantity: 1,
                    })
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart - ${(customizeProduct.price * customization.quantity).toFixed(2)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
