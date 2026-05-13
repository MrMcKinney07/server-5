import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Vercel Cron configuration:
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/release-missions",
//     "schedule": "0 12 * * *"
//   }]
// }
// Note: 12:00 UTC = 7:00 AM EST (during standard time)
// For EDT (daylight saving), use "0 11 * * *" for 7:00 AM

export async function GET(request: Request) {
  // Verify cron secret for security (optional but recommended)
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  // Calculate "today" in America/New_York timezone
  const nowInNY = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
  const nyDate = new Date(nowInNY)
  const today = nyDate.toISOString().split("T")[0] // YYYY-MM-DD format

  // Find missions for today that haven't been released yet
  const { data: unreleased, error: fetchError } = await supabase
    .from("agent_daily_missions")
    .select("id")
    .eq("date", today)
    .is("released_at", null)

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch missions", details: fetchError.message }, { status: 500 })
  }

  if (!unreleased || unreleased.length === 0) {
    return NextResponse.json({
      message: "No missions to release",
      date: today,
      count: 0,
    })
  }

  // Release all missions by setting released_at to now
  const missionIds = unreleased.map((m) => m.id)
  const { error: updateError } = await supabase
    .from("agent_daily_missions")
    .update({ released_at: new Date().toISOString() })
    .in("id", missionIds)

  if (updateError) {
    return NextResponse.json({ error: "Failed to release missions", details: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: "Missions released successfully",
    date: today,
    count: missionIds.length,
  })
}
