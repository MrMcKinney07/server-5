import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { grantXP } from "@/lib/xp-service"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { missionId, notes, photoUrl } = await request.json()

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the mission with template
    const { data: mission, error: missionError } = await supabase
      .from("agent_missions")
      .select("*, template:mission_templates(*)")
      .eq("id", missionId)
      .eq("agent_id", user.id)
      .single()

    if (missionError || !mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 })
    }

    if (mission.status === "completed") {
      return NextResponse.json({ error: "Mission already completed" }, { status: 400 })
    }

    const points = mission.template?.points || 10

    // Update mission status
    const { error: updateError } = await supabase
      .from("agent_missions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        points_earned: points,
        notes: notes || null,
        photo_url: photoUrl || null,
      })
      .eq("id", missionId)
      .eq("agent_id", user.id)

    if (updateError) {
      console.error("[v0] Failed to update mission:", updateError)
      return NextResponse.json({ error: "Failed to complete mission" }, { status: 500 })
    }

    // Grant XP using the unified XP service
    const xpResult = await grantXP(
      user.id,
      points,
      `Completed mission: ${mission.template?.title || "Mission"}`,
      "MISSION",
    )

    if (!xpResult.success) {
      console.error("[v0] XP grant failed:", xpResult.error)
    }

    console.log("[v0] Mission completed:", {
      missionId,
      points,
      xpGranted: xpResult.success,
      newSeasonXP: xpResult.newSeasonXP,
      newBankXP: xpResult.newBankXP,
    })

    return NextResponse.json({
      success: true,
      points,
      xp: xpResult.success ? xpResult : null,
    })
  } catch (error) {
    console.error("[v0] Mission completion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
