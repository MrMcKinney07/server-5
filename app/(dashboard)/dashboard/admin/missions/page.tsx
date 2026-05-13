import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ImageIcon } from "lucide-react"
import Link from "next/link"
import { MissionTemplatesManager } from "@/components/admin/mission-templates-manager"
import { AssignMissionsForm } from "@/components/admin/assign-missions-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

      <Card className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-cyan-400" />
            Mission Photo Review
          </CardTitle>
          <CardDescription>View and review photos submitted by agents for completed missions</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/missions/review">
            <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 bg-transparent">
              <ImageIcon className="h-4 w-4 mr-2" />
              View Submitted Photos
            </Button>
          </Link>
        </CardContent>
      </Card>
      {/* </CHANGE> */}

      <div className="grid gap-6 lg:grid-cols-2">
        <MissionTemplatesManager templates={templates || []} />
        <AssignMissionsForm templates={templates || []} agents={agents || []} />
      </div>
    </div>
  )
}
