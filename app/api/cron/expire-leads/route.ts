import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { assignLeadToNextAgent } from "@/lib/leads/assign-lead-to-next-agent"
import { sendEmail } from "@/lib/email/send-email"

const BROKER_EMAIL = "Mrmckinney@mckinneyrealtyco.com"
const BROKER_NAME = "Matt McKinney"

/**
 * Cron job to expire unclaimed leads and reassign them.
 *
 * Logic:
 * - If failed_claim_attempts = 0: Reassign to next agent, set attempts = 1
 * - If failed_claim_attempts = 1: Assign to broker Matt McKinney, set attempts = 2, stop rotation
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // Find expired, unclaimed leads
    const { data: expiredLeads, error: fetchError } = await supabase
      .from("leads")
      .select("id, contact_id, assigned_agent_id, failed_claim_attempts")
      .eq("status", "assigned")
      .is("claimed_at", null)
      .lt("claim_expires_at", now)

    if (fetchError) {
      console.error("Error fetching expired leads:", fetchError)
      return NextResponse.json({ error: "Failed to fetch expired leads" }, { status: 500 })
    }

    if (!expiredLeads || expiredLeads.length === 0) {
      return NextResponse.json({ message: "No expired leads found", processed: 0 })
    }

    const { data: brokerAgent } = await supabase.from("agents").select("id").eq("email", BROKER_EMAIL).single()

    const results: {
      leadId: string
      previousAgent: string | null
      newAgent: string | null
      fallbackToBroker: boolean
    }[] = []

    for (const lead of expiredLeads) {
      const currentAttempts = lead.failed_claim_attempts || 0

      // Log activity for expiration
      if (lead.assigned_agent_id) {
        await supabase.from("activities").insert({
          contact_id: lead.contact_id,
          lead_id: lead.id,
          agent_id: lead.assigned_agent_id,
          type: "status_change",
          description: `Lead expired - agent did not claim within 30 minutes (attempt ${currentAttempts + 1})`,
        })
      }

      if (currentAttempts >= 1) {
        // Second failure - assign to broker and stop rotation
        if (brokerAgent) {
          await supabase
            .from("leads")
            .update({
              assigned_agent_id: brokerAgent.id,
              assigned_at: now,
              claim_expires_at: null, // No expiry for broker
              status: "claimed", // Auto-claim for broker
              claimed_at: now,
              failed_claim_attempts: 2,
            })
            .eq("id", lead.id)

          // Log broker assignment activity
          await supabase.from("activities").insert({
            contact_id: lead.contact_id,
            lead_id: lead.id,
            agent_id: brokerAgent.id,
            type: "assignment",
            description: `Lead auto-assigned to broker ${BROKER_NAME} after 2 failed claim attempts`,
          })

          const { data: contactData } = await supabase
            .from("contacts")
            .select("full_name, email, phone")
            .eq("id", lead.contact_id)
            .single()

          await sendEmail({
            to: BROKER_EMAIL,
            subject: `[McKinney One] Lead Escalation - ${contactData?.full_name || "Unknown Contact"}`,
            body: `A lead has been escalated to you after 2 agents failed to claim it within the 30-minute window.

Contact: ${contactData?.full_name || "Unknown"}
Email: ${contactData?.email || "N/A"}
Phone: ${contactData?.phone || "N/A"}

Please follow up at your earliest convenience.

View lead: ${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/leads/${lead.id}`,
          })

          results.push({
            leadId: lead.id,
            previousAgent: lead.assigned_agent_id,
            newAgent: brokerAgent.id,
            fallbackToBroker: true,
          })
        } else {
          // Broker not found - mark as unclaimed_expired
          await supabase
            .from("leads")
            .update({
              status: "unclaimed_expired",
              failed_claim_attempts: 2,
            })
            .eq("id", lead.id)

          results.push({
            leadId: lead.id,
            previousAgent: lead.assigned_agent_id,
            newAgent: null,
            fallbackToBroker: false,
          })
        }
      } else {
        await supabase
          .from("leads")
          .update({
            status: "unclaimed_expired",
            failed_claim_attempts: currentAttempts + 1,
          })
          .eq("id", lead.id)

        // Reassign to next eligible agent
        const newAgentId = await assignLeadToNextAgent(lead.id)

        results.push({
          leadId: lead.id,
          previousAgent: lead.assigned_agent_id,
          newAgent: newAgentId,
          fallbackToBroker: false,
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} expired leads`,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Error in expire-leads cron:", error)
    return NextResponse.json({ error: "Failed to process expired leads" }, { status: 500 })
  }
}
