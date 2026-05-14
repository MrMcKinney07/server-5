"use client"

import { useEffect, useState, useCallback } from "react"
import { createBrowserClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell, User, Clock, FileText, Target, AlertCircle, FileSignature, CheckCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

type Notification = {
  id: string
  type: "lead" | "follow_up" | "closing" | "mission" | "system" | "contract_doc"
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
  dbId?: string // for contract_notifications rows
}

export function NotificationsDropdown({ isBroker = false }: { isBroker?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  const fetchNotifications = useCallback(async () => {
    if (!hasSupabaseCredentials()) {
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("id", user.id)
      .single()
    if (!agent) return

    const now = new Date()
    const allNotifications: Notification[] = []

    // ── Contract document notifications (broker/admin only) ──
    if (isBroker) {
      const { data: contractNotifs } = await supabase
        .from("contract_notifications")
        .select("id, contract_id, document_name, agent_name, property_address, read, created_at")
        .eq("recipient_id", agent.id)
        .order("created_at", { ascending: false })
        .limit(20)

      contractNotifs?.forEach((n) => {
        allNotifications.push({
          id: `cn-${n.id}`,
          dbId: n.id,
          type: "contract_doc",
          title: "Document Ready for Review",
          message: `${n.agent_name} uploaded "${n.document_name}" — ${n.property_address}`,
          link: `/dashboard/admin/broker?tab=contracts`,
          read: n.read,
          createdAt: new Date(n.created_at),
        })
      })
    }

    // ── Overdue follow-ups ───────────────────────────────────
    const { data: overdueLeads } = await supabase
      .from("leads")
      .select("id, first_name, last_name, next_follow_up")
      .eq("agent_id", agent.id)
      .not("next_follow_up", "is", null)
      .lt("next_follow_up", now.toISOString())
      .limit(5)

    overdueLeads?.forEach((lead) => {
      allNotifications.push({
        id: `overdue-${lead.id}`,
        type: "follow_up",
        title: "Overdue Follow-up",
        message: `${lead.first_name} ${lead.last_name} needs attention`,
        link: `/dashboard/leads/${lead.id}`,
        read: false,
        createdAt: new Date(lead.next_follow_up!),
      })
    })

    // ── Upcoming closings (within 7 days) ────────────────────
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const { data: upcomingClosings } = await supabase
      .from("transactions")
      .select("id, property_address, closing_date")
      .eq("agent_id", agent.id)
      .eq("status", "under_contract")
      .gte("closing_date", now.toISOString().split("T")[0])
      .lte("closing_date", weekFromNow.toISOString().split("T")[0])
      .limit(3)

    upcomingClosings?.forEach((tx) => {
      allNotifications.push({
        id: `closing-${tx.id}`,
        type: "closing",
        title: "Upcoming Closing",
        message: tx.property_address,
        link: `/dashboard/transactions/${tx.id}`,
        read: false,
        createdAt: new Date(tx.closing_date!),
      })
    })

    // ── Incomplete daily missions ────────────────────────────
    const today = now.toISOString().split("T")[0]
    const { data: incompleteMissions } = await supabase
      .from("agent_missions")
      .select("id, template:mission_templates(title)")
      .eq("agent_id", agent.id)
      .eq("mission_date", today)
      .eq("status", "in_progress")
      .limit(3)

    if (incompleteMissions && incompleteMissions.length > 0) {
      allNotifications.push({
        id: "missions-reminder",
        type: "mission",
        title: "Daily Missions",
        message: `${incompleteMissions.length} mission(s) remaining today`,
        link: "/dashboard/missions",
        read: false,
        createdAt: now,
      })
    }

    allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    setNotifications(allNotifications)
    setLoading(false)
  }, [supabase, isBroker])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60 * 1000) // refresh every 60s
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Mark all contract notifications read
  async function markAllContractRead() {
    const unreadIds = notifications
      .filter((n) => n.type === "contract_doc" && !n.read && n.dbId)
      .map((n) => n.dbId!)

    if (unreadIds.length === 0) return

    await supabase
      .from("contract_notifications")
      .update({ read: true })
      .in("id", unreadIds)

    setNotifications((prev) =>
      prev.map((n) => (n.type === "contract_doc" ? { ...n, read: true } : n))
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const unreadContractCount = notifications.filter((n) => n.type === "contract_doc" && !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case "follow_up":   return <Clock className="h-4 w-4 text-amber-400" />
      case "closing":     return <FileText className="h-4 w-4 text-emerald-400" />
      case "mission":     return <Target className="h-4 w-4 text-purple-400" />
      case "contract_doc": return <FileSignature className="h-4 w-4 text-cyan-400" />
      case "lead":        return <User className="h-4 w-4 text-blue-400" />
      default:            return <AlertCircle className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[480px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between py-3">
          <span className="font-semibold">Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
            )}
            {isBroker && unreadContractCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={markAllContractRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No notifications</p>
          </div>
        ) : (
          <>
            {isBroker && unreadContractCount > 0 && (
              <>
                <div className="px-3 py-1.5">
                  <p className="text-[11px] font-semibold text-cyan-500 uppercase tracking-wider">
                    Documents Awaiting Approval
                  </p>
                </div>
                {notifications
                  .filter((n) => n.type === "contract_doc" && !n.read)
                  .slice(0, 5)
                  .map((n) => (
                    <DropdownMenuItem key={n.id} asChild>
                      <Link
                        href={n.link || "#"}
                        className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                      >
                        <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
              </>
            )}

            {notifications
              .filter((n) => n.type !== "contract_doc" || n.read)
              .slice(0, 6)
              .map((n) => (
                <DropdownMenuItem key={n.id} asChild>
                  <Link
                    href={n.link || "#"}
                    className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                  </Link>
                </DropdownMenuItem>
              ))}
          </>
        )}

        <DropdownMenuSeparator />
        {isBroker ? (
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/admin/broker?tab=contracts"
              className="text-center text-sm text-cyan-600 w-full justify-center py-2"
            >
              View All Contract Files
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/calendar"
              className="text-center text-sm text-blue-600 w-full justify-center py-2"
            >
              View Calendar
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
