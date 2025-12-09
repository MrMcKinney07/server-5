import type React from "react"
import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Clock, ShoppingBag, FileText, Gift, Printer, Package } from "lucide-react"

const storeItems = [
  {
    id: 1,
    name: "Yard Signs",
    description: "Professional McKinney One branded yard signs",
    price: 25,
    category: "signage",
    inStock: true,
  },
  {
    id: 2,
    name: "Business Cards (500)",
    description: "Premium business cards with your contact info",
    price: 45,
    category: "print",
    inStock: true,
  },
  {
    id: 3,
    name: "Open House Kit",
    description: "Signs, flyers, and sign-in sheets for open houses",
    price: 75,
    category: "kit",
    inStock: true,
  },
  {
    id: 4,
    name: "Listing Presentation Folder",
    description: "Professional folders for listing presentations",
    price: 15,
    category: "print",
    inStock: true,
  },
  {
    id: 5,
    name: "Closing Gift Box",
    description: "Branded gift box for client closings",
    price: 50,
    category: "gift",
    inStock: false,
  },
  {
    id: 6,
    name: "Door Hangers (100)",
    description: "Custom door hangers for neighborhood farming",
    price: 35,
    category: "print",
    inStock: true,
  },
]

const categoryIcons: Record<string, React.ReactNode> = {
  signage: <Package className="h-5 w-5" />,
  print: <Printer className="h-5 w-5" />,
  kit: <ShoppingBag className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
}

export default async function StorePage() {
  const agent = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supply Store</h1>
        <p className="text-gray-600 mt-1">Order marketing materials and supplies</p>
      </div>

      {/* Office Location Card */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <MapPin className="h-5 w-5" />
            McKinney One Office
          </CardTitle>
          <CardDescription>Pick up your orders or visit us anytime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Address
              </h4>
              <p className="text-gray-600">
                123 Real Estate Boulevard
                <br />
                Suite 100
                <br />
                McKinney, TX 75070
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" />
                Contact
              </h4>
              <p className="text-gray-600">
                Phone: (469) 555-0100
                <br />
                Email: office@mckinnyone.com
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Office Hours
              </h4>
              <p className="text-gray-600">
                Mon - Fri: 9:00 AM - 6:00 PM
                <br />
                Sat: 10:00 AM - 2:00 PM
                <br />
                Sun: Closed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Items Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Supplies</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storeItems.map((item) => (
            <Card key={item.id} className={`relative ${!item.inStock ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">{categoryIcons[item.category]}</div>
                  {!item.inStock && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-600">${item.price}</span>
                  <Button disabled={!item.inStock} className="bg-blue-600 hover:bg-blue-700">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Request Custom Items */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Need Something Custom?
          </CardTitle>
          <CardDescription>Request custom marketing materials or bulk orders</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Contact the office to request custom branded materials, bulk discounts, or specialty items not listed here.
          </p>
          <Button variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50 bg-transparent">
            Submit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
