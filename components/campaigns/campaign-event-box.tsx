"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  CalendarDays,
  Calendar,
  ImageIcon,
  LinkIcon,
  Plus,
  X,
  Sparkles,
  Check,
  Upload,
  AlertCircle,
} from "lucide-react"

interface Attachment {
  name: string
  url: string
  type: string
  size?: number
}

interface Link {
  text: string
  url: string
}

interface CampaignStep {
  id: string
  campaign_id: string
  step_number: number
  type: "email" | "sms" | "property_recommendation"
  subject: string | null
  body: string | null
  delay_hours: number
  ai_personalize: boolean
  schedule_type?: "delay" | "weekly" | "monthly"
  schedule_day_of_week?: number | null
  schedule_day_of_month?: number | null
  schedule_time?: string | null
  attachments?: Attachment[]
  links?: Link[]
}

interface CampaignEventBoxProps {
  step?: CampaignStep
  campaignId: string
  stepNumber: number
  isNew?: boolean
  onSaved?: () => void
  onCancel?: () => void
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAYS_OF_WEEK_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function CampaignEventBox({
  step,
  campaignId,
  stepNumber,
  isNew = false,
  onSaved,
  onCancel,
}: CampaignEventBoxProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expanded, setExpanded] = useState(isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Message content
  const [messageType, setMessageType] = useState<"email" | "sms" | "both">(
    step?.type === "sms" ? "sms" : step?.type === "email" ? "email" : "email",
  )
  const [subject, setSubject] = useState(step?.subject || "")
  const [emailBody, setEmailBody] = useState(step?.type === "email" ? step?.body || "" : "")
  const [smsBody, setSmsBody] = useState(step?.type === "sms" ? step?.body || "" : "")
  const [aiPersonalize, setAiPersonalize] = useState(step?.ai_personalize || false)

  // Schedule
  const [scheduleType, setScheduleType] = useState<"delay" | "weekly" | "monthly">(step?.schedule_type || "delay")
  const [delayValue, setDelayValue] = useState(
    step?.delay_hours ? (step.delay_hours >= 24 ? Math.floor(step.delay_hours / 24) : step.delay_hours) : 1,
  )
  const [delayUnit, setDelayUnit] = useState<"hours" | "days">(
    step?.delay_hours && step.delay_hours >= 24 ? "days" : "hours",
  )
  const [dayOfWeek, setDayOfWeek] = useState(step?.schedule_day_of_week ?? 1)
  const [dayOfMonth, setDayOfMonth] = useState(step?.schedule_day_of_month ?? 1)
  const [scheduleTime, setScheduleTime] = useState(step?.schedule_time?.slice(0, 5) || "10:00")

  // Media
  const [attachments, setAttachments] = useState<Attachment[]>(step?.attachments || [])
  const [links, setLinks] = useState<Link[]>(step?.links || [])
  const [newLinkText, setNewLinkText] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  const placeholders = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "agent_name", label: "Agent Name" },
    { key: "property_address", label: "Property Address" },
  ]

  const insertPlaceholder = (placeholder: string, target: "email" | "sms") => {
    const text = `{{${placeholder}}}`
    if (target === "email") {
      setEmailBody(emailBody + " " + text)
    } else {
      setSmsBody(smsBody + " " + text)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData.session) {
      setError("Authentication error. Please refresh the page and try again.")
      setSaving(false)
      return
    }

    if (messageType === "email" && !subject.trim()) {
      setError("Email subject is required")
      setSaving(false)
      return
    }
    if (messageType === "email" && !emailBody.trim()) {
      setError("Email body is required")
      setSaving(false)
      return
    }
    if (messageType === "sms" && !smsBody.trim()) {
      setError("SMS message is required")
      setSaving(false)
      return
    }
    if (messageType === "both" && (!subject.trim() || !emailBody.trim() || !smsBody.trim())) {
      setError("All content fields are required when sending both email and SMS")
      setSaving(false)
      return
    }

    const safeStepNumber = Math.floor(stepNumber)

    const delayHours = scheduleType === "delay" ? (delayUnit === "days" ? delayValue * 24 : delayValue) : 0

    const baseData = {
      campaign_id: campaignId,
      step_number: safeStepNumber,
      delay_hours: delayHours,
      schedule_type: scheduleType,
      schedule_day_of_week: scheduleType === "weekly" ? dayOfWeek : null,
      schedule_day_of_month: scheduleType === "monthly" ? dayOfMonth : null,
      schedule_time: scheduleType !== "delay" ? scheduleTime + ":00" : null,
      ai_personalize: aiPersonalize,
      attachments,
      links,
    }

    try {
      if (messageType === "both") {
        const { data: existingSteps } = await supabase
          .from("campaign_steps")
          .select("step_number")
          .eq("campaign_id", campaignId)
          .order("step_number", { ascending: false })
          .limit(1)

        const maxStepNumber =
          existingSteps && existingSteps.length > 0 ? Math.floor(existingSteps[0].step_number) : safeStepNumber

        if (step) {
          const { error: updateError } = await supabase
            .from("campaign_steps")
            .update({
              ...baseData,
              type: "email",
              subject,
              body: emailBody,
            })
            .eq("id", step.id)

          if (updateError) {
            console.error("[v0] Update email error:", updateError)
            throw new Error(`Email update failed: ${updateError.message}`)
          }

          const { error: insertError } = await supabase.from("campaign_steps").insert({
            ...baseData,
            step_number: maxStepNumber + 1,
            type: "sms",
            subject: null,
            body: smsBody,
          })

          if (insertError) {
            console.error("[v0] Insert SMS error:", insertError)
            throw new Error(`SMS insert failed: ${insertError.message}`)
          }
        } else {
          const { error: insertError1 } = await supabase.from("campaign_steps").insert({
            ...baseData,
            type: "email",
            subject,
            body: emailBody,
          })

          if (insertError1) {
            console.error("[v0] Insert email error:", insertError1)
            throw new Error(`Email insert failed: ${insertError1.message}`)
          }

          const { error: insertError2 } = await supabase.from("campaign_steps").insert({
            ...baseData,
            step_number: maxStepNumber + 1,
            type: "sms",
            subject: null,
            body: smsBody,
          })

          if (insertError2) {
            console.error("[v0] Insert SMS error:", insertError2)
            throw new Error(`SMS insert failed: ${insertError2.message}`)
          }
        }
      } else {
        const data = {
          ...baseData,
          type: messageType,
          subject: messageType === "email" ? subject : null,
          body: messageType === "email" ? emailBody : smsBody,
        }

        if (step) {
          const { error: updateError } = await supabase.from("campaign_steps").update(data).eq("id", step.id)
          if (updateError) {
            console.error("[v0] Update error:", updateError)
            throw new Error(`Update failed: ${updateError.message}`)
          }
        } else {
          const { error: insertError } = await supabase.from("campaign_steps").insert(data)
          if (insertError) {
            console.error("[v0] Insert error:", insertError)
            throw new Error(`Insert failed: ${insertError.message}`)
          }
        }
      }

      setSaving(false)
      setExpanded(false)
      onSaved?.()
      router.refresh()
    } catch (err: unknown) {
      setSaving(false)
      const errorMessage = err instanceof Error ? err.message : "Failed to save. Please try again."
      setError(errorMessage)
      console.error("[v0] Save campaign step error:", err)
    }
  }

  const handleDelete = async () => {
    if (!step) return

    if (!confirm("Are you sure you want to delete this event?")) return

    const { error: deleteError } = await supabase.from("campaign_steps").delete().eq("id", step.id)

    if (deleteError) {
      setError("Failed to delete: " + deleteError.message)
      return
    }

    router.refresh()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      setAttachments([
        ...attachments,
        {
          name: file.name,
          url: data.url,
          type: file.type,
          size: file.size,
        },
      ])
    } catch {
      setError("Failed to upload file. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const addLink = () => {
    if (!newLinkText || !newLinkUrl) return

    let url = newLinkUrl
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    setLinks([...links, { text: newLinkText, url }])
    setNewLinkText("")
    setNewLinkUrl("")
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const getScheduleDescription = () => {
    if (scheduleType === "delay") {
      const unit = delayUnit === "days" ? (delayValue === 1 ? "day" : "days") : delayValue === 1 ? "hour" : "hours"
      return `After ${delayValue} ${unit}`
    }
    if (scheduleType === "weekly") {
      return `Every ${DAYS_OF_WEEK_FULL[dayOfWeek]} at ${scheduleTime}`
    }
    if (scheduleType === "monthly") {
      const suffix = dayOfMonth === 1 ? "st" : dayOfMonth === 2 ? "nd" : dayOfMonth === 3 ? "rd" : "th"
      return `${dayOfMonth}${suffix} of each month at ${scheduleTime}`
    }
    return ""
  }

  // Collapsed view
  if (!expanded && step) {
    return (
      <Card
        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {step.type === "email" ? (
                    <>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </>
                  )}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {getScheduleDescription()}
                </Badge>
                {attachments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {attachments.length}
                  </Badge>
                )}
              </div>

              {step.type === "email" && step.subject && <p className="font-medium text-sm truncate">{step.subject}</p>}
              <p className="text-sm text-muted-foreground truncate">{step.body || "No content"}</p>
            </div>

            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Expanded view
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 border-2 border-primary/30">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Event #{stepNumber}</span>
            {step && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-red-500 hover:text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!isNew && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="media">Media & Links</TabsTrigger>
          </TabsList>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="space-y-4">
            {/* Message Type Selector */}
            <div className="grid gap-2">
              <Label>Message Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={messageType === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageType("email")}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={messageType === "sms" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageType("sms")}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
                <Button
                  type="button"
                  variant={messageType === "both" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageType("both")}
                >
                  Both
                </Button>
              </div>
            </div>

            {/* Email Content */}
            {(messageType === "email" || messageType === "both") && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Email</span>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Email Body</Label>
                    <div className="flex gap-1 flex-wrap">
                      {placeholders.slice(0, 3).map((p) => (
                        <Button
                          key={p.key}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => insertPlaceholder(p.key, "email")}
                        >
                          {`{{${p.key}}}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Write your email content here..."
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* SMS Content */}
            {(messageType === "sms" || messageType === "both") && (
              <div className="space-y-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">SMS</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{smsBody.length}/160 characters</span>
                </div>

                <div className="grid gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {placeholders.slice(0, 3).map((p) => (
                      <Button
                        key={p.key}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => insertPlaceholder(p.key, "sms")}
                      >
                        {`{{${p.key}}}`}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Write your SMS message..."
                    rows={3}
                    value={smsBody}
                    onChange={(e) => setSmsBody(e.target.value)}
                    maxLength={320}
                  />
                </div>
              </div>
            )}

            {/* AI Personalization */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">AI Personalization</p>
                  <p className="text-xs text-muted-foreground">Let AI customize each message</p>
                </div>
              </div>
              <Switch checked={aiPersonalize} onCheckedChange={setAiPersonalize} />
            </div>
          </TabsContent>

          {/* SCHEDULE TAB */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid gap-2">
              <Label>When to Send</Label>
              <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as "delay" | "weekly" | "monthly")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delay">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      After Delay
                    </div>
                  </SelectItem>
                  <SelectItem value="weekly">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Weekly (Recurring)
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Monthly (Recurring)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === "delay" && (
              <div className="grid gap-2">
                <Label>Delay Duration</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={delayValue}
                    onChange={(e) => setDelayValue(Number(e.target.value))}
                    className="w-24"
                  />
                  <Select value={delayUnit} onValueChange={(v) => setDelayUnit(v as "hours" | "days")}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">After enrollment or previous step</p>
              </div>
            )}

            {scheduleType === "weekly" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Day of Week</Label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <Button
                        key={day}
                        type="button"
                        variant={dayOfWeek === index ? "default" : "outline"}
                        size="sm"
                        className="w-10"
                        onClick={() => setDayOfWeek(index)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
              </div>
            )}

            {scheduleType === "monthly" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Day of Month</Label>
                  <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                          {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
              </div>
            )}

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Schedule Preview</p>
              <p className="text-sm text-muted-foreground">{getScheduleDescription()}</p>
            </div>
          </TabsContent>

          {/* MEDIA TAB */}
          <TabsContent value="media" className="space-y-4">
            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Attachments
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        {att.type.startsWith("image/") ? (
                          <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <LinkIcon className="h-4 w-4 text-gray-500 shrink-0" />
                        )}
                        <span className="text-sm truncate">{att.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No attachments added</p>
              )}
            </div>

            {/* Links */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Trackable Links
              </Label>

              {links.length > 0 && (
                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{link.text}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => removeLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Link text"
                  value={newLinkText}
                  onChange={(e) => setNewLinkText(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                  disabled={!newLinkText || !newLinkUrl}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Property Placeholders */}
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-2">Property Placeholders</p>
              <p className="text-xs text-muted-foreground mb-2">Use these in your links to auto-fill property data:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs font-mono">
                  {"{{property_address}}"}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  {"{{property_price}}"}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  {"{{property_link}}"}
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          {isNew && onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {!isNew && (
            <Button variant="outline" onClick={() => setExpanded(false)}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                {isNew ? "Add Event" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
