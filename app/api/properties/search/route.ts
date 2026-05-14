import { NextResponse } from "next/server"
import type { RapidAPIProperty } from "@/lib/types/property"

const HOST = "realtor-search.p.rapidapi.com"
const BASE = `https://${HOST}`

// Normalize a raw property object from the API into our shared type
function normalize(p: Record<string, unknown>, fallbackStatus: string): RapidAPIProperty {
  const loc     = (p.location as Record<string, unknown>) || {}
  const addr    = ((loc.address || p.address) as Record<string, unknown>) || {}
  const coord   = (loc.coordinate as Record<string, unknown>) || {}
  const desc    = (p.description as Record<string, unknown>) || {}
  const photo   = (p.primary_photo as Record<string, unknown>) || {}
  const photos  = (p.photos as Record<string, unknown>[]) || []

  return {
    property_id: (p.property_id as string) || (p.listing_id as string) || String(Math.random()),
    listing_id:  (p.listing_id  as string) || (p.property_id as string),
    mls_id:      (p.mls_id as string) || undefined,
    address: {
      line:        (addr.line        as string) || (addr.street as string) || "",
      city:        (addr.city        as string) || "",
      state_code:  (addr.state_code  as string) || (addr.state  as string) || "",
      postal_code: (addr.postal_code as string) || (addr.zip    as string) || "",
      lat:         (addr.lat as number) || (coord.lat as number) || undefined,
      lon:         (addr.lon as number) || (coord.lon as number) || undefined,
    },
    lat:        (addr.lat as number) || (coord.lat as number) || undefined,
    lon:        (addr.lon as number) || (coord.lon as number) || undefined,
    price:      (p.list_price as number) || (p.price as number) || 0,
    beds:       (desc.beds    as number) || (p.beds  as number) || 0,
    baths:      (desc.baths_consolidated as number) || (desc.baths as number) || (p.baths as number) || 0,
    baths_full: (desc.baths_full as number) || undefined,
    sqft:       (desc.sqft      as number) || (p.sqft      as number) || undefined,
    year_built: (desc.year_built as number) || (p.year_built as number) || undefined,
    prop_type:  (desc.type   as string)  || (p.prop_type as string) || "",
    prop_status:(p.status    as string)  || fallbackStatus,
    thumbnail:
      (photo.href as string) ||
      (photos[0]?.href as string) ||
      (p.thumbnail as string) ||
      undefined,
    rdc_web_url: (p.href as string) || (p.rdc_web_url as string) || undefined,
    list_date:   (p.list_date as string) || undefined,
  }
}

// Pull the results array and total from various known response shapes
function extractResults(data: Record<string, unknown>): { raw: Record<string, unknown>[]; total: number } {
  const raw: Record<string, unknown>[] =
    (data?.data as Record<string, unknown>)?.results as Record<string, unknown>[] ||
    (data?.data as Record<string, unknown>)?.properties as Record<string, unknown>[] ||
    data?.results as Record<string, unknown>[] ||
    data?.properties as Record<string, unknown>[] ||
    (Array.isArray(data?.data) ? data.data as Record<string, unknown>[] : null) ||
    []

  const total: number =
    ((data?.data as Record<string, unknown>)?.total as number) ||
    (data?.total as number) ||
    raw.length

  return { raw, total }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const location  = searchParams.get("location") || ""
  const minPrice  = searchParams.get("minPrice")
  const maxPrice  = searchParams.get("maxPrice")
  const minBeds   = searchParams.get("minBeds")
  const minBaths  = searchParams.get("minBaths")
  const propType  = searchParams.get("propType")
  const status    = searchParams.get("status") || "for_sale"
  const sortBy    = searchParams.get("sortBy") || "relevant"
  const minSqft   = searchParams.get("minSqft")
  const maxSqft   = searchParams.get("maxSqft")
  const minYear   = searchParams.get("minYear")
  const maxYear   = searchParams.get("maxYear")
  const garage    = searchParams.get("garage")
  const maxDom    = searchParams.get("maxDom")
  const lat       = searchParams.get("lat")
  const lon       = searchParams.get("lon")
  const radius    = searchParams.get("radius")
  const page      = parseInt(searchParams.get("page") || "1", 10)
  const pageSize  = parseInt(searchParams.get("pageSize") || "12", 10)

  const apiKey = process.env.RAPIDAPI_REALTOR_KEY
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 })

  // Need at least a location or coordinates
  if (!location.trim() && !(lat && lon)) {
    return NextResponse.json({ properties: [], total: 0 })
  }

  try {
    let url: string
    let fetchOptions: RequestInit

    const headers = {
      "Content-Type": "application/json",
      "x-rapidapi-host": HOST,
      "x-rapidapi-key": apiKey,
    }

    const isCoords = lat && lon

    if (isCoords) {
      // Map / radius search — POST /properties/coords/search-buy|rent|sold
      const endpoint =
        status === "for_rent" ? `${BASE}/properties/coords/search-rent` :
        status === "sold"     ? `${BASE}/properties/coords/search-sold` :
                                `${BASE}/properties/coords/search-buy`

      const body: Record<string, unknown> = {
        latitude:  parseFloat(lat),
        longitude: parseFloat(lon),
        radius:    parseFloat(radius || "5"),
        limit:     pageSize,
        offset:    (page - 1) * pageSize,
        sort:      sortBy,
      }
      if (minPrice)                        body.price_min    = parseInt(minPrice)
      if (maxPrice)                        body.price_max    = parseInt(maxPrice)
      if (minBeds  && minBeds  !== "any")  body.beds_min     = parseInt(minBeds)
      if (minBaths && minBaths !== "any")  body.baths_min    = parseInt(minBaths)
      if (propType && propType !== "any")  body.property_type = propType
      if (minSqft)                         body.sqft_min     = parseInt(minSqft)
      if (maxSqft)                         body.sqft_max     = parseInt(maxSqft)
      if (minYear)                         body.year_built_min = parseInt(minYear)
      if (maxYear)                         body.year_built_max = parseInt(maxYear)
      if (garage  && garage   !== "any")   body.has_garage   = true
      if (maxDom)                          body.age_max      = parseInt(maxDom)

      url = endpoint
      fetchOptions = { method: "POST", headers, body: JSON.stringify(body), next: { revalidate: 300 } }
    } else {
      // Text / location search — GET /properties/search-buy|rent|sold
      const endpoint =
        status === "for_rent" ? `${BASE}/properties/search-rent` :
        status === "sold"     ? `${BASE}/properties/search-sold` :
                                `${BASE}/properties/search-buy`

      const params = new URLSearchParams({
        location,
        limit:  String(pageSize),
        offset: String((page - 1) * pageSize),
        sort:   sortBy,
      })

      if (minPrice)                        params.set("price_min",       minPrice)
      if (maxPrice)                        params.set("price_max",       maxPrice)
      if (minBeds  && minBeds  !== "any")  params.set("beds_min",        minBeds)
      if (minBaths && minBaths !== "any")  params.set("baths_min",       minBaths)
      if (propType && propType !== "any")  params.set("property_type",   propType)
      if (minSqft)                         params.set("sqft_min",        minSqft)
      if (maxSqft)                         params.set("sqft_max",        maxSqft)
      if (minYear)                         params.set("year_built_min",  minYear)
      if (maxYear)                         params.set("year_built_max",  maxYear)
      if (garage  && garage   !== "any")   params.set("has_garage",      "true")
      if (maxDom)                          params.set("age_max",         maxDom)

      url = `${endpoint}?${params.toString()}`
      fetchOptions = { method: "GET", headers, next: { revalidate: 300 } }
    }

    const response = await fetch(url, fetchOptions)
    const rawText  = await response.text()

    if (!response.ok) {
      console.log("[v0] RapidAPI error body:", rawText)
      return NextResponse.json(
        { error: `RapidAPI ${response.status}: ${rawText.slice(0, 300)}` },
        { status: 502 },
      )
    }

    const data = JSON.parse(rawText) as Record<string, unknown>
    console.log("[v0] API response keys:", Object.keys(data))
    console.log("[v0] API data sample:", JSON.stringify(data).slice(0, 500))
    const { raw, total } = extractResults(data)
    console.log("[v0] Extracted raw count:", raw.length, "total:", total)

    const properties: RapidAPIProperty[] = raw.map((p) => normalize(p, status))

    return NextResponse.json({ properties, total, page, pageSize })
  } catch (err) {
    console.error("[v0] properties/search error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
