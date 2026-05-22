"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BarChart3, Download } from "lucide-react"
import { generatePDF } from "@/lib/money-math/pdf-generator"

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val)
}
function parse(val: string) {
  return parseFloat(val.replace(/[^0-9.]/g, "")) || 0
}

export interface CapRateResult {
  grossRentalIncome: number
  vacancyLoss: number
  extraIncome: number
  effectiveGrossIncome: number
  operatingExpenses: number
  noi: number
  purchasePrice: number
  capRate: number
}

export interface CashOnCashResult {
  annualDebtService: number
  cashFlow: number
  totalCashInvested: number
  cashOnCashReturn: number
  noi: number
}

interface Props {
  onResultChange?: (result: CapRateResult | null) => void
  initialPurchasePrice?: string
  initialDownPct?: string
  initialMortgageRate?: string
  initialLoanTerm?: string
}

export function CapRateCalculator({ onResultChange, initialPurchasePrice, initialDownPct, initialMortgageRate, initialLoanTerm }: Props) {
  // --- Cap Rate inputs ---
  const [monthlyRent, setMonthlyRent] = useState("3500")
  const [vacancyRate, setVacancyRate] = useState("5")
  const [extraIncome, setExtraIncome] = useState("0")
  const [propertyTax, setPropertyTax] = useState("4800")
  const [insurance, setInsurance] = useState("1800")
  const [maintenance, setMaintenance] = useState("2400")
  const [management, setManagement] = useState("3")
  const [otherExpenses, setOtherExpenses] = useState("600")
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice ?? "400000")
  const [capResult, setCapResult] = useState<CapRateResult | null>(null)

  // --- Cash-on-Cash inputs ---
  const [downPct, setDownPct] = useState(initialDownPct ?? "20")
  const [mortgageRate, setMortgageRate] = useState(initialMortgageRate ?? "7.0")
  const [loanTerm, setLoanTerm] = useState(initialLoanTerm ?? "30")

  // Sync when parent provides updated shared context
  useEffect(() => { if (initialPurchasePrice) setPurchasePrice(initialPurchasePrice) }, [initialPurchasePrice])
  useEffect(() => { if (initialDownPct) setDownPct(initialDownPct) }, [initialDownPct])
  useEffect(() => { if (initialMortgageRate) setMortgageRate(initialMortgageRate) }, [initialMortgageRate])
  useEffect(() => { if (initialLoanTerm) setLoanTerm(initialLoanTerm) }, [initialLoanTerm])
  const [closingCosts, setClosingCosts] = useState("8000")
  const [cocResult, setCocResult] = useState<CashOnCashResult | null>(null)

  const calculateCapRate = useCallback(() => {
    const grossRentalIncome = parse(monthlyRent) * 12
    const vacancyLoss = grossRentalIncome * (parseFloat(vacancyRate) / 100)
    const egi = grossRentalIncome - vacancyLoss + parse(extraIncome)
    const mgmtFee = egi * (parseFloat(management) / 100)
    const operatingExpenses =
      parse(propertyTax) + parse(insurance) + parse(maintenance) + mgmtFee + parse(otherExpenses)
    const noi = egi - operatingExpenses
    const price = parse(purchasePrice)
    const capRate = price > 0 ? (noi / price) * 100 : 0

    const res: CapRateResult = {
      grossRentalIncome,
      vacancyLoss,
      extraIncome: parse(extraIncome),
      effectiveGrossIncome: egi,
      operatingExpenses,
      noi,
      purchasePrice: price,
      capRate,
    }
    setCapResult(res)
    onResultChange?.(res)
  }, [monthlyRent, vacancyRate, extraIncome, propertyTax, insurance, maintenance, management, otherExpenses, purchasePrice, onResultChange])

  const calculateCashOnCash = useCallback(() => {
    if (!capResult) return
    const price = capResult.purchasePrice
    const down = price * (parseFloat(downPct) / 100)
    const loanAmount = price - down
    const r = parseFloat(mortgageRate) / 100 / 12
    const n = parseFloat(loanTerm) * 12
    const monthlyPayment =
      r > 0 ? (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1) : loanAmount / n
    const annualDebtService = monthlyPayment * 12
    const cashFlow = capResult.noi - annualDebtService
    const totalCashInvested = down + parse(closingCosts)
    const cashOnCashReturn = totalCashInvested > 0 ? (cashFlow / totalCashInvested) * 100 : 0

    setCocResult({ annualDebtService, cashFlow, totalCashInvested, cashOnCashReturn, noi: capResult.noi })
  }, [capResult, downPct, mortgageRate, loanTerm, closingCosts])

  const handleDownloadCapRate = async () => {
    if (!capResult) return
    await generatePDF("caprate", getCapRateRows(capResult), "Cap Rate Analysis")
  }

  const handleDownloadCashOnCash = async () => {
    if (!capResult || !cocResult) return
    await generatePDF("caprate", getCashOnCashRows(capResult, cocResult), "Cash-on-Cash Return Analysis")
  }

  return (
    <div className="space-y-6">
      {/* ── Cap Rate ─────────────────────────────────────── */}
      <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            Cap Rate Calculator
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Based on Net Operating Income (NOI) only — financing costs are excluded.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Income</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} prefix="$" />
              <Field label="Vacancy Rate" value={vacancyRate} onChange={setVacancyRate} suffix="%" />
              <Field label="Extra / Other Income (annual)" value={extraIncome} onChange={setExtraIncome} prefix="$" />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Annual Operating Expenses</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Property Tax" value={propertyTax} onChange={setPropertyTax} prefix="$" />
              <Field label="Insurance" value={insurance} onChange={setInsurance} prefix="$" />
              <Field label="Maintenance" value={maintenance} onChange={setMaintenance} prefix="$" />
              <Field label="Mgmt Fee" value={management} onChange={setManagement} suffix="%" />
              <Field label="Other Expenses" value={otherExpenses} onChange={setOtherExpenses} prefix="$" />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Property Value</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Purchase / Market Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
            </div>
          </div>

          <Button
            onClick={calculateCapRate}
            className="w-full bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl"
          >
            Calculate Cap Rate
          </Button>

          {capResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <MetricCard
                  label="Cap Rate"
                  value={`${capResult.capRate.toFixed(2)}%`}
                  color={capResult.capRate >= 6 ? "emerald" : capResult.capRate >= 4 ? "amber" : "rose"}
                  sublabel={capResult.capRate >= 6 ? "Strong return" : capResult.capRate >= 4 ? "Moderate return" : "Low return"}
                />
              </div>

              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    <TableRow label="Gross Rental Income" value={fmt(capResult.grossRentalIncome)} />
                    <TableRow label="Vacancy Loss" value={`− ${fmt(capResult.vacancyLoss)}`} dim />
                    <TableRow label="Effective Gross Income" value={fmt(capResult.effectiveGrossIncome)} />
                    <TableRow label="Operating Expenses" value={`− ${fmt(capResult.operatingExpenses)}`} dim />
                    <TableRow label="Net Operating Income (NOI)" value={fmt(capResult.noi)} bold />
                    <TableRow label="Purchase Price" value={fmt(capResult.purchasePrice)} />
                    <TableRow label="Cap Rate" value={`${capResult.capRate.toFixed(2)}%`} bold />
                  </tbody>
                </table>
              </div>

              <Button
                variant="outline"
                onClick={handleDownloadCapRate}
                className="w-full border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2"
              >
                <Download className="h-4 w-4" />
                Download Cap Rate PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Cash-on-Cash ─────────────────────────────────── */}
      <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            Cash-on-Cash Return
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Measures annual cash flow against actual cash invested, including financing costs.
            {!capResult && (
              <span className="text-amber-400 ml-1">Run Cap Rate calculation first.</span>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Financing</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" />
              <Field label="Mortgage Rate" value={mortgageRate} onChange={setMortgageRate} suffix="%" />
              <Field label="Loan Term" value={loanTerm} onChange={setLoanTerm} suffix="yrs" />
              <Field label="Closing Costs" value={closingCosts} onChange={setClosingCosts} prefix="$" />
            </div>
          </div>

          <Button
            onClick={calculateCashOnCash}
            disabled={!capResult}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl disabled:opacity-40"
          >
            Calculate Cash-on-Cash
          </Button>

          {cocResult && capResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Cash-on-Cash Return"
                  value={`${cocResult.cashOnCashReturn.toFixed(2)}%`}
                  color={cocResult.cashOnCashReturn >= 8 ? "emerald" : cocResult.cashOnCashReturn >= 4 ? "amber" : "rose"}
                  sublabel={cocResult.cashOnCashReturn >= 8 ? "Strong" : cocResult.cashOnCashReturn >= 4 ? "Moderate" : "Low"}
                />
                <MetricCard
                  label="Monthly Cash Flow"
                  value={fmt(cocResult.cashFlow / 12)}
                  color={cocResult.cashFlow >= 0 ? "emerald" : "rose"}
                  sublabel={cocResult.cashFlow >= 0 ? "Positive" : "Negative"}
                />
              </div>

              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    <TableRow label="Net Operating Income (NOI)" value={fmt(cocResult.noi)} />
                    <TableRow label="Annual Debt Service" value={`− ${fmt(cocResult.annualDebtService)}`} dim />
                    <TableRow label="Annual Cash Flow" value={fmt(cocResult.cashFlow)} bold />
                    <TableRow label="Total Cash Invested" value={fmt(cocResult.totalCashInvested)} />
                    <TableRow label="Cash-on-Cash Return" value={`${cocResult.cashOnCashReturn.toFixed(2)}%`} bold />
                  </tbody>
                </table>
              </div>

              <Button
                variant="outline"
                onClick={handleDownloadCashOnCash}
                className="w-full border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2"
              >
                <Download className="h-4 w-4" />
                Download Cash-on-Cash PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label, value, onChange, prefix, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300 text-xs">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
        <Input
          className={`bg-white/[0.04] border-white/[0.08] text-white rounded-xl ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, sublabel }: { label: string; value: string; color: string; sublabel?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose:    "text-rose-400 bg-rose-500/10 border-rose-500/20",
    cyan:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  }
  const cls = colorMap[color] || colorMap.cyan
  return (
    <div className={`rounded-xl p-3 border text-center ${cls}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${cls.split(" ")[0]}`}>{value}</p>
      {sublabel && <p className="text-xs opacity-60 mt-0.5">{sublabel}</p>}
    </div>
  )
}

function TableRow({ label, value, dim, bold }: { label: string; value: string; dim?: boolean; bold?: boolean }) {
  return (
    <tr className="border-t border-white/[0.04]">
      <td className={`px-4 py-2 ${bold ? "font-semibold text-white" : dim ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </td>
      <td className={`px-4 py-2 text-right ${bold ? "font-semibold text-white" : dim ? "text-slate-500" : "text-slate-300"}`}>
        {value}
      </td>
    </tr>
  )
}

export function getCapRateRows(r: CapRateResult) {
  return [
    { label: "Purchase / Market Price", value: fmt(r.purchasePrice) },
    { label: "Gross Rental Income", value: fmt(r.grossRentalIncome) },
    { label: "Vacancy Loss", value: `− ${fmt(r.vacancyLoss)}` },
    ...(r.extraIncome > 0 ? [{ label: "Extra / Other Income", value: fmt(r.extraIncome) }] : []),
    { label: "Effective Gross Income", value: fmt(r.effectiveGrossIncome) },
    { label: "Operating Expenses", value: `− ${fmt(r.operatingExpenses)}` },
    { label: "Net Operating Income (NOI)", value: fmt(r.noi), highlight: true },
    { label: "Cap Rate", value: `${r.capRate.toFixed(2)}%`, highlight: true },
  ]
}

export function getCashOnCashRows(cap: CapRateResult, coc: CashOnCashResult) {
  return [
    { label: "Net Operating Income (NOI)", value: fmt(coc.noi) },
    { label: "Annual Debt Service", value: `− ${fmt(coc.annualDebtService)}` },
    { label: "Annual Cash Flow", value: fmt(coc.cashFlow), highlight: true },
    { label: "Total Cash Invested", value: fmt(coc.totalCashInvested) },
    { label: "Cash-on-Cash Return", value: `${coc.cashOnCashReturn.toFixed(2)}%`, highlight: true },
  ]
}
