"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, RefreshCw, Download, Wifi, WifiOff, ExternalLink } from "lucide-react"
import { generatePDF } from "@/lib/money-math/pdf-generator"
import type { LiveRate, RatesResponse } from "@/app/api/money-math/rates/route"
import { RatesHistoryChart } from "@/components/money-math/rates-history-chart"

export type { LiveRate }

interface Props {
  onRatesLoaded?: (rates: LiveRate[]) => void
}

export function InterestRatesViewer({ onRatesLoaded }: Props) {
  const [data, setData] = useState<RatesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/money-math/rates")
      if (!res.ok) throw new Error("Failed to fetch rates")
      const json: RatesResponse = await res.json()
      setData(json)
      onRatesLoaded?.(json.rates)
    } catch (e: any) {
      setError("Could not load rates. Showing last known data.")
    } finally {
      setLoading(false)
    }
  }, [onRatesLoaded])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const handleDownload = () => {
    if (!data) return
    generatePDF(
      "rates",
      data.rates.map((r) => ({
        label: r.label,
        value: `${r.rateStr} (${r.changeStr})`,
        subtext: r.low52 && r.high52 ? `52-wk: ${r.low52.toFixed(2)}%–${r.high52.toFixed(2)}%` : undefined,
      })),
      "Current Mortgage & Interest Rates",
      `Source: Mortgage News Daily · As of ${data.asOf}`
    )
  }

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Live Mortgage Rates
          </CardTitle>
          <button
            onClick={fetchRates}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {data && (
          <div className="flex items-center gap-2 mt-1">
            {data.source === "live" ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Wifi className="h-3 w-3" /> Live · {data.asOf}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <WifiOff className="h-3 w-3" /> Cached · {data.asOf}
              </span>
            )}
            <a
              href="https://www.mortgagenewsdaily.com/mortgage-rates"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors ml-auto"
            >
              MortgageNewsDaily.com <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {error && <p className="text-xs text-amber-400 mt-1">{error}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && !data ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-white/[0.04] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.04]">
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium text-xs">Product</th>
                    <th className="text-right px-4 py-2.5 text-slate-400 font-medium text-xs">Rate</th>
                    <th className="text-right px-4 py-2.5 text-slate-400 font-medium text-xs">Today</th>
                    <th className="text-right px-4 py-2.5 text-slate-400 font-medium text-xs hidden sm:table-cell">52-Wk Range</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rates ?? []).map((r) => (
                    <tr key={r.label} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-white text-xs font-medium">{r.label}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-cyan-400 text-sm">{r.rateStr}</td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        <span
                          className={
                            r.direction === "up"
                              ? "text-rose-400"
                              : r.direction === "down"
                                ? "text-emerald-400"
                                : "text-slate-400"
                          }
                        >
                          {r.direction === "up" ? "▲" : r.direction === "down" ? "▼" : "–"} {r.changeStr}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500 hidden sm:table-cell">
                        {r.low52 && r.high52
                          ? `${r.low52.toFixed(2)}% – ${r.high52.toFixed(2)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rate bar visualization */}
            {data?.rates.slice(0, 3).map((r) => (
              <div key={r.label} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{r.label}</span>
                  <span className="text-cyan-400 font-semibold">{r.rateStr}</span>
                </div>
                {r.low52 > 0 && r.high52 > 0 && (
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full relative"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((r.rate - r.low52) / (r.high52 - r.low52)) * 100))}%`,
                      }}
                    />
                  </div>
                )}
                {r.low52 > 0 && r.high52 > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>{r.low52.toFixed(2)}% low</span>
                    <span>{r.high52.toFixed(2)}% high</span>
                  </div>
                )}
              </div>
            ))}

            {/* Historical chart */}
            <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <RatesHistoryChart />
            </div>

            <Button
              variant="outline"
              onClick={handleDownload}
              className="w-full border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
