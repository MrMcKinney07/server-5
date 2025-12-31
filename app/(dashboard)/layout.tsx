import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { requireAuth, isDatabaseSetup } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dbReady = await isDatabaseSetup()

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 space-background noise-overlay">
        <Card className="max-w-lg w-full bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-white">Database Setup Required</CardTitle>
            </div>
            <CardDescription className="text-slate-400">The database tables have not been created yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">
              Please run the SQL migration scripts in the{" "}
              <code className="bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10">/scripts</code> folder to set
              up the database. Run them in order starting with{" "}
              <code className="bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10">
                001-create-agents-table.sql
              </code>
              .
            </p>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-xs font-mono text-slate-400">Scripts to run: 001 through 026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
