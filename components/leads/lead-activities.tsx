import type React from "react"
import type { Activity } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MessageSquare, Users, Home, FileText, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface LeadActivitiesProps {
  activities: Activity[]
}

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  meeting: Users,
  showing: Home,
  note: FileText,
  task: Clock,
  follow_up: Clock,
}

const activityColors: Record<string, string> = {
  call: "bg-blue-100 text-blue-700",
  email: "bg-purple-100 text-purple-700",
  text: "bg-green-100 text-green-700",
  meeting: "bg-amber-100 text-amber-700",
  showing: "bg-emerald-100 text-emerald-700",
  note: "bg-gray-100 text-gray-700",
  task: "bg-rose-100 text-rose-700",
  follow_up: "bg-indigo-100 text-indigo-700",
}

export function LeadActivities({ activities }: LeadActivitiesProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No activities recorded yet</p>
            <p className="text-sm">Log calls, emails, and meetings to track your interactions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity History ({activities.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activity_type] || FileText
            return (
              <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className={`p-2 rounded-lg h-fit ${activityColors[activity.activity_type] || "bg-gray-100"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="capitalize text-xs">
                      {activity.activity_type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                    {activity.completed && (
                      <Badge variant="secondary" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                  {activity.subject && <p className="font-medium text-sm">{activity.subject}</p>}
                  {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
