"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Check if this is a redirect error - if so, navigate to login
    if (
      error.message === "NEXT_REDIRECT" ||
      error.digest?.startsWith("NEXT_REDIRECT")
    ) {
      router.push("/auth/login")
      return
    }
    console.error("[v0] Root error boundary caught:", error)
  }, [error, router])

  // Don't render error UI for redirects
  if (
    error.message === "NEXT_REDIRECT" ||
    error.digest?.startsWith("NEXT_REDIRECT")
  ) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-700 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 mb-6 text-sm">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
          <Button onClick={() => window.location.href = "/auth/login"}>
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  )
}
