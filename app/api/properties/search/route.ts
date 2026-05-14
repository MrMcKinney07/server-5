import { NextResponse } from "next/server"

export interface RapidAPIProperty {
  property_id: string
  listing_id?: string
  mls_id?: string
  address: {
    line?: string
    city?: string
    state_code?: string
    postal_code?: string
    county?: string
    lat?: number
    lon?: number
  }
  price?: number
  beds?: number
  baths?: number
  baths_full?: number
  baths_half?: number
  sqft?: number
  lot_sqft?: number
  year_built?: number
  prop_type?: string
  prop_status?: string
  thumbnail?: string
  photos?: { href: string }[]
  description?: string
  list_date?: string
  last_update?: string
  rdc_web_url?: string
  garage?: number
  pool?: boolean
  spa?: boolean
  hoa_fee?: number
}

export interface PropertySearchParams {
  city?: string
  state?: string
  zip?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  minBeds?: number
  maxBeds?: number
  minBaths?: number
  maxBaths?: number
  minSqft?: number
  maxSqft?: number
  propType?: string
  page?: number
  pageSize?: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const location = searchParams.get("location") || ""
  const city = searchParams.get("city") || ""
  const state = searchParams.get("state") || ""
  const zip = searchParams.get("zip") || ""
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const minBeds = searchParams.get("minBeds")
  const maxBeds = searchParams.get("maxBeds")
  const minBaths = searchParams.get("minBaths")
  const propType = searchParams.get("propType") || "single_family"
  const page = parseInt(searchParams.get("page") || "1", 10)
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10)

  const apiKey = process.env.RAPIDAPI_REALTOR_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  // Build the search location string
  const searchLocation = zip || location || (city && state ? `${city}, ${state}` : city || state)
  if (!searchLocation) {
    return NextResponse.json({ properties: [], total: 0 }, { status: 200 })
  }

  try {
    const params = new URLSearchParams({
      location: searchLocation,
      status: "for_sale",
      sortBy: "newest",
      property_type: propType,
      offset: String((page - 1) * pageSize),
      limit: String(pageSize),
    })

    if (minPrice) params.set("price_min", minPrice)
    if (maxPrice) params.set("price_max", maxPrice)
    if (minBeds) params.set("beds_min", minBeds)
    if (maxBeds) params.set("beds_max", maxBeds)
    if (minBaths) params.set("baths_min", minBaths)

    const response = await fetch(
      `https://realtor-search.p.rapidapi.com/properties/list?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "realtor-search.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
        next: { revalidate: 300 }, // cache 5 mins
      },
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error("[properties/search] RapidAPI error:", response.status, errText)
      return NextResponse.json({ error: "Failed to fetch listings" }, { status: 502 })
    }

    const data = await response.json()

    // Normalise the response — RapidAPI returns { data: { home_search: { results, total } } }
    const results: RapidAPIProperty[] =
      data?.data?.home_search?.results ||
      data?.results ||
      data?.data?.results ||
      []

    const total: number =
      data?.data?.home_search?.total ||
      data?.total ||
      results.length

    return NextResponse.json({
      properties: results,
      total,
      page,
      pageSize,
    })
  } catch (err) {
    console.error("[properties/search] Unexpected error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
