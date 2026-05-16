"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { grantXP } from "@/lib/xp-service"

async function getAgentDaysActive(userId: string): Promise<number> {
  const supabase = await createServerClient()
  const { data: agent } = await supabase.from("agents").select("created_at").eq("id", userId).single()
  if (!agent?.created_at) return 0
  const ms = Date.now() - new Date(agent.created_at).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

async function isNewAgent(userId: string): Promise<boolean> {
  const days = await getAgentDaysActive(userId)
  return days <= 180 // within 6 months
}

export async function autoAssignMissionsIfNeeded() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const isNew = await isNewAgent(user.id)
  if (!isNew) {
    return { success: false, isVeteran: true }
  }

  const daysActive = await getAgentDaysActive(user.id)
  const today = new Date().toISOString().split("T")[0]

  // Check if missions already exist for today
  const { data: existingSet } = await supabase
    .from("daily_mission_sets")
    .select("id, daily_mission_items(count)")
    .eq("user_id", user.id)
    .eq("mission_date", today)
    .maybeSingle()

  if (existingSet && (existingSet.daily_mission_items as any)[0]?.count >= 3) {
    return { success: true, alreadyAssigned: true }
  }

  // Get available templates for today, filtered by agent tenure
  const dayOfWeek = new Date().getDay()

  const { data: allTemplates } = await supabase
    .from("mission_templates")
    .select("id, category, min_days_active")
    .eq("is_active", true)
    .contains("active_days", [dayOfWeek])

  const templates = (allTemplates || []).filter((t) => daysActive >= (t.min_days_active ?? 0))

  if (!templates || templates.length < 3) {
    return { success: false, error: "Not enough missions available" }
  }

  const prospectingMissions = templates.filter((t) => t.category === "prospecting")
  const marketingMissions = templates.filter((t) => t.category === "marketing")
  const otherMissions = templates.filter((t) => t.category !== "prospecting" && t.category !== "marketing")

  const selectedIds: string[] = []

  // Add 1 prospecting mission
  if (prospectingMissions.length > 0) {
    const randomProspecting = prospectingMissions[Math.floor(Math.random() * prospectingMissions.length)]
    selectedIds.push(randomProspecting.id)
  }

  // Add 1 marketing mission
  if (marketingMissions.length > 0) {
    const randomMarketing = marketingMissions[Math.floor(Math.random() * marketingMissions.length)]
    selectedIds.push(randomMarketing.id)
  }

  // Add 1 other mission (or any random if we don't have enough specific categories)
  const remainingPool = [...otherMissions, ...prospectingMissions, ...marketingMissions].filter(
    (t) => !selectedIds.includes(t.id),
  )

  if (remainingPool.length > 0 && selectedIds.length < 3) {
    const randomOther = remainingPool[Math.floor(Math.random() * remainingPool.length)]
    selectedIds.push(randomOther.id)
  }

  // Fallback: if we still don't have 3, just grab random ones
  while (selectedIds.length < 3 && templates.length >= 3) {
    const available = templates.filter((t) => !selectedIds.includes(t.id))
    if (available.length === 0) break
    const random = available[Math.floor(Math.random() * available.length)]
    selectedIds.push(random.id)
  }

  if (selectedIds.length < 3) {
    return { success: false, error: "Could not select enough diverse missions" }
  }

  // Use the existing selectDailyMissions function
  return await selectDailyMissions(selectedIds)
}

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
    return { missions: [], templates: [], isNewAgent: false }
  }

  const [isNew, daysActive] = await Promise.all([
    isNewAgent(user.id),
    getAgentDaysActive(user.id),
  ])

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

  const dayOfWeek = new Date().getDay()

  const { data: allTemplates } = await supabase
    .from("mission_templates")
    .select("id, title, description, xp_reward, active_days, min_days_active")
    .eq("is_active", true)
    .contains("active_days", [dayOfWeek])

  // Filter out listing-style missions for agents in their first 14 days
  const templates = (allTemplates || []).filter((t) => daysActive >= (t.min_days_active ?? 0))

  return {
    missions: set?.daily_mission_items || [],
    templates,
    isNewAgent: isNew,
  }
}
