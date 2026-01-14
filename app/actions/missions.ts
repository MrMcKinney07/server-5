"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { grantXP } from "@/lib/xp-service"

export async function selectDailyMissions(templateIds: string[]) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const today = new Date().toISOString().split("T")[0]

  // Step 1: Create or get today's mission set
  const { data: existingSet } = await supabase
    .from("daily_mission_sets")
    .select("id")
    .eq("user_id", user.id)
    .eq("mission_date", today)
    .maybeSingle()

  let setId: string

  if (existingSet) {
    setId = existingSet.id
    // Delete existing items to replace them
    await supabase.from("daily_mission_items").delete().eq("daily_set_id", setId)
  } else {
    const { data: newSet, error: setError } = await supabase
      .from("daily_mission_sets")
      .insert({ user_id: user.id, mission_date: today })
      .select("id")
      .single()

    if (setError || !newSet) {
      return { success: false, error: "Failed to create mission set" }
    }
    setId = newSet.id
  }

  // Step 2: Insert selected missions
  const items = templateIds.map((templateId) => ({
    daily_set_id: setId,
    mission_template_id: templateId,
    status: "assigned",
  }))

  const { error: itemsError } = await supabase.from("daily_mission_items").insert(items)

  if (itemsError) {
    return { success: false, error: "Failed to add missions" }
  }

  revalidatePath("/dashboard/missions")
  return { success: true }
}

export async function completeMission(itemId: string, notes?: string, photoUrl?: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Step 1: Get mission item with template info
  const { data: item, error: itemError } = await supabase
    .from("daily_mission_items")
    .select(`
      id,
      status,
      mission_template_id,
      daily_set_id,
      mission_templates (xp_reward)
    `)
    .eq("id", itemId)
    .single()

  if (itemError || !item || item.status === "completed") {
    return { success: false, error: "Mission not found or already completed" }
  }

  const xpReward = (item.mission_templates as any)?.xp_reward || 5

  const { data: existingTransaction } = await supabase
    .from("xp_transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("source", "mission_completion")
    .eq("source_id", itemId)
    .maybeSingle()

  if (existingTransaction) {
    console.log("[v0] Mission already awarded XP, skipping duplicate award")
    return { success: false, error: "Mission already completed and XP awarded" }
  }

  // Step 2: Mark mission as completed
  const { error: updateError } = await supabase
    .from("daily_mission_items")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      notes,
      photo_url: photoUrl,
    })
    .eq("id", itemId)

  if (updateError) {
    return { success: false, error: "Failed to update mission" }
  }

  const xpResult = await grantXP(user.id, xpReward, `Completed mission`, "MISSION")

  if (!xpResult.success) {
    console.error("[v0] Failed to grant XP:", xpResult.error)
    return { success: false, error: "Failed to award XP" }
  }

  const { error: txError } = await supabase.from("xp_transactions").insert({
    user_id: user.id,
    source: "mission_completion",
    source_id: itemId,
    season_delta: xpReward,
    bank_delta: xpReward,
    lifetime_delta: xpReward,
  })

  if (txError) {
    console.error("[v0] Failed to record XP transaction (non-critical):", txError)
  }

  console.log("[v0] Mission completed successfully:", {
    xpEarned: xpReward,
    newLifetimeXP: xpResult.newLifetimeXP,
    prestigeTier: xpResult.prestigeTier,
    tierChanged: xpResult.tierChanged,
  })

  revalidatePath("/dashboard/missions")
  revalidatePath("/dashboard/prestige")
  return { success: true, xpEarned: xpReward }
}

export async function getTodaysMissions() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { missions: [], templates: [] }
  }

  const today = new Date().toISOString().split("T")[0]

  const { data: set } = await supabase
    .from("daily_mission_sets")
    .select(`
      id,
      daily_mission_items (
        id,
        status,
        completed_at,
        notes,
        photo_url,
        mission_templates (
          id,
          title,
          description,
          xp_reward
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("mission_date", today)
    .maybeSingle()

  // Get available templates for selection
  const dayOfWeek = new Date().getDay() || 7 // Convert Sunday from 0 to 7
  const { data: templates } = await supabase
    .from("mission_templates")
    .select("id, title, description, xp_reward, active_days")
    .contains("active_days", [dayOfWeek])

  return {
    missions: set?.daily_mission_items || [],
    templates: templates || [],
  }
}
