import { type NextRequest, NextResponse } from "next/server"
import { getCurrentAgent } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const agent = await getCurrentAgent()
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Fetch the lead
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, assigned_agent_id, status, claim_expires_at, contact_id")
      .eq("id", id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Validate claim conditions
    if (lead.assigned_agent_id !== agent.id) {
      return NextResponse.json({ error: "This lead is not assigned to you" }, { status: 403 })
    }

    if (lead.status !== "assigned") {
      return NextResponse.json({ error: `Lead cannot be claimed (status: ${lead.status})` }, { status: 400 })
    }

    if (!lead.claim_expires_at || new Date(lead.claim_expires_at) < new Date()) {
      return NextResponse.json({ error: "Claim window has expired" }, { status: 400 })
    }

    // Claim the lead
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        claimed_at: new Date().toISOString(),
        status: "claimed",
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to claim lead" }, { status: 500 })
    }

    // Create activity record
    await supabase.from("activities").insert({
      contact_id: lead.contact_id,
      lead_id: id,
      agent_id: agent.id,
      type: "status_change",
      description: `Lead claimed by ${agent.full_name || agent.email}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error claiming lead:", error)
    return NextResponse.json({ error: "Failed to claim lead" }, { status: 500 })
  }
}
