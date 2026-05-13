import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const { newAgentId, reason, adminId } = await request.json()

    if (!newAgentId) {
      return NextResponse.json({ error: "New agent ID is required" }, { status: 400 })
    }

    // Get current lead details
    const { data: currentLead } = await supabase
      .from("leads")
      .select("assigned_agent_id, contact_id, first_name, last_name")
      .eq("id", id)
      .single()

    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const now = new Date()
    const claimExpiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString()

    // Update the lead
    const { error: leadError } = await supabase
      .from("leads")
      .update({
        assigned_agent_id: newAgentId,
        assigned_at: now.toISOString(),
        claim_expires_at: claimExpiresAt,
        status: "assigned",
      })
      .eq("id", id)

    if (leadError) {
      console.error("Error reassigning lead:", leadError)
      return NextResponse.json({ error: "Failed to reassign lead" }, { status: 500 })
    }

    // Get agent details
    const { data: oldAgent } = await supabase
      .from("agents")
      .select("full_name, email")
      .eq("id", currentLead.assigned_agent_id || "")
      .single()

    const { data: newAgent } = await supabase.from("agents").select("full_name, email").eq("id", newAgentId).single()

    const { data: admin } = await supabase.from("agents").select("full_name, email").eq("id", adminId).single()

    // Create activity record
    if (currentLead.contact_id) {
      const description = reason
        ? `Lead reassigned from ${oldAgent?.full_name || "previous agent"} to ${newAgent?.full_name || newAgent?.email} by ${admin?.full_name || admin?.email}. Reason: ${reason}`
        : `Lead reassigned from ${oldAgent?.full_name || "previous agent"} to ${newAgent?.full_name || newAgent?.email} by ${admin?.full_name || admin?.email}`

      await supabase.from("activities").insert({
        contact_id: currentLead.contact_id,
        lead_id: id,
        agent_id: newAgentId,
        type: "reassignment",
        description,
      })
    }

    return NextResponse.json({ success: true, newAgentId })
  } catch (error) {
    console.error("Error in reassign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
