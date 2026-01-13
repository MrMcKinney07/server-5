import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { requireAuth, isDatabaseSetup, SupabaseConfigError } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
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
              <CardDescription className="text-slate-400">
                The database tables have not been created yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Please run the SQL migration scripts in the{" "}
                <code className="bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10">/scripts</code> folder to
                set up the database.
              </p>
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
  } catch (err: any) {
    // NEXT_REDIRECT is expected when redirect() is called - rethrow it
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw err
    }

    if (err instanceof SupabaseConfigError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
          <Card className="max-w-lg w-full bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <CardTitle className="text-white">Configuration Error</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Missing required Supabase environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-400">
                Please ensure the following environment variables are set in your Vercel project settings:
              </p>
              <ul className="text-xs font-mono text-slate-500 space-y-1 bg-white/5 p-3 rounded-lg border border-white/10">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
              <p className="text-xs text-red-400 font-mono mt-2">{err.message}</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Generic server error for other unexpected errors
    console.error("Dashboard layout error:", err)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <Card className="max-w-lg w-full bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <CardTitle className="text-white">Server Error</CardTitle>
            </div>
            <CardDescription className="text-slate-400">Something went wrong loading the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              Please try refreshing the page. If the problem persists, contact support.
            </p>
            <p className="text-xs text-slate-500 mt-2 font-mono">Error: {err?.message || "Unknown error"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
