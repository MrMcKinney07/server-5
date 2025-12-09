import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { requireAuth, isDatabaseSetup } from "@/lib/auth"
import { CopilotTrigger } from "@/components/ai/copilot-trigger"
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Database Setup Required</CardTitle>
            </div>
            <CardDescription>The database tables have not been created yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please run the SQL migration scripts in the <code className="bg-muted px-1 py-0.5 rounded">/scripts</code>{" "}
              folder to set up the database. Run them in order starting with{" "}
              <code className="bg-muted px-1 py-0.5 rounded">001-create-agents-table.sql</code>.
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-mono text-muted-foreground">Scripts to run: 001 through 026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const agent = await requireAuth()

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardTopbar agent={agent} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CopilotTrigger />
    </div>
  )
}
