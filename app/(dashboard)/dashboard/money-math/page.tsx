"use client"

import { useState, useEffect } from "react"
import { MortgageCalculator, getMortgageRows, type MortgageResult, type MortgageSharedContext } from "@/components/money-math/mortgage-calculator"
import { InterestRatesViewer, type LiveRate } from "@/components/money-math/interest-rates-viewer"
import { NetSheetCalculator, getNetSheetRows, type NetSheetResult } from "@/components/money-math/net-sheet-calculator"
import { CapRateCalculator, getCapRateRows, type CapRateResult } from "@/components/money-math/cap-rate-calculator"
import { ClosingCostCalculator, getClosingCostRows, type ClosingCostResult } from "@/components/money-math/closing-cost-calculator"
import { generateCombinedPDF, type PDFRow } from "@/lib/money-math/pdf-generator"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, TrendingUp, FileText, BarChart3, Receipt, Download, CheckSquare, Square } from "lucide-react"

const TABS = [
  { id: "mortgage", label: "Mortgage", icon: Home, color: "text-cyan-400", activeClass: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" },
  { id: "rates", label: "Rates", icon: TrendingUp, color: "text-emerald-400", activeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { id: "netsheet", label: "Net Sheet", icon: FileText, color: "text-amber-400", activeClass: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  { id: "caprate", label: "Cap Rate", icon: BarChart3, color: "text-violet-400", activeClass: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
  { id: "closing", label: "Closing Costs", icon: Receipt, color: "text-rose-400", activeClass: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function MoneyMathPage() {
  const [activeTab, setActiveTab] = useState<TabId>("mortgage")
  const [liveRates, setLiveRates] = useState<LiveRate[]>([])

  // Pre-fetch rates on page load so Mortgage tab has them immediately
  useEffect(() => {
    fetch("/api/money-math/rates")
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates?.length) {
          setLiveRates(d.rates)
          // Seed shared context with the 30-yr fixed rate if available
          const thirtyYr = d.rates.find((r: { label: string }) => r.label.toLowerCase().includes("30"))
          if (thirtyYr) {
            setSharedCtx((prev) => ({ ...prev, interestRate: thirtyYr.rate.toFixed(2) }))
          }
        }
      })
      .catch(() => {})
  }, [])
  // Shared context: values set on one tab flow into the relevant fields of other tabs
  const [sharedCtx, setSharedCtx] = useState<MortgageSharedContext>({
    homePrice: "400000",
    downPayment: "20",
    interestRate: "7.25",
    termYears: "30",
  })

  const [mortgageResult, setMortgageResult] = useState<MortgageResult | null>(null)
  const [netSheetResult, setNetSheetResult] = useState<NetSheetResult | null>(null)
  const [capRateResult, setCapRateResult] = useState<CapRateResult | null>(null)
  const [closingResult, setClosingResult] = useState<ClosingCostResult | null>(null)

  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set())

  const availableExports: { id: string; label: string; rows: PDFRow[] }[] = [
    ...(mortgageResult ? [{ id: "mortgage", label: "Mortgage Calculator", rows: getMortgageRows(mortgageResult) }] : []),
    ...(netSheetResult ? [{ id: "netsheet", label: "Seller Net Sheet", rows: getNetSheetRows(netSheetResult) }] : []),
    ...(capRateResult ? [{ id: "caprate", label: "Cap Rate Analysis", rows: getCapRateRows(capRateResult) }] : []),
    ...(closingResult ? [{ id: "closing", label: "Closing Cost Estimate", rows: getClosingCostRows(closingResult) }] : []),
  ]

  const toggleExport = (id: string) => {
    setSelectedForExport((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCombinedExport = async () => {
    const sections = availableExports
      .filter((e) => selectedForExport.has(e.id))
      .map((e) => ({ title: e.label, rows: e.rows }))
    if (sections.length === 0) return
    await generateCombinedPDF(sections)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Money Math</h1>
        <p className="text-slate-400 text-sm mt-1">Financial calculators for real estate professionals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                isActive ? tab.activeClass : "border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <tab.icon className={cn("h-4 w-4", isActive ? "" : tab.color)} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === "mortgage" && (
            <MortgageCalculator
              onResultChange={setMortgageResult}
              onContextChange={setSharedCtx}
              liveRates={liveRates.map((r) => ({ label: r.label, rate: r.rate }))}
              initialHomePrice={sharedCtx.homePrice}
              initialDownPayment={sharedCtx.downPayment}
              initialInterestRate={sharedCtx.interestRate}
              initialTermYears={sharedCtx.termYears}
            />
          )}
          {activeTab === "rates" && <InterestRatesViewer onRatesLoaded={setLiveRates} />}
          {activeTab === "netsheet" && (
            <NetSheetCalculator
              onResultChange={setNetSheetResult}
              initialSalePrice={sharedCtx.homePrice}
            />
          )}
          {activeTab === "caprate" && (
            <CapRateCalculator
              onResultChange={setCapRateResult}
              initialPurchasePrice={sharedCtx.homePrice}
              initialDownPct={sharedCtx.downPayment}
              initialMortgageRate={sharedCtx.interestRate}
              initialLoanTerm={sharedCtx.termYears}
            />
          )}
          {activeTab === "closing" && (
            <ClosingCostCalculator
              onResultChange={setClosingResult}
              initialPurchasePrice={sharedCtx.homePrice}
              initialDownPct={sharedCtx.downPayment}
              initialInterestRate={sharedCtx.interestRate}
            />
          )}
        </div>

        {/* Combined Export Panel */}
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Combined Export</h3>
              <p className="text-slate-500 text-xs mt-1">Run each calculator to add it here, then download a combined report.</p>
            </div>

            {availableExports.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-xs">No results yet. Run a calculator to see export options here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableExports.map((exp) => {
                  const isSelected = selectedForExport.has(exp.id)
                  return (
                    <button
                      key={exp.id}
                      onClick={() => toggleExport(exp.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border text-left",
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                          : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-white"
                      )}
                    >
                      {isSelected ? <CheckSquare className="h-4 w-4 shrink-0" /> : <Square className="h-4 w-4 shrink-0" />}
                      {exp.label}
                    </button>
                  )
                })}
              </div>
            )}

            {availableExports.length > 0 && (
              <div className="space-y-2 pt-1">
                <Button
                  onClick={() => setSelectedForExport(new Set(availableExports.map((e) => e.id)))}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-xl text-xs"
                >
                  Select All
                </Button>
                <Button
                  onClick={handleCombinedExport}
                  disabled={selectedForExport.size === 0}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Combined PDF
                </Button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Tips</p>
            <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
              <p>Run any calculator and hit Calculate to unlock its PDF export.</p>
              <p>Check multiple calculators in the panel to bundle them into one downloadable report.</p>
              <p>Rates shown are reference figures. Always verify with your lender.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
