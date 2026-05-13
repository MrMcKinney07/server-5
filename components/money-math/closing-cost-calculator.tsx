"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Receipt, Download } from "lucide-react"
import { generatePDF } from "@/lib/money-math/pdf-generator"

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val)
}
function parse(val: string) {
  return parseFloat(val.replace(/[^0-9.]/g, "")) || 0
}

export interface ClosingCostResult {
  purchasePrice: number
  loanAmount: number
  lenderFees: number
  titleInsurance: number
  escrowFees: number
  recordingFees: number
  prepaidInterest: number
  homeownersInsurance: number
  propertyTaxEscrow: number
  inspectionFees: number
  appraisalFee: number
  otherFees: number
  totalBuyerCosts: number
  docStamps: number
  titleBelowThreshold: number
  totalSellerCosts: number
  breakdown: { category: string; item: string; amount: number; party: "buyer" | "seller" }[]
}

interface Props {
  onResultChange?: (result: ClosingCostResult | null) => void
}

export function ClosingCostCalculator({ onResultChange }: Props) {
  const [purchasePrice, setPurchasePrice] = useState("450000")
  const [downPct, setDownPct] = useState("20")
  const [isFHA, setIsFHA] = useState(false)
  const [state, setState] = useState("FL")
  const [result, setResult] = useState<ClosingCostResult | null>(null)

  const calculate = useCallback(() => {
    const price = parse(purchasePrice)
    const loanAmount = price * (1 - parseFloat(downPct) / 100)

    // Buyer costs
    const originationFee = loanAmount * 0.01
    const appraisalFee = 550
    const creditReport = 35
    const titleSearchFee = 200
    const lenderTitleInsurance = loanAmount * 0.0035
    const ownerTitleInsurance = price * 0.00575
    const escrowFee = 500
    const recordingFees = 225
    const prepaidInterest = (loanAmount * 0.0725) / 365 * 15
    const homeownersInsurance = price * 0.006 / 12 * 3
    const propertyTaxEscrow = (price * 0.012) / 12 * 3
    const inspectionFee = 450
    const surveyFee = 400
    const fhaMIP = isFHA ? loanAmount * 0.0175 : 0
    const otherBuyerFees = creditReport + surveyFee + fhaMIP

    const lenderFees = originationFee + appraisalFee + creditReport
    const titleInsurance = lenderTitleInsurance + ownerTitleInsurance + titleSearchFee
    const escrowFees = escrowFee
    const prepaid = prepaidInterest + homeownersInsurance + propertyTaxEscrow

    const totalBuyerCosts = lenderFees + titleInsurance + escrowFees + recordingFees + prepaid + inspectionFee + otherBuyerFees

    // Seller costs (Florida defaults)
    const docStamps = price * 0.007
    const titleBelowThreshold = price <= 100000 ? price * 0.00575 : price * 0.005
    const totalSellerCosts = docStamps + titleBelowThreshold

    const breakdown: ClosingCostResult["breakdown"] = [
      { category: "Lender Fees", item: "Origination Fee (1%)", amount: originationFee, party: "buyer" },
      { category: "Lender Fees", item: "Appraisal Fee", amount: appraisalFee, party: "buyer" },
      { category: "Lender Fees", item: "Credit Report", amount: creditReport, party: "buyer" },
      { category: "Title", item: "Lender Title Insurance", amount: lenderTitleInsurance, party: "buyer" },
      { category: "Title", item: "Owner Title Insurance", amount: ownerTitleInsurance, party: "buyer" },
      { category: "Title", item: "Title Search", amount: titleSearchFee, party: "buyer" },
      { category: "Settlement", item: "Escrow / Settlement Fee", amount: escrowFee, party: "buyer" },
      { category: "Government", item: "Recording Fees", amount: recordingFees, party: "buyer" },
      { category: "Prepaids", item: "Prepaid Interest (15 days)", amount: prepaidInterest, party: "buyer" },
      { category: "Prepaids", item: "Homeowners Insurance (3 mo.)", amount: homeownersInsurance, party: "buyer" },
      { category: "Prepaids", item: "Property Tax Escrow (3 mo.)", amount: propertyTaxEscrow, party: "buyer" },
      { category: "Inspections", item: "Home Inspection", amount: inspectionFee, party: "buyer" },
      { category: "Inspections", item: "Survey", amount: surveyFee, party: "buyer" },
      ...(isFHA ? [{ category: "FHA", item: "Upfront MIP (1.75%)", amount: fhaMIP, party: "buyer" as const }] : []),
      { category: "Government", item: "Documentary Stamps", amount: docStamps, party: "seller" },
      { category: "Title", item: "Owner's Title (Seller Portion)", amount: titleBelowThreshold, party: "seller" },
    ]

    const res: ClosingCostResult = {
      purchasePrice: price,
      loanAmount,
      lenderFees: lenderFees + fhaMIP,
      titleInsurance,
      escrowFees,
      recordingFees,
      prepaidInterest,
      homeownersInsurance,
      propertyTaxEscrow,
      inspectionFees: inspectionFee + surveyFee,
      appraisalFee,
      otherFees: creditReport + surveyFee,
      totalBuyerCosts,
      docStamps,
      titleBelowThreshold,
      totalSellerCosts,
      breakdown,
    }
    setResult(res)
    onResultChange?.(res)
  }, [purchasePrice, downPct, isFHA, onResultChange])

  const handleDownload = () => {
    if (!result) return
    generatePDF("closing", getClosingCostRows(result), "Closing Cost Estimate")
  }

  const buyerItems = result?.breakdown.filter((b) => b.party === "buyer") ?? []
  const sellerItems = result?.breakdown.filter((b) => b.party === "seller") ?? []

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 text-rose-400" />
          Closing Cost Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Purchase Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Down Payment</Label>
            <div className="relative">
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pr-7 rounded-xl" value={downPct} onChange={(e) => setDownPct(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <Label className="text-slate-300 text-sm">FHA Loan</Label>
          <Switch checked={isFHA} onCheckedChange={setIsFHA} />
        </div>

        <Button onClick={calculate} className="w-full bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-xl">
          Calculate Closing Costs
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">Buyer Total</p>
                <p className="text-xl font-bold text-cyan-400">{fmt(result.totalBuyerCosts)}</p>
                <p className="text-slate-500 text-xs mt-0.5">{((result.totalBuyerCosts / result.purchasePrice) * 100).toFixed(1)}% of price</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">Seller Total</p>
                <p className="text-xl font-bold text-amber-400">{fmt(result.totalSellerCosts)}</p>
                <p className="text-slate-500 text-xs mt-0.5">{((result.totalSellerCosts / result.purchasePrice) * 100).toFixed(1)}% of price</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Buyer Costs</p>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {buyerItems.map((item, i) => (
                      <tr key={i} className="border-t border-white/[0.04] first:border-t-0">
                        <td className="px-3 py-2 text-slate-400">{item.item}</td>
                        <td className="px-3 py-2 text-right text-slate-300">{fmt(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-white/[0.1] bg-white/[0.03]">
                      <td className="px-3 py-2 font-semibold text-white">Total Buyer Costs</td>
                      <td className="px-3 py-2 text-right font-bold text-cyan-400">{fmt(result.totalBuyerCosts)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Seller Costs</p>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {sellerItems.map((item, i) => (
                      <tr key={i} className="border-t border-white/[0.04] first:border-t-0">
                        <td className="px-3 py-2 text-slate-400">{item.item}</td>
                        <td className="px-3 py-2 text-right text-slate-300">{fmt(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-white/[0.1] bg-white/[0.03]">
                      <td className="px-3 py-2 font-semibold text-white">Total Seller Costs</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-400">{fmt(result.totalSellerCosts)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

export function getClosingCostRows(r: ClosingCostResult) {
  return [
    { label: "Purchase Price", value: fmt(r.purchasePrice) },
    { label: "Loan Amount", value: fmt(r.loanAmount) },
    { label: "--- BUYER COSTS ---", value: "" },
    { label: "Lender Fees", value: fmt(r.lenderFees) },
    { label: "Title Insurance", value: fmt(r.titleInsurance) },
    { label: "Escrow / Settlement", value: fmt(r.escrowFees) },
    { label: "Recording Fees", value: fmt(r.recordingFees) },
    { label: "Inspection Fees", value: fmt(r.inspectionFees) },
    { label: "Prepaids & Escrows", value: fmt(r.prepaidInterest + r.homeownersInsurance + r.propertyTaxEscrow) },
    { label: "Total Buyer Costs", value: fmt(r.totalBuyerCosts), highlight: true },
    { label: "--- SELLER COSTS ---", value: "" },
    { label: "Documentary Stamps", value: fmt(r.docStamps) },
    { label: "Owner's Title", value: fmt(r.titleBelowThreshold) },
    { label: "Total Seller Costs", value: fmt(r.totalSellerCosts), highlight: true },
  ]
}
