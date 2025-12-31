"use client"

import type React from "react"
import { useState, useRef } from "react"
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
import {
  Plus,
  Sparkles,
  Clock,
  Calendar,
  CalendarDays,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Paperclip,
  X,
  Upload,
  FileText,
  ExternalLink,
} from "lucide-react"

interface AddStepDialogProps {
  campaignId: string
  nextStepNumber: number
  trigger?: React.ReactNode
}

type StepType = "email" | "sms" | "property_recommendation" | "email_and_sms"
type ScheduleType = "delay" | "weekly" | "monthly"

interface Attachment {
  name: string
  url: string
  type: string
  size: number
}

interface LinkItem {
  text: string
  url: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export function AddStepDialog({ campaignId, nextStepNumber, trigger }: AddStepDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stepType, setStepType] = useState<StepType>("email")
  const [scheduleType, setScheduleType] = useState<ScheduleType>("delay")
  const [delayUnit, setDelayUnit] = useState<"hours" | "days">("hours")
  const [delayValue, setDelayValue] = useState(nextStepNumber === 1 ? 0 : 24)
  const [dayOfWeek, setDayOfWeek] = useState(1) // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [scheduleTime, setScheduleTime] = useState("10:00")
  const [aiPersonalize, setAiPersonalize] = useState(false)
  const [emailBody, setEmailBody] = useState("")
  const [smsBody, setSmsBody] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [links, setLinks] = useState<LinkItem[]>([])
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [newLinkText, setNewLinkText] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newAttachments: Attachment[] = []

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          newAttachments.push({
            name: file.name,
            url: data.url,
            type: file.type,
            size: file.size,
          })
        }
      } catch (error) {
        console.error("[v0] Upload error:", error)
      }
    }

    setAttachments([...attachments, ...newAttachments])
    setUploading(false)

    // Reset input
    if (type === "file" && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (type === "image" && imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const addLink = () => {
    if (newLinkText && newLinkUrl) {
      setLinks([...links, { text: newLinkText, url: newLinkUrl }])
      setNewLinkText("")
      setNewLinkUrl("")
      setShowLinkDialog(false)
    }
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const insertPlaceholder = (placeholder: string, target: "email" | "sms") => {
    if (target === "email") {
      setEmailBody(emailBody + ` {{${placeholder}}}`)
    } else {
      setSmsBody(smsBody + ` {{${placeholder}}}`)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const subject = formData.get("subject") as string

    // Calculate delay hours based on schedule type
    let delayHours = 0
    if (scheduleType === "delay") {
      delayHours = delayUnit === "days" ? delayValue * 24 : delayValue
    }

    const stepData = {
      campaign_id: campaignId,
      step_number: nextStepNumber,
      delay_hours: delayHours,
      schedule_type: scheduleType,
      schedule_day_of_week: scheduleType === "weekly" ? dayOfWeek : null,
      schedule_day_of_month: scheduleType === "monthly" ? dayOfMonth : null,
      schedule_time: scheduleType !== "delay" ? scheduleTime : null,
      ai_personalize: aiPersonalize,
      attachments: attachments.length > 0 ? attachments : [],
      links: links.length > 0 ? links : [],
    }

    if (stepType === "email_and_sms") {
      // Insert SMS step
      await supabase.from("campaign_steps").insert({
        ...stepData,
        type: "sms",
        subject: null,
        body: smsBody,
      })

      // Insert Email step with same schedule
      await supabase.from("campaign_steps").insert({
        ...stepData,
        step_number: nextStepNumber + 1,
        delay_hours: 0,
        type: "email",
        subject: subject,
        body: emailBody,
        email_html: emailBody,
      })
    } else {
      await supabase.from("campaign_steps").insert({
        ...stepData,
        type: stepType,
        subject: stepType === "email" ? subject : null,
        body: stepType === "email" ? emailBody : stepType === "sms" ? smsBody : null,
        email_html: stepType === "email" ? emailBody : null,
      })
    }

    setLoading(false)
    setOpen(false)
    resetForm()
    router.refresh()
  }

  const resetForm = () => {
    setStepType("email")
    setScheduleType("delay")
    setDelayValue(24)
    setAiPersonalize(false)
    setEmailBody("")
    setSmsBody("")
    setAttachments([])
    setLinks([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Campaign Step #{nextStepNumber}</DialogTitle>
            <DialogDescription>Configure when and what to send in this step</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="attachments">Media & Links</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Message Type</Label>
                <Select value={stepType} onValueChange={(v) => setStepType(v as StepType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="email_and_sms">Email & SMS (Both)</SelectItem>
                    <SelectItem value="property_recommendation">Property Recommendation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Content */}
              {(stepType === "email" || stepType === "email_and_sms") && (
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Email Content</span>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="e.g., Just checking in about your home search..."
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Email Body</Label>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2">
                          <Bold className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2">
                          <Italic className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2">
                          <Underline className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2">
                          <List className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2">
                          <ListOrdered className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write your email content here..."
                      rows={8}
                      className="font-mono text-sm"
                      required
                    />
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-2">Insert:</span>
                      {["first_name", "last_name", "agent_name", "property_interest", "budget"].map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs bg-transparent"
                          onClick={() => insertPlaceholder(p, "email")}
                        >
                          {`{{${p}}}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SMS Content */}
              {(stepType === "sms" || stepType === "email_and_sms") && (
                <div className="space-y-3 p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">SMS Content</span>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>SMS Message</Label>
                      <span className={`text-xs ${smsBody.length > 160 ? "text-red-500" : "text-muted-foreground"}`}>
                        {smsBody.length}/160
                      </span>
                    </div>
                    <Textarea
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      placeholder="Hi {{first_name}}! Quick update on homes in your area..."
                      rows={4}
                      required={stepType === "sms" || stepType === "email_and_sms"}
                    />
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-2">Insert:</span>
                      {["first_name", "agent_name"].map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs bg-transparent"
                          onClick={() => insertPlaceholder(p, "sms")}
                        >
                          {`{{${p}}}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Property Recommendation */}
              {stepType === "property_recommendation" && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    This step will automatically send personalized property recommendations based on the lead's
                    preferences, budget, and viewing history. No content needed - AI handles it!
                  </p>
                </div>
              )}

              {/* AI Personalization */}
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">AI Personalization</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Customize content for each lead automatically
                    </p>
                  </div>
                </div>
                <Switch checked={aiPersonalize} onCheckedChange={setAiPersonalize} />
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Schedule Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={scheduleType === "delay" ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setScheduleType("delay")}
                  >
                    <Clock className="h-5 w-5" />
                    <span className="text-xs">Delay</span>
                  </Button>
                  <Button
                    type="button"
                    variant={scheduleType === "weekly" ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setScheduleType("weekly")}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Weekly</span>
                  </Button>
                  <Button
                    type="button"
                    variant={scheduleType === "monthly" ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setScheduleType("monthly")}
                  >
                    <CalendarDays className="h-5 w-5" />
                    <span className="text-xs">Monthly</span>
                  </Button>
                </div>
              </div>

              {/* Delay Options */}
              {scheduleType === "delay" && (
                <div className="p-4 border rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Send this message after a set time from the previous step (or enrollment for step 1).
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Wait Time</Label>
                      <Input
                        type="number"
                        min="0"
                        value={delayValue}
                        onChange={(e) => setDelayValue(Number(e.target.value))}
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-xs">Unit</Label>
                      <Select value={delayUnit} onValueChange={(v) => setDelayUnit(v as typeof delayUnit)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {delayValue === 0 && nextStepNumber === 1 && (
                    <p className="text-xs text-green-600">Sends immediately when lead is enrolled</p>
                  )}
                </div>
              )}

              {/* Weekly Options */}
              {scheduleType === "weekly" && (
                <div className="p-4 border rounded-lg space-y-4">
                  <p className="text-sm text-muted-foreground">Send this message on a specific day each week.</p>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">Day of Week</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <Button
                            key={day.value}
                            type="button"
                            variant={dayOfWeek === day.value ? "default" : "outline"}
                            size="sm"
                            className="w-12"
                            onClick={() => setDayOfWeek(day.value)}
                          >
                            {day.label.slice(0, 3)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Send Time</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    Will send every {DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label} at {scheduleTime}
                  </p>
                </div>
              )}

              {/* Monthly Options */}
              {scheduleType === "monthly" && (
                <div className="p-4 border rounded-lg space-y-4">
                  <p className="text-sm text-muted-foreground">Send this message on a specific day each month.</p>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">Day of Month</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={dayOfMonth === day ? "default" : "outline"}
                            size="sm"
                            className="w-9 h-9 p-0 text-xs"
                            onClick={() => setDayOfMonth(day)}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Send Time</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    Will send on the {dayOfMonth}
                    {dayOfMonth === 1 ? "st" : dayOfMonth === 2 ? "nd" : dayOfMonth === 3 ? "rd" : "th"} of each month
                    at {scheduleTime}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="space-y-4 mt-4">
              {/* File Uploads */}
              <div className="space-y-3">
                <Label>Attachments & Images</Label>
                <div className="flex gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "image")}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "file")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Add File
                  </Button>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4 animate-pulse" />
                    Uploading...
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {attachment.type.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="text-sm truncate max-w-[200px]">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Links</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowLinkDialog(true)}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>

                {showLinkDialog && (
                  <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
                    <div className="grid gap-2">
                      <Label className="text-xs">Link Text</Label>
                      <Input
                        placeholder="e.g., View Property Listings"
                        value={newLinkText}
                        onChange={(e) => setNewLinkText(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">URL</Label>
                      <Input
                        placeholder="https://..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={addLink}>
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowLinkDialog(false)
                          setNewLinkText("")
                          setNewLinkUrl("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {links.length > 0 && (
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-blue-500" />
                          <div>
                            <span className="text-sm font-medium">{link.text}</span>
                            <span className="text-xs text-muted-foreground ml-2 truncate max-w-[150px]">
                              {link.url}
                            </span>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLink(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {links.length === 0 && !showLinkDialog && (
                  <p className="text-sm text-muted-foreground">
                    No links added. Links will appear as clickable buttons in the email.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Step"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
