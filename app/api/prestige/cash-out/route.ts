import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const agent = await requireAuth()
    const supabase = await createClient()

    const seasonXP = agent.exp_season || 0

    if (seasonXP === 0) {
      return NextResponse.json({ error: "No XP to cash out" }, { status: 400 })
    }

    const currentSeason = new Date().toISOString().slice(0, 7)

    const { error: updateError } = await supabase
      .from("agents")
      .update({
        exp_bank: (agent.exp_bank || 0) + seasonXP,
        exp_season: 0,
        last_season_reset: new Date().toISOString(),
      })
      .eq("id", agent.id)

    if (updateError) throw updateError

    const { error: ledgerError } = await supabase.from("xp_ledger").insert({
      user_id: agent.id,
      amount: seasonXP,
      kind: "EARN",
      source: "season_cashout",
      season_id: currentSeason,
      note: `Season cash out: ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    })

    if (ledgerError) throw ledgerError

    return NextResponse.json({
      success: true,
      amount: seasonXP,
      newBalance: (agent.exp_bank || 0) + seasonXP,
    })
  } catch (error) {
    console.error("Cash out error:", error)
    return NextResponse.json({ error: "Cash out failed" }, { status: 500 })
  }
}
