import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { NextResponse } from "next/server"
import { grantXP } from "@/lib/xp-service"
import { XP_REWARDS } from "@/lib/xp-constants"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await getCurrentAgent()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params

  // Fetch the contract to confirm it belongs to this agent and is at 100%
  const { data: contract, error: contractErr } = await supabase
    .from("executed_contracts")
    .select("id, property_address, progress_percent, payment_status, agent_id")
    .eq("id", contractId)
    .single()

  if (contractErr || !contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  if (contract.agent_id !== agent.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (contract.progress_percent < 100) return NextResponse.json({ error: "Documents not fully approved" }, { status: 400 })
  if (contract.payment_status === "pending" || contract.payment_status === "sent") {
    return NextResponse.json({ error: "Payment already requested" }, { status: 400 })
  }

  // Set payment_status to pending and status to closed
  const { error: updateErr } = await supabase
    .from("executed_contracts")
    .update({ payment_status: "pending", status: "closed" })
    .eq("id", contractId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Grant 30 XP for closing a contract
  const xpResult = await grantXP(
    agent.id,
    XP_REWARDS.CONTRACT_CLOSE,
    `Closed contract: ${contract.property_address}`,
    "CONTRACT_CLOSE",
  )

  // Credit one incomplete mission item for today (counts towards the 3 daily missions)
  try {
    const today = new Date().toISOString().split("T")[0]
    const { data: todaySet } = await supabase
      .from("daily_mission_sets")
      .select("id")
      .eq("user_id", agent.id)
      .eq("mission_date", today)
      .maybeSingle()

    if (todaySet) {
      // Find the first incomplete mission item
      const { data: pendingItem } = await supabase
        .from("daily_mission_items")
        .select("id")
        .eq("daily_set_id", todaySet.id)
        .neq("status", "completed")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (pendingItem) {
        await supabase
          .from("daily_mission_items")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            notes: `Auto-completed: closed contract at ${contract.property_address}`,
          })
          .eq("id", pendingItem.id)
      }
    }
  } catch (missionErr) {
    // Non-critical — don't fail the whole request
    console.error("[v0] Failed to credit mission on contract close:", missionErr)
  }

  // Fetch agent name
  const { data: agentRow } = await supabase
    .from("agents")
    .select("Name")
    .eq("id", agent.id)
    .single()

  // Notify all brokers/admins
  const { data: brokers } = await supabase
    .from("agents")
    .select("id")
    .in("Role", ["admin", "broker"])

  if (brokers && brokers.length > 0) {
    const serviceClient = createServiceClient()
    const notifRows = brokers.map((b) => ({
      recipient_id: b.id,
      contract_id: contractId,
      document_key: "payment_request",
      document_name: "Payment Request",
      agent_name: agentRow?.Name || agent.email,
      property_address: contract.property_address,
      read: false,
    }))
    await serviceClient.from("contract_notifications").insert(notifRows)
  }

  return NextResponse.json({
    success: true,
    xp: xpResult.success ? { earned: XP_REWARDS.CONTRACT_CLOSE, newSeasonXP: xpResult.newSeasonXP } : null,
  })
}
