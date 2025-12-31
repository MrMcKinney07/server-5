import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { CampaignsTable } from "@/components/campaigns/campaigns-table"
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog"

export default async function CampaignsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(`
      *,
      owner:agents!owner_id(Name, Email)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.log("[v0] Campaigns fetch error:", error)
  }

  const filteredCampaigns =
    agent.role === "broker" ? campaigns || [] : (campaigns || []).filter((c) => c.owner_id === agent.id)

  const campaignsWithCounts = await Promise.all(
    filteredCampaigns.map(async (campaign) => {
      const [stepsResult, enrollmentsResult] = await Promise.all([
        supabase.from("campaign_steps").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
        supabase
          .from("lead_campaign_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaign.id),
      ])

      return {
        ...campaign,
        steps: [{ count: stepsResult.count || 0 }],
        enrollments: [{ count: enrollmentsResult.count || 0 }],
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drip Campaigns</h1>
          <p className="text-sm text-muted-foreground">Automated email, SMS, and property recommendation sequences</p>
        </div>
        <CreateCampaignDialog />
      </div>

      {campaignsWithCounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-1">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Create your first drip campaign to automatically nurture leads with personalized emails and texts.
          </p>
          <CreateCampaignDialog />
        </div>
      ) : (
        <CampaignsTable campaigns={campaignsWithCounts} />
      )}
    </div>
  )
}
