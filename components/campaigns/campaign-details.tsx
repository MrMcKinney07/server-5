"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MessageSquare, Clock, Calendar, Shield, Settings } from "lucide-react"

interface Campaign {
  id: string
  name: string
  description: string | null
  is_active: boolean
  channel?: string
  type?: string
  send_time_local?: string
  quiet_hours_start?: string
  quiet_hours_end?: string
  stop_on_reply?: boolean
  throttle_per_minute?: number
  dedupe_window_days?: number
  audience_filter?: { send_days?: string[] }
  created_at: string
  owner: { full_name: string; email: string; Name?: string } | null
}

interface CampaignDetailsProps {
  campaign: Campaign
}

function ChannelDisplay({ channel }: { channel?: string }) {
  switch (channel) {
    case "SMS":
      return (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">SMS Only</p>
            <p className="text-xs text-green-600 dark:text-green-500">Text messages</p>
          </div>
        </div>
      )
    case "EMAIL":
      return (
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <Mail className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Email Only</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Emails to inbox</p>
          </div>
        </div>
      )
    case "BOTH":
      return (
        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex gap-1">
            <Mail className="h-4 w-4 text-purple-600" />
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Email + SMS</p>
            <p className="text-xs text-purple-600 dark:text-purple-500">Both channels</p>
          </div>
        </div>
      )
    default:
      return (
        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-200 dark:border-slate-800">
          <Mail className="h-4 w-4 text-slate-600" />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400">Not Set</p>
          </div>
        </div>
      )
  }
}

const dayLabels: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
}

export function CampaignDetails({ campaign }: CampaignDetailsProps) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description || "")
  const [sendTime, setSendTime] = useState(campaign.send_time_local?.slice(0, 5) || "10:30")
  const [quietHoursStart, setQuietHoursStart] = useState(campaign.quiet_hours_start?.slice(0, 5) || "09:00")
  const [quietHoursEnd, setQuietHoursEnd] = useState(campaign.quiet_hours_end?.slice(0, 5) || "19:00")
  const [stopOnReply, setStopOnReply] = useState(campaign.stop_on_reply ?? true)
  const [throttlePerMinute, setThrottlePerMinute] = useState(campaign.throttle_per_minute ?? 30)
  const [dedupeWindowDays, setDedupeWindowDays] = useState(campaign.dedupe_window_days ?? 365)
  const [sendDays, setSendDays] = useState<string[]>(
    campaign.audience_filter?.send_days || ["mon", "tue", "wed", "thu", "fri"],
  )

  const router = useRouter()
  const supabase = createBrowserClient()

  const toggleDay = (day: string) => {
    setSendDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const days = [
    { key: "sun", label: "S" },
    { key: "mon", label: "M" },
    { key: "tue", label: "T" },
    { key: "wed", label: "W" },
    { key: "thu", label: "T" },
    { key: "fri", label: "F" },
    { key: "sat", label: "S" },
  ]

  async function handleSave() {
    setLoading(true)
    await supabase
      .from("campaigns")
      .update({
        name,
        description: description || null,
        send_time_local: sendTime + ":00",
        quiet_hours_start: quietHoursStart + ":00",
        quiet_hours_end: quietHoursEnd + ":00",
        stop_on_reply: stopOnReply,
        throttle_per_minute: throttlePerMinute,
        dedupe_window_days: dedupeWindowDays,
        audience_filter: { send_days: sendDays },
      })
      .eq("id", campaign.id)
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  async function toggleActive() {
    await supabase.from("campaigns").update({ is_active: !campaign.is_active }).eq("id", campaign.id)
    router.refresh()
  }

  const formatTime = (time?: string) => {
    if (!time) return "Not set"
    const [hours, minutes] = time.split(":")
    const h = Number.parseInt(hours)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const activeSendDays = campaign.audience_filter?.send_days || ["mon", "tue", "wed", "thu", "fri"]

  if (editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Edit Campaign Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="basics" className="text-xs">
                Basics
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs">
                Schedule
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs">
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-slate-900 dark:text-slate-100">
                  Name
                </Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-slate-900 dark:text-slate-100">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Send Time</Label>
                <Input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Send Days</Label>
                <div className="flex gap-1">
                  {days.map((day) => (
                    <Button
                      key={day.key}
                      type="button"
                      variant={sendDays.includes(day.key) ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0 text-xs"
                      onClick={() => toggleDay(day.key)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Quiet Hours</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-900 dark:text-slate-100">Stop on Reply</Label>
                <Switch checked={stopOnReply} onCheckedChange={setStopOnReply} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Throttle Rate</Label>
                <Select value={throttlePerMinute.toString()} onValueChange={(v) => setThrottlePerMinute(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10/min</SelectItem>
                    <SelectItem value="30">30/min</SelectItem>
                    <SelectItem value="60">60/min</SelectItem>
                    <SelectItem value="120">120/min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Dedupe Window</Label>
                <Select value={dedupeWindowDays.toString()} onValueChange={(v) => setDedupeWindowDays(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Campaign Settings</CardTitle>
        <Badge variant={campaign.is_active ? "default" : "secondary"}>
          {campaign.is_active ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{campaign.name}</p>
          <p className="text-xs text-muted-foreground">{campaign.description || "No description"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Channel</p>
          <ChannelDisplay channel={campaign.channel} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Send Time</span>
            </div>
            <p className="text-sm">{formatTime(campaign.send_time_local)} CT</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Quiet Hours</span>
            </div>
            <p className="text-sm">
              {formatTime(campaign.quiet_hours_start)} - {formatTime(campaign.quiet_hours_end)}
            </p>
          </div>
        </div>

        <div className="p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Send Days</span>
          </div>
          <div className="flex gap-1">
            {days.map((day) => (
              <span
                key={day.key}
                className={`w-6 h-6 flex items-center justify-center text-xs rounded ${
                  activeSendDays.includes(day.key)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground">Stop on Reply</span>
            <Badge variant={campaign.stop_on_reply ? "default" : "secondary"} className="text-xs">
              {campaign.stop_on_reply ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground">Throttle</span>
            <span className="text-xs font-medium">{campaign.throttle_per_minute || 30}/min</span>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Type: {campaign.type === "BROADCAST" ? "One-Time Broadcast" : "Drip Sequence"}
          </p>
          <p className="text-xs text-muted-foreground">Created: {new Date(campaign.created_at).toLocaleDateString()}</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Label htmlFor="active-toggle" className="text-sm">
            Active
          </Label>
          <Switch id="active-toggle" checked={campaign.is_active} onCheckedChange={toggleActive} />
        </div>

        <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Edit Settings
        </Button>
      </CardContent>
    </Card>
  )
}
