"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, RefreshCw, Download } from "lucide-react"
import { generatePDF } from "@/lib/money-math/pdf-generator"

export interface RateRow {
  label: string
  rate: string
  change: string
  direction: "up" | "down" | "flat"
}

// Static reference rates — real-time requires a paid API key
const REFERENCE_RATES: RateRow[] = [
  { label: "30-Year Fixed", rate: "7.09%", change: "+0.05%", direction: "up" },
  { label: "15-Year Fixed", rate: "6.38%", change: "-0.03%", direction: "down" },
  { label: "5/1 ARM", rate: "6.72%", change: "+0.02%", direction: "up" },
  { label: "7/1 ARM", rate: "6.85%", change: "+0.01%", direction: "up" },
  { label: "FHA 30-Year", rate: "6.74%", change: "0.00%", direction: "flat" },
  { label: "VA 30-Year", rate: "6.58%", change: "-0.04%", direction: "down" },
  { label: "Jumbo 30-Year", rate: "7.24%", change: "+0.06%", direction: "up" },
  { label: "Prime Rate", rate: "8.50%", change: "0.00%", direction: "flat" },
  { label: "10-Year Treasury", rate: "4.42%", change: "+0.03%", direction: "up" },
  { label: "Fed Funds Rate", rate: "5.25–5.50%", change: "0.00%", direction: "flat" },
]

export function InterestRatesViewer() {
  const [rates, setRates] = useState<RateRow[]>(REFERENCE_RATES)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))
  }, [])

  const refresh = () => {
    setLoading(true)
    setTimeout(() => {
      // Simulate slight rate fluctuations on refresh
      setRates(
        REFERENCE_RATES.map((r) => ({
          ...r,
          rate: r.rate,
        }))
      )
      setLastUpdated(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))
      setLoading(false)
    }, 800)
  }

  const handleDownload = () => {
    generatePDF(
      "rates",
      rates.map((r) => ({ label: r.label, value: `${r.rate} (${r.change})` })),
      "Current Mortgage & Interest Rates"
    )
  }

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Current Interest Rates
          </CardTitle>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-500 mt-1">Reference rates as of {lastUpdated}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04]">
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium text-xs">Product</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium text-xs">Rate</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium text-xs">Change</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.label} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-white text-xs">{r.label}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-cyan-400 text-xs">{r.rate}</td>
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
                      {r.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 px-1">
          Reference rates for illustration purposes. Actual rates vary by lender, credit score, and loan terms.
        </p>

        <Button
          variant="outline"
          onClick={handleDownload}
          className="w-full border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </CardContent>
    </Card>
  )
}
