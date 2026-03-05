import { requireAuth } from "@/lib/auth"
import { MarketingMarketplace } from "@/components/marketing/marketing-marketplace"

export default async function MarketingPage() {
  await requireAuth()

  return <MarketingMarketplace />
}
