import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bed, Bath, Square, MapPin, Calendar, Hash } from "lucide-react"
import type { Property } from "@/lib/types/database"

interface PropertyDetailsProps {
  property: Property
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-[16/9] relative bg-muted rounded-lg overflow-hidden">
          {property.thumbnail_url ? (
            <img
              src={property.thumbnail_url || "/placeholder.svg"}
              alt={property.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={`/.jpg?height=600&width=1000&query=${encodeURIComponent(property.address + " house exterior photo")}`}
              alt={property.address}
              className="w-full h-full object-cover"
            />
          )}
          <Badge
            className="absolute top-4 right-4"
            variant={property.status === "active" ? "default" : property.status === "pending" ? "secondary" : "outline"}
          >
            {property.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{property.description || "No description available."}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">${property.price.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <Bed className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-lg font-semibold">{property.beds}</p>
                <p className="text-xs text-muted-foreground">Beds</p>
              </div>
              <div className="space-y-1">
                <Bath className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-lg font-semibold">{property.baths}</p>
                <p className="text-xs text-muted-foreground">Baths</p>
              </div>
              <div className="space-y-1">
                <Square className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-lg font-semibold">{property.sqft.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Sqft</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">{property.address}</p>
                <p className="text-sm text-muted-foreground">
                  {property.city}, {property.state} {property.zip}
                </p>
              </div>
            </div>
            {property.mls_id && (
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">MLS ID</p>
                  <p className="font-medium">{property.mls_id}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Listed</p>
                <p className="font-medium">{new Date(property.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
