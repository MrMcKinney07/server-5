"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Phone, MessageSquare, CheckCircle, Clock, Mail, Calendar, User, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, isToday, isBefore, startOfDay } from "date-fns"

const FOLLOW_UP_XP = 1
const DAILY_FOLLOW_UP_CAP = 5

interface Task {
  id: string
  subject: string
  description: string
  activity_type: string
  due_at: string
  completed: boolean
  lead_id: string
  lead?: {
    first_name: string
    last_name: string
  }
}

interface LeadActionsWidgetProps {
  agentId: string
}

export function LeadActionsWidget({ agentId }: LeadActionsWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dailyFollowUpCount, setDailyFollowUpCount] = useState(0)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("activities")
      .select(`
        id,
        subject,
        description,
        activity_type,
        due_at,
        completed,
        lead_id,
        lead:leads(first_name, last_name)
      `)
      .eq("agent_id", agentId)
      .eq("completed", false)
      .lte("due_at", `${today}T23:59:59`)
      .order("due_at", { ascending: true })

    if (!error && data) {
      setTasks(data as Task[])
    }

    const { count } = await supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("completed", true)
      .gte("completed_at", `${today}T00:00:00`)
      .lte("completed_at", `${today}T23:59:59`)

    setDailyFollowUpCount(count || 0)
    setLoading(false)
  }, [agentId, supabase])

  useEffect(() => {
    fetchTasks()

    // Check for date rollover at midnight
    const checkMidnight = () => {
      const now = new Date()
      const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()

      setTimeout(() => {
        fetchTasks()
        checkMidnight()
      }, msUntilMidnight + 1000)
    }
    checkMidnight()
  }, [fetchTasks])

  const handleComplete = async (taskId: string) => {
    setActionLoading(taskId)

    const task = tasks.find((t) => t.id === taskId)
    if (!task) {
      setActionLoading(null)
      return
    }

    // Mark task as completed
    const { error: taskError } = await supabase
      .from("activities")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", taskId)

    if (!taskError) {
      const { data: nextActivity } = await supabase
        .from("activities")
        .select("due_at")
        .eq("lead_id", task.lead_id)
        .eq("completed", false)
        .order("due_at", { ascending: true })
        .limit(1)
        .single()

      await supabase
        .from("leads")
        .update({
          next_follow_up: nextActivity?.due_at || null,
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", task.lead_id)

      if (dailyFollowUpCount < DAILY_FOLLOW_UP_CAP) {
        const { data: agentData } = await supabase.from("agents").select("exp").eq("id", agentId).single()
        await supabase
          .from("agents")
          .update({ exp: (agentData?.exp || 0) + FOLLOW_UP_XP })
          .eq("id", agentId)
        setDailyFollowUpCount((prev) => prev + 1)
      }

      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId))
    }

    setActionLoading(null)
  }

  const handleSnooze = async (taskId: string) => {
    setActionLoading(taskId)

    // Snooze to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    await supabase.from("activities").update({ due_at: tomorrow.toISOString() }).eq("id", taskId)

    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId))

    setActionLoading(null)
  }

  const getTaskIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "call":
        return <Phone className="h-4 w-4" />
      case "text":
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "follow_up":
      case "follow up":
        return <Calendar className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getDueDateStyle = (dueAt: string) => {
    const dueDate = new Date(dueAt)
    const today = startOfDay(new Date())

    if (isBefore(startOfDay(dueDate), today)) {
      return { color: "text-red-400", bg: "bg-red-500/20", label: "Overdue" }
    } else if (isToday(dueDate)) {
      return { color: "text-amber-400", bg: "bg-amber-500/20", label: "Today" }
    }
    return { color: "text-slate-400", bg: "bg-slate-500/20", label: "Upcoming" }
  }

  // Calculate stats
  const todayTasks = tasks.filter((t) => isToday(new Date(t.due_at)))
  const overdueTasks = tasks.filter((t) => isBefore(startOfDay(new Date(t.due_at)), startOfDay(new Date())))
  const totalTasks = tasks.length

  const remainingXP = Math.max(0, DAILY_FOLLOW_UP_CAP - dailyFollowUpCount)
  const canEarnXP = dailyFollowUpCount < DAILY_FOLLOW_UP_CAP

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Follow Up Tasks
            </CardTitle>
            <CardDescription>Tasks due today and overdue items</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchTasks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4 mt-3 text-sm flex-wrap">
          <span className="text-amber-400 font-medium">Today: {todayTasks.length} tasks</span>
          <span className="text-red-400 font-medium">Overdue: {overdueTasks.length} tasks</span>
          <span className="text-slate-400 font-medium">Total: {totalTasks} actions</span>
          <span className={`font-medium ${canEarnXP ? "text-emerald-400" : "text-slate-500"}`}>
            XP Today: {dailyFollowUpCount}/{DAILY_FOLLOW_UP_CAP}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
            <p className="font-medium text-emerald-400">All caught up!</p>
            <p className="text-sm text-slate-400">No tasks need your attention right now.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const dateStyle = getDueDateStyle(task.due_at)
            const leadName = task.lead
              ? `${task.lead.first_name || ""} ${task.lead.last_name || ""}`.trim()
              : "Unknown Lead"

            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg border ${dateStyle.label === "Overdue" ? "border-red-500/30 bg-red-500/10" : "border-slate-500/30 bg-slate-500/10"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${dateStyle.bg}`}>
                    <span className={dateStyle.color}>{getTaskIcon(task.activity_type)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="font-medium text-sm truncate text-white">{leadName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {task.activity_type || "Task"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">
                      {task.subject || task.description || "No description"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className={`h-3 w-3 ${dateStyle.color}`} />
                      <span className={`text-xs ${dateStyle.color} font-medium`}>
                        {dateStyle.label} - {format(new Date(task.due_at), "MMM d")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {task.lead_id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-transparent"
                        onClick={() => window.open(`tel:`, "_self")}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-transparent"
                        onClick={() => window.open(`sms:`, "_self")}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Text
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleComplete(task.id)}
                    disabled={actionLoading === task.id}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {actionLoading === task.id
                      ? "..."
                      : canEarnXP
                        ? "Log Activity (+1 XP)"
                        : "Log Activity (XP Capped)"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => handleSnooze(task.id)}
                    disabled={actionLoading === task.id}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Snooze
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
