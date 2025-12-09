import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { LeadDetails } from "@/components/leads/lead-details"
import { LeadStatusPanel } from "@/components/leads/lead-status-panel"
import { ClaimLeadButton } from "@/components/leads/claim-lead-button"
import { ContactActivities } from "@/components/contacts/contact-activities"
import { AddActivityDialog } from "@/components/contacts/add-activity-dialog"
import { StartTransactionButton } from "@/components/transactions/start-transaction-button"
import type { Lead, Contact, Agent, Activity, Property } from "@/lib/types/database"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

interface LeadPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: lead } = await supabase
    .from("leads")
    .select("*, contact:contacts(*), assigned_agent:agents(*)")
    .eq("id", id)
    .single()

  if (!lead) {
    notFound()
  }

  const [{ data: activities }, { data: agents }, { data: properties }] = await Promise.all([
    supabase
      .from("activities")
      .select("*, agent:agents(full_name, email)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("agents").select("id, full_name, email").eq("is_active", true),
    supabase.from("properties").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(20),
  ])

  const typedLead = lead as Lead & { contact: Contact; assigned_agent: Agent | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{typedLead.contact.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            Lead from {typedLead.source} • Created {new Date(typedLead.created_at).toLocaleDateString()}
          </p>
        </div>
        <StartTransactionButton
          contactId={typedLead.contact_id}
          leadId={id}
          agentId={agent.id}
          properties={(properties as Property[]) || []}
        />
        <AddActivityDialog contactId={typedLead.contact_id} agentId={agent.id} leadId={id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          {typedLead.status === "assigned" && typedLead.assigned_agent_id === agent.id && (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Action Required</CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimLeadButton lead={typedLead} currentAgentId={agent.id} />
              </CardContent>
            </Card>
          )}
          <LeadDetails lead={typedLead} />
          <LeadStatusPanel lead={typedLead} agents={(agents as Agent[]) || []} currentAgentId={agent.id} />
        </div>
        <div className="lg:col-span-2">
          <ContactActivities
            activities={(activities as (Activity & { agent: { full_name: string; email: string } })[]) || []}
          />
        </div>
      </div>
    </div>
  )
}
