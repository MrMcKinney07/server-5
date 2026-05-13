import type React from "react"
import type { Activity } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Phone, Mail, FileText, ArrowRightLeft, Target } from "lucide-react"

interface ContactActivitiesProps {
  activities: (Activity & { agent: { full_name: string; email: string } })[]
}

const typeIcons: Record<string, React.ReactNode> = {
  note: <MessageSquare className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  text: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  status_change: <ArrowRightLeft className="h-4 w-4" />,
  mission: <Target className="h-4 w-4" />,
  assignment: <FileText className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
}

export function ContactActivities({ activities }: ContactActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity History ({activities.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {typeIcons[activity.type] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {activity.type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      by {activity.agent?.full_name || activity.agent?.email}
                    </span>
                  </div>
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
