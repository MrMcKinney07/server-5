import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.RAPIDAPI_REALESTATE_KEY
  if (!apiKey) return NextResponse.json({ error: "RAPIDAPI_REALESTATE_KEY not set" }, { status: 500 })

  const url = "https://us-real-estate-listings.p.rapidapi.com/forSale?location=McKinney%2C+TX&page=1"
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": "us-real-estate-listings.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
    cache: "no-store",
  })

  const text = await res.text()
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { parsed = text }

  return NextResponse.json({ status: res.status, body: parsed })
}
