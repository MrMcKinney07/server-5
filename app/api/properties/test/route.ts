import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint") || "forSale"
  const location = searchParams.get("location") || "McKinney, TX"

  const apiKey = process.env.RAPIDAPI_REALESTATE_KEY
  if (!apiKey) return NextResponse.json({ error: "RAPIDAPI_REALESTATE_KEY not set" }, { status: 500 })

  const url = `https://us-real-estate-listings.p.rapidapi.com/${endpoint}?location=${encodeURIComponent(location)}&page=1`

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": "us-real-estate-listings.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
    cache: "no-store",
  })

  const text = await res.text()
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(text) } catch { return NextResponse.json({ status: res.status, raw: text }) }

  // Return diagnostic info: top-level keys, total count, and first listing raw
  const topKeys = Object.keys(parsed)
  let firstItem: unknown = null
  let count = 0
  for (const key of topKeys) {
    const val = parsed[key]
    if (Array.isArray(val) && val.length > 0) {
      count = val.length
      firstItem = val[0]
      break
    }
    if (val && typeof val === "object") {
      const nested = val as Record<string, unknown>
      for (const k2 of Object.keys(nested)) {
        if (Array.isArray(nested[k2]) && (nested[k2] as unknown[]).length > 0) {
          count = (nested[k2] as unknown[]).length
          firstItem = (nested[k2] as unknown[])[0]
          break
        }
      }
    }
  }

  return NextResponse.json({
    httpStatus: res.status,
    topLevelKeys: topKeys,
    arrayCount: count,
    firstItemKeys: firstItem && typeof firstItem === "object" ? Object.keys(firstItem as object) : null,
    firstItem,
    fullResponse: parsed,
  })
}
