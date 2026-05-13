import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, UserCheck, Clock } from "lucide-react"
import Link from "next/link"
import { AgentManagementTable } from "@/components/admin/agent-management-table"
import { CreateAgentDialog } from "@/components/admin/create-agent-dialog"

export default async function AdminAgentsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: agents } = await supabase
    .from("agents")
    .select(
      "id, Name, Email, Phone, Role, profile_picture_url, is_active, last_sign_in_at, created_at, notes, contract_date",
    )
    .order("created_at", { ascending: false })

  console.log("[v0] Fetched agents from database:", agents?.length, agents)

  const activeCount = agents?.filter((a) => a.is_active)?.length || 0
  const inactiveCount = (agents?.length || 0) - activeCount
  const recentSignIns =
    agents?.filter((a) => {
      if (!a.last_sign_in_at) return false
      const daysSinceSignIn = (Date.now() - new Date(a.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceSignIn <= 7
    }).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Agent Management</h1>
            <p className="text-muted-foreground">Comprehensive agent account management and monitoring</p>
          </div>
        </div>
        <CreateAgentDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            {inactiveCount > 0 && <p className="text-xs text-muted-foreground mt-1">{inactiveCount} disabled</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentSignIns}</div>
            <p className="text-xs text-muted-foreground mt-1">Signed in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            All Agents
          </CardTitle>
          <CardDescription>
            View agent details, manage accounts, send password resets, and track activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents && agents.length > 0 ? (
            <AgentManagementTable agents={agents} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No agents found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
