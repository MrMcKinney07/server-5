import { Button } from "@/components/ui/button"
import { Bell, Search } from "lucide-react"
import { UserMenu } from "@/components/dashboard/user-menu"
import type { CurrentAgent } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"

interface DashboardTopbarProps {
  agent: CurrentAgent
}

export function DashboardTopbar({ agent }: DashboardTopbarProps) {
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
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">{agent.full_name || agent.email}</span>
          <Badge variant={agent.role === "admin" || agent.role === "broker" ? "default" : "secondary"}>
            {agent.role}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <UserMenu agent={agent} />
      </div>
    </header>
  )
}
