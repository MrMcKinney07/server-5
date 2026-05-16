"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, hasSupabaseCredentials } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

interface CampaignStatusToggleProps {
  campaignId: string
  isActive: boolean
}

export function CampaignStatusToggle({ campaignId, isActive }: CampaignStatusToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [optimistic, setOptimistic] = useState(isActive)

  async function toggle() {
    if (!hasSupabaseCredentials()) return
    setLoading(true)
    const next = !optimistic
    setOptimistic(next)
    const supabase = createClient()
    await supabase.from("campaigns").update({ is_active: next }).eq("id", campaignId)
    router.refresh()
    setLoading(false)
  }

  if (!optimistic) {
    return (
      <Button
        size="sm"
        onClick={toggle}
        disabled={loading}
        className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
      >
        <Play className="h-3.5 w-3.5" />
        {loading ? "Resuming..." : "Resume Campaign"}
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={toggle}
      disabled={loading}
      className="gap-1.5 text-muted-foreground border-white/[0.08] hover:text-white hover:border-white/20"
    >
      <Pause className="h-3.5 w-3.5" />
      {loading ? "Pausing..." : "Pause"}
    </Button>
  )
}
