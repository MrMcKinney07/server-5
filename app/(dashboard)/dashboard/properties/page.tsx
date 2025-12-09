import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Script from "next/script"

export default async function PropertiesPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Property Search</h1>
        <p className="text-sm text-muted-foreground">Search MLS listings with interactive map</p>
      </div>

      {/* IDX Map Search - Full featured search with built-in filters */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">MLS Map Search</CardTitle>
          <CardDescription>Use the map controls to search by location, price, beds, baths, and more</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div id="idxStart" className="w-full h-[700px]"></div>
          <Script
            src="https://mckinneyrealtyco.idxbroker.com/idx/map/mapsearch?apikey=kN7w3ySMUIniDtdf0qfLV"
            strategy="afterInteractive"
          />
        </CardContent>
      </Card>
    </div>
  )
}
