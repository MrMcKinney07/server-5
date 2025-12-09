"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, ExternalLink, Trash2, Eye, DollarSign, Bed, Bath, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SavedProperty {
  id: string
  lead_id: string
  listing_id: string | null
  mls_number: string | null
  address: string
  city: string | null
  state: string | null
  zip: string | null
  price: number | null
  beds: number | null
  baths: number | null
  photo_url: string | null
  idx_url: string
  date_added: string
  view_count?: number
  last_viewed_at?: string | null
}

interface SavedPropertiesListProps {
  properties: SavedProperty[]
  leadId: string
  leadName: string
}

export function SavedPropertiesList({ properties, leadId, leadName }: SavedPropertiesListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (propertyId: string) => {
    setIsDeleting(propertyId)
    const supabase = createBrowserClient()

    await supabase.from("saved_properties").delete().eq("id", propertyId)
    router.refresh()
    setIsDeleting(null)
  }

  const formatPrice = (price: number | null) => {
    if (!price) return null
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5" />
            Saved Properties
          </CardTitle>
          <CardDescription>Properties saved for {leadName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No properties saved yet</p>
            <p className="text-sm">Save properties from the search to track what this lead is interested in</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5" />
          Saved Properties ({properties.length})
        </CardTitle>
        <CardDescription>Properties saved for {leadName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            {/* Property Image */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {property.photo_url ? (
                <img
                  src={property.photo_url || "/placeholder.svg"}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium truncate">{property.address}</h4>
                  {(property.city || property.state || property.zip) && (
                    <p className="text-sm text-muted-foreground">
                      {[property.city, property.state, property.zip].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                {property.view_count && property.view_count > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {property.view_count} views
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm">
                {property.price && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <DollarSign className="h-3 w-3" />
                    {formatPrice(property.price)}
                  </span>
                )}
                {property.beds && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Bed className="h-3 w-3" />
                    {property.beds} bed
                  </span>
                )}
                {property.baths && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Bath className="h-3 w-3" />
                    {property.baths} bath
                  </span>
                )}
                {property.mls_number && <span className="text-muted-foreground">MLS# {property.mls_number}</span>}
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Added {formatDistanceToNow(new Date(property.date_added), { addSuffix: true })}</span>
                {property.last_viewed_at && (
                  <>
                    <span>•</span>
                    <span>
                      Last viewed {formatDistanceToNow(new Date(property.last_viewed_at), { addSuffix: true })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={property.idx_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(property.id)}
                disabled={isDeleting === property.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
