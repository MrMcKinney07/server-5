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
import { Plus, Sparkles } from "lucide-react"

interface AddStepDialogProps {
  campaignId: string
  nextStepNumber: number
}

type StepType = "email" | "sms" | "property_recommendation"

export function AddStepDialog({ campaignId, nextStepNumber }: AddStepDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stepType, setStepType] = useState<StepType>("email")
  const [delayUnit, setDelayUnit] = useState<"hours" | "days">("hours")
  const [aiPersonalize, setAiPersonalize] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const delayValue = Number.parseInt(formData.get("delay") as string) || 0
    const subject = formData.get("subject") as string
    const body = formData.get("body") as string

    // Convert to hours
    let delayHours = delayValue
    if (delayUnit === "days") delayHours = delayValue * 24

    const { error } = await supabase.from("campaign_steps").insert({
      campaign_id: campaignId,
      step_number: nextStepNumber,
      delay_hours: delayHours,
      type: stepType,
      subject: stepType === "email" ? subject : null,
      body: stepType !== "property_recommendation" ? body : null,
      ai_personalize: aiPersonalize,
    })

    setLoading(false)

    if (!error) {
      setOpen(false)
      setStepType("email")
      setAiPersonalize(false)
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
            <DialogDescription>Add step #{nextStepNumber} to the drip sequence</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Step Type</Label>
              <Select value={stepType} onValueChange={(v) => setStepType(v as StepType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="property_recommendation">Property Recommendation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Delay After Previous Step</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="delay"
                  min="0"
                  defaultValue={nextStepNumber === 1 ? "0" : "24"}
                  className="flex-1"
                />
                <Select value={delayUnit} onValueChange={(v) => setDelayUnit(v as typeof delayUnit)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {stepType === "email" && (
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input id="subject" name="subject" placeholder="e.g., Just checking in..." required />
              </div>
            )}
            {stepType !== "property_recommendation" && (
              <div className="grid gap-2">
                <Label htmlFor="body">{stepType === "email" ? "Email Body" : "SMS Message"}</Label>
                <Textarea
                  id="body"
                  name="body"
                  placeholder={
                    stepType === "email"
                      ? "Use {{first_name}}, {{property_interest}}, {{budget}} for personalization..."
                      : "Hi {{first_name}}! Quick update on homes in your area..."
                  }
                  rows={5}
                  required
                />
                {stepType === "sms" && (
                  <p className="text-xs text-muted-foreground">
                    Keep SMS messages under 160 characters for best results.
                  </p>
                )}
              </div>
            )}
            {stepType === "property_recommendation" && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  This step will automatically send personalized property recommendations based on the lead's
                  preferences, budget, and viewing history.
                </p>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">AI Personalization</p>
                  <p className="text-xs text-amber-700">Use AI to personalize content for each lead</p>
                </div>
              </div>
              <Switch checked={aiPersonalize} onCheckedChange={setAiPersonalize} />
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
