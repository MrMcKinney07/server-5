"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pause, Play, X, Users, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { useConfirm } from "@/hooks/use-confirm"

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

const statusConfig = {
  active: {
    label: "Active",
    icon: Clock,
    class: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400 animate-pulse",
  },
  paused: {
    label: "Paused",
    icon: AlertCircle,
    class: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    class: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    dot: "bg-slate-400",
  },
}

export function CampaignEnrollmentsList({ enrollments }: CampaignEnrollmentsListProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [search, setSearch] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function togglePause(enrollmentId: string, currentStatus: string) {
    if (!hasSupabaseCredentials()) return
    setLoadingId(enrollmentId)
    const supabase = createClient()
    const newStatus = currentStatus === "active" ? "paused" : "active"
    await supabase.from("lead_campaign_enrollments").update({ status: newStatus }).eq("id", enrollmentId)
    router.refresh()
    setLoadingId(null)
  }

  async function unenroll(enrollmentId: string) {
    if (!(await confirm({ title: "Remove from campaign?", description: "This lead will be removed from the campaign.", confirmText: "Remove", destructive: true }))) return
    if (!hasSupabaseCredentials()) return
    setLoadingId(enrollmentId)
    const supabase = createClient()
    await supabase.from("lead_campaign_enrollments").delete().eq("id", enrollmentId)
    router.refresh()
    setLoadingId(null)
  }

  const filtered = enrollments.filter((e) => {
    const q = search.toLowerCase()
    return (
      !q ||
      e.lead?.first_name?.toLowerCase().includes(q) ||
      e.lead?.last_name?.toLowerCase().includes(q) ||
      e.lead?.email?.toLowerCase().includes(q) ||
      e.lead?.phone?.includes(q)
    )
  })

  const counts = {
    active: enrollments.filter((e) => e.status === "active").length,
    paused: enrollments.filter((e) => e.status === "paused").length,
    completed: enrollments.filter((e) => e.status === "completed").length,
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] p-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">No leads enrolled</p>
        <p className="text-xs text-muted-foreground">Enroll leads from their profile page or the Sequence tab.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(counts).map(([status, count]) => {
          if (count === 0) return null
          const cfg = statusConfig[status as keyof typeof statusConfig]
          return (
            <div key={status} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${cfg.class}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {count} {cfg.label}
            </div>
          )
        })}
        <div className="ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs w-48 bg-white/[0.03] border-white/[0.08] placeholder:text-muted-foreground/50 focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_100px_120px_80px] gap-0 text-[11px] font-medium text-muted-foreground bg-white/[0.02] border-b border-white/[0.06] px-4 py-2.5">
          <span>Lead</span>
          <span>Step</span>
          <span>Status</span>
          <span>Next Send</span>
          <span />
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filtered.map((enrollment) => {
            const cfg = statusConfig[enrollment.status]
            const isLoading = loadingId === enrollment.id
            return (
              <div
                key={enrollment.id}
                className="grid grid-cols-[1fr_80px_100px_120px_80px] gap-0 items-center px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Lead */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {enrollment.lead?.first_name} {enrollment.lead?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {enrollment.lead?.email || enrollment.lead?.phone || "—"}
                  </p>
                </div>

                {/* Step */}
                <div>
                  <span className="text-xs text-muted-foreground">Step {enrollment.current_step}</span>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${cfg.class}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Next send */}
                <div>
                  {enrollment.next_run_at ? (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(enrollment.next_run_at), "MMM d, h:mm a")}
                    </span>
                  ) : enrollment.status === "completed" ? (
                    <span className="text-xs text-muted-foreground">Done</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  {enrollment.status !== "completed" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading}
                        className="h-7 w-7 text-muted-foreground hover:text-white"
                        onClick={() => togglePause(enrollment.id, enrollment.status)}
                        title={enrollment.status === "active" ? "Pause" : "Resume"}
                      >
                        {enrollment.status === "active"
                          ? <Pause className="h-3.5 w-3.5" />
                          : <Play className="h-3.5 w-3.5" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading}
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        onClick={() => unenroll(enrollment.id)}
                        title="Remove from campaign"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 && search && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No leads matching &quot;{search}&quot;
        </p>
      )}
    </div>
  )
}
