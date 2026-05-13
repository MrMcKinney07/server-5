"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Mail, MessageSquare, Send, Clock, Calendar, Shield, Zap, AlertCircle } from "lucide-react"

export function CreateCampaignDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState<string>("BOTH")
  const [campaignType, setCampaignType] = useState<string>("SEQUENCE")
  // Schedule settings
  const [sendTime, setSendTime] = useState("10:30")
  const [sendDays, setSendDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"])
  const [quietHoursStart, setQuietHoursStart] = useState("09:00")
  const [quietHoursEnd, setQuietHoursEnd] = useState("19:00")
  // Advanced settings
  const [stopOnReply, setStopOnReply] = useState(true)
  const [throttlePerMinute, setThrottlePerMinute] = useState(30)
  const [dedupeWindowDays, setDedupeWindowDays] = useState(365)
  const [error, setError] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      setError("Your session has expired. Please refresh the page and try again.")
      setLoading(false)
      return
    }

    const user = sessionData.session.user

    const fullDayNames = sendDays.map((d) => {
      const dayMap: Record<string, string> = {
        sun: "sunday",
        mon: "monday",
        tue: "tuesday",
        wed: "wednesday",
        thu: "thursday",
        fri: "friday",
        sat: "saturday",
      }
      return dayMap[d] || d
    })

    const insertData = {
      name,
      description: description || null,
      owner_id: user.id,
      channel,
      type: campaignType,
      send_time_local: sendTime + ":00",
      send_days: fullDayNames,
      quiet_hours_start: quietHoursStart + ":00",
      quiet_hours_end: quietHoursEnd + ":00",
      stop_on_reply: stopOnReply,
      throttle_per_minute: throttlePerMinute,
      dedupe_window_days: dedupeWindowDays,
      is_active: true,
    }

    const { data, error: insertError } = await supabase.from("campaigns").insert(insertData).select().single()

    if (data?.id) {
      // Get agent information for welcome email
      const { data: agentData } = await supabase.from("agents").select("full_name, email").eq("id", user.id).single()

      if (agentData?.email) {
        // Send welcome email in background (don't block UI)
        fetch("/api/campaigns/welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: data.id,
            campaignName: name,
            agentName: agentData.full_name,
            agentEmail: agentData.email,
            campaignType,
            channel,
          }),
        }).catch((err) => console.error("Failed to send welcome email:", err))
      }
    }

    setLoading(false)

    if (insertError) {
      if (insertError.code === "42501") {
        setError("Permission denied. You may not have access to create campaigns.")
      } else if (insertError.code === "23503") {
        setError("Your account is not properly set up. Please contact support.")
      } else {
        setError(insertError.message || "Failed to create campaign. Please try again.")
      }
      return
    }

    if (data?.id) {
      setOpen(false)
      router.push(`/dashboard/campaigns/${data.id}`)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Set up an automated campaign to nurture leads with emails and texts.</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <Tabs defaultValue="basics" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* BASICS TAB */}
            <TabsContent value="basics" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-900 dark:text-slate-100">
                  Campaign Name
                </Label>
                <Input id="name" name="name" placeholder="e.g., New Buyer Nurture" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-slate-900 dark:text-slate-100">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the purpose and target audience"
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-slate-100">Campaign Type</Label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEQUENCE">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        <span>Drip Sequence</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="BROADCAST">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>One-Time Broadcast</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {campaignType === "SEQUENCE"
                    ? "Sends messages over time based on enrollment date"
                    : "Sends a single message to all enrolled contacts at once"}
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-slate-100">Message Channel</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={channel === "EMAIL" ? "default" : "outline"}
                    className="flex flex-col gap-1 h-auto py-3"
                    onClick={() => setChannel("EMAIL")}
                  >
                    <Mail className="h-5 w-5" />
                    <span className="text-xs">Email Only</span>
                  </Button>
                  <Button
                    type="button"
                    variant={channel === "SMS" ? "default" : "outline"}
                    className="flex flex-col gap-1 h-auto py-3"
                    onClick={() => setChannel("SMS")}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs">SMS Only</span>
                  </Button>
                  <Button
                    type="button"
                    variant={channel === "BOTH" ? "default" : "outline"}
                    className="flex flex-col gap-1 h-auto py-3"
                    onClick={() => setChannel("BOTH")}
                  >
                    <div className="flex gap-1">
                      <Mail className="h-4 w-4" />
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Email + SMS</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* SCHEDULE TAB */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Clock className="h-4 w-4" />
                  Send Time
                </Label>
                <Input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
                <p className="text-xs text-muted-foreground">Messages will be sent around this time (Central Time)</p>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Calendar className="h-4 w-4" />
                  Send Days
                </Label>
                <div className="flex gap-1">
                  {days.map((day) => (
                    <Button
                      key={day.key}
                      type="button"
                      variant={sendDays.includes(day.key) ? "default" : "outline"}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => toggleDay(day.key)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Messages will only be sent on selected days</p>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Shield className="h-4 w-4" />
                  Quiet Hours (Do Not Disturb)
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Start sending at</p>
                    <Input type="time" value={quietHoursStart} onChange={(e) => setQuietHoursStart(e.target.value)} />
                  </div>
                  <span className="text-muted-foreground mt-4">to</span>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Stop sending at</p>
                    <Input type="time" value={quietHoursEnd} onChange={(e) => setQuietHoursEnd(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Messages will only be sent between these hours</p>
              </div>
            </TabsContent>

            {/* ADVANCED TAB */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Stop on Reply</p>
                    <p className="text-xs text-muted-foreground">Pause campaign when lead responds</p>
                  </div>
                </div>
                <Switch checked={stopOnReply} onCheckedChange={setStopOnReply} />
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Zap className="h-4 w-4" />
                  Throttle Rate
                </Label>
                <Select value={throttlePerMinute.toString()} onValueChange={(v) => setThrottlePerMinute(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 messages/minute (Safe)</SelectItem>
                    <SelectItem value="30">30 messages/minute (Normal)</SelectItem>
                    <SelectItem value="60">60 messages/minute (Fast)</SelectItem>
                    <SelectItem value="120">120 messages/minute (Max)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How fast to send messages (helps avoid spam filters)</p>
              </div>

              <div className="grid gap-2">
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
                    <SelectItem value="730">2 years</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Prevent re-enrolling leads who completed this campaign recently
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
