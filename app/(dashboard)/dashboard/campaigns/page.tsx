import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { CampaignsTable } from "@/components/campaigns/campaigns-table"
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog"

export default async function CampaignsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      `*, owner:agents!owner_id(Name, Email), steps:campaign_steps(count), enrollments:lead_campaign_enrollments(count)`,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drip Campaigns</h1>
          <p className="text-sm text-muted-foreground">Automated email, SMS, and property recommendation sequences</p>
        </div>
        <CreateCampaignDialog />
      </div>

      <CampaignsTable campaigns={campaigns || []} />
    </div>
  )
}
