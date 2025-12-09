import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Home, ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function PropertiesPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Properties</h1>
        <p className="text-sm text-muted-foreground">Search and manage property listings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-cyan-500" />
              MLS Search
            </CardTitle>
            <CardDescription>Search live MLS listings powered by IDX Broker</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access real-time property listings from the MLS. Search by location, price, beds, baths, and more.
            </p>
            <Button asChild>
              <Link href="/dashboard/properties/mls-search">Search MLS Listings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-emerald-500" />
              Full IDX Website
            </CardTitle>
            <CardDescription>Visit the full IDX Broker property search site</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access all advanced search features, saved searches, and detailed property information.
            </p>
            <Button variant="outline" asChild>
              <Link
                href="https://mckinneyrealtyco.idxbroker.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Open IDX Site <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
