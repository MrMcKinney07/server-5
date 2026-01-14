"use client"

import { Button } from "@/components/ui/button"
import { Bell, Zap, Coins } from "lucide-react"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Badge } from "@/components/ui/badge"
import { UserBadgeName } from "@/components/prestige/user-badge-name"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface TopbarData {
  seasonXP: number
  bankXP: number
  name: string
  email: string
  role: string
}

export function DashboardTopbar() {
  const [data, setData] = useState<TopbarData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: agent } = await supabase
          .from("agents")
          .select("Name, Email, exp_season, exp_bank, Role")
          .eq("id", user.id)
          .single()

        if (agent) {
          setData({
            seasonXP: agent.exp_season || 0,
            bankXP: agent.exp_bank || 0,
            name: agent.Name,
            email: agent.Email,
            role: agent.Role,
          })
        }
      } catch (error) {
        console.error("Failed to fetch agent data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
  }, [supabase])

  if (loading || !data) {
    return (
      <header className="h-16 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md flex items-center justify-between px-6 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.05)] to-transparent" />
        <div className="flex items-center gap-4" />
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 bg-slate-700/50 rounded-full animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="h-16 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md flex items-center justify-between px-6 relative">
      {/* Top highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.05)] to-transparent" />

      <div className="flex items-center gap-4">{/* Spacer for layout balance */}</div>

      <div className="flex items-center gap-4">
        <Link href="/dashboard/prestige">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full hover:bg-cyan-500/20 transition-colors cursor-pointer">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-300">{data.seasonXP.toLocaleString()}</span>
              <span className="text-xs text-cyan-400/70">Season</span>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/prestige">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors cursor-pointer">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">{data.bankXP.toLocaleString()}</span>
              <span className="text-xs text-amber-400/70">Bank</span>
            </div>
          </div>
        </Link>
        <UserBadgeName
          name={data.name}
          email={data.email}
          avatarUrl={null}
          prestigeTier={1} // Assuming prestigeTier is always 1 for simplicity
          showName={false}
          size="md"
        />
        <Badge variant={data.role === "admin" || data.role === "broker" ? "default" : "secondary"}>{data.role}</Badge>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-slate-400" />
        </Button>
        <UserMenu email={data.email} name={data.name} role={data.role} />
      </div>
    </header>
  )
}
