import { NextResponse } from "next/server"

export const revalidate = 3600 // cache for 1 hour

export interface LiveRate {
  label: string
  rate: number
  rateStr: string
  change: number
  changeStr: string
  direction: "up" | "down" | "flat"
  low52: number
  high52: number
  source: string
}

export interface RatesResponse {
  rates: LiveRate[]
  fetchedAt: string
  asOf: string
  source: "live" | "fallback"
}

// Parse a rate string like "6.57%" -> 6.57
function parseRate(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0
}

// Parse a change string like "+0.01%" -> 0.01
function parseChange(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) * (s.includes("-") ? -1 : 1) || 0
}

async function scrapeMND(): Promise<LiveRate[]> {
  const res = await fetch("https://www.mortgagenewsdaily.com/mortgage-rates", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`MND fetch failed: ${res.status}`)

  const html = await res.text()

  // Extract the rate table rows using regex on the HTML
  // MND embeds data in their table with specific patterns
  const rates: LiveRate[] = []

  // Pattern to find rate rows: label | rate% | points | change%
  // We look for known product names and the rates near them
  const products = [
    { search: /30 Yr\. Fixed.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year Fixed", source: "MND" },
    { search: /15 Yr\. Fixed.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "15-Year Fixed", source: "MND" },
    { search: /30 Yr\. Jumbo.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year Jumbo", source: "MND" },
    { search: /7\/6 SOFR ARM.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "7/6 ARM (SOFR)", source: "MND" },
    { search: /30 Yr\. FHA.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year FHA", source: "MND" },
    { search: /30 Yr\. VA.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year VA", source: "MND" },
  ]

  // Find the MND section specifically (before Freddie Mac section)
  const mndSection = html.split("Freddie Mac")[0] || html

  for (const p of products) {
    const match = mndSection.match(p.search)
    if (match) {
      const rate = parseRate(match[1])
      const change = parseChange(match[2])
      rates.push({
        label: p.label,
        rate,
        rateStr: `${rate.toFixed(2)}%`,
        change,
        changeStr: change === 0 ? "0.00%" : `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
        direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
        low52: 0,
        high52: 0,
        source: p.source,
      })
    }
  }

  // Also grab 52-week ranges from the detailed table
  const rangePattern = /(\d+\.\d+)%.*?(\d+\.\d+)%.*?(\d+\.\d+)%.*?(\d+\.\d+)%.*?(\d+\.\d+)%/g
  // If we found rates, try to match 52wk ranges
  if (rates.length > 0) {
    const rangeSection = html.match(/52 Week Range[\s\S]{0,5000}/)
    if (rangeSection) {
      const rowMatches = Array.from(rangeSection[0].matchAll(/(\d+\.\d+)%[^%]*(\d+\.\d+)%[^%]*(\d+\.\d+)%/g))
      rowMatches.forEach((m, i) => {
        if (rates[i]) {
          rates[i].low52 = parseRate(m[2])
          rates[i].high52 = parseRate(m[3])
        }
      })
    }
  }

  return rates
}

// Fallback rates seeded from MND as of May 13, 2026 (last known good data)
function getFallbackRates(): LiveRate[] {
  const data = [
    { label: "30-Year Fixed", rate: 6.57, change: 0.01, low52: 5.99, high52: 7.08 },
    { label: "15-Year Fixed", rate: 6.07, change: 0.03, low52: 5.55, high52: 6.39 },
    { label: "30-Year Jumbo", rate: 6.68, change: 0.03, low52: 6.10, high52: 7.15 },
    { label: "7/6 ARM (SOFR)", rate: 6.32, change: 0.02, low52: 5.29, high52: 6.63 },
    { label: "30-Year FHA", rate: 6.02, change: 0.02, low52: 5.62, high52: 6.53 },
    { label: "30-Year VA", rate: 6.04, change: 0.02, low52: 5.64, high52: 6.54 },
  ]
  return data.map((d) => ({
    label: d.label,
    rate: d.rate,
    rateStr: `${d.rate.toFixed(2)}%`,
    change: d.change,
    changeStr: d.change === 0 ? "0.00%" : `${d.change > 0 ? "+" : ""}${d.change.toFixed(2)}%`,
    direction: d.change > 0 ? "up" : d.change < 0 ? "down" : "flat",
    low52: d.low52,
    high52: d.high52,
    source: "MND (cached)",
  }))
}

export async function GET() {
  const fetchedAt = new Date().toISOString()
  const asOf = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  try {
    const rates = await scrapeMND()

    if (rates.length >= 4) {
      return NextResponse.json({ rates, fetchedAt, asOf, source: "live" } satisfies RatesResponse)
    }

    // Not enough data — use fallback
    return NextResponse.json({
      rates: getFallbackRates(),
      fetchedAt,
      asOf,
      source: "fallback",
    } satisfies RatesResponse)
  } catch {
    return NextResponse.json({
      rates: getFallbackRates(),
      fetchedAt,
      asOf,
      source: "fallback",
    } satisfies RatesResponse)
  }
}
