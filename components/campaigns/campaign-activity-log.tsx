"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, MessageSquare, Home, CheckCircle2, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"

interface CampaignLog {
  id: string
  lead_id: string
  campaign_id: string
  step_id: string | null
  event: string
  info: Record<string, any>
  created_at: string
  lead?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface CampaignActivityLogProps {
  campaignId: string
}

const eventIcons: Record<string, any> = {
  email_sent: Mail,
  sms_sent: MessageSquare,
  property_recommendation_sent: Home,
  completed: CheckCircle2,
  campaign_completed: CheckCircle2,
  error: XCircle,
}

const eventColors: Record<string, string> = {
  email_sent: "bg-blue-100 text-blue-700",
  sms_sent: "bg-green-100 text-green-700",
  property_recommendation_sent: "bg-purple-100 text-purple-700",
  completed: "bg-gray-100 text-gray-700",
  campaign_completed: "bg-gray-100 text-gray-700",
  error: "bg-red-100 text-red-700",
}

const eventLabels: Record<string, string> = {
  email_sent: "Email Sent",
  sms_sent: "SMS Sent",
  property_recommendation_sent: "Properties Sent",
  completed: "Step Completed",
  campaign_completed: "Campaign Completed",
  error: "Error",
}

export function CampaignActivityLog({ campaignId }: CampaignActivityLogProps) {
  const [logs, setLogs] = useState<CampaignLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from("campaign_logs")
        .select("*, lead:leads(first_name, last_name, email)")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(50)

      setLogs((data as CampaignLog[]) || [])
      setLoading(false)
    }

    fetchLogs()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`campaign-logs-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "campaign_logs",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as CampaignLog, ...prev])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, supabase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Activity Log ({logs.length})</CardTitle>
        <p className="text-sm text-muted-foreground">Real-time campaign activity and message delivery</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="border border-dashed rounded-lg p-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No activity yet. Activity will appear here once the campaign starts sending.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const Icon = eventIcons[log.event] || Clock
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-lg ${eventColors[log.event] || "bg-gray-100"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={eventColors[log.event]}>
                          {eventLabels[log.event] || log.event}
                        </Badge>
                        {log.info?.step_number && (
                          <span className="text-xs text-muted-foreground">Step #{log.info.step_number}</span>
                        )}
                        {log.info?.ai_personalized && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            AI Personalized
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        {log.lead?.first_name} {log.lead?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.lead?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
