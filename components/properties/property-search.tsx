"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Bed, Bath, Square, Home, Plus, Check, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import type { RapidAPIProperty } from "@/app/api/properties/search/route"
import { cn } from "@/lib/utils"

interface PropertySearchProps {
  /** If provided, renders an "Add to cart" button on each card */
  onAddToCart?: (property: RapidAPIProperty) => void
  /** IDs already in cart so we can show a "Added" state */
  cartIds?: string[]
  /** Compact mode for dialogs */
  compact?: boolean
}

function formatPrice(price?: number) {
  if (!price) return null
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price)
}

function PropertyCard({
  property,
  onAdd,
  inCart,
  compact,
}: {
  property: RapidAPIProperty
  onAdd?: (p: RapidAPIProperty) => void
  inCart?: boolean
  compact?: boolean
}) {
  const address = property.address
  const photo = property.thumbnail || property.photos?.[0]?.href
  const fullAddress = [address.line, address.city, address.state_code, address.postal_code]
    .filter(Boolean)
    .join(", ")

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden flex flex-col transition-shadow hover:shadow-md",
        compact ? "text-sm" : "",
      )}
    >
      {/* Photo */}
      <div className={cn("relative bg-muted flex-shrink-0", compact ? "h-32" : "h-44")}>
        {photo ? (
          <img src={photo} alt={address.line || "Property"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {property.prop_status && (
          <Badge className="absolute top-2 left-2 capitalize text-xs">
            {property.prop_status.replace(/_/g, " ")}
          </Badge>
        )}
        {property.price && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
            {formatPrice(property.price)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div>
          <p className="font-medium leading-snug line-clamp-1">{address.line || "Address unavailable"}</p>
          <p className="text-muted-foreground text-xs line-clamp-1">
            {[address.city, address.state_code, address.postal_code].filter(Boolean).join(", ")}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {property.beds !== undefined && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.beds} bd
            </span>
          )}
          {(property.baths_full !== undefined || property.baths !== undefined) && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.baths_full ?? property.baths} ba
            </span>
          )}
          {property.sqft && (
            <span className="flex items-center gap-1">
              <Square className="h-3.5 w-3.5" />
              {property.sqft.toLocaleString()} sqft
            </span>
          )}
        </div>

        {property.mls_id && (
          <p className="text-xs text-muted-foreground">MLS# {property.mls_id}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {onAdd && (
            <Button
              size="sm"
              variant={inCart ? "secondary" : "default"}
              className="flex-1 h-8 text-xs"
              onClick={() => onAdd(property)}
              disabled={inCart}
            >
              {inCart ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add to Cart
                </>
              )}
            </Button>
          )}
          {property.rdc_web_url && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              asChild
            >
              <a href={property.rdc_web_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function PropertySearch({ onAddToCart, cartIds = [], compact = false }: PropertySearchProps) {
  const [location, setLocation] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minBeds, setMinBeds] = useState("any")
  const [minBaths, setMinBaths] = useState("any")
  const [propType, setPropType] = useState("any")
  const [page, setPage] = useState(1)

  const [results, setResults] = useState<RapidAPIProperty[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageSize = compact ? 6 : 12
  const totalPages = Math.ceil(total / pageSize)

  const doSearch = useCallback(async (overridePage = 1) => {
    if (!location.trim()) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ location: location.trim(), page: String(overridePage), pageSize: String(pageSize) })
      if (minPrice) params.set("minPrice", minPrice)
      if (maxPrice) params.set("maxPrice", maxPrice)
      if (minBeds && minBeds !== "any") params.set("minBeds", minBeds)
      if (minBaths && minBaths !== "any") params.set("minBaths", minBaths)
      if (propType && propType !== "any") params.set("propType", propType)

      const res = await fetch(`/api/properties/search?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Search failed")
      setResults(data.properties || [])
      setTotal(data.total || 0)
      setPage(overridePage)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }, [location, minPrice, maxPrice, minBeds, minBaths, propType, pageSize])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(1)
  }

  const handlePage = (newPage: number) => {
    doSearch(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 p-4 border rounded-lg bg-card">
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="ps-location" className="text-xs mb-1 block">Location *</Label>
          <Input
            id="ps-location"
            placeholder="City, ZIP, neighborhood..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="w-28">
          <Label htmlFor="ps-minprice" className="text-xs mb-1 block">Min Price</Label>
          <Input
            id="ps-minprice"
            type="number"
            placeholder="$0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="w-28">
          <Label htmlFor="ps-maxprice" className="text-xs mb-1 block">Max Price</Label>
          <Input
            id="ps-maxprice"
            type="number"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="w-24">
          <Label className="text-xs mb-1 block">Beds</Label>
          <Select value={minBeds} onValueChange={setMinBeds}>
            <SelectTrigger className="h-9">
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

        <div className="w-24">
          <Label className="text-xs mb-1 block">Baths</Label>
          <Select value={minBaths} onValueChange={setMinBaths}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!compact && (
          <div className="w-36">
            <Label className="text-xs mb-1 block">Type</Label>
            <Select value={propType} onValueChange={setPropType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="single_family">Single Family</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhome">Townhome</SelectItem>
                <SelectItem value="multi_family">Multi-Family</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button type="submit" disabled={!location.trim() || loading} className="h-9">
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {/* Results */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">{error}</div>
      )}

      {loading && (
        <div className={cn("grid gap-4", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
          {Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <Skeleton className={compact ? "h-32" : "h-44"} />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
          <Home className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No listings found</p>
          <p className="text-sm mt-1">Try a different location or adjust your filters</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()} listing{total !== 1 ? "s" : ""} found
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
            )}
          </div>

          <div className={cn("grid gap-4", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
            {results.map((p) => (
              <PropertyCard
                key={p.property_id}
                property={p}
                onAdd={onAddToCart}
                inCart={cartIds.includes(p.property_id)}
                compact={compact}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePage(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 py-16 text-muted-foreground border rounded-lg border-dashed">
          <Search className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">Search for properties</p>
          <p className="text-sm mt-1">Enter a city, ZIP code, or neighborhood above</p>
        </div>
      )}
    </div>
  )
}
