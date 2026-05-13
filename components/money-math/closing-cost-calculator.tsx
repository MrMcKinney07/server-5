"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Receipt, Download, Info } from "lucide-react"
import { generatePDF } from "@/lib/money-math/pdf-generator"

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val)
}
function pct(val: number, total: number) {
  return total > 0 ? ((val / total) * 100).toFixed(2) + "%" : "—"
}
function parse(val: string) {
  return parseFloat(val.replace(/[^0-9.]/g, "")) || 0
}

// Florida promulgated title insurance rates (Fla. Admin. Code 69O-186)
function floridaTitlePremium(amount: number): number {
  if (amount <= 0) return 0
  if (amount <= 100_000) return (amount / 1000) * 5.75
  if (amount <= 1_000_000) return 575 + ((amount - 100_000) / 1000) * 5.0
  if (amount <= 5_000_000) return 575 + 4_500 + ((amount - 1_000_000) / 1000) * 2.5
  return 575 + 4_500 + 10_000 + ((amount - 5_000_000) / 1000) * 2.25
}

// Simultaneous issue discount: lender's policy gets 30% off when issued with owner's
function floridaLenderTitlePremium(loanAmount: number): number {
  const full = floridaTitlePremium(loanAmount)
  return full * 0.70 // 30% simultaneous issue discount
}

// Florida doc stamps on deed: Fla. Stat. § 201.02
function docStamps(salePrice: number, isMiamiDade: boolean): number {
  if (isMiamiDade) {
    // Miami-Dade: $0.60/$100 deed + $0.45/$100 surtax (single-family residential)
    return (salePrice / 100) * 1.05
  }
  return (salePrice / 100) * 0.70
}

// Florida intangibles tax on new mortgage: $0.35 per $100 (buyer pays, Fla. Stat. § 199.133)
function intangiblesTax(loanAmount: number): number {
  return (loanAmount / 100) * 0.35
}

// Recording fees: $10 first page, $8.50 each additional (Fla. Stat. § 28.24)
function recordingFee(pages: number): number {
  if (pages <= 0) return 0
  return 10 + Math.max(0, pages - 1) * 8.50
}

const FLORIDA_COUNTIES = [
  "Alachua", "Baker", "Bay", "Bradford", "Brevard", "Broward", "Calhoun",
  "Charlotte", "Citrus", "Clay", "Collier", "Columbia", "DeSoto", "Dixie",
  "Duval", "Escambia", "Flagler", "Franklin", "Gadsden", "Gilchrist",
  "Glades", "Gulf", "Hamilton", "Hardee", "Hendry", "Hernando", "Highlands",
  "Hillsborough", "Holmes", "Indian River", "Jackson", "Jefferson", "Lafayette",
  "Lake", "Lee", "Leon", "Levy", "Liberty", "Madison", "Manatee", "Marion",
  "Martin", "Miami-Dade", "Monroe", "Nassau", "Okaloosa", "Okeechobee",
  "Orange", "Osceola", "Palm Beach", "Pasco", "Pinellas", "Polk", "Putnam",
  "St. Johns", "St. Lucie", "Santa Rosa", "Sarasota", "Seminole", "Sumter",
  "Suwannee", "Taylor", "Union", "Volusia", "Wakulla", "Walton", "Washington",
]

export interface ClosingCostResult {
  purchasePrice: number
  loanAmount: number
  downPayment: number
  county: string
  isMiamiDade: boolean
  // Buyer costs
  originationFee: number
  appraisalFee: number
  creditReportFee: number
  lenderTitlePremium: number
  ownerTitlePremium: number
  titleSearchFee: number
  titleExamFee: number
  settlementFee: number
  deedRecordingFee: number
  mortgageRecordingFee: number
  intangiblesTax: number
  prepaidInterest: number
  homeownersInsurance: number
  propTaxEscrow: number
  inspectionFee: number
  surveyFee: number
  hoaTransferFee: number
  fhaMIP: number
  totalBuyerCosts: number
  // Seller costs
  docStamps: number
  agentCommission: number
  titleSellerPortion: number
  homeWarranty: number
  totalSellerCosts: number
  // Breakdown
  breakdown: { category: string; item: string; amount: number; note: string; party: "buyer" | "seller" }[]
}

interface Props {
  onResultChange?: (result: ClosingCostResult | null) => void
}

export function ClosingCostCalculator({ onResultChange }: Props) {
  const [purchasePrice, setPurchasePrice] = useState("450000")
  const [downPct, setDownPct] = useState("20")
  const [county, setCounty] = useState("Orange")
  const [isFHA, setIsFHA] = useState(false)
  const [includeCommission, setIncludeCommission] = useState(true)
  const [commissionPct, setCommissionPct] = useState("5.5")
  const [includeHOA, setIncludeHOA] = useState(false)
  const [currentRate, setCurrentRate] = useState("7.00")
  const [result, setResult] = useState<ClosingCostResult | null>(null)

  const calculate = useCallback(() => {
    const price = parse(purchasePrice)
    const down = (parseFloat(downPct) || 20) / 100
    const loanAmt = price * (1 - down)
    const isMiamiDade = county === "Miami-Dade"
    const rate = parseFloat(currentRate) / 100 || 0.07

    // --- BUYER COSTS (real FL market data) ---

    // Lender fees
    const originationFee = loanAmt * 0.01           // 0.5–1.0%, avg 1.0% per CFPB data
    const appraisalFee = price < 500_000 ? 525 : price < 1_000_000 ? 650 : 900  // FL avg $500–$650
    const creditReportFee = 35                       // standard $30–$50

    // Title insurance (Florida promulgated rates - Fla. Admin. Code 69O-186)
    const ownerTitlePremium = floridaTitlePremium(price)
    const lenderTitlePremium = floridaLenderTitlePremium(loanAmt)  // simultaneous issue discount
    const titleSearchFee = 175                       // FL avg $150–$200
    const titleExamFee = 100                         // attorney exam fee
    const settlementFee = 595                        // FL avg title company settlement $500–$700

    // Government fees (exact statutory rates)
    const deedPages = 3
    const deedRec = recordingFee(deedPages)          // deed: avg 3 pages
    const mortgagePages = 14
    const mortgageRec = recordingFee(mortgagePages)  // mortgage: avg 12–15 pages
    const intangTax = intangiblesTax(loanAmt)        // $0.35/$100 of loan (Fla. Stat. § 199.133)

    // Prepaids
    const daysOfInterest = 15                        // avg 15 days prepaid interest
    const prepaidInt = (loanAmt * rate) / 365 * daysOfInterest
    const hoiAnnual = price < 300_000 ? 2_400 : price < 600_000 ? 3_600 : 5_200  // FL avg skyrocketed
    const hoiPrepaid = (hoiAnnual / 12) * 3          // 3 months prepaid
    const propTaxRate = 0.0093                        // FL avg effective rate 0.93% (Tax Foundation 2025)
    const propTaxEscrow = (price * propTaxRate) / 12 * 3  // 3 months escrow

    // Services
    const inspectionFee = price < 400_000 ? 425 : price < 700_000 ? 525 : 700   // FL avg $400–$550
    const surveyFee = 450                             // FL avg $400–$550
    const hoaFee = includeHOA ? 600 : 0              // HOA transfer/resale cert avg $300–$800

    // FHA upfront MIP
    const fhaMIP = isFHA ? loanAmt * 0.0175 : 0      // 1.75% upfront MIP (FHA handbook)

    const totalBuyerCosts =
      originationFee + appraisalFee + creditReportFee +
      ownerTitlePremium + lenderTitlePremium + titleSearchFee + titleExamFee + settlementFee +
      deedRec + mortgageRec + intangTax +
      prepaidInt + hoiPrepaid + propTaxEscrow +
      inspectionFee + surveyFee + hoaFee + fhaMIP

    // --- SELLER COSTS (real FL market data) ---
    const docStampsAmt = docStamps(price, isMiamiDade)  // Fla. Stat. § 201.02
    const agentComm = includeCommission ? price * (parseFloat(commissionPct) / 100) : 0
    // In most FL counties seller pays owner's title; buyer in some South FL markets
    const titleSellerPortion = isMiamiDade ? 0 : ownerTitlePremium  // seller pays in most counties
    const homeWarranty = 525                              // FL avg $400–$600, seller-paid

    const totalSellerCosts = docStampsAmt + agentComm + titleSellerPortion + homeWarranty

    const breakdown: ClosingCostResult["breakdown"] = [
      // Buyer — Lender
      { category: "Lender Fees", item: "Origination Fee", amount: originationFee, note: "1.0% of loan amount (avg FL market)", party: "buyer" },
      { category: "Lender Fees", item: "Appraisal Fee", amount: appraisalFee, note: "FL market avg $500–$650", party: "buyer" },
      { category: "Lender Fees", item: "Credit Report Fee", amount: creditReportFee, note: "Standard $30–$50", party: "buyer" },
      // Buyer — Title
      { category: "Title Insurance", item: "Owner's Title Insurance", amount: ownerTitlePremium, note: "FL promulgated rate (69O-186)", party: "buyer" },
      { category: "Title Insurance", item: "Lender's Title Insurance", amount: lenderTitlePremium, note: "30% simultaneous issue discount", party: "buyer" },
      { category: "Title Insurance", item: "Title Search", amount: titleSearchFee, note: "FL avg $150–$200", party: "buyer" },
      { category: "Title Insurance", item: "Title Examination Fee", amount: titleExamFee, note: "Attorney exam, FL avg $75–$125", party: "buyer" },
      { category: "Title Insurance", item: "Settlement / Closing Fee", amount: settlementFee, note: "Title company fee, FL avg $500–$700", party: "buyer" },
      // Buyer — Government
      { category: "Government", item: "Deed Recording Fee", amount: deedRec, note: `Fla. Stat. § 28.24 · ${deedPages} pages`, party: "buyer" },
      { category: "Government", item: "Mortgage Recording Fee", amount: mortgageRec, note: `Fla. Stat. § 28.24 · ${mortgagePages} pages`, party: "buyer" },
      { category: "Government", item: "Intangibles Tax (Mortgage)", amount: intangTax, note: "$0.35/$100 of loan · Fla. Stat. § 199.133", party: "buyer" },
      // Buyer — Prepaids
      { category: "Prepaids", item: `Prepaid Interest (${daysOfInterest} days)`, amount: prepaidInt, note: "From closing date to end of month", party: "buyer" },
      { category: "Prepaids", item: "Homeowners Insurance (3 mo.)", amount: hoiPrepaid, note: `FL avg annual: ${fmt(hoiAnnual)} (post-Ian market)`, party: "buyer" },
      { category: "Prepaids", item: "Property Tax Escrow (3 mo.)", amount: propTaxEscrow, note: "FL avg effective rate 0.93% (Tax Foundation 2025)", party: "buyer" },
      // Buyer — Services
      { category: "Services", item: "Home Inspection", amount: inspectionFee, note: "FL avg $400–$550", party: "buyer" },
      { category: "Services", item: "Survey", amount: surveyFee, note: "FL avg $400–$550", party: "buyer" },
      ...(includeHOA ? [{ category: "Services", item: "HOA Transfer / Resale Certificate", amount: hoaFee, note: "FL avg $300–$800 · near-universal in condos", party: "buyer" as const }] : []),
      ...(isFHA ? [{ category: "FHA", item: "Upfront Mortgage Insurance Premium", amount: fhaMIP, note: "1.75% of loan amount · FHA Handbook 4000.1", party: "buyer" as const }] : []),
      // Seller
      { category: "Government", item: isMiamiDade ? "Doc Stamps on Deed (Miami-Dade)" : "Documentary Stamps on Deed", amount: docStampsAmt, note: isMiamiDade ? "$0.60+$0.45/$100 · Fla. Stat. § 201.02" : "$0.70/$100 · Fla. Stat. § 201.02", party: "seller" },
      ...(agentComm > 0 ? [{ category: "Commissions", item: `Agent Commissions (${commissionPct}%)`, amount: agentComm, note: "Post-NAR settlement avg 5%–5.5%", party: "seller" as const }] : []),
      ...(!isMiamiDade ? [{ category: "Title Insurance", item: "Owner's Title Insurance (Seller-Paid)", amount: titleSellerPortion, note: "Seller customarily pays in most FL counties", party: "seller" as const }] : []),
      { category: "Services", item: "Home Warranty (1 yr)", amount: homeWarranty, note: "FL avg $400–$600, seller-paid", party: "seller" },
    ]

    const res: ClosingCostResult = {
      purchasePrice: price, loanAmount: loanAmt, downPayment: price * down,
      county, isMiamiDade,
      originationFee, appraisalFee, creditReportFee,
      lenderTitlePremium, ownerTitlePremium, titleSearchFee, titleExamFee, settlementFee,
      deedRecordingFee: deedRec, mortgageRecordingFee: mortgageRec, intangiblesTax: intangTax,
      prepaidInterest: prepaidInt, homeownersInsurance: hoiPrepaid, propTaxEscrow,
      inspectionFee, surveyFee, hoaTransferFee: hoaFee, fhaMIP,
      totalBuyerCosts,
      docStamps: docStampsAmt, agentCommission: agentComm, titleSellerPortion, homeWarranty,
      totalSellerCosts,
      breakdown,
    }
    setResult(res)
    onResultChange?.(res)
  }, [purchasePrice, downPct, county, isFHA, includeCommission, commissionPct, includeHOA, currentRate, onResultChange])

  const handleDownload = () => {
    if (!result) return
    generatePDF("closing", getClosingCostRows(result), `Florida Closing Cost Estimate · ${result.county} County`)
  }

  const buyerItems = result?.breakdown.filter((b) => b.party === "buyer") ?? []
  const sellerItems = result?.breakdown.filter((b) => b.party === "seller") ?? []

  // Group buyer items by category
  const buyerCategories = buyerItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof buyerItems>)

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 text-rose-400" />
          Florida Closing Cost Calculator
        </CardTitle>
        <p className="text-slate-500 text-xs mt-0.5">
          Based on Florida statutes (§ 201.02, § 199.133, § 28.24) and FL Admin. Code 69O-186 promulgated title rates
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Purchase Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pl-7 rounded-xl"
                value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Down Payment</Label>
            <div className="relative">
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pr-7 rounded-xl"
                value={downPct} onChange={(e) => setDownPct(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Florida County</Label>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
            >
              {FLORIDA_COUNTIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Current Interest Rate</Label>
            <div className="relative">
              <Input className="bg-white/[0.04] border-white/[0.08] text-white pr-7 rounded-xl"
                value={currentRate} onChange={(e) => setCurrentRate(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <Label className="text-slate-300 text-sm">FHA Loan</Label>
              <p className="text-slate-500 text-[11px]">Adds 1.75% upfront MIP</p>
            </div>
            <Switch checked={isFHA} onCheckedChange={setIsFHA} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <Label className="text-slate-300 text-sm">HOA Community</Label>
              <p className="text-slate-500 text-[11px]">Transfer fee + resale certificate (~$600)</p>
            </div>
            <Switch checked={includeHOA} onCheckedChange={setIncludeHOA} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <Label className="text-slate-300 text-sm">Include Agent Commissions</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  className="bg-white/[0.04] border-white/[0.08] text-white rounded-lg h-7 w-16 text-xs px-2"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  disabled={!includeCommission}
                />
                <span className="text-slate-500 text-xs">% (post-NAR settlement avg 5–5.5%)</span>
              </div>
            </div>
            <Switch checked={includeCommission} onCheckedChange={setIncludeCommission} />
          </div>
        </div>

        {county === "Miami-Dade" && (
          <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Miami-Dade uses a different doc stamp rate: $0.60 + $0.45 surtax per $100. Buyer (not seller) customarily pays doc stamps in Miami-Dade. Owner&apos;s title insurance is buyer-paid in this market.</span>
          </div>
        )}

        <Button onClick={calculate} className="w-full bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-xl">
          Calculate Florida Closing Costs
        </Button>

        {result && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">Buyer Total</p>
                <p className="text-xl font-bold text-cyan-400">{fmt(result.totalBuyerCosts)}</p>
                <p className="text-slate-500 text-xs mt-0.5">{pct(result.totalBuyerCosts, result.purchasePrice)} of price</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">Seller Total</p>
                <p className="text-xl font-bold text-amber-400">{fmt(result.totalSellerCosts)}</p>
                <p className="text-slate-500 text-xs mt-0.5">{pct(result.totalSellerCosts, result.purchasePrice)} of price</p>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Combined Total: </span>
              <span className="text-white font-bold">{fmt(result.totalBuyerCosts + result.totalSellerCosts)}</span>
              <span className="ml-2">({pct(result.totalBuyerCosts + result.totalSellerCosts, result.purchasePrice)} of purchase price)</span>
            </div>

            {/* Buyer breakdown by category */}
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Buyer Costs</p>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(buyerCategories).map(([cat, items]) => (
                      <>
                        <tr key={`cat-${cat}`} className="bg-white/[0.03]">
                          <td colSpan={2} className="px-3 py-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{cat}</td>
                        </tr>
                        {items.map((item, i) => (
                          <tr key={`${cat}-${i}`} className="border-t border-white/[0.03] hover:bg-white/[0.02] group">
                            <td className="px-3 py-2">
                              <span className="text-slate-300">{item.item}</span>
                              <span className="ml-2 text-slate-600 group-hover:text-slate-500 text-[10px] italic">{item.note}</span>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-200 font-mono whitespace-nowrap">{fmt(item.amount)}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                    <tr className="border-t border-white/[0.12] bg-white/[0.03]">
                      <td className="px-3 py-2.5 font-bold text-white">Total Buyer Costs</td>
                      <td className="px-3 py-2.5 text-right font-bold text-cyan-400 font-mono">{fmt(result.totalBuyerCosts)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seller breakdown */}
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Seller Costs</p>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {sellerItems.map((item, i) => (
                      <tr key={i} className="border-t border-white/[0.03] first:border-t-0 hover:bg-white/[0.02] group">
                        <td className="px-3 py-2">
                          <span className="text-slate-300">{item.item}</span>
                          <span className="ml-2 text-slate-600 group-hover:text-slate-500 text-[10px] italic">{item.note}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-200 font-mono whitespace-nowrap">{fmt(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-white/[0.12] bg-white/[0.03]">
                      <td className="px-3 py-2.5 font-bold text-white">Total Seller Costs</td>
                      <td className="px-3 py-2.5 text-right font-bold text-amber-400 font-mono">{fmt(result.totalSellerCosts)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Rates based on Fla. Stat. §§ 201.02 (doc stamps), 199.133 (intangibles tax), 28.24 (recording fees) and Fla. Admin. Code 69O-186 (promulgated title rates). HOI premium reflects post-Hurricane Ian Florida market. Property tax uses FL avg effective rate of 0.93% (Tax Foundation 2025). Always verify with your title company and lender.
            </p>

            <Button
              variant="outline"
              onClick={handleDownload}
              className="w-full border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl gap-2"
            >
              <Download className="h-4 w-4" />
              Download Florida Closing Cost Sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function getClosingCostRows(r: ClosingCostResult) {
  const rows: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Purchase Price", value: fmt(r.purchasePrice) },
    { label: "Loan Amount", value: fmt(r.loanAmount) },
    { label: "Down Payment", value: fmt(r.downPayment) },
    { label: `County: ${r.county}`, value: r.isMiamiDade ? "Miami-Dade rates apply" : "Standard FL rates" },
    { label: "─── BUYER COSTS ───", value: "" },
    { label: "Origination Fee (1%)", value: fmt(r.originationFee) },
    { label: "Appraisal Fee", value: fmt(r.appraisalFee) },
    { label: "Credit Report", value: fmt(r.creditReportFee) },
    { label: "Owner's Title Insurance (FL promulgated)", value: fmt(r.ownerTitlePremium) },
    { label: "Lender's Title Insurance (simultaneous)", value: fmt(r.lenderTitlePremium) },
    { label: "Title Search", value: fmt(r.titleSearchFee) },
    { label: "Title Examination", value: fmt(r.titleExamFee) },
    { label: "Settlement / Closing Fee", value: fmt(r.settlementFee) },
    { label: "Deed Recording Fee (§ 28.24)", value: fmt(r.deedRecordingFee) },
    { label: "Mortgage Recording Fee (§ 28.24)", value: fmt(r.mortgageRecordingFee) },
    { label: "Intangibles Tax on Mortgage (§ 199.133)", value: fmt(r.intangiblesTax) },
    { label: "Prepaid Interest (15 days)", value: fmt(r.prepaidInterest) },
    { label: "Homeowners Insurance (3 mo.)", value: fmt(r.homeownersInsurance) },
    { label: "Property Tax Escrow (3 mo.)", value: fmt(r.propTaxEscrow) },
    { label: "Home Inspection", value: fmt(r.inspectionFee) },
    { label: "Survey", value: fmt(r.surveyFee) },
    ...(r.hoaTransferFee > 0 ? [{ label: "HOA Transfer Fee", value: fmt(r.hoaTransferFee) }] : []),
    ...(r.fhaMIP > 0 ? [{ label: "FHA Upfront MIP (1.75%)", value: fmt(r.fhaMIP) }] : []),
    { label: "TOTAL BUYER COSTS", value: fmt(r.totalBuyerCosts), highlight: true },
    { label: "─── SELLER COSTS ───", value: "" },
    { label: `Doc Stamps on Deed (${r.isMiamiDade ? "$1.05" : "$0.70"}/$100)`, value: fmt(r.docStamps) },
    ...(r.agentCommission > 0 ? [{ label: "Agent Commissions", value: fmt(r.agentCommission) }] : []),
    ...(r.titleSellerPortion > 0 ? [{ label: "Owner's Title Insurance (seller-paid)", value: fmt(r.titleSellerPortion) }] : []),
    { label: "Home Warranty (1 yr)", value: fmt(r.homeWarranty) },
    { label: "TOTAL SELLER COSTS", value: fmt(r.totalSellerCosts), highlight: true },
    { label: "COMBINED TOTAL", value: fmt(r.totalBuyerCosts + r.totalSellerCosts), highlight: true },
  ]
  return rows
}
