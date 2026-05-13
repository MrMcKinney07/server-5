import { NextResponse } from "next/server"

// FRED series IDs (Federal Reserve Economic Data — free, no API key needed for public series)
const FRED_SERIES: Record<string, string> = {
  "30yr":  "MORTGAGE30US",  // 30-Year Fixed Rate Mortgage Average
  "15yr":  "MORTGAGE15US",  // 15-Year Fixed Rate Mortgage Average
  "arm":   "MORTGAGE5US",   // 5/1-Year Adjustable Rate Mortgage
}

export interface HistoryPoint {
  date: string   // "YYYY-MM-DD"
  value: number  // rate %
}

export interface HistoryResponse {
  series: string
  label: string
  data: HistoryPoint[]
  source: "fred" | "fallback"
  fetchedAt: string
}

async function fetchFREDSeries(seriesId: string, startDate: string): Promise<HistoryPoint[]> {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&vintage_date=&realtime_start=&realtime_end=&cosd=${startDate}&coed=9999-12-31&limit=10000&offset=0&sort_order=asc&output_type=file&file_type=csv&revision_hist_toggle=false`

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 43200 }, // cache 12 hours
  })

  if (!res.ok) throw new Error(`FRED fetch failed: ${res.status}`)

  const text = await res.text()
  const lines = text.trim().split("\n").slice(1) // skip header row

  const points: HistoryPoint[] = []
  for (const line of lines) {
    const [date, val] = line.split(",")
    const value = parseFloat(val)
    if (date && !isNaN(value) && value > 0) {
      points.push({ date: date.trim(), value })
    }
  }

  return points
}

function getStartDate(range: string): string {
  const now = new Date()
  const map: Record<string, number> = {
    "3m":  3,
    "6m":  6,
    "1y":  12,
    "3y":  36,
    "5y":  60,
    "10y": 120,
  }
  const months = map[range] ?? 12
  const start = new Date(now)
  start.setMonth(start.getMonth() - months)
  return start.toISOString().split("T")[0]
}

// Fallback: generate realistic historical data when FRED is unreachable
function generateFallback(range: string, series: string): HistoryPoint[] {
  const months = { "3m": 3, "6m": 6, "1y": 12, "3y": 36, "5y": 60, "10y": 120 }[range] ?? 12
  const endDate = new Date()
  const points: HistoryPoint[] = []

  // Base rates and volatility by series
  const baseRate = series === "15yr" ? 6.07 : series === "arm" ? 5.89 : 6.57
  const volatility = 0.08

  for (let i = months * 4; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i * 7) // weekly points
    const noise = (Math.random() - 0.5) * volatility
    const trend = (i / (months * 4)) * 0.5 // slight upward trend going back
    const value = Math.max(3, Math.min(9, baseRate + trend + noise))
    points.push({
      date: d.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    })
  }

  return points
}

const LABEL_MAP: Record<string, string> = {
  "30yr": "30-Year Fixed",
  "15yr": "15-Year Fixed",
  "arm":  "5/1 ARM",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range  = searchParams.get("range")  ?? "1y"
  const series = searchParams.get("series") ?? "30yr"
  const fredId = FRED_SERIES[series] ?? FRED_SERIES["30yr"]
  const startDate = getStartDate(range)
  const fetchedAt = new Date().toISOString()

  try {
    const data = await fetchFREDSeries(fredId, startDate)

    if (data.length > 2) {
      return NextResponse.json({
        series,
        label: LABEL_MAP[series] ?? "30-Year Fixed",
        data,
        source: "fred",
        fetchedAt,
      } satisfies HistoryResponse)
    }

    // Empty response — return fallback
    return NextResponse.json({
      series,
      label: LABEL_MAP[series] ?? "30-Year Fixed",
      data: generateFallback(range, series),
      source: "fallback",
      fetchedAt,
    } satisfies HistoryResponse)
  } catch {
    return NextResponse.json({
      series,
      label: LABEL_MAP[series] ?? "30-Year Fixed",
      data: generateFallback(range, series),
      source: "fallback",
      fetchedAt,
    } satisfies HistoryResponse)
  }
}
