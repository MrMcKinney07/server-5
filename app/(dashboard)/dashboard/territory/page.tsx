import { requireAuth } from "@/lib/auth"
import { ComingSoon } from "@/components/ui/coming-soon"

export default async function TerritoryPage() {
  await requireAuth()

  return <ComingSoon title="Territory" description="Territory management and mapping tools are on their way. Check back soon." />
}
