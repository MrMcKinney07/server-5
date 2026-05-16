"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Home,
  Plus,
  Phone,
  Calendar,
  MoreHorizontal,
  X,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns"
import { createClient } from "@/lib/supabase/client"

export interface CalendarEvent {
  id: string
  type: "appointment" | "closing" | "follow_up" | "other"
  title: string
  date: Date
  link?: string
}

type EventType = CalendarEvent["type"]

interface DashboardCalendarProps {
  events: CalendarEvent[]
  agentId: string
}

const EVENT_COLORS: Record<EventType, string> = {
  appointment: "bg-blue-500",
  closing:     "bg-emerald-500",
  follow_up:   "bg-amber-500",
  other:       "bg-slate-400",
}

const EVENT_BADGE_COLORS: Record<EventType, string> = {
  appointment: "bg-blue-500/15 text-blue-600 border-blue-200 dark:border-blue-800",
  closing:     "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:border-emerald-800",
  follow_up:   "bg-amber-500/15 text-amber-600 border-amber-200 dark:border-amber-800",
  other:       "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700",
}

function EventIcon({ type }: { type: EventType }) {
  switch (type) {
    case "appointment": return <CalendarCheck className="h-3 w-3 shrink-0" />
    case "closing":     return <Home className="h-3 w-3 shrink-0" />
    case "follow_up":   return <Phone className="h-3 w-3 shrink-0" />
    case "other":       return <MoreHorizontal className="h-3 w-3 shrink-0" />
  }
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  appointment: "Appointment",
  closing:     "Closing",
  follow_up:   "Follow Up",
  other:       "Other",
}

export function DashboardCalendar({ events: initialEvents, agentId }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay]   = useState<Date | null>(new Date())
  const [events, setEvents]             = useState<CalendarEvent[]>(initialEvents)
  const [showModal, setShowModal]       = useState(false)
  const [saving, setSaving]             = useState(false)

  // Form state
  const [eventTitle, setEventTitle]   = useState("")
  const [eventType, setEventType]     = useState<EventType>("appointment")
  const [eventDate, setEventDate]     = useState(format(new Date(), "yyyy-MM-dd"))
  const [eventTime, setEventTime]     = useState("09:00")

  const supabase = createClient()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const calStart   = startOfWeek(monthStart)
  const calEnd     = endOfWeek(monthEnd)
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  const eventsOnDay    = (day: Date) => events.filter((e) => isSameDay(e.date, day))
  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : []

  function openAddModal() {
    setEventTitle("")
    setEventType("appointment")
    setEventDate(selectedDay ? format(selectedDay, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
    setEventTime("09:00")
    setShowModal(true)
  }

  async function handleSave() {
    if (!eventTitle.trim()) return
    setSaving(true)

    const eventDatetime = new Date(`${eventDate}T${eventTime}:00`)

    // Persist to agent_notifications as a calendar event
    const { data, error } = await supabase
      .from("agent_notifications")
      .insert({
        agent_id: agentId,
        type: eventType,
        title: eventTitle.trim(),
        message: `${EVENT_TYPE_LABELS[eventType]} on ${format(eventDatetime, "MMM d, yyyy 'at' h:mm a")}`,
        read: true, // calendar events don't need bell notification
        metadata: {
          event_start_time: eventDatetime.toISOString(),
          event_type: eventType,
        },
      })
      .select("id")
      .single()

    if (!error && data) {
      setEvents((prev) => [
        ...prev,
        {
          id: data.id,
          type: eventType,
          title: eventTitle.trim(),
          date: eventDatetime,
        },
      ])
    }

    setSaving(false)
    setShowModal(false)
  }

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-blue-500" />
              Calendar
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-28 text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 ml-1 gap-1 text-xs"
                onClick={openAddModal}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3 pt-0">
          {/* Day headers */}
          <div className="grid grid-cols-7">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day) => {
              const dayEvents      = eventsOnDay(day)
              const isSelected     = selectedDay && isSameDay(day, selectedDay)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const todayDay       = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center justify-start pt-1 pb-1 rounded-lg text-xs transition-colors min-h-[38px] ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : todayDay
                        ? "bg-primary/10 text-primary font-bold"
                        : isCurrentMonth
                          ? "hover:bg-muted text-foreground"
                          : "text-muted-foreground/40 hover:bg-muted/40"
                  }`}
                >
                  <span className="font-medium leading-none">{format(day, "d")}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : EVENT_COLORS[e.type]}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            {(Object.keys(EVENT_COLORS) as EventType[]).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full inline-block ${EVENT_COLORS[type]}`} />
                {EVENT_TYPE_LABELS[type]}
              </div>
            ))}
          </div>

          {/* Events for selected day */}
          <div className="border-t pt-3 space-y-2 min-h-[60px]">
            {selectedDay && (
              <p className="text-xs font-medium text-muted-foreground">
                {isToday(selectedDay) ? "Today" : format(selectedDay, "EEEE, MMM d")}
              </p>
            )}
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events — click Add to schedule one.</p>
            ) : (
              selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs font-medium ${EVENT_BADGE_COLORS[e.type]}`}
                >
                  <EventIcon type={e.type} />
                  <span className="truncate">{e.title}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4 capitalize shrink-0 border-current">
                    {EVENT_TYPE_LABELS[e.type]}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Event Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Call with Sarah Johnson"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-type">Type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                <SelectTrigger id="event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!eventTitle.trim() || saving}>
              {saving ? "Saving..." : "Save Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
