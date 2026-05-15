"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Phone, MessageSquare, CheckCircle, Clock, Mail, Calendar, User, RefreshCw } from "lucide-react"
import { createClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import { format, isToday, isBefore, startOfDay } from "date-fns"

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
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchTasks = useCallback(async () => {
    if (!hasSupabaseCredentials()) {
      setLoading(false)
      return
    }
    setLoading(true)
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabaseRef.current
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

    setLoading(false)
  }, [agentId])

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
    const { error: taskError } = await supabaseRef.current
      .from("activities")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", taskId)

    if (!taskError) {
      const { data: nextActivity } = await supabaseRef.current
        .from("activities")
        .select("due_at")
        .eq("lead_id", task.lead_id)
        .eq("completed", false)
        .order("due_at", { ascending: true })
        .limit(1)
        .single()

      await supabaseRef.current
        .from("leads")
        .update({
          next_follow_up: nextActivity?.due_at || null,
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", task.lead_id)

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

    await supabaseRef.current.from("activities").update({ due_at: tomorrow.toISOString() }).eq("id", taskId)

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
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  dateStyle.label === "Overdue"
                    ? "border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-500/5"
                    : "border-slate-700/40 bg-gradient-to-br from-slate-800/50 to-slate-900/30"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${dateStyle.bg} ring-2 ring-white/10`}>
                    <span className={dateStyle.color}>{getTaskIcon(task.activity_type)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-sm text-white">{leadName}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs mb-2 bg-slate-700/50">
                      {task.activity_type || "Task"}
                    </Badge>
                    <p className="text-sm text-slate-300 line-clamp-2 mb-2">
                      {task.subject || task.description || "No description"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${dateStyle.color}`} />
                      <span className={`text-xs ${dateStyle.color} font-semibold`}>
                        {dateStyle.label} - {format(new Date(task.due_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {task.lead_id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs border-slate-600 hover:bg-slate-700 bg-transparent"
                        onClick={() => (window.location.href = `/dashboard/leads/${task.lead_id}`)}
                      >
                        <User className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    onClick={() => handleComplete(task.id)}
                    disabled={actionLoading === task.id}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {actionLoading === task.id ? "..." : "Complete"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs hover:bg-slate-700"
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
