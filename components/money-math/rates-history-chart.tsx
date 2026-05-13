"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { RefreshCw, DatabaseIcon } from "lucide-react"
import type { HistoryResponse, HistoryPoint } from "@/app/api/money-math/rates/history/route"

const RANGES = [
  { id: "3m",  label: "3M" },
  { id: "6m",  label: "6M" },
  { id: "1y",  label: "1Y" },
  { id: "3y",  label: "3Y" },
  { id: "5y",  label: "5Y" },
  { id: "10y", label: "10Y" },
]

const SERIES_OPTIONS = [
  { id: "30yr", label: "30-Yr Fixed", color: "#22d3ee" },
  { id: "15yr", label: "15-Yr Fixed", color: "#a78bfa" },
  { id: "arm",  label: "5/1 ARM",     color: "#34d399" },
]

function formatDate(dateStr: string, range: string): string {
  const d = new Date(dateStr)
  if (range === "3m" || range === "6m") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  if (range === "1y") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

function downsample(data: HistoryPoint[], maxPoints: number): HistoryPoint[] {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0 || i === data.length - 1)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 border border-white/[0.1] rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-slate-400 text-[11px] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>
          {p.value.toFixed(2)}%
        </p>
      ))}
    </div>
  )
}

export function RatesHistoryChart() {
  const [activeRange,  setActiveRange]  = useState("1y")
  const [activeSeries, setActiveSeries] = useState("30yr")
  const [data,    setData]    = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [source,  setSource]  = useState<"fred" | "fallback">("fred")
  const [minVal,  setMinVal]  = useState(5)
  const [maxVal,  setMaxVal]  = useState(8)

  const fetchHistory = useCallback(async (range: string, series: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/money-math/rates/history?range=${range}&series=${series}`)
      const json: HistoryResponse = await res.json()
      const points = downsample(json.data, 120)
      setData(points)
      setSource(json.source)

      if (points.length) {
        const vals = points.map((p) => p.value)
        const lo = Math.min(...vals)
        const hi = Math.max(...vals)
        const pad = (hi - lo) * 0.15 || 0.3
        setMinVal(Math.floor((lo - pad) * 4) / 4)
        setMaxVal(Math.ceil((hi + pad) * 4) / 4)
      }
    } catch {
      // keep existing data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(activeRange, activeSeries)
  }, [activeRange, activeSeries, fetchHistory])

  const seriesColor = SERIES_OPTIONS.find((s) => s.id === activeSeries)?.color ?? "#22d3ee"
  const currentRate = data.length ? data[data.length - 1].value : null
  const startRate   = data.length ? data[0].value : null
  const rateChange  = currentRate !== null && startRate !== null ? currentRate - startRate : null

  const chartData = data.map((p) => ({
    ...p,
    date: formatDate(p.date, activeRange),
  }))

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Historical Rate Trend</p>
          {currentRate !== null && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: seriesColor }}>
                {currentRate.toFixed(2)}%
              </span>
              {rateChange !== null && (
                <span className={`text-sm font-medium ${rateChange > 0 ? "text-rose-400" : rateChange < 0 ? "text-emerald-400" : "text-slate-400"}`}>
                  {rateChange > 0 ? "+" : ""}{rateChange.toFixed(2)}% this period
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Series selector */}
          <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
            {SERIES_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSeries(s.id)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeSeries === s.id
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                style={activeSeries === s.id ? { backgroundColor: s.color + "22", color: s.color } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Range selector */}
          <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRange(r.id)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeRange === r.id
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchHistory(activeRange, activeSeries)}
            disabled={loading}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl z-10">
            <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={seriesColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={seriesColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickCount={6}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {currentRate && (
              <ReferenceLine
                y={currentRate}
                stroke={seriesColor}
                strokeDasharray="4 4"
                strokeOpacity={0.4}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={seriesColor}
              strokeWidth={2}
              fill="url(#rateGradient)"
              dot={false}
              activeDot={{ r: 4, fill: seriesColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Source attribution */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
        <DatabaseIcon className="h-3 w-3" />
        {source === "fred"
          ? "Source: FRED · Federal Reserve Bank of St. Louis · Updated weekly"
          : "Source: Estimated data (FRED unavailable)"}
      </div>
    </div>
  )
}
