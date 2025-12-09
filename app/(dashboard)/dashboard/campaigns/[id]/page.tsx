import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { CampaignDetails } from "@/components/campaigns/campaign-details"
import { CampaignStepsList } from "@/components/campaigns/campaign-steps-list"
import { AddStepDialog } from "@/components/campaigns/add-step-dialog"
import type { Campaign, CampaignStep } from "@/lib/types/database"

interface CampaignPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params
  await requireAuth()
  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, created_by_agent:agents(full_name, email)")
    .eq("id", id)
    .single()

  if (!campaign) {
    notFound()
  }

  const { data: steps } = await supabase
    .from("campaign_steps")
    .select("*")
    .eq("campaign_id", id)
    .order("step_number", { ascending: true })

  const { data: enrollments } = await supabase
    .from("campaign_enrollments")
    .select("id, is_paused, completed_at")
    .eq("campaign_id", id)

  const activeCount = enrollments?.filter((e) => !e.is_paused && !e.completed_at).length || 0
  const completedCount = enrollments?.filter((e) => e.completed_at).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{(campaign as Campaign).name}</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} active enrollments, {completedCount} completed
          </p>
        </div>
        <AddStepDialog campaignId={id} nextStepNumber={(steps?.length || 0) + 1} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CampaignDetails
            campaign={campaign as Campaign & { created_by_agent: { full_name: string; email: string } | null }}
          />
        </div>
        <div className="lg:col-span-2">
          <CampaignStepsList steps={(steps as CampaignStep[]) || []} campaignId={id} />
        </div>
      </div>
    </div>
  )
}
