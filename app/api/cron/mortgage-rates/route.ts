import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function parseRate(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0
}

function parseChange(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) * (s.includes("-") ? -1 : 1) || 0
}

async function scrapeMND() {
  const res = await fetch("https://www.mortgagenewsdaily.com/mortgage-rates", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  })

  if (!res.ok) throw new Error(`MND fetch failed: ${res.status}`)

  const html = await res.text()

  const products = [
    { search: /30 Yr\. Fixed.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year Fixed" },
    { search: /15 Yr\. Fixed.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "15-Year Fixed" },
    { search: /30 Yr\. Jumbo.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year Jumbo" },
    { search: /7\/6 SOFR ARM.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "7/6 ARM (SOFR)" },
    { search: /30 Yr\. FHA.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year FHA" },
    { search: /30 Yr\. VA.*?(\d+\.\d+)%.*?([+-]\d+\.\d+)%/s, label: "30-Year VA" },
  ]

  const mndSection = html.split("Freddie Mac")[0] || html
  const rates: { label: string; rate: number; change: number; low52: number; high52: number }[] = []

  for (const p of products) {
    const match = mndSection.match(p.search)
    if (match) {
      const rate = parseRate(match[1])
      const change = parseChange(match[2])
      rates.push({ label: p.label, rate, change, low52: 0, high52: 0 })
    }
  }

  // Try to fill in 52-week ranges
  const rangeSection = html.match(/52 Week Range[\s\S]{0,5000}/)
  if (rangeSection && rates.length > 0) {
    const rowMatches = Array.from(rangeSection[0].matchAll(/(\d+\.\d+)%[^%]*(\d+\.\d+)%[^%]*(\d+\.\d+)%/g))
    rowMatches.forEach((m, i) => {
      if (rates[i]) {
        rates[i].low52  = parseRate(m[2])
        rates[i].high52 = parseRate(m[3])
      }
    })
  }

  return rates
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const today = new Date().toISOString().split("T")[0]
  const fetchedAt = new Date().toISOString()

  try {
    const rates = await scrapeMND()

    if (rates.length < 4) {
      return NextResponse.json({ error: "Not enough rates scraped", count: rates.length }, { status: 500 })
    }

    const rows = rates.map((r) => ({
      rate_date:  today,
      label:      r.label,
      rate:       r.rate,
      rate_str:   `${r.rate.toFixed(2)}%`,
      change:     r.change,
      change_str: r.change === 0 ? "0.00%" : `${r.change > 0 ? "+" : ""}${r.change.toFixed(2)}%`,
      direction:  r.change > 0 ? "up" : r.change < 0 ? "down" : ("flat" as "up" | "down" | "flat"),
      low52:      r.low52,
      high52:     r.high52,
      source:     "MND",
      fetched_at: fetchedAt,
    }))

    const { error } = await supabase
      .from("mortgage_rates")
      .upsert(rows, { onConflict: "rate_date,label" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Cron] Upserted ${rows.length} mortgage rates for ${today}`)
    return NextResponse.json({ success: true, date: today, count: rows.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[Cron] Mortgage rate scrape failed:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
