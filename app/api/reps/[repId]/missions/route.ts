import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

const supabaseAdmin = createServiceClient()

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key")
  return apiKey === process.env.ZAPIER_API_KEY
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ repId: string }> }) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized. Provide x-api-key header or api_key query param." }, { status: 401 })
  }

  try {
    const { repId } = await params
    const days = Number.parseInt(request.nextUrl.searchParams.get("days") || "3", 10)

    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const sinceDateStr = sinceDate.toISOString().split("T")[0]

    // Query agent_daily_missions for this rep in the last N days
    const { data: missions, error } = await supabaseAdmin
      .from("agent_daily_missions")
      .select("id, date, mission1_completed, mission2_completed, mission3_completed, created_at")
      .eq("agent_id", repId)
      .gte("date", sinceDateStr)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching rep missions:", error)
      return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 })
    }

    // Count completed missions
    let missionCount = 0
    let lastMissionDate: string | null = null

    for (const m of missions || []) {
      const completedInDay = [m.mission1_completed, m.mission2_completed, m.mission3_completed].filter(Boolean).length
      missionCount += completedInDay
      if (completedInDay > 0 && !lastMissionDate) {
        lastMissionDate = m.date
      }
    }

    const hasCompletedRecently = missionCount > 0

    return NextResponse.json({
      repId,
      lastMissionDate,
      hasCompletedRecently,
      missionCount,
      daysChecked: days,
    })
  } catch (error) {
    console.error("Error in rep missions endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
