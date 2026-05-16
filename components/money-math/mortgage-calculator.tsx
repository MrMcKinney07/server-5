"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Home, Download } from "lucide-react"
import { generatePDF } from "@/lib/money-math/pdf-generator"

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val)
}

function parseCurrency(val: string) {
  return parseFloat(val.replace(/[^0-9.]/g, "")) || 0
}

export interface MortgageResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  loanAmount: number
  downPaymentAmount: number
  principal: number
  rate: number
  termYears: number
  amortization: { month: number; principal: number; interest: number; balance: number }[]
}

export interface MortgageSharedContext {
  homePrice: string
  downPayment: string
  interestRate: string
  termYears: string
}

interface Props {
  onResultChange?: (result: MortgageResult | null) => void
  onContextChange?: (ctx: MortgageSharedContext) => void
  liveRates?: Array<{ label: string; rate: number }>
  initialHomePrice?: string
  initialDownPayment?: string
  initialInterestRate?: string
  initialTermYears?: string
}

export function MortgageCalculator({ onResultChange, onContextChange, liveRates, initialHomePrice, initialDownPayment, initialInterestRate, initialTermYears }: Props) {
  const [homePrice, setHomePrice] = useState(initialHomePrice ?? "400000")
  const [downPayment, setDownPayment] = useState(initialDownPayment ?? "20")
  const [interestRate, setInterestRate] = useState(initialInterestRate ?? "7.25")
  const [termYears, setTermYears] = useState(initialTermYears ?? "30")
  const [result, setResult] = useState<MortgageResult | null>(null)
  const [liveRateLabel, setLiveRateLabel] = useState<string | null>(null)

  const applyLiveRate = (label: string, rate: number) => {
    const rateStr = rate.toFixed(2)
    setInterestRate(rateStr)
    setLiveRateLabel(label)
    setResult(null)
    onResultChange?.(null)
    onContextChange?.({ homePrice, downPayment, interestRate: rateStr, termYears })
  }

  const calculate = useCallback(() => {
    onContextChange?.({ homePrice, downPayment, interestRate, termYears })

    const price = parseCurrency(homePrice)
    const dpPct = parseFloat(downPayment) || 0
    const rate = parseFloat(interestRate) / 100 / 12
    const n = parseInt(termYears) * 12
    const downAmt = price * (dpPct / 100)
    const principal = price - downAmt

    if (!price || !rate || !n) return

    const monthly = (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
    const totalPayment = monthly * n
    const totalInterest = totalPayment - principal

    // Build first 12 months of amortization
    const amortization: MortgageResult["amortization"] = []
    let balance = principal
    for (let i = 1; i <= Math.min(n, 360); i++) {
      const interestPmt = balance * rate
      const principalPmt = monthly - interestPmt
      balance -= principalPmt
      amortization.push({ month: i, principal: principalPmt, interest: interestPmt, balance: Math.max(0, balance) })
    }

    const res: MortgageResult = {
      monthlyPayment: monthly,
      totalPayment,
      totalInterest,
      loanAmount: principal,
      downPaymentAmount: downAmt,
      principal,
      rate: parseFloat(interestRate),
      termYears: parseInt(termYears),
      amortization,
    }
    setResult(res)
    onResultChange?.(res)
  }, [homePrice, downPayment, interestRate, termYears, onResultChange])

  const handleDownload = async () => {
    if (!result) return
    await generatePDF("mortgage", getMortgageRows(result), "Mortgage Payment Calculator")
  }

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Home className="h-4 w-4 text-cyan-400" />
          Mortgage Payment Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {liveRates && liveRates.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Apply Live Rate (MND)</Label>
            <div className="flex flex-wrap gap-2">
              {liveRates.map((r) => (
                <button
                  key={r.label}
                  onClick={() => applyLiveRate(r.label, r.rate)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    liveRateLabel === r.label
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {r.label} · {r.rate.toFixed(2)}%
                </button>
              ))}
            </div>
            {liveRateLabel && (
              <p className="text-[11px] text-cyan-500">Using live {liveRateLabel} rate from Mortgage News Daily</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Home Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input
                className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl"
                value={homePrice}
                onChange={(e) => setHomePrice(e.target.value)}
                placeholder="400,000"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Down Payment %</Label>
            <div className="relative">
              <Input
                className="bg-white/[0.04] border-white/[0.08] text-white pr-7 rounded-xl"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                placeholder="20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Interest Rate</Label>
            <div className="relative">
              <Input
                className="bg-white/[0.04] border-white/[0.08] text-white pr-7 rounded-xl"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="7.25"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Loan Term (Years)</Label>
            <Input
              className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
              value={termYears}
              onChange={(e) => setTermYears(e.target.value)}
              placeholder="30"
            />
          </div>
        </div>

        <Button onClick={calculate} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl">
          Calculate
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">Monthly Payment</p>
              <p className="text-3xl font-bold text-cyan-400">{formatCurrency(result.monthlyPayment)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResultRow label="Loan Amount" value={formatCurrency(result.loanAmount)} />
              <ResultRow label="Down Payment" value={formatCurrency(result.downPaymentAmount)} />
              <ResultRow label="Total Payment" value={formatCurrency(result.totalPayment)} />
              <ResultRow label="Total Interest" value={formatCurrency(result.totalInterest)} accent="rose" />
            </div>
            <div className="pt-1">
              <p className="text-xs text-slate-400 mb-2">First 12 Months</p>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.04]">
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Mo.</th>
                      <th className="text-right px-3 py-2 text-slate-400 font-medium">Principal</th>
                      <th className="text-right px-3 py-2 text-slate-400 font-medium">Interest</th>
                      <th className="text-right px-3 py-2 text-slate-400 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.amortization.slice(0, 12).map((row) => (
                      <tr key={row.month} className="border-t border-white/[0.04]">
                        <td className="px-3 py-1.5 text-slate-400">{row.month}</td>
                        <td className="px-3 py-1.5 text-right text-emerald-400">{formatCurrency(row.principal)}</td>
                        <td className="px-3 py-1.5 text-right text-rose-400">{formatCurrency(row.interest)}</td>
                        <td className="px-3 py-1.5 text-right text-white">{formatCurrency(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="w-full border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResultRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className={`text-sm font-semibold ${accent === "rose" ? "text-rose-400" : "text-white"}`}>{value}</p>
    </div>
  )
}

export function getMortgageRows(r: MortgageResult) {
  return [
    { label: "Home Price", value: formatCurrency(r.principal + r.downPaymentAmount) },
    { label: "Down Payment", value: formatCurrency(r.downPaymentAmount) },
    { label: "Loan Amount", value: formatCurrency(r.loanAmount) },
    { label: "Interest Rate", value: `${r.rate}%` },
    { label: "Loan Term", value: `${r.termYears} years` },
    { label: "Monthly Payment", value: formatCurrency(r.monthlyPayment), highlight: true },
    { label: "Total Interest Paid", value: formatCurrency(r.totalInterest) },
    { label: "Total Payment", value: formatCurrency(r.totalPayment) },
  ]
}
