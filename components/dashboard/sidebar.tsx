import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Home,
  FileText,
  ShoppingBag,
  Settings,
  UserCircle,
  Target,
  Mail,
  DollarSign,
  BookOpen,
  UsersRound,
  Award,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-400" },
  { label: "Missions", href: "/dashboard/missions", icon: Target, color: "text-amber-400" },
  { label: "Contacts", href: "/dashboard/contacts", icon: UserCircle, color: "text-emerald-400" },
  { label: "Leads", href: "/dashboard/leads", icon: Users, color: "text-blue-400" },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Mail, color: "text-rose-400" },
  { label: "Properties", href: "/dashboard/properties", icon: Home, color: "text-emerald-400" },
  { label: "Transactions", href: "/dashboard/transactions", icon: FileText, color: "text-amber-400" },
  { label: "Earnings", href: "/dashboard/earnings", icon: DollarSign, color: "text-emerald-400" },
  { label: "Rewards", href: "/dashboard/rewards", icon: Award, color: "text-amber-400" },
  { label: "My Team", href: "/dashboard/team", icon: UsersRound, color: "text-blue-400" },
  { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen, color: "text-rose-400" },
  { label: "Supply Store", href: "/dashboard/store", icon: ShoppingBag, color: "text-emerald-400" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "text-slate-400" },
]

export function DashboardSidebar() {
  return (
    <aside className="w-64 border-r border-sidebar-border bg-gradient-to-b from-[#1e3a5f] to-[#162d4a] flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-[#162d4a]/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M1</span>
          </div>
          <span className="font-semibold text-lg text-white">McKinney One</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group"
          >
            <item.icon className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex gap-1">
          <div className="h-1 flex-1 rounded-full bg-blue-500"></div>
          <div className="h-1 flex-1 rounded-full bg-emerald-500"></div>
          <div className="h-1 flex-1 rounded-full bg-amber-500"></div>
          <div className="h-1 flex-1 rounded-full bg-rose-500"></div>
        </div>
      </div>
    </aside>
  )
}
