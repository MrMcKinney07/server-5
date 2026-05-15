"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarCheck, Home, Plus } from "lucide-react"
import Link from "next/link"
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

export interface CalendarEvent {
  id: string
  type: "appointment" | "closing"
  title: string
  date: Date
  link?: string
}

interface DashboardCalendarProps {
  events: CalendarEvent[]
  agentId: string
}

const EVENT_COLORS = {
  appointment: "bg-blue-500",
  closing: "bg-emerald-500",
}

const EVENT_BADGE_COLORS = {
  appointment: "bg-blue-500/15 text-blue-600 border-blue-200",
  closing: "bg-emerald-500/15 text-emerald-600 border-emerald-200",
}

export function DashboardCalendar({ events, agentId }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const eventsOnDay = (day: Date) => events.filter((e) => isSameDay(e.date, day))
  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : []

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4 text-blue-500" />
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
            <Link href="/dashboard/calendar">
              <Button variant="outline" size="sm" className="h-7 ml-1 gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1 flex-1">
          {days.map((day) => {
            const dayEvents = eventsOnDay(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const todayDay = isToday(day)

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
                        className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : EVENT_COLORS[e.type]}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Appointment
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Closing
          </div>
        </div>

        {/* Events for selected day */}
        <div className="border-t pt-3 space-y-2 min-h-[60px]">
          {selectedDay && (
            <p className="text-xs font-medium text-muted-foreground">
              {isToday(selectedDay) ? "Today" : format(selectedDay, "EEEE, MMM d")}
            </p>
          )}
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events</p>
          ) : (
            selectedEvents.map((e) => (
              <div
                key={e.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs font-medium ${EVENT_BADGE_COLORS[e.type]}`}
              >
                {e.type === "appointment" ? (
                  <CalendarCheck className="h-3 w-3 shrink-0" />
                ) : (
                  <Home className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{e.title}</span>
                <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4 capitalize shrink-0">
                  {e.type}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
