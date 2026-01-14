import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { addXP } from "@/lib/xp-service"

// Bonus XP based on streak length
function getStreakBonusXP(streak: number): number {
  if (streak >= 6) return 20
  if (streak >= 5) return 15
  if (streak >= 4) return 10
  if (streak >= 3) return 5
  return 0
}

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get current agent data
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, login_streak, last_login_date, longest_streak")
    .eq("id", user.id)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const today = new Date().toISOString().split("T")[0]
  const lastLoginDate = agent.last_login_date

  // If already logged in today, don't update streak
  if (lastLoginDate === today) {
    return NextResponse.json({
      streak: agent.login_streak,
      bonusXP: getStreakBonusXP(agent.login_streak),
      alreadyTracked: true,
    })
  }

  // Calculate new streak
  let newStreak = 1
  let streakContinued = false

  if (lastLoginDate) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    if (lastLoginDate === yesterdayStr) {
      // Consecutive day - increment streak
      newStreak = (agent.login_streak || 0) + 1
      streakContinued = true
    }
    // Otherwise streak resets to 1
  }

  // Update longest streak if needed
  const newLongestStreak = Math.max(newStreak, agent.longest_streak || 0)

  // Update agent record
  const { error: updateError } = await supabase
    .from("agents")
    .update({
      login_streak: newStreak,
      last_login_date: today,
      longest_streak: newLongestStreak,
      last_sign_in_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("Error updating streak:", updateError)
    return NextResponse.json({ error: "Failed to update streak" }, { status: 500 })
  }

  // Award bonus XP if streak is 3+ days
  const bonusXP = getStreakBonusXP(newStreak)
  if (bonusXP > 0 && streakContinued) {
    await addXP(user.id, bonusXP, "hustle_streak", `Daily login streak bonus (${newStreak} days)`)
  }

  return NextResponse.json({
    streak: newStreak,
    bonusXP: bonusXP,
    longestStreak: newLongestStreak,
    streakContinued,
    alreadyTracked: false,
  })
}
