import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { ContactDetails } from "@/components/contacts/contact-details"
import { ContactLeads } from "@/components/contacts/contact-leads"
import { ContactActivities } from "@/components/contacts/contact-activities"
import { ContactCampaigns } from "@/components/contacts/contact-campaigns"
import { AddActivityDialog } from "@/components/contacts/add-activity-dialog"
import { StartTransactionButton } from "@/components/transactions/start-transaction-button"
import type { Contact, Lead, Activity, Agent, Campaign, CampaignEnrollment, Property } from "@/lib/types/database"

interface ContactPageProps {
  params: Promise<{ id: string }>
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { id } = await params
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: contact } = await supabase.from("contacts").select("*").eq("id", id).single()

  if (!contact) {
    notFound()
  }

  const [
    { data: leads },
    { data: activities },
    { data: agents },
    { data: enrollments },
    { data: campaigns },
    { data: properties },
  ] = await Promise.all([
    supabase.from("leads").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("*, agent:agents(full_name, email)")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("agents").select("id, full_name, email").eq("is_active", true),
    supabase.from("campaign_enrollments").select("*, campaign:campaigns(*)").eq("contact_id", id),
    supabase.from("campaigns").select("*").eq("is_active", true),
    supabase.from("properties").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(20),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{(contact as Contact).full_name}</h1>
          <p className="text-sm text-muted-foreground">Contact details and activity history</p>
        </div>
        <div className="flex items-center gap-2">
          <StartTransactionButton contactId={id} agentId={agent.id} properties={(properties as Property[]) || []} />
          <AddActivityDialog contactId={id} agentId={agent.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <ContactDetails contact={contact as Contact} agents={(agents as Agent[]) || []} currentAgentId={agent.id} />
          <ContactCampaigns
            contactId={id}
            agentId={agent.id}
            enrollments={(enrollments as (CampaignEnrollment & { campaign: Campaign })[]) || []}
            availableCampaigns={(campaigns as Campaign[]) || []}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <ContactLeads leads={(leads as Lead[]) || []} contactId={id} />
          <ContactActivities
            activities={(activities as (Activity & { agent: { full_name: string; email: string } })[]) || []}
          />
        </div>
      </div>
    </div>
  )
}
