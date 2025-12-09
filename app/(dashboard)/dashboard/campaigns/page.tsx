import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { CampaignsTable } from "@/components/campaigns/campaigns-table"
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog"
import type { Campaign } from "@/lib/types/database"

export default async function CampaignsPage() {
  await requireAuth()
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, created_by_agent:agents(full_name, email)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drip Campaigns</h1>
          <p className="text-sm text-muted-foreground">Automated email and SMS sequences for nurturing contacts</p>
        </div>
        <CreateCampaignDialog />
      </div>

      <CampaignsTable
        campaigns={
          (campaigns as (Campaign & { created_by_agent: { full_name: string; email: string } | null })[]) || []
        }
      />
    </div>
  )
}
