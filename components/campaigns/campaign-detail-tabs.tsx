"use client"

import { useState } from "react"
import { CampaignTimelineBuilder } from "@/components/campaigns/campaign-timeline-builder"
import { CampaignEnrollmentsList } from "@/components/campaigns/campaign-enrollments-list"
import { CampaignActivityLog } from "@/components/campaigns/campaign-activity-log"
import { CampaignLeadEnrollment } from "@/components/campaigns/campaign-lead-enrollment"
import { CampaignDetails } from "@/components/campaigns/campaign-details"
import { ListOrdered, Users, Activity, Settings } from "lucide-react"

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
  owner?: { full_name: string; email: string; Name?: string } | null
}

interface Step {
  id: string
  step_number: number
  type: string
  subject?: string
  body?: string
  delay_hours?: number
  [key: string]: unknown
}

interface Enrollment {
  id: string
  lead_id: string
  campaign_id: string
  current_step: number
  status: "active" | "paused" | "completed"
  next_run_at: string | null
  created_at: string
  lead: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
  } | null
}

interface CampaignDetailTabsProps {
  campaign: Campaign
  steps: Step[]
  enrollments: Enrollment[]
}

const tabs = [
  { id: "sequence", label: "Sequence", icon: ListOrdered },
  { id: "enrollments", label: "Enrollments", icon: Users },
  { id: "activity", label: "Activity Log", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
]

export function CampaignDetailTabs({ campaign, steps, enrollments }: CampaignDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("sequence")

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.id === "enrollments" ? `${tab.label} (${enrollments.length})` : tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "sequence" && (
        <div className="space-y-4">
          <CampaignLeadEnrollment campaignId={campaign.id} campaignName={campaign.name} />
          <CampaignTimelineBuilder steps={steps} campaignId={campaign.id} />
        </div>
      )}

      {activeTab === "enrollments" && (
        <CampaignEnrollmentsList enrollments={enrollments} />
      )}

      {activeTab === "activity" && (
        <CampaignActivityLog campaignId={campaign.id} />
      )}

      {activeTab === "settings" && (
        <CampaignDetails campaign={campaign} />
      )}
    </div>
  )
}
