"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Lead } from "@/lib/types/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LeadStatusSelectProps {
  lead: Lead
}

const statuses = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "nurturing", label: "Nurturing" },
  { value: "active", label: "Active" },
  { value: "under_contract", label: "Under Contract" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
]

export function LeadStatusSelect({ lead }: LeadStatusSelectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    const supabase = createBrowserClient()

    await supabase
      .from("leads")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        last_contacted_at: newStatus === "contacted" ? new Date().toISOString() : lead.last_contacted_at,
      })
      .eq("id", lead.id)

    router.refresh()
    setIsLoading(false)
  }

  return (
    <Select value={lead.status} onValueChange={handleStatusChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
