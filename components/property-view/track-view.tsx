"use client"

import { useEffect } from "react"

/**
 * Records a property-view session via the tracking API.
 * Replaces the former inline dangerouslySetInnerHTML script so the property id
 * is passed as a typed prop and never interpolated into raw HTML (XSS-safe).
 */
export function TrackView({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    let sessionId: string | null = null
    let startTime = Date.now()
    let cancelled = false

    async function startSession() {
      try {
        const res = await fetch("/api/property-view-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, action: "start" }),
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) sessionId = data.sessionId
      } catch {
        // Ignore tracking failures — they must never break the page.
      }
    }

    function endSession() {
      if (!sessionId) return
      const duration = Math.floor((Date.now() - startTime) / 1000)
      const payload = JSON.stringify({ sessionId, action: "end", duration })
      // sendBeacon survives page unload where fetch would be cancelled.
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/property-view-session", new Blob([payload], { type: "application/json" }))
      } else {
        fetch("/api/property-view-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        endSession()
      } else {
        startTime = Date.now()
        startSession()
      }
    }

    startSession()
    window.addEventListener("beforeunload", endSession)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      cancelled = true
      endSession()
      window.removeEventListener("beforeunload", endSession)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [propertyId])

  return null
}
