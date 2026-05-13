"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Eye, TrendingUp, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PropertyView {
  id: string
  view_count: number
  last_viewed_at: string
  total_duration_seconds: number
  average_duration_seconds: number
  last_session_duration_seconds: number
  saved_property: {
    address: string
    city: string
    state: string
    price: number
    photo_url: string
  }
}

interface PropertyEngagementAnalyticsProps {
  leadId: string
  propertyViews: PropertyView[]
}

export function PropertyEngagementAnalytics({ leadId, propertyViews }: PropertyEngagementAnalyticsProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getEngagementLevel = (avgDuration: number) => {
    if (avgDuration >= 120) return { label: "High Interest", color: "bg-green-500" }
    if (avgDuration >= 60) return { label: "Moderate", color: "bg-yellow-500" }
    return { label: "Low Interest", color: "bg-gray-400" }
  }

  if (propertyViews.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No property views yet</p>
          <p className="text-sm mt-1">Send properties to track client engagement</p>
        </div>
      </Card>
    )
  }

  // Sort by engagement (average duration * view count)
  const sortedViews = [...propertyViews].sort((a, b) => {
    const scoreA = (a.average_duration_seconds || 0) * a.view_count
    const scoreB = (b.average_duration_seconds || 0) * b.view_count
    return scoreB - scoreA
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{propertyViews.reduce((sum, pv) => sum + pv.view_count, 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold">
                {formatDuration(propertyViews.reduce((sum, pv) => sum + (pv.total_duration_seconds || 0), 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Properties Viewed</p>
              <p className="text-2xl font-bold">{propertyViews.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Property Engagement</h3>
        {sortedViews.map((pv) => {
          const engagement = getEngagementLevel(pv.average_duration_seconds || 0)
          return (
            <Card key={pv.id} className="p-4">
              <div className="flex items-start gap-4">
                {pv.saved_property.photo_url && (
                  <img
                    src={pv.saved_property.photo_url || "/placeholder.svg"}
                    alt={pv.saved_property.address}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-base">{pv.saved_property.address}</h4>
                      <p className="text-sm text-muted-foreground">
                        {pv.saved_property.city}, {pv.saved_property.state}
                      </p>
                      <p className="text-sm font-medium mt-1">${pv.saved_property.price?.toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary" className={`${engagement.color} text-white`}>
                      {engagement.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{pv.view_count}</span>
                      <span className="text-muted-foreground">views</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{formatDuration(pv.total_duration_seconds || 0)}</span>
                      <span className="text-muted-foreground">total</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{formatDuration(pv.average_duration_seconds || 0)}</span>
                      <span className="text-muted-foreground">avg</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {pv.last_viewed_at
                          ? formatDistanceToNow(new Date(pv.last_viewed_at), { addSuffix: true })
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
