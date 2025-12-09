"use client"

import type React from "react"

import type { Activity } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MessageSquare, Calendar, FileText, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface LeadActivitiesProps {
  activities: Activity[]
  leadId: string
  agentId: string
}

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  text: <MessageSquare className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckCircle className="h-4 w-4" />,
  follow_up: <Calendar className="h-4 w-4" />,
}

const activityColors: Record<string, string> = {
  call: "bg-blue-100 text-blue-600",
  email: "bg-emerald-100 text-emerald-600",
  text: "bg-purple-100 text-purple-600",
  meeting: "bg-amber-100 text-amber-600",
  note: "bg-gray-100 text-gray-600",
  task: "bg-rose-100 text-rose-600",
  follow_up: "bg-cyan-100 text-cyan-600",
}

export function LeadActivities({ activities }: LeadActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent interactions with this lead</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`p-2 rounded-lg h-fit ${activityColors[activity.activity_type] || "bg-gray-100"}`}>
                  {activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium capitalize">{activity.activity_type.replace("_", " ")}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {activity.subject && <p className="text-sm font-medium">{activity.subject}</p>}
                  {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
        )}
      </CardContent>
    </Card>
  )
}
