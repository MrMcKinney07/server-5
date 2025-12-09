"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function RebuildRankingsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRebuild() {
    setLoading(true)

    try {
      const response = await fetch("/api/admin/rebuild-ranking", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to rebuild rankings")
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to rebuild rankings:", error)
      alert(error instanceof Error ? error.message : "Failed to rebuild rankings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRebuild} disabled={loading}>
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Rebuilding..." : "Rebuild Rankings"}
    </Button>
  )
}
