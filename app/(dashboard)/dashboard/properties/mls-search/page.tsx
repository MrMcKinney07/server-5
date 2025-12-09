import { requireAuth } from "@/lib/auth"
import { IDXWidget } from "@/components/properties/idx-widget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function MLSSearchPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">MLS Property Search</h1>
          <p className="text-sm text-muted-foreground">Search live MLS listings powered by IDX Broker</p>
        </div>
        <Link
          href="https://mckinneyrealtyco.idxbroker.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Full IDX Site <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Listings</CardTitle>
          <CardDescription>Find properties from the MLS in real-time</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[600px]">
          <IDXWidget widgetId="131657" className="w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
