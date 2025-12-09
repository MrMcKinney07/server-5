import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { MissionSetsTable } from "@/components/admin/missions/sets-table"
import { CreateSetDialog } from "@/components/admin/missions/create-set-dialog"

export default async function MissionSetsPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch mission sets with their items and templates
  const { data: sets } = await supabase
    .from("mission_sets")
    .select(`
      *,
      items:mission_set_items(
        *,
        mission_template:mission_templates(*)
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch all active templates for the create/edit dialogs
  const { data: templates } = await supabase.from("mission_templates").select("*").eq("is_active", true).order("title")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mission Sets</h1>
          <p className="text-muted-foreground">Group mission templates for weekly assignment</p>
        </div>
        <CreateSetDialog templates={templates ?? []} />
      </div>

      <MissionSetsTable sets={sets ?? []} templates={templates ?? []} />
    </div>
  )
}
