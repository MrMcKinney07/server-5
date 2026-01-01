"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Home,
  Settings,
  Target,
  Mail,
  DollarSign,
  Shield,
  Trophy,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-cyan-400" },
  { label: "Missions", href: "/dashboard/missions", icon: Target, color: "text-amber-400" },
  { label: "Leads", href: "/dashboard/leads", icon: Users, color: "text-cyan-400" },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Mail, color: "text-rose-400" },
  { label: "Properties", href: "/dashboard/properties", icon: Home, color: "text-emerald-400" },
  { label: "Earnings", href: "/dashboard/earnings", icon: DollarSign, color: "text-emerald-400" },
  { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen, color: "text-violet-400" },
  { label: "Prestige", href: "/dashboard/prestige", icon: Trophy, color: "text-amber-400" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "text-slate-400" },
]

interface DashboardSidebarProps {
  agentRole?: string
}

export function DashboardSidebar({ agentRole }: DashboardSidebarProps) {
  const pathname = usePathname()
  const isAdmin = agentRole === "admin" || agentRole === "broker"

  return (
    <aside className="w-64 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-2xl border-r border-white/[0.06] flex flex-col relative">
      {/* Top highlight shine */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center">
            <img src="/images/m1-crm-logo-bottom-left.png" alt="M1 CRM Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-lg text-white tracking-tight">McKinney One</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 group rounded-xl",
                isActive
                  ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : item.color,
                  "group-hover:scale-110",
                )}
              />
              {item.label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="my-4 border-t border-white/5" />
            <Link
              href="/dashboard/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 group rounded-xl",
                pathname.startsWith("/dashboard/admin")
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                  : "text-amber-400/80 hover:text-amber-400 hover:bg-white/[0.06]",
              )}
            >
              <Shield
                className={cn(
                  "h-5 w-5 transition-all duration-200 group-hover:scale-110",
                  pathname.startsWith("/dashboard/admin") && "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                )}
              />
              Admin Portal
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex gap-1">
          <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
        </div>
      </div>
    </aside>
  )
}
