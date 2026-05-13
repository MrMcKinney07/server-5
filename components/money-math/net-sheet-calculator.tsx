"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import { generatePDF } from "@/lib/money-math/pdf-generator"

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val)
}
function parse(val: string) {
  return parseFloat(val.replace(/[^0-9.]/g, "")) || 0
}

export interface NetSheetResult {
  salePrice: number
  mortgagePayoff: number
  agentCommission: number
  closingCosts: number
  taxes: number
  otherFees: number
  totalDeductions: number
  netProceeds: number
}

interface Props {
  onResultChange?: (result: NetSheetResult | null) => void
}

export function NetSheetCalculator({ onResultChange }: Props) {
  const [salePrice, setSalePrice] = useState("450000")
  const [mortgagePayoff, setMortgagePayoff] = useState("280000")
  const [commissionRate, setCommissionRate] = useState("6")
  const [closingCosts, setClosingCosts] = useState("2500")
  const [prorations, setProrations] = useState("1200")
  const [otherFees, setOtherFees] = useState("500")
  const [result, setResult] = useState<NetSheetResult | null>(null)

  const calculate = useCallback(() => {
    const price = parse(salePrice)
    const payoff = parse(mortgagePayoff)
    const commission = price * (parseFloat(commissionRate) / 100)
    const closing = parse(closingCosts)
    const taxes = parse(prorations)
    const other = parse(otherFees)
    const totalDeductions = payoff + commission + closing + taxes + other
    const netProceeds = price - totalDeductions

    const res: NetSheetResult = {
      salePrice: price,
      mortgagePayoff: payoff,
      agentCommission: commission,
      closingCosts: closing,
      taxes,
      otherFees: other,
      totalDeductions,
      netProceeds,
    }
    setResult(res)
    onResultChange?.(res)
  }, [salePrice, mortgagePayoff, commissionRate, closingCosts, prorations, otherFees, onResultChange])

  const handleDownload = () => {
    if (!result) return
    generatePDF("netsheet", getNetSheetRows(result), "Seller Net Sheet")
  }

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-amber-400" />
          Seller Net Sheet Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Sale Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Mortgage Payoff</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl" value={mortgagePayoff} onChange={(e) => setMortgagePayoff(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Commission Rate</Label>
            <div className="relative">
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pr-7 rounded-xl" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Closing Costs</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl" value={closingCosts} onChange={(e) => setClosingCosts(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Tax Prorations</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl" value={prorations} onChange={(e) => setProrations(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Other Fees</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl" value={otherFees} onChange={(e) => setOtherFees(e.target.value)} />
            </div>
          </div>
        </div>

        <Button onClick={calculate} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl">
          Calculate Net Proceeds
        </Button>

        {result && (
          <div className="space-y-3">
            <div className={`rounded-xl p-4 text-center border ${result.netProceeds >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}>
              <p className="text-slate-400 text-xs mb-1">Estimated Net Proceeds</p>
              <p className={`text-3xl font-bold ${result.netProceeds >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmt(result.netProceeds)}</p>
            </div>
            <div className="space-y-1.5">
              <DeductionRow label="Sale Price" value={fmt(result.salePrice)} type="credit" />
              <div className="border-t border-white/[0.06] my-2" />
              <DeductionRow label="Mortgage Payoff" value={`-${fmt(result.mortgagePayoff)}`} type="debit" />
              <DeductionRow label={`Agent Commission (${commissionRate}%)`} value={`-${fmt(result.agentCommission)}`} type="debit" />
              <DeductionRow label="Closing Costs" value={`-${fmt(result.closingCosts)}`} type="debit" />
              <DeductionRow label="Tax Prorations" value={`-${fmt(result.taxes)}`} type="debit" />
              <DeductionRow label="Other Fees" value={`-${fmt(result.otherFees)}`} type="debit" />
              <div className="border-t border-white/[0.06] my-2" />
              <DeductionRow label="Total Deductions" value={`-${fmt(result.totalDeductions)}`} type="total" />
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

function DeductionRow({ label, value, type }: { label: string; value: string; type: "credit" | "debit" | "total" }) {
  return (
    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/[0.02]">
      <span className={`text-xs ${type === "total" ? "font-semibold text-white" : "text-slate-400"}`}>{label}</span>
      <span className={`text-xs font-semibold ${type === "credit" ? "text-emerald-400" : type === "total" ? "text-rose-400" : "text-slate-300"}`}>{value}</span>
    </div>
  )
}

export function getNetSheetRows(r: NetSheetResult) {
  return [
    { label: "Sale Price", value: fmt(r.salePrice), highlight: true },
    { label: "Mortgage Payoff", value: `-${fmt(r.mortgagePayoff)}` },
    { label: "Agent Commission", value: `-${fmt(r.agentCommission)}` },
    { label: "Closing Costs", value: `-${fmt(r.closingCosts)}` },
    { label: "Tax Prorations", value: `-${fmt(r.taxes)}` },
    { label: "Other Fees", value: `-${fmt(r.otherFees)}` },
    { label: "Total Deductions", value: `-${fmt(r.totalDeductions)}` },
    { label: "Net Proceeds", value: fmt(r.netProceeds), highlight: true },
  ]
}
