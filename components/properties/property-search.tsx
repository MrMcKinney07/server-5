"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search, Bed, Bath, Square, Home, Plus, Check,
  ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal, X,
  MapPin, Calendar, DollarSign
} from "lucide-react"
import type { RapidAPIProperty } from "@/lib/types/property"
import { cn } from "@/lib/utils"

interface PropertySearchProps {
  onAddToCart?: (property: RapidAPIProperty) => void
  cartIds?: string[]
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

  const statusLabel = property.prop_status
    ? property.prop_status.replace(/_/g, " ")
    : null

  const statusColor =
    property.prop_status === "for_sale" ? "bg-emerald-500" :
    property.prop_status === "for_rent" ? "bg-blue-500" :
    property.prop_status === "sold"     ? "bg-rose-500" : "bg-zinc-500"

  return (
    <div className={cn(
      "group rounded-xl border bg-card overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      compact ? "text-sm" : "",
    )}>
      {/* Photo */}
      <div className={cn("relative bg-muted flex-shrink-0 overflow-hidden", compact ? "h-36" : "h-48")}>
        {photo ? (
          <img
            src={photo}
            alt={address.line || "Property"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Home className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge */}
        {statusLabel && (
          <div className={cn("absolute top-2.5 left-2.5 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", statusColor)}>
            {statusLabel}
          </div>
        )}

        {/* Price */}
        {property.price ? (
          <div className="absolute bottom-2.5 left-2.5 text-white font-bold text-sm">
            {formatPrice(property.price)}
          </div>
        ) : null}

        {/* External link */}
        {property.rdc_web_url && (
          <a
            href={property.rdc_web_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5 text-white" />
          </a>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5 gap-2.5">
        <div>
          <p className="font-semibold leading-snug line-clamp-1 text-foreground">
            {address.line || "Address unavailable"}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {[address.city, address.state_code, address.postal_code].filter(Boolean).join(", ")}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {property.beds !== undefined && property.beds > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.beds} bd
            </span>
          )}
          {(property.baths_full !== undefined || property.baths !== undefined) && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {(property.baths_full ?? property.baths) || 0} ba
            </span>
          )}
          {property.sqft && property.sqft > 0 && (
            <span className="flex items-center gap-1">
              <Square className="h-3.5 w-3.5" />
              {property.sqft.toLocaleString()} sqft
            </span>
          )}
        </div>

        {property.mls_id && (
          <p className="text-[10px] text-muted-foreground/60 font-mono">MLS# {property.mls_id}</p>
        )}

        {/* Add to cart */}
        {onAdd && (
          <Button
            size="sm"
            variant={inCart ? "secondary" : "default"}
            className="mt-auto h-8 text-xs w-full"
            onClick={() => onAdd(property)}
            disabled={inCart}
          >
            {inCart ? (
              <><Check className="h-3.5 w-3.5 mr-1.5" />Added</>
            ) : (
              <><Plus className="h-3.5 w-3.5 mr-1.5" />Add to Cart</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function FilterPill({
  label,
  active,
  onClick,
}: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-foreground border-border hover:border-foreground/40",
      )}
    >
      {label}
    </button>
  )
}

const PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "$200k+", min: "200000" },
  { label: "$300k+", min: "300000" },
  { label: "$400k+", min: "400000" },
  { label: "$500k+", min: "500000" },
  { label: "$600k+", min: "600000" },
  { label: "$750k+", min: "750000" },
  { label: "$1M+", min: "1000000" },
]

const BED_OPTIONS = [
  { label: "Any", value: "any" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
  { label: "5+", value: "5" },
]

export function PropertySearch({ onAddToCart, cartIds = [], compact = false }: PropertySearchProps) {
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState("for_sale")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minBeds, setMinBeds] = useState("any")
  const [minBaths, setMinBaths] = useState("any")
  const [propType, setPropType] = useState("any")
  const [minSqft, setMinSqft] = useState("")
  const [maxSqft, setMaxSqft] = useState("")
  const [minYear, setMinYear] = useState("")
  const [maxYear, setMaxYear] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      const params = new URLSearchParams({ page: String(overridePage), pageSize: String(pageSize) })
      params.set("location", location.trim())
      params.set("status", status)
      if (minPrice)                       params.set("minPrice", minPrice)
      if (maxPrice)                       params.set("maxPrice", maxPrice)
      if (minBeds && minBeds !== "any")   params.set("minBeds", minBeds)
      if (minBaths && minBaths !== "any") params.set("minBaths", minBaths)
      if (propType && propType !== "any") params.set("propType", propType)
      if (minSqft)                        params.set("minSqft", minSqft)
      if (maxSqft)                        params.set("maxSqft", maxSqft)
      if (minYear)                        params.set("minYear", minYear)
      if (maxYear)                        params.set("maxYear", maxYear)

      const res = await fetch(`/api/properties/search?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResults(data.properties || [])
      setTotal(data.total || 0)
      setPage(overridePage)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }, [location, status, minPrice, maxPrice, minBeds, minBaths, propType, minSqft, maxSqft, minYear, maxYear, pageSize])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(1)
  }

  const handlePage = (p: number) => {
    doSearch(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const activeFilterCount = [
    minPrice || maxPrice,
    minBeds !== "any",
    minBaths !== "any",
    propType !== "any",
    minSqft || maxSqft,
    minYear || maxYear,
  ].filter(Boolean).length

  const clearFilters = () => {
    setMinPrice(""); setMaxPrice(""); setMinBeds("any")
    setMinBaths("any"); setPropType("any"); setMinSqft("")
    setMaxSqft(""); setMinYear(""); setMaxYear("")
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Search bar ── */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 p-4 rounded-xl border bg-card shadow-sm">
          {/* Top row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter ZIP code (e.g. 75070)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="for_sale">For Sale</SelectItem>
                <SelectItem value="for_rent">For Rent</SelectItem>
                <SelectItem value="sold">Recently Sold</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!location.trim() || loading} className="h-10 px-5">
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching…" : "Search"}
            </Button>
          </div>

          {/* Quick filter pills */}
          {!compact && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Beds pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Beds:</span>
                {BED_OPTIONS.map((o) => (
                  <FilterPill
                    key={o.value}
                    label={o.label}
                    active={minBeds === o.value}
                    onClick={() => setMinBeds(o.value)}
                  />
                ))}
              </div>

              <div className="h-5 w-px bg-border mx-1" />

              {/* Property type */}
              <Select value={propType} onValueChange={setPropType}>
                <SelectTrigger className="h-8 text-xs rounded-full border px-3 w-auto gap-1.5">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Type</SelectItem>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhome">Townhome</SelectItem>
                  <SelectItem value="multi_family">Multi-Family</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="mobile">Mobile / Manufactured</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-5 w-px bg-border mx-1" />

              {/* More filters toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors",
                  showAdvanced || activeFilterCount > 0
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/40"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 bg-background text-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-8 px-2 rounded-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          )}

          {/* Advanced filters panel */}
          {!compact && showAdvanced && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Min Price
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 300000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Max Price
                </label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Bath className="h-3 w-3" /> Min Baths
                </label>
                <Select value={minBaths} onValueChange={setMinBaths}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Square className="h-3 w-3" /> Min Sqft
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 1500"
                  value={minSqft}
                  onChange={(e) => setMinSqft(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Year Min
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 2000"
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Year Max
                </label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={maxYear}
                  onChange={(e) => setMaxYear(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </form>

      {/* ── Error ── */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Skeletons ── */}
      {loading && (
        <div className={cn("grid gap-4", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
          {Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <Skeleton className={compact ? "h-36" : "h-48"} />
              <div className="p-3.5 space-y-2.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-xl border-dashed">
          <Home className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-semibold text-foreground">No listings found</p>
          <p className="text-sm mt-1">Try a different ZIP code or adjust your filters</p>
        </div>
      )}

      {/* ── Results ── */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {total.toLocaleString()} listing{total !== 1 ? "s" : ""}
              <span className="text-muted-foreground font-normal"> found near {location}</span>
            </p>
            {totalPages > 1 && (
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          <div className={cn("grid gap-4", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
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
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePage(page - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => handlePage(page + 1)}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Pre-search prompt ── */}
      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-xl border-dashed">
          <Search className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-semibold text-foreground">Search for properties</p>
          <p className="text-sm mt-1">Enter a ZIP code above to find live listings</p>
        </div>
      )}
    </div>
  )
}
