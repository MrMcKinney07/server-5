"use client"

import { useState, useCallback } from "react"
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
  effectiveGrossIncome: number
  operatingExpenses: number
  noi: number
  purchasePrice: number
  capRate: number
  cashOnCashReturn: number
  downPayment: number
  annualDebtService: number
  cashFlow: number
}

interface Props {
  onResultChange?: (result: CapRateResult | null) => void
}

export function CapRateCalculator({ onResultChange }: Props) {
  const [monthlyRent, setMonthlyRent] = useState("3500")
  const [vacancyRate, setVacancyRate] = useState("5")
  const [propertyTax, setPropertyTax] = useState("4800")
  const [insurance, setInsurance] = useState("1800")
  const [maintenance, setMaintenance] = useState("2400")
  const [management, setManagement] = useState("3")
  const [otherExpenses, setOtherExpenses] = useState("600")
  const [purchasePrice, setPurchasePrice] = useState("400000")
  const [downPct, setDownPct] = useState("25")
  const [mortgageRate, setMortgageRate] = useState("7.25")
  const [result, setResult] = useState<CapRateResult | null>(null)

  const calculate = useCallback(() => {
    const grossRentalIncome = parse(monthlyRent) * 12
    const vacancyLoss = grossRentalIncome * (parseFloat(vacancyRate) / 100)
    const egi = grossRentalIncome - vacancyLoss
    const mgmtFee = egi * (parseFloat(management) / 100)
    const operatingExpenses = parse(propertyTax) + parse(insurance) + parse(maintenance) + mgmtFee + parse(otherExpenses)
    const noi = egi - operatingExpenses
    const price = parse(purchasePrice)
    const capRate = price > 0 ? (noi / price) * 100 : 0

    // Cash-on-cash
    const dp = price * (parseFloat(downPct) / 100)
    const loanAmt = price - dp
    const r = parseFloat(mortgageRate) / 100 / 12
    const n = 30 * 12
    const monthlyMortgage = r > 0 ? (loanAmt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0
    const annualDebtService = monthlyMortgage * 12
    const cashFlow = noi - annualDebtService
    const cashOnCash = dp > 0 ? (cashFlow / dp) * 100 : 0

    const res: CapRateResult = {
      grossRentalIncome,
      vacancyLoss,
      effectiveGrossIncome: egi,
      operatingExpenses,
      noi,
      purchasePrice: price,
      capRate,
      cashOnCashReturn: cashOnCash,
      downPayment: dp,
      annualDebtService,
      cashFlow,
    }
    setResult(res)
    onResultChange?.(res)
  }, [monthlyRent, vacancyRate, propertyTax, insurance, maintenance, management, otherExpenses, purchasePrice, downPct, mortgageRate, onResultChange])

  const handleDownload = async () => {
    if (!result) return
    await generatePDF("caprate", getCapRateRows(result), "Cap Rate & Investment Analysis")
  }

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-violet-400" />
          Cap Rate Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Income</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} prefix="$" />
            <Field label="Vacancy Rate" value={vacancyRate} onChange={setVacancyRate} suffix="%" />
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Annual Expenses</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Property Tax" value={propertyTax} onChange={setPropertyTax} prefix="$" />
            <Field label="Insurance" value={insurance} onChange={setInsurance} prefix="$" />
            <Field label="Maintenance" value={maintenance} onChange={setMaintenance} prefix="$" />
            <Field label="Mgmt Fee" value={management} onChange={setManagement} suffix="%" />
            <Field label="Other Expenses" value={otherExpenses} onChange={setOtherExpenses} prefix="$" />
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Financing</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" />
            <Field label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" />
            <Field label="Mortgage Rate" value={mortgageRate} onChange={setMortgageRate} suffix="%" />
          </div>
        </div>

        <Button onClick={calculate} className="w-full bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl">
          Calculate
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Cap Rate" value={`${result.capRate.toFixed(2)}%`} color={result.capRate >= 5 ? "emerald" : result.capRate >= 3 ? "amber" : "rose"} />
              <MetricCard label="Cash-on-Cash" value={`${result.cashOnCashReturn.toFixed(2)}%`} color={result.cashOnCashReturn >= 8 ? "emerald" : result.cashOnCashReturn >= 4 ? "amber" : "rose"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="NOI" value={fmt(result.noi)} color="cyan" />
              <MetricCard label="Monthly Cash Flow" value={fmt(result.cashFlow / 12)} color={result.cashFlow >= 0 ? "emerald" : "rose"} />
            </div>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <TableRow label="Gross Rental Income" value={fmt(result.grossRentalIncome)} />
                  <TableRow label="Vacancy Loss" value={`-${fmt(result.vacancyLoss)}`} dim />
                  <TableRow label="Effective Gross Income" value={fmt(result.effectiveGrossIncome)} />
                  <TableRow label="Operating Expenses" value={`-${fmt(result.operatingExpenses)}`} dim />
                  <TableRow label="Net Operating Income" value={fmt(result.noi)} bold />
                  <TableRow label="Annual Debt Service" value={`-${fmt(result.annualDebtService)}`} dim />
                  <TableRow label="Annual Cash Flow" value={fmt(result.cashFlow)} bold />
                </tbody>
              </table>
            </div>
            <Button variant="outline" onClick={handleDownload} className="w-full border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value, onChange, prefix, suffix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300 text-xs">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
        <Input
          className={`bg-white/[0.04] border-white/[0.08] text-white rounded-xl ${prefix ? "pl-7" : ""} ${suffix ? "pr-7" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  }
  return (
    <div className={`rounded-xl p-3 border text-center ${colorMap[color] || colorMap.cyan}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorMap[color]?.split(" ")[0]}`}>{value}</p>
    </div>
  )
}

function TableRow({ label, value, dim, bold }: { label: string; value: string; dim?: boolean; bold?: boolean }) {
  return (
    <tr className="border-t border-white/[0.04]">
      <td className={`px-4 py-2 ${bold ? "font-semibold text-white" : dim ? "text-slate-500" : "text-slate-400"}`}>{label}</td>
      <td className={`px-4 py-2 text-right ${bold ? "font-semibold text-white" : dim ? "text-slate-500" : "text-slate-300"}`}>{value}</td>
    </tr>
  )
}

export function getCapRateRows(r: CapRateResult) {
  return [
    { label: "Purchase Price", value: fmt(r.purchasePrice) },
    { label: "Gross Rental Income", value: fmt(r.grossRentalIncome) },
    { label: "Vacancy Loss", value: `-${fmt(r.vacancyLoss)}` },
    { label: "Operating Expenses", value: `-${fmt(r.operatingExpenses)}` },
    { label: "Net Operating Income (NOI)", value: fmt(r.noi), highlight: true },
    { label: "Cap Rate", value: `${r.capRate.toFixed(2)}%`, highlight: true },
    { label: "Annual Debt Service", value: `-${fmt(r.annualDebtService)}` },
    { label: "Annual Cash Flow", value: fmt(r.cashFlow) },
    { label: "Cash-on-Cash Return", value: `${r.cashOnCashReturn.toFixed(2)}%`, highlight: true },
  ]
}
