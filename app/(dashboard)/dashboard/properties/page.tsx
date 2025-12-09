import { requireAuth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, MapPin } from "lucide-react"
import Script from "next/script"

export default async function PropertiesPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Property Search</h1>
        <p className="text-sm text-muted-foreground">Find properties by location, price, and features</p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="location" placeholder="City, ZIP, or Address" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price Range</Label>
              <Select>
                <SelectTrigger id="price">
                  <SelectValue placeholder="Any Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Price</SelectItem>
                  <SelectItem value="0-200000">Under $200k</SelectItem>
                  <SelectItem value="200000-400000">$200k - $400k</SelectItem>
                  <SelectItem value="400000-600000">$400k - $600k</SelectItem>
                  <SelectItem value="600000-800000">$600k - $800k</SelectItem>
                  <SelectItem value="800000-1000000">$800k - $1M</SelectItem>
                  <SelectItem value="1000000+">$1M+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beds">Bedrooms</Label>
              <Select>
                <SelectTrigger id="beds">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baths">Bathrooms</Label>
              <Select>
                <SelectTrigger id="baths">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="type">Property Type</Label>
              <Select>
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="house">Single Family</SelectItem>
                  <SelectItem value="condo">Condo/Townhouse</SelectItem>
                  <SelectItem value="multi">Multi-Family</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sqft">Square Feet</Label>
              <Select>
                <SelectTrigger id="sqft">
                  <SelectValue placeholder="Any Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Size</SelectItem>
                  <SelectItem value="0-1000">Under 1,000</SelectItem>
                  <SelectItem value="1000-1500">1,000 - 1,500</SelectItem>
                  <SelectItem value="1500-2000">1,500 - 2,000</SelectItem>
                  <SelectItem value="2000-3000">2,000 - 3,000</SelectItem>
                  <SelectItem value="3000+">3,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot">Lot Size</Label>
              <Select>
                <SelectTrigger id="lot">
                  <SelectValue placeholder="Any Lot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Lot</SelectItem>
                  <SelectItem value="0-0.25">Under 1/4 Acre</SelectItem>
                  <SelectItem value="0.25-0.5">1/4 - 1/2 Acre</SelectItem>
                  <SelectItem value="0.5-1">1/2 - 1 Acre</SelectItem>
                  <SelectItem value="1-5">1 - 5 Acres</SelectItem>
                  <SelectItem value="5+">5+ Acres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                <Search className="h-4 w-4 mr-2" />
                Search Properties
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IDX Map Search */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div id="idxStart" className="w-full h-[600px]"></div>
          <Script
            src="https://mckinneyrealtyco.idxbroker.com/idx/map/mapsearch?apikey=kN7w3ySMUIniDtdf0qfLV"
            strategy="afterInteractive"
          />
        </CardContent>
      </Card>
    </div>
  )
}
