import { NextResponse } from "next/server"

// Temporary diagnostic route — tests all known endpoint paths on realtor-search.p.rapidapi.com
// Visit /api/properties/discover to see which endpoints exist
export async function GET() {
  const apiKey = process.env.RAPIDAPI_REALTOR_KEY
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 })

  const BASE = "https://realtor-search.p.rapidapi.com"
  const headers = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "realtor-search.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
  }

  const candidates = [
    "/properties/list?location=Austin%2C+TX&status=for_sale&limit=1",
    "/properties/search?location=Austin%2C+TX&status=for_sale&limit=1",
    "/properties/for-sale?location=Austin%2C+TX&limit=1",
    "/search/properties?location=Austin%2C+TX&status=for_sale&limit=1",
    "/properties?location=Austin%2C+TX&status=for_sale&limit=1",
    "/properties/v2/list-for-sale?city=Austin&state_code=TX&limit=1",
    "/homes/list?location=Austin%2C+TX&status=for_sale&limit=1",
  ]

  const results = await Promise.all(
    candidates.map(async (path) => {
      try {
        const res = await fetch(`${BASE}${path}`, { headers })
        const body = await res.text()
        return {
          path,
          status: res.status,
          ok: res.ok,
          preview: body.slice(0, 120),
        }
      } catch (e) {
        return { path, status: 0, ok: false, preview: String(e) }
      }
    }),
  )

  // Also fetch the root to see if there's an index/listing
  let rootBody = ""
  try {
    const r = await fetch(`${BASE}/`, { headers })
    rootBody = (await r.text()).slice(0, 300)
  } catch {}

  return NextResponse.json({ results, rootBody })
}
