import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const { agentId, adminId } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const now = new Date()
    const claimExpiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString()

    // Update the lead
    const { error: leadError } = await supabase
      .from("leads")
      .update({
        assigned_agent_id: agentId,
        assigned_at: now.toISOString(),
        claim_expires_at: claimExpiresAt,
        status: "assigned",
      })
      .eq("id", id)

    if (leadError) {
      console.error("Error updating lead:", leadError)
      return NextResponse.json({ error: "Failed to assign lead" }, { status: 500 })
    }

    // Get lead and agent details for activity log
    const { data: lead } = await supabase
      .from("leads")
      .select("contact_id, first_name, last_name")
      .eq("id", id)
      .single()

    const { data: agent } = await supabase.from("agents").select("full_name, email").eq("id", agentId).single()

    const { data: admin } = await supabase.from("agents").select("full_name, email").eq("id", adminId).single()

    // Create activity record
    if (lead) {
      await supabase.from("activities").insert({
        contact_id: lead.contact_id,
        lead_id: id,
        agent_id: agentId,
        type: "assignment",
        description: `Lead manually assigned to ${agent?.full_name || agent?.email} by ${admin?.full_name || admin?.email}`,
      })
    }

    return NextResponse.json({ success: true, agentId })
  } catch (error) {
    console.error("Error in manual-assign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
