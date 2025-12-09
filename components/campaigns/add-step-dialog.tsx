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
import { Plus } from "lucide-react"
import type { CampaignStepActionType } from "@/lib/types/database"

interface AddStepDialogProps {
  campaignId: string
  nextStepNumber: number
}

export function AddStepDialog({ campaignId, nextStepNumber }: AddStepDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionType, setActionType] = useState<CampaignStepActionType>("email")
  const [delayUnit, setDelayUnit] = useState<"minutes" | "hours" | "days">("hours")
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const delayValue = Number.parseInt(formData.get("delay") as string) || 0
    const subject = formData.get("subject") as string
    const body = formData.get("body") as string

    // Convert delay to minutes
    let delayMinutes = delayValue
    if (delayUnit === "hours") delayMinutes = delayValue * 60
    if (delayUnit === "days") delayMinutes = delayValue * 1440

    const { error } = await supabase.from("campaign_steps").insert({
      campaign_id: campaignId,
      step_number: nextStepNumber,
      delay_minutes: delayMinutes,
      action_type: actionType,
      subject: actionType === "email" ? subject : null,
      body,
    })

    setLoading(false)

    if (!error) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Campaign Step</DialogTitle>
            <DialogDescription>Add a new step to the drip sequence (Step #{nextStepNumber})</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Action Type</Label>
              <Select value={actionType} onValueChange={(v) => setActionType(v as CampaignStepActionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Delay After Enrollment</Label>
              <div className="flex gap-2">
                <Input type="number" name="delay" min="0" defaultValue="0" className="flex-1" />
                <Select value={delayUnit} onValueChange={(v) => setDelayUnit(v as typeof delayUnit)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {actionType === "email" && (
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input id="subject" name="subject" placeholder="e.g., Just checking in..." required />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="body">
                {actionType === "email" ? "Email Body" : actionType === "sms" ? "SMS Message" : "Task Description"}
              </Label>
              <Textarea
                id="body"
                name="body"
                placeholder={
                  actionType === "email"
                    ? "Write your email content..."
                    : actionType === "sms"
                      ? "Write your SMS message..."
                      : "Describe the task to complete..."
                }
                rows={5}
                required
              />
              {actionType === "sms" && (
                <p className="text-xs text-muted-foreground">
                  Keep SMS messages under 160 characters for best results.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
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
