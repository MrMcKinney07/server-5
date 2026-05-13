import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bed, Bath, Square, ChevronLeft, ChevronRight } from "lucide-react"
import type { Property } from "@/lib/types/database"

interface PropertyGridProps {
  properties: Property[]
  total: number
  page: number
  pageSize: number
}

export function PropertyGrid({ properties, total, page, pageSize }: PropertyGridProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No properties found. Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Link key={property.id} href={`/dashboard/properties/${property.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
              <div className="aspect-[4/3] relative bg-muted">
                {property.thumbnail_url ? (
                  <img
                    src={property.thumbnail_url || "/placeholder.svg"}
                    alt={property.address}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={`/.jpg?height=300&width=400&query=${encodeURIComponent(property.address + " house exterior")}`}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Badge
                  className="absolute top-3 right-3"
                  variant={
                    property.status === "active" ? "default" : property.status === "pending" ? "secondary" : "outline"
                  }
                >
                  {property.status}
                </Badge>
              </div>
              <CardContent className="pt-4">
                <p className="text-xl font-semibold">${property.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">{property.address}</p>
                <p className="text-sm text-muted-foreground">
                  {property.city}, {property.state} {property.zip}
                </p>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {property.beds} bd
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {property.baths} ba
                  </span>
                  <span className="flex items-center gap-1">
                    <Square className="h-4 w-4" />
                    {property.sqft.toLocaleString()} sqft
                  </span>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} asChild>
            <Link href={`/dashboard/properties?page=${page - 1}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} asChild>
            <Link href={`/dashboard/properties?page=${page + 1}`}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
