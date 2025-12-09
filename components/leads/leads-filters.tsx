"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Agent } from "@/lib/types/database"
import { X } from "lucide-react"

interface LeadsFiltersProps {
  agents: Agent[]
}

const statuses = [
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "claimed", label: "Claimed" },
  { value: "contacted", label: "Contacted" },
  { value: "nurture", label: "Nurture" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
]

const sources = [
  { value: "realtor", label: "Realtor" },
  { value: "upnest", label: "UpNest" },
  { value: "opcity", label: "OpCity" },
  { value: "fb_ads", label: "FB Ads" },
  { value: "manual", label: "Manual" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
]

export function LeadsFilters({ agents }: LeadsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/leads?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/dashboard/leads")
  }

  const hasFilters = searchParams.has("status") || searchParams.has("source") || searchParams.has("agent")

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={searchParams.get("status") || "all"} onValueChange={(v) => updateFilter("status", v || null)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("source") || "all"} onValueChange={(v) => updateFilter("source", v || null)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {sources.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("agent") || "all"} onValueChange={(v) => updateFilter("agent", v || null)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All agents" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All agents</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.full_name || agent.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
