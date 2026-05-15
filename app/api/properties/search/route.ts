import { NextResponse } from "next/server"
import type { RapidAPIProperty } from "@/lib/types/property"

const HOST = "us-real-estate-listings.p.rapidapi.com"
const BASE = `https://${HOST}`

// Normalize a raw property from the new API into our shared type
function normalize(p: Record<string, unknown>, fallbackStatus: string): RapidAPIProperty {
  const address = (p.address as Record<string, unknown>) || {}
  const photos  = (p.photos  as string[]) || []

  return {
    property_id: String(p.id || p.property_id || p.zpid || Math.random()),
    listing_id:  String(p.id || p.zpid || ""),
    mls_id:      (p.mlsId as string) || (p.mls_id as string) || undefined,
    address: {
      line:        (address.streetAddress as string) || (p.streetAddress as string) || "",
      city:        (address.city        as string) || (p.city as string) || "",
      state_code:  (address.state       as string) || (p.state as string) || "",
      postal_code: (address.zipcode     as string) || (p.zipcode as string) || "",
      lat:         (address.lat         as number) || (p.latitude  as number) || undefined,
      lon:         (address.lon         as number) || (p.longitude as number) || undefined,
    },
    lat:        (p.latitude  as number) || (address.lat as number) || undefined,
    lon:        (p.longitude as number) || (address.lon as number) || undefined,
    price:      (p.price as number) || (p.listPrice as number) || (p.list_price as number) || 0,
    beds:       (p.bedrooms  as number) || (p.beds  as number) || 0,
    baths:      (p.bathrooms as number) || (p.baths as number) || 0,
    baths_full: (p.bathroomsFull as number) || undefined,
    sqft:       (p.livingArea as number) || (p.sqft as number) || undefined,
    year_built: (p.yearBuilt  as number) || undefined,
    prop_type:  (p.homeType   as string) || (p.propertyType as string) || (p.prop_type as string) || "",
    prop_status:(p.status     as string) || (p.homeStatus   as string) || fallbackStatus,
    thumbnail:  (p.imgSrc     as string) || photos[0] || (p.thumbnail as string) || undefined,
    rdc_web_url:(p.detailUrl  as string) || (p.hdpUrl    as string) || undefined,
    list_date:  (p.listingDateTimeOnZillow as string) || (p.list_date as string) || undefined,
  }
}

function extractResults(data: Record<string, unknown>): { raw: Record<string, unknown>[]; total: number } {
  // New API returns: { props: [...] } or { data: { results: [...] } } or { results: [...] }
  const raw: Record<string, unknown>[] =
    (data?.props       as Record<string, unknown>[]) ||
    (data?.results     as Record<string, unknown>[]) ||
    (data?.listings    as Record<string, unknown>[]) ||
    ((data?.data as Record<string, unknown>)?.results as Record<string, unknown>[]) ||
    (Array.isArray(data?.data) ? data.data as Record<string, unknown>[] : null) ||
    []

  const total: number =
    (data?.totalResultCount as number) ||
    (data?.total            as number) ||
    ((data?.data as Record<string, unknown>)?.total as number) ||
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

  if (!location.trim()) {
    return NextResponse.json({ properties: [], total: 0 })
  }

  try {
    // Choose endpoint based on status
    const endpoint =
      status === "for_rent" ? `${BASE}/forRent` :
      status === "sold"     ? `${BASE}/sold`    :
                              `${BASE}/forSale`

    const params = new URLSearchParams({
      location,
      page:      String(page),
      resultsPerPage: String(pageSize),
    })

    if (minPrice && minPrice !== "any")  params.set("minPrice",  minPrice)
    if (maxPrice && maxPrice !== "any")  params.set("maxPrice",  maxPrice)
    if (minBeds  && minBeds  !== "any")  params.set("minBeds",   minBeds)
    if (minBaths && minBaths !== "any")  params.set("minBaths",  minBaths)
    if (propType && propType !== "any")  params.set("homeType",  propType)
    if (minSqft)                         params.set("minSqft",   minSqft)
    if (maxSqft)                         params.set("maxSqft",   maxSqft)
    if (minYear)                         params.set("minYearBuilt", minYear)
    if (maxYear)                         params.set("maxYearBuilt", maxYear)

    const url = `${endpoint}?${params.toString()}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type":   "application/json",
        "x-rapidapi-host": HOST,
        "x-rapidapi-key":  apiKey,
      },
      next: { revalidate: 300 },
    })

    const rawText = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        { error: `RapidAPI ${response.status}: ${rawText.slice(0, 300)}` },
        { status: 502 },
      )
    }

    const data = JSON.parse(rawText) as Record<string, unknown>
    const { raw, total } = extractResults(data)

    const properties: RapidAPIProperty[] = raw.map((p) => normalize(p, status))

    return NextResponse.json({ properties, total, page, pageSize })
  } catch (err) {
    console.error("[v0] properties/search error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
