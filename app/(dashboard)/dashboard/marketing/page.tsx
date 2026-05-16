import { requireAuth } from "@/lib/auth"
import { ComingSoon } from "@/components/ui/coming-soon"

export default async function MarketingPage() {
  await requireAuth()

  return <ComingSoon title="Marketing" description="Marketing tools and resources are on their way. Check back soon." />
}
