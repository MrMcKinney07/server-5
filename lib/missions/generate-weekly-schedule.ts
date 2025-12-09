/**
 * Mission Schedule Generator
 *
 * Generates a weekly schedule of missions from a mission set.
 * - Each day gets 3 missions (perDay)
 * - No duplicate missions in a single day
 * - Missions are rotated evenly across the week
 */

export type DailySchedule = {
  date: Date
  missionTemplateIds: string[] // length 3 (or perDay)
}

/**
 * Generates a weekly mission schedule from a pool of mission template IDs
 *
 * @param missionTemplateIds - Array of up to 10 mission template IDs
 * @param startDate - The starting date for the schedule
 * @param days - Number of days to generate (default 7)
 * @param perDay - Number of missions per day (default 3)
 * @returns Array of DailySchedule objects
 */
export function generateWeeklyMissionSchedule(
  missionTemplateIds: string[],
  startDate: Date,
  days = 7,
  perDay = 3,
): DailySchedule[] {
  if (missionTemplateIds.length === 0) {
    throw new Error("At least one mission template is required")
  }

  if (missionTemplateIds.length < perDay) {
    throw new Error(`Need at least ${perDay} mission templates to generate ${perDay} unique missions per day`)
  }

  const schedule: DailySchedule[] = []

  // Track usage count for each mission to ensure even distribution
  const usageCount: Record<string, number> = {}
  missionTemplateIds.forEach((id) => {
    usageCount[id] = 0
  })

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    // Calculate the date for this day
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayIndex)

    // Select missions for this day
    const dailyMissions = selectMissionsForDay(missionTemplateIds, usageCount, perDay, dayIndex)

    // Update usage counts
    dailyMissions.forEach((id) => {
      usageCount[id]++
    })

    schedule.push({
      date,
      missionTemplateIds: dailyMissions,
    })
  }

  return schedule
}

/**
 * Selects missions for a single day, ensuring:
 * - No duplicates within the day
 * - Even distribution across the schedule
 * - Some variety by using day index as a rotation offset
 */
function selectMissionsForDay(
  allMissionIds: string[],
  usageCount: Record<string, number>,
  perDay: number,
  dayIndex: number,
): string[] {
  const selected: string[] = []

  // Create a copy of IDs sorted by usage count (least used first)
  // Add day-based rotation for variety
  const sortedByUsage = [...allMissionIds].sort((a, b) => {
    const diff = usageCount[a] - usageCount[b]
    if (diff !== 0) return diff
    // If same usage count, use deterministic rotation based on day
    const indexA = allMissionIds.indexOf(a)
    const indexB = allMissionIds.indexOf(b)
    return ((indexA + dayIndex) % allMissionIds.length) - ((indexB + dayIndex) % allMissionIds.length)
  })

  // Pick the first perDay missions that haven't been selected today
  for (const missionId of sortedByUsage) {
    if (!selected.includes(missionId)) {
      selected.push(missionId)
      if (selected.length >= perDay) break
    }
  }

  return selected
}

/**
 * Formats a Date to YYYY-MM-DD string for database storage
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString().split("T")[0]
}
