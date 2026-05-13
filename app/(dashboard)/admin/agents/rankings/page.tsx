import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { RankingsTable } from "@/components/admin/rankings/rankings-table"
import { RebuildRankingsButton } from "@/components/admin/rankings/rebuild-rankings-button"

export default async function AdminRankingsPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Get current year and month
  const nowInNY = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
  const nyDate = new Date(nowInNY)
  const year = nyDate.getFullYear()
  const month = nyDate.getMonth() + 1

  // Fetch current month's rankings with agent info
  const { data: rankings } = await supabase
    .from("monthly_agent_stats")
    .select(
      `
      *,
      agent:agents(id, full_name, email, segment)
    `,
    )
    .eq("year", year)
    .eq("month", month)
    .order("rank", { ascending: true })

  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agent Rankings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {monthName} {year} mission performance leaderboard
          </p>
        </div>
        <RebuildRankingsButton />
      </div>

      <RankingsTable rankings={rankings || []} />
    </div>
  )
}
