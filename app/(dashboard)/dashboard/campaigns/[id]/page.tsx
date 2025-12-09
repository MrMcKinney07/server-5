import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CampaignDetails } from "@/components/campaigns/campaign-details"
import { CampaignStepsList } from "@/components/campaigns/campaign-steps-list"
import { AddStepDialog } from "@/components/campaigns/add-step-dialog"
import { CampaignEnrollmentsList } from "@/components/campaigns/campaign-enrollments-list"

interface CampaignPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params
  await requireAuth()
  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, owner:agents!owner_id(full_name, email)")
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
    .from("lead_campaign_enrollments")
    .select("*, lead:leads(first_name, last_name, email, phone)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(50)

  const activeCount = enrollments?.filter((e) => e.status === "active").length || 0
  const completedCount = enrollments?.filter((e) => e.status === "completed").length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} active, {completedCount} completed enrollments
          </p>
        </div>
        <AddStepDialog campaignId={id} nextStepNumber={(steps?.length || 0) + 1} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <CampaignDetails campaign={campaign} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <CampaignStepsList steps={steps || []} campaignId={id} />
          <CampaignEnrollmentsList enrollments={enrollments || []} />
        </div>
      </div>
    </div>
  )
}
