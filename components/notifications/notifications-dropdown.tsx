"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
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
import { Bell, User, Clock, FileText, Target, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

type Notification = {
  id: string
  type: "lead" | "follow_up" | "closing" | "mission" | "system"
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: agent } = await supabase.from("agents").select("id").eq("id", user.id).single()

      if (!agent) return

      const now = new Date()
      const allNotifications: Notification[] = []

      // Get overdue follow-ups
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

      // Get upcoming closings (within 7 days)
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

      // Get incomplete daily missions
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

      // Sort by date
      allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setNotifications(allNotifications)
      setLoading(false)
    }

    fetchNotifications()

    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase])

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case "lead":
        return <User className="h-4 w-4 text-blue-500" />
      case "follow_up":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "closing":
        return <FileText className="h-4 w-4 text-emerald-500" />
      case "mission":
        return <Target className="h-4 w-4 text-purple-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No notifications
          </div>
        ) : (
          notifications.slice(0, 8).map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link href={notification.link || "#"} className="flex items-start gap-3 p-3 cursor-pointer">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/calendar" className="text-center text-sm text-blue-600 w-full justify-center">
            View Calendar
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
