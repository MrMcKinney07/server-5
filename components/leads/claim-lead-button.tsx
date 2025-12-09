"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"
import type { Lead } from "@/lib/types/database"

interface ClaimLeadButtonProps {
  lead: Lead
  currentAgentId: string
}

export function ClaimLeadButton({ lead, currentAgentId }: ClaimLeadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const router = useRouter()

  // Check if this lead can be claimed by the current agent
  const canClaim =
    lead.status === "assigned" && lead.assigned_agent_id === currentAgentId && lead.claim_expires_at && !isExpired

  useEffect(() => {
    if (!lead.claim_expires_at || lead.status !== "assigned") {
      return
    }

    const updateCountdown = () => {
      const expiresAt = new Date(lead.claim_expires_at!).getTime()
      const now = Date.now()
      const diff = expiresAt - now

      if (diff <= 0) {
        setIsExpired(true)
        setTimeRemaining(null)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [lead.claim_expires_at, lead.status])

  const handleClaim = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}/claim`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to claim lead")
      }

      router.refresh()
    } catch (error) {
      console.error("Error claiming lead:", error)
      alert(error instanceof Error ? error.message : "Failed to claim lead")
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if lead is not assigned to current agent
  if (lead.assigned_agent_id !== currentAgentId) {
    return null
  }

  // Already claimed
  if (lead.status === "claimed") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Claimed</span>
      </div>
    )
  }

  // Expired
  if (isExpired && lead.status === "assigned") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Claim window expired</span>
      </div>
    )
  }

  // Show claim button
  if (canClaim) {
    return (
      <div className="space-y-2">
        <Button onClick={handleClaim} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? "Claiming..." : "Claim This Lead"}
        </Button>
        {timeRemaining && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expires in {timeRemaining}</span>
          </div>
        )}
      </div>
    )
  }

  return null
}
