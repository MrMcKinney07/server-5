import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { MissionTemplatesTable } from "@/components/admin/missions/templates-table"
import { CreateTemplateDialog } from "@/components/admin/missions/create-template-dialog"

export default async function MissionTemplatesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from("mission_templates")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mission Templates</h1>
          <p className="text-muted-foreground">Create and manage reusable mission definitions</p>
        </div>
        <CreateTemplateDialog />
      </div>

      <MissionTemplatesTable templates={templates ?? []} />
    </div>
  )
}
