import { requireAuth } from "@/lib/auth"
import { MarketingMarketplace } from "@/components/marketing/marketing-marketplace"

export default async function MarketingPage() {
  const agent = await requireAuth()

  return (
    <MarketingMarketplace
      agentId={agent.id}
      agentName={agent.Name || ""}
      agentPhone={agent.Phone || ""}
      agentEmail={agent.Email || ""}
      agentPhotoUrl={agent.profile_picture_url || undefined}
    />
  )
}
