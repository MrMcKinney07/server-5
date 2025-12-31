"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Zap, Mail, MessageSquare, CalendarClock } from "lucide-react"
import { CampaignEventBox } from "./campaign-event-box"

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
  attachments?: Array<{ name: string; url: string; type: string; size?: number }>
  links?: Array<{ text: string; url: string }>
}

interface CampaignTimelineBuilderProps {
  steps: CampaignStep[]
  campaignId: string
}

export function CampaignTimelineBuilder({ steps, campaignId }: CampaignTimelineBuilderProps) {
  const [showNewBox, setShowNewBox] = useState(false)
  const router = useRouter()

  const handleNewBoxSaved = () => {
    setShowNewBox(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Campaign Timeline
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {steps.length} event{steps.length !== 1 ? "s" : ""} • Add up to 20 events
          </p>
        </div>
        {steps.length > 0 && steps.length < 20 && !showNewBox && (
          <Button onClick={() => setShowNewBox(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Box
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {steps.length === 0 && !showNewBox ? (
          // Empty State
          <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-gradient-to-br from-primary/5 to-transparent">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Building Your Campaign</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your first event box to create an automated drip sequence. Each box is a message that goes out at your
              scheduled time.
            </p>
            <Button size="lg" onClick={() => setShowNewBox(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Event
            </Button>

            <div className="mt-8 pt-6 border-t border-dashed">
              <p className="text-xs text-muted-foreground mb-3">Quick Start Ideas</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs py-1">
                  <Mail className="h-3 w-3 mr-1" />
                  Welcome Email → Day 1
                </Badge>
                <Badge variant="outline" className="text-xs py-1">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Check-in SMS → Day 3
                </Badge>
                <Badge variant="outline" className="text-xs py-1">
                  <Mail className="h-3 w-3 mr-1" />
                  Property Updates → Weekly
                </Badge>
                <Badge variant="outline" className="text-xs py-1">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Monthly Newsletter → Monthly
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          // Timeline View
          <div className="relative space-y-4">
            {/* Timeline Line */}
            {steps.length > 0 && (
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-slate-200 to-transparent dark:via-slate-700" />
            )}

            {/* Event Boxes */}
            {steps.map((step, index) => (
              <div key={step.id} className="relative pl-12">
                {/* Timeline Dot */}
                <div className="absolute left-0 top-4 w-[22px] h-[22px] rounded-full bg-white dark:bg-slate-900 border-4 border-primary flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>

                <CampaignEventBox step={step} campaignId={campaignId} stepNumber={step.step_number} />
              </div>
            ))}

            {/* New Event Box */}
            {showNewBox && (
              <div className="relative pl-12">
                <div className="absolute left-0 top-4 w-[22px] h-[22px] rounded-full bg-white dark:bg-slate-900 border-4 border-dashed border-primary/50 flex items-center justify-center z-10">
                  <Plus className="h-3 w-3 text-primary/50" />
                </div>

                <CampaignEventBox
                  campaignId={campaignId}
                  stepNumber={steps.length + 1}
                  isNew
                  onSaved={handleNewBoxSaved}
                  onCancel={() => setShowNewBox(false)}
                />
              </div>
            )}

            {/* Add Button at Bottom */}
            {steps.length > 0 && steps.length < 20 && !showNewBox && (
              <div className="relative pl-12">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center z-10">
                  <Plus className="h-3 w-3 text-slate-400" />
                </div>

                <button
                  onClick={() => setShowNewBox(true)}
                  className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Plus className="h-6 w-6 mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-medium text-slate-500 group-hover:text-primary transition-colors">
                    Add Event Box #{steps.length + 1}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Click to add another message to your sequence</p>
                </button>
              </div>
            )}

            {steps.length >= 20 && (
              <p className="text-center text-sm text-muted-foreground py-4">Maximum of 20 events reached</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
