import { createServerClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { MissionReviewList } from "@/components/admin/missions/mission-review-list"

export default async function AdminMissionReviewPage() {
  await requireAdmin()
  const supabase = await createServerClient()

  // Fetch all completed missions with photos
  const { data: completedMissions } = await supabase
    .from("daily_mission_items")
    .select(
      `
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
      ),
      daily_mission_sets (
        user_id,
        mission_date,
        agents:user_id (
          id,
          Name,
          Email
        )
      )
    `,
    )
    .eq("status", "completed")
    .not("photo_url", "is", null)
    .order("completed_at", { ascending: false })
    .limit(100)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mission Photo Review</h1>
        <p className="text-muted-foreground mt-2">Review photos submitted by agents for completed missions</p>
      </div>

      <MissionReviewList missions={completedMissions || []} />
    </div>
  )
}
