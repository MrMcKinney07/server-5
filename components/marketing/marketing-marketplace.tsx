"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, ShoppingCart, Zap, Users, Megaphone, BarChart3, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MarketingProduct {
  id: string
  name: string
  category: "ads" | "va" | "templates" | "tools"
  description: string
  features: string[]
  price: number
  icon: React.ReactNode
  popular?: boolean
  image?: string
  tier?: "starter" | "pro" | "enterprise"
}

const MARKETING_PRODUCTS: MarketingProduct[] = [
  // Ads
  {
    id: "social-ads-starter",
    name: "Social Media Ads Kit",
    category: "ads",
    description: "Pre-designed Facebook & Instagram ads for real estate listings",
    features: ["50 Ad templates", "MLS integration", "Lead capture forms", "Analytics dashboard"],
    price: 49,
    tier: "starter",
    icon: <Megaphone className="h-6 w-6" />,
  },
  {
    id: "social-ads-pro",
    name: "Premium Social Ads",
    category: "ads",
    description: "Advanced targeting and retargeting campaigns",
    features: ["500 Ad templates", "AI optimization", "Multi-platform support", "Lead scoring", "Conversion tracking"],
    price: 149,
    tier: "pro",
    icon: <Megaphone className="h-6 w-6" />,
    popular: true,
  },
  {
    id: "google-ads-suite",
    name: "Google Ads Suite",
    category: "ads",
    description: "Google Ads setup, optimization & management",
    features: ["Keyword research", "Campaign setup", "Monthly optimization", "Performance reports"],
    price: 199,
    tier: "pro",
    icon: <BarChart3 className="h-6 w-6" />,
  },

  // Virtual Assistants
  {
    id: "va-part-time",
    name: "Part-Time Virtual Assistant",
    category: "va",
    description: "20 hours/week - Calls, emails, scheduling",
    features: ["Lead follow-ups", "Calendar management", "Email management", "Basic CRM updates"],
    price: 299,
    tier: "starter",
    icon: <Users className="h-6 w-6" />,
  },
  {
    id: "va-full-time",
    name: "Full-Time Virtual Assistant",
    category: "va",
    description: "40 hours/week - Complete administrative support",
    features: ["24/7 availability", "Lead qualification", "Transaction support", "Database management", "Team coordination"],
    price: 799,
    tier: "pro",
    icon: <Users className="h-6 w-6" />,
    popular: true,
  },
  {
    id: "va-dedicated-admin",
    name: "Dedicated Admin Team",
    category: "va",
    description: "Multiple specialists for your entire operation",
    features: ["Team of 3-5 people", "Custom workflows", "Premium support", "Training included"],
    price: 1999,
    tier: "enterprise",
    icon: <Users className="h-6 w-6" />,
  },

  // Templates
  {
    id: "email-templates",
    name: "Email Campaign Templates",
    category: "templates",
    description: "100+ professional email templates",
    features: ["Buyer sequences", "Seller sequences", "Follow-up templates", "Holiday campaigns"],
    price: 29,
    tier: "starter",
    icon: <Megaphone className="h-6 w-6" />,
  },
  {
    id: "video-templates",
    name: "Video Marketing Pack",
    category: "templates",
    description: "Property showcase & testimonial video templates",
    features: ["20 video templates", "Editing software access", "Music library", "Stock footage"],
    price: 79,
    tier: "pro",
    icon: <Megaphone className="h-6 w-6" />,
  },
  {
    id: "landing-pages",
    name: "High-Converting Landing Pages",
    category: "templates",
    description: "Done-for-you landing page templates",
    features: ["10 page templates", "CRM integration", "Mobile optimized", "A/B testing tools"],
    price: 99,
    tier: "pro",
    icon: <Megaphone className="h-6 w-6" />,
  },

  // Tools
  {
    id: "crm-integration",
    name: "Advanced CRM Tools",
    category: "tools",
    description: "Automation & workflow enhancements",
    features: ["Custom automations", "Integration support", "Priority support"],
    price: 39,
    tier: "starter",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    id: "analytics-premium",
    name: "Premium Analytics Suite",
    category: "tools",
    description: "Deep insights into your marketing ROI",
    features: ["Real-time dashboards", "Custom reports", "Predictive analytics", "Team performance tracking"],
    price: 149,
    tier: "pro",
    icon: <BarChart3 className="h-6 w-6" />,
    popular: true,
  },
]

export function MarketingMarketplace() {
  const [selectedProduct, setSelectedProduct] = useState<MarketingProduct | null>(null)
  const [cart, setCart] = useState<MarketingProduct[]>([])
  const [activeCategory, setActiveCategory] = useState<"all" | "ads" | "va" | "templates" | "tools">("all")
  const { toast } = useToast()

  const filteredProducts =
    activeCategory === "all" ? MARKETING_PRODUCTS : MARKETING_PRODUCTS.filter((p) => p.category === activeCategory)

  const cartTotal = cart.reduce((sum, p) => sum + p.price, 0)

  const handleAddToCart = (product: MarketingProduct) => {
    setCart([...cart, product])
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    })
  }

  const handleRemoveFromCart = (index: number) => {
    const removed = cart[index]
    setCart(cart.filter((_, i) => i !== index))
    toast({
      title: "Removed from cart",
      description: `${removed.name} has been removed`,
    })
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-primary/20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-3 text-white">Marketing Marketplace</h1>
          <p className="text-lg text-slate-300 mb-4">
            Scale your business with premium marketing materials, virtual assistants, and proven strategies
          </p>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>All products come with full support and integration</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={(v) => setActiveCategory(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-5 bg-white/5 border border-white/10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="va">VA</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-8 mt-8">
          {/* Products Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                  product.popular ? "md:col-span-2 lg:col-span-1 ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                }`}
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Popular Badge */}
                {product.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white z-10">Popular</Badge>
                )}

                {/* Tier Badge */}
                <Badge
                  variant="outline"
                  className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm border-white/20 text-white z-10 capitalize"
                >
                  {product.tier}
                </Badge>

                <div className="relative flex-1 p-6 space-y-6 flex flex-col">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {product.icon}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{product.description}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {product.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <Check className="h-4 w-4 text-primary/80 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {product.features.length > 3 && (
                        <li className="text-sm text-primary/80 font-medium">+{product.features.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  {/* Price & CTA */}
                  <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">${product.price}</span>
                      <span className="text-sm text-slate-400">/month</span>
                    </div>
                    <Button
                      className="w-full group/btn"
                      onClick={() => {
                        handleAddToCart(product)
                        setSelectedProduct(product)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card className="p-12">
              <div className="text-center space-y-2">
                <Megaphone className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold">No products in this category</h3>
                <p className="text-muted-foreground">Check back soon for more options!</p>
              </div>
            </Card>
          )}
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
                Clear Cart
              </Button>
              <Button className="gap-2">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProduct?.icon}
              {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>{selectedProduct?.description}</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Included Features:</h4>
                <ul className="space-y-2">
                  {selectedProduct.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Price per month:</span>
                  <span className="font-semibold text-white">${selectedProduct.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cancel anytime</span>
                  <span className="text-primary">No lock-in</span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Confirm Add to Cart
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
