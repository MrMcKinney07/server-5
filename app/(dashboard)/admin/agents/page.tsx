import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AgentManagementTable } from "@/components/admin/agent-management-table"
import { CreateAgentDialog } from "@/components/admin/create-agent-dialog"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminAgentsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: agent } = await supabase.from("agents").select("Role").eq("id", user.id).single()

  if (!agent || (agent.Role !== "admin" && agent.Role !== "broker")) {
    redirect("/dashboard")
  }

  const { data: agents } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
          <p className="text-muted-foreground mt-2">Manage your team members and their access</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="bg-gradient-to-r from-purple-600/10 to-purple-800/10 hover:from-purple-600/20 hover:to-purple-800/20 border-purple-600/50"
          >
            <Link href="/admin/broadcast">
              <Mail className="h-4 w-4 mr-2" />
              Broadcast Email
            </Link>
          </Button>
          <CreateAgentDialog />
        </div>
      </div>

      <AgentManagementTable agents={agents || []} />
    </div>
  )
}
