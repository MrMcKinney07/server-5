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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Missions", href: "/dashboard/missions", icon: Target },
  { label: "Contacts", href: "/dashboard/contacts", icon: UserCircle },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Mail },
  { label: "Properties", href: "/dashboard/properties", icon: Home },
  { label: "Transactions", href: "/dashboard/transactions", icon: FileText },
  { label: "Earnings", href: "/dashboard/earnings", icon: DollarSign },
  { label: "Rewards", href: "/dashboard/rewards", icon: Award },
  { label: "My Team", href: "/dashboard/team", icon: UsersRound },
  { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
  { label: "Supply Store", href: "/dashboard/store", icon: ShoppingBag },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="font-semibold text-lg text-sidebar-foreground">
          McKinney One
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
