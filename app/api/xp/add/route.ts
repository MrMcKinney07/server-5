import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const agent = await requireAuth()
    const supabase = await createClient()
    const { amount, reason, type, source } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const currentSeason = new Date().toISOString().slice(0, 7)

    // Add to season XP
    const { error: updateError } = await supabase
      .from("agents")
      .update({
        exp_season: (agent.exp_season || 0) + amount,
      })
      .eq("id", agent.id)

    if (updateError) throw updateError

    // Record in xp_events
    const { error: eventError } = await supabase.from("xp_events").insert({
      user_id: agent.id,
      amount,
      reason: reason || "XP Award",
      type: type || "manual",
      season_id: currentSeason,
    })

    if (eventError) throw eventError

    return NextResponse.json({
      success: true,
      newSeasonXP: (agent.exp_season || 0) + amount,
    })
  } catch (error) {
    console.error("Add XP error:", error)
    return NextResponse.json({ error: "Failed to add XP" }, { status: 500 })
  }
}
