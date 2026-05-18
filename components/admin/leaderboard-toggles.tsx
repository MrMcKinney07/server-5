"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Trophy, TrendingUp } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface LeaderboardTogglesProps {
  showClosings: boolean
  showListings: boolean
}

export function LeaderboardToggles({ showClosings, showListings }: LeaderboardTogglesProps) {
  const [closings, setClosings] = useState(showClosings)
  const [listings, setListings] = useState(showListings)
  const [isPending, startTransition] = useTransition()

  async function updateSetting(key: string, value: boolean) {
    const res = await fetch("/api/admin/office-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    if (!res.ok) {
      toast({ title: "Error", description: "Failed to update setting.", variant: "destructive" })
      return false
    }
    toast({ title: "Setting updated", description: "Dashboard will reflect this change." })
    return true
  }

  function handleClosingsToggle(checked: boolean) {
    setClosings(checked)
    startTransition(async () => {
      const ok = await updateSetting("show_closings_leaderboard", checked)
      if (!ok) setClosings(!checked)
    })
  }

  function handleListingsToggle(checked: boolean) {
    setListings(checked)
    startTransition(async () => {
      const ok = await updateSetting("show_listings_leaderboard", checked)
      if (!ok) setListings(!checked)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" />
          Leaderboard Visibility
        </CardTitle>
        <CardDescription>
          Control which leaderboards are visible to all agents on their dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
              <Trophy className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <Label htmlFor="closings-toggle" className="text-sm font-medium cursor-pointer">
                Top Closers Leaderboard
              </Label>
              <p className="text-xs text-muted-foreground">Quarterly ranking by closed transactions</p>
            </div>
          </div>
          <Switch
            id="closings-toggle"
            checked={closings}
            onCheckedChange={handleClosingsToggle}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <Label htmlFor="listings-toggle" className="text-sm font-medium cursor-pointer">
                Listings Leaderboard
              </Label>
              <p className="text-xs text-muted-foreground">Monthly ranking by listing agreements uploaded</p>
            </div>
          </div>
          <Switch
            id="listings-toggle"
            checked={listings}
            onCheckedChange={handleListingsToggle}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  )
}
