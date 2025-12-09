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
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{agent.full_name || agent.email}</span>
          <Badge variant={agent.role === "admin" ? "default" : "secondary"}>{agent.role}</Badge>
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <UserMenu agent={agent} />
      </div>
    </header>
  )
}
