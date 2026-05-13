"use client"

import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pause, Play, X, Users } from "lucide-react"

interface Enrollment {
  id: string
  lead_id: string
  campaign_id: string
  current_step: number
  status: "active" | "paused" | "completed"
  next_run_at: string | null
  created_at: string
  lead: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
  } | null
}

interface CampaignEnrollmentsListProps {
  enrollments: Enrollment[]
}

export function CampaignEnrollmentsList({ enrollments }: CampaignEnrollmentsListProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  async function togglePause(enrollmentId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    await supabase.from("lead_campaign_enrollments").update({ status: newStatus }).eq("id", enrollmentId)
    router.refresh()
  }

  async function unenroll(enrollmentId: string) {
    if (!confirm("Remove this lead from the campaign?")) return
    await supabase.from("lead_campaign_enrollments").delete().eq("id", enrollmentId)
    router.refresh()
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    completed: "bg-blue-100 text-blue-700",
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Enrolled Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-dashed rounded-lg p-8 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No leads enrolled yet. Enroll leads from their detail page.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Enrolled Leads ({enrollments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {enrollment.lead?.first_name} {enrollment.lead?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {enrollment.lead?.email || enrollment.lead?.phone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Step {enrollment.current_step}</span>
              <Badge variant="secondary" className={statusColors[enrollment.status]}>
                {enrollment.status}
              </Badge>
              {enrollment.status !== "completed" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => togglePause(enrollment.id, enrollment.status)}
                  >
                    {enrollment.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => unenroll(enrollment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
