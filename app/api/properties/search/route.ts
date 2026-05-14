import { NextResponse } from "next/server"
import type { RapidAPIProperty } from "@/lib/types/property"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const location   = searchParams.get("location") || ""
  const minPrice   = searchParams.get("minPrice")
  const maxPrice   = searchParams.get("maxPrice")
  const minBeds    = searchParams.get("minBeds")
  const minBaths   = searchParams.get("minBaths")
  const propType   = searchParams.get("propType") || ""
  const status     = searchParams.get("status") || "for_sale"
  const sortBy     = searchParams.get("sortBy") || "relevant"
  const minSqft    = searchParams.get("minSqft")
  const maxSqft    = searchParams.get("maxSqft")
  const minYear    = searchParams.get("minYear")
  const maxYear    = searchParams.get("maxYear")
  const garage     = searchParams.get("garage")
  const maxDom     = searchParams.get("maxDom") // days on market
  const lat        = searchParams.get("lat")
  const lon        = searchParams.get("lon")
  const radius     = searchParams.get("radius") // miles
  const page       = parseInt(searchParams.get("page") || "1", 10)
  const pageSize   = parseInt(searchParams.get("pageSize") || "12", 10)

  const apiKey = process.env.RAPIDAPI_REALTOR_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  if (!location.trim()) {
    return NextResponse.json({ properties: [], total: 0 })
  }

  try {
    const params = new URLSearchParams({
      location,
      status,
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
      sort: sortBy,
    })

    if (minPrice)                        params.set("price_min", minPrice)
    if (maxPrice)                        params.set("price_max", maxPrice)
    if (minBeds && minBeds !== "any")    params.set("beds_min", minBeds)
    if (minBaths && minBaths !== "any")  params.set("baths_min", minBaths)
    if (propType && propType !== "any")  params.set("property_type", propType)
    if (minSqft)                         params.set("sqft_min", minSqft)
    if (maxSqft)                         params.set("sqft_max", maxSqft)
    if (minYear)                         params.set("year_built_min", minYear)
    if (maxYear)                         params.set("year_built_max", maxYear)
    if (garage && garage !== "any")      params.set("has_garage", "true")
    if (maxDom)                          params.set("age_max", maxDom)
    if (lat && lon)                      { params.set("lat", lat); params.set("long", lon) }
    if (radius)                          params.set("radius", radius)

    const url = `https://realtor-com-open.p.rapidapi.com/search/properties?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "realtor-com-open.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
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

    const data = JSON.parse(rawText)

    // Support multiple known response shapes
    const raw: Record<string, unknown>[] =
      data?.home_search?.properties ||
      data?.data?.home_search?.results ||
      data?.data?.home_search?.properties ||
      data?.results ||
      data?.properties ||
      (Array.isArray(data?.data) ? data.data : null) ||
      []

    const total: number =
      data?.home_search?.total ||
      data?.data?.home_search?.total ||
      data?.total ||
      raw.length

    const properties: RapidAPIProperty[] = raw.map((p) => {
      const locAddr =
        (p.location as Record<string, unknown>)?.address ||
        (p.address as Record<string, unknown>) ||
        {}
      const addr = locAddr as Record<string, unknown>
      const desc = ((p.description as Record<string, unknown>) || {}) as Record<string, unknown>

      return {
        property_id: (p.property_id as string) || (p.listing_id as string) || String(Math.random()),
        listing_id:  (p.listing_id  as string) || (p.property_id as string),
        mls_id:      (p.mls_id as string) || undefined,
        address: {
          line:        (addr.line        as string) || (addr.street as string) || "",
          city:        (addr.city        as string) || "",
          state_code:  (addr.state_code  as string) || (addr.state as string) || "",
          postal_code: (addr.postal_code as string) || (addr.zip   as string) || "",
        },
        price:      (p.list_price as number) || (p.price as number) || 0,
        beds:       (desc.beds   as number)  || (p.beds  as number) || 0,
        baths:      (desc.baths_consolidated as number) || (desc.baths as number) || (p.baths as number) || 0,
        baths_full: (desc.baths_full as number) || (p.baths_full as number) || undefined,
        sqft:       (desc.sqft  as number) || (p.sqft  as number) || undefined,
        year_built: (desc.year_built as number) || (p.year_built as number) || undefined,
        prop_type:  (desc.type  as string) || (p.prop_type as string) || "",
        prop_status:(p.status   as string) || (p.prop_status as string) || status,
        thumbnail:
          ((p.primary_photo as Record<string, unknown>)?.href as string) ||
          (p.thumbnail as string) ||
          ((p.photos as Record<string, unknown>[])?.[0]?.href as string) ||
          undefined,
        rdc_web_url: (p.href as string) || (p.rdc_web_url as string) || undefined,
        list_date:   (p.list_date as string) || undefined,
        lat: (addr.lat as number) || ((p.location as Record<string,unknown>)?.coordinate as Record<string,unknown>)?.lat as number || undefined,
        lon: (addr.lon as number) || ((p.location as Record<string,unknown>)?.coordinate as Record<string,unknown>)?.lon as number || undefined,
      }
    })

    return NextResponse.json({ properties, total, page, pageSize })
  } catch (err) {
    console.error("[properties/search] error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
