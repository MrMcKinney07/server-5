import { NextResponse } from "next/server"

// Probes known endpoint paths to find which ones exist on realtor-search.p.rapidapi.com
const CANDIDATES = [
  "/properties/list",
  "/properties/search",
  "/properties/for-sale",
  "/properties/for_sale",
  "/search/properties",
  "/listings/search",
  "/listings",
  "/for-sale",
  "/properties",
  "/agents/list",   // known-adjacent endpoint for comparison
]

export async function GET() {
  const apiKey = process.env.RAPIDAPI_REALTOR_KEY
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 })

  const results: Record<string, { status: number; body: string }> = {}

  await Promise.all(
    CANDIDATES.map(async (path) => {
      const url = `https://realtor-search.p.rapidapi.com${path}?location=Miami%2C+FL&limit=1`
      try {
        const res = await fetch(url, {
          headers: {
            "x-rapidapi-host": "realtor-search.p.rapidapi.com",
            "x-rapidapi-key": apiKey,
          },
        })
        const body = await res.text()
        results[path] = { status: res.status, body: body.slice(0, 200) }
      } catch (e) {
        results[path] = { status: 0, body: String(e) }
      }
    }),
  )

  // Sort: 200s first, then by path
  const sorted = Object.entries(results).sort((a, b) => {
    if (a[1].status === 200 && b[1].status !== 200) return -1
    if (b[1].status === 200 && a[1].status !== 200) return 1
    return a[0].localeCompare(b[0])
  })

  return NextResponse.json(Object.fromEntries(sorted), { status: 200 })
}
