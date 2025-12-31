import { Button } from "@/components/ui/button"
import { Bell, Search, Zap, Coins } from "lucide-react"
import { UserMenu } from "@/components/dashboard/user-menu"
import type { CurrentAgent } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { UserBadgeName } from "@/components/prestige/user-badge-name"
import Link from "next/link"

interface DashboardTopbarProps {
  agent: CurrentAgent
}

export function DashboardTopbar({ agent }: DashboardTopbarProps) {
  const seasonXP = agent.exp_season || 0
  const bankXP = agent.exp_bank || 0

  return (
    <header className="h-16 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md flex items-center justify-between px-6 relative">
      {/* Top highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.05)] to-transparent" />

      <div className="flex items-center gap-4">
        {/* Glass search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/dashboard/prestige">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full hover:bg-cyan-500/20 transition-colors cursor-pointer">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-300">{seasonXP.toLocaleString()}</span>
              <span className="text-xs text-cyan-400/70">Season</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors cursor-pointer">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">{bankXP.toLocaleString()}</span>
              <span className="text-xs text-amber-400/70">Bank</span>
            </div>
          </div>
        </Link>

        <UserBadgeName
          name={agent.full_name || agent.email || "Agent"}
          email={agent.email}
          avatarUrl={null}
          prestigeTier={agent.prestige_tier || 1}
          showName={false}
          size="md"
        />

        <Badge variant={agent.role === "admin" || agent.role === "broker" ? "default" : "secondary"}>
          {agent.role}
        </Badge>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <UserMenu agent={agent} />
      </div>
    </header>
  )
}
