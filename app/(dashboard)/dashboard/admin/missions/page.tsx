import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MissionTemplatesManager } from "@/components/admin/mission-templates-manager"
import { AssignMissionsForm } from "@/components/admin/assign-missions-form"

export default async function AdminMissionsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: templates }, { data: agents }] = await Promise.all([
    supabase.from("mission_templates").select("*").eq("is_active", true).order("category"),
    supabase.from("agents").select("*"),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Mission Management</h1>
          <p className="text-muted-foreground">Create templates and assign missions to agents</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MissionTemplatesManager templates={templates || []} />
        <AssignMissionsForm templates={templates || []} agents={agents || []} />
      </div>
    </div>
  )
}
