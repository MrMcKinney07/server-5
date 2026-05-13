"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon, Phone, Home, FileText, Clock, User } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns"
import Link from "next/link"

type CalendarEvent = {
  id: string
  title: string
  date: Date
  type: "follow_up" | "showing" | "closing" | "activity"
  leadId?: string
  leadName?: string
  transactionId?: string
  color: string
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: agent } = await supabase.from("agents").select("id").eq("id", user.id).single()

      if (!agent) return

      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      // Fetch follow-ups from leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, first_name, last_name, next_follow_up")
        .eq("agent_id", agent.id)
        .not("next_follow_up", "is", null)
        .gte("next_follow_up", monthStart.toISOString())
        .lte("next_follow_up", monthEnd.toISOString())

      // Fetch activities with due dates
      const { data: activities } = await supabase
        .from("activities")
        .select("id, subject, activity_type, due_at, lead_id, leads(first_name, last_name)")
        .eq("agent_id", agent.id)
        .eq("completed", false)
        .not("due_at", "is", null)
        .gte("due_at", monthStart.toISOString())
        .lte("due_at", monthEnd.toISOString())

      // Fetch transaction closings
      const { data: transactions } = await supabase
        .from("transactions")
        .select("id, property_address, closing_date, status")
        .eq("agent_id", agent.id)
        .not("closing_date", "is", null)
        .gte("closing_date", format(monthStart, "yyyy-MM-dd"))
        .lte("closing_date", format(monthEnd, "yyyy-MM-dd"))

      const allEvents: CalendarEvent[] = []

      // Add follow-ups
      leads?.forEach((lead) => {
        if (lead.next_follow_up) {
          allEvents.push({
            id: `followup-${lead.id}`,
            title: `Follow up: ${lead.first_name} ${lead.last_name}`,
            date: parseISO(lead.next_follow_up),
            type: "follow_up",
            leadId: lead.id,
            leadName: `${lead.first_name} ${lead.last_name}`,
            color: "bg-blue-500",
          })
        }
      })

      // Add activities
      activities?.forEach((activity) => {
        if (activity.due_at) {
          const lead = activity.leads as any
          allEvents.push({
            id: `activity-${activity.id}`,
            title: activity.subject || activity.activity_type,
            date: parseISO(activity.due_at),
            type: "activity",
            leadId: activity.lead_id || undefined,
            leadName: lead ? `${lead.first_name} ${lead.last_name}` : undefined,
            color:
              activity.activity_type === "call"
                ? "bg-emerald-500"
                : activity.activity_type === "email"
                  ? "bg-purple-500"
                  : activity.activity_type === "showing"
                    ? "bg-amber-500"
                    : "bg-gray-500",
          })
        }
      })

      // Add closings
      transactions?.forEach((tx) => {
        if (tx.closing_date) {
          allEvents.push({
            id: `closing-${tx.id}`,
            title: `Closing: ${tx.property_address}`,
            date: parseISO(tx.closing_date),
            type: "closing",
            transactionId: tx.id,
            color: "bg-rose-500",
          })
        }
      })

      setEvents(allEvents)
      setLoading(false)
    }

    fetchEvents()
  }, [currentMonth, supabase])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startDay = startOfMonth(currentMonth).getDay()
  const selectedEvents = selectedDate ? events.filter((e) => isSameDay(e.date, selectedDate)) : []

  const getEventIcon = (type: string) => {
    switch (type) {
      case "follow_up":
        return <Phone className="h-3 w-3" />
      case "showing":
        return <Home className="h-3 w-3" />
      case "closing":
        return <FileText className="h-3 w-3" />
      case "activity":
        return <Clock className="h-3 w-3" />
      default:
        return <CalendarIcon className="h-3 w-3" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View your follow-ups, showings, and closings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for start of month */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg" />
              ))}

              {/* Days */}
              {days.map((day) => {
                const dayEvents = events.filter((e) => isSameDay(e.date, day))
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`h-24 p-1 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                    } ${isToday(day) ? "bg-amber-50" : ""}`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday(day) ? "text-amber-600" : !isSameMonth(day, currentMonth) ? "text-gray-400" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`${event.color} text-white text-xs px-1 py-0.5 rounded truncate`}
                        >
                          {event.title.substring(0, 15)}...
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a Date"}
            </CardTitle>
            <CardDescription>
              {selectedDate ? `${selectedEvents.length} event(s)` : "Click a date to see events"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${event.color} text-white`}>{getEventIcon(event.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{format(event.date, "h:mm a")}</p>
                          {event.leadName && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {event.leadName}
                            </div>
                          )}
                        </div>
                      </div>
                      {event.leadId && (
                        <Link href={`/dashboard/leads/${event.leadId}`}>
                          <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                            View Lead
                          </Button>
                        </Link>
                      )}
                      {event.transactionId && (
                        <Link href={`/dashboard/transactions/${event.transactionId}`}>
                          <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                            View Transaction
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events on this day</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a date to see events</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Legend:</span>
            <Badge className="bg-blue-500">Follow-ups</Badge>
            <Badge className="bg-emerald-500">Calls</Badge>
            <Badge className="bg-purple-500">Emails</Badge>
            <Badge className="bg-amber-500">Showings</Badge>
            <Badge className="bg-rose-500">Closings</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
