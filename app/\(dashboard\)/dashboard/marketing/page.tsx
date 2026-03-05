"use client"

import { MarketingMarketplace } from "@/components/marketing/marketing-marketplace"

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-8">
        <MarketingMarketplace />
      </div>
    </div>
  )
}
