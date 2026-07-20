import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { requireAuth } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const agent = await requireAuth()

  return (
    <div className="min-h-screen flex space-background noise-overlay">
      <DashboardSidebar agentRole={agent.role} />
      <div className="flex-1 flex flex-col relative">
        <DashboardTopbar agent={agent} />
        <main className="flex-1 p-6 relative z-10">{children}</main>
      </div>
    </div>
  )
}
