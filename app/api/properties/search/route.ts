import { NextResponse } from "next/server"
import type { RapidAPIProperty } from "@/lib/types/property"

const HOST = "us-real-estate-listings.p.rapidapi.com"
const BASE = `https://${HOST}`

// Pull a nested number from any common key variant
function num(p: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = p[k]
    if (typeof v === "number" && !isNaN(v)) return v
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v)
  }
  return undefined
}

function str(p: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = p[k]
    if (typeof v === "string" && v.trim() !== "") return v.trim()
  }
  return undefined
}

function normalize(p: Record<string, unknown>, fallbackStatus: string): RapidAPIProperty {
  // address can be nested or flat
  const addr = (p.address as Record<string, unknown>) ||
               (p.location as Record<string, unknown>) || {}

  const line = str(addr, "streetAddress", "line", "street", "address1") ||
               str(p,    "streetAddress", "address", "street")          || ""

  const city        = str(addr, "city")        || str(p, "city")        || ""
  const state_code  = str(addr, "state", "stateCode", "state_code") || str(p, "state", "stateCode") || ""
  const postal_code = str(addr, "zipcode", "zip", "postalCode", "postal_code") || str(p, "zipcode", "zip") || ""
  const lat         = num(addr, "lat", "latitude") || num(p, "latitude", "lat")
  const lon         = num(addr, "lon", "lng", "longitude") || num(p, "longitude", "lon", "lng")

  // photos: array of strings OR array of {href}
  const rawPhotos = (p.photos as unknown[]) || []
  const firstPhoto = rawPhotos.length > 0
    ? (typeof rawPhotos[0] === "string" ? rawPhotos[0] : (rawPhotos[0] as Record<string, unknown>)?.href)
    : undefined

  const thumbnail = str(p, "imgSrc", "primaryPhoto", "thumbnail", "photo", "image") ||
                    (typeof firstPhoto === "string" ? firstPhoto : undefined)

  return {
    property_id: str(p, "zpid", "id", "propertyId", "property_id", "mlsId", "listingId") || String(Math.random()),
    listing_id:  str(p, "zpid", "id", "listingId", "property_id"),
    mls_id:      str(p, "mlsId", "mls_id", "mlsNum"),
    address:     { line, city, state_code, postal_code, lat, lon },
    lat,
    lon,
    price:       num(p, "price", "listPrice", "list_price", "unformattedPrice") || 0,
    beds:        num(p, "bedrooms", "beds", "bedroomsCount")                    || 0,
    baths:       num(p, "bathrooms", "baths", "bathroomsCount")                 || 0,
    baths_full:  num(p, "bathroomsFull", "baths_full"),
    sqft:        num(p, "livingArea", "sqft", "squareFeet", "lotAreaValue"),
    year_built:  num(p, "yearBuilt", "year_built"),
    prop_type:   str(p, "homeType", "propertyType", "prop_type", "type")        || "",
    prop_status: str(p, "homeStatus", "status", "prop_status")                  || fallbackStatus,
    thumbnail,
    rdc_web_url: str(p, "detailUrl", "hdpUrl", "url", "propertyUrl", "rdc_web_url"),
    list_date:   str(p, "listingDateTimeOnZillow", "daysOnZillow", "list_date", "listedDate"),
  }
}

function extractResults(data: Record<string, unknown>): { raw: Record<string, unknown>[]; total: number } {
  // Walk every key looking for the first array with objects
  function findArray(obj: Record<string, unknown>): Record<string, unknown>[] | null {
    // Check common known keys first
    for (const k of ["props", "results", "listings", "properties", "data", "homes", "list"]) {
      const v = obj[k]
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") return v as Record<string, unknown>[]
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const nested = v as Record<string, unknown>
        for (const k2 of Object.keys(nested)) {
          const v2 = nested[k2]
          if (Array.isArray(v2) && v2.length > 0 && typeof v2[0] === "object") return v2 as Record<string, unknown>[]
        }
      }
    }
    // Fallback: scan every top-level key
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") return v as Record<string, unknown>[]
    }
    return null
  }

  const raw = findArray(data) || []

  const total: number =
    num(data, "totalResultCount", "total", "totalCount", "count") ||
    ((data.data as Record<string, unknown>)?.total as number)     ||
    raw.length

  return { raw, total }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const location = searchParams.get("location") || ""
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const minBeds  = searchParams.get("minBeds")
  const minBaths = searchParams.get("minBaths")
  const propType = searchParams.get("propType")
  const status   = searchParams.get("status") || "for_sale"
  const minSqft  = searchParams.get("minSqft")
  const maxSqft  = searchParams.get("maxSqft")
  const minYear  = searchParams.get("minYear")
  const maxYear  = searchParams.get("maxYear")
  const page     = parseInt(searchParams.get("page") || "1", 10)
  const pageSize = parseInt(searchParams.get("pageSize") || "12", 10)

  const apiKey = process.env.RAPIDAPI_REALESTATE_KEY
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  if (!location.trim()) return NextResponse.json({ properties: [], total: 0 })

  // Parse "City, ST" or "City ST" or "12345" into separate params
  const isZip = /^\d{5}$/.test(location.trim())
  let city = ""
  let state_code = ""
  let zipcode = ""

  if (isZip) {
    zipcode = location.trim()
  } else {
    // Handle "McKinney, TX" or "McKinney TX" or "McKinney, Texas"
    const parts = location.split(/,\s*|\s{2,}/)
    city = parts[0]?.trim() || location.trim()
    state_code = parts[1]?.trim().toUpperCase().slice(0, 2) || ""
  }

  try {
    const endpoint =
      status === "for_rent" ? `${BASE}/forRent` :
      status === "sold"     ? `${BASE}/sold`    :
                              `${BASE}/forSale`

    const params = new URLSearchParams({ page: String(page) })

    // Use the correct params for this API
    if (isZip) {
      params.set("zipcode", zipcode)
    } else {
      if (city)       params.set("city",      city)
      if (state_code) params.set("state_code", state_code)
    }

    if (minPrice && minPrice !== "any") params.set("price_min",      minPrice)
    if (maxPrice && maxPrice !== "any") params.set("price_max",      maxPrice)
    if (minBeds  && minBeds  !== "any") params.set("beds_min",       minBeds)
    if (minBaths && minBaths !== "any") params.set("baths_min",      minBaths)
    if (propType && propType !== "any") params.set("prop_type",      propType)
    if (minSqft)                        params.set("sqft_min",       minSqft)
    if (maxSqft)                        params.set("sqft_max",       maxSqft)
    if (minYear)                        params.set("year_built_min", minYear)
    if (maxYear)                        params.set("year_built_max", maxYear)

    const url = `${endpoint}?${params.toString()}`
    console.log("[v0] search URL:", url)

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-host": HOST,
        "x-rapidapi-key":  apiKey,
      },
      cache: "no-store",
    })

    const rawText = await response.text()
    console.log("[v0] search status:", response.status, "raw:", rawText.slice(0, 300))

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error ${response.status}: ${rawText.slice(0, 200)}` },
        { status: 502 },
      )
    }

    const data = JSON.parse(rawText) as Record<string, unknown>

    // If the API returned an error object, surface it
    if (data.statusType === "error" || data.errors) {
      return NextResponse.json(
        { error: `API rejected request: ${JSON.stringify(data.errors || data)}` },
        { status: 400 },
      )
    }

    const { raw, total } = extractResults(data)
    const properties: RapidAPIProperty[] = raw.slice(0, pageSize).map((p) => normalize(p, status))

    return NextResponse.json({ properties, total, page, pageSize })
  } catch (err) {
    console.error("[v0] properties/search error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
