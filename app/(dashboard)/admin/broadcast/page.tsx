import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BroadcastEmailForm } from "@/components/admin/broadcast-email-form"

export default async function BroadcastEmailPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: agent } = await supabase.from("agents").select("Role").eq("id", user.id).single()

  if (!agent || (agent.Role !== "admin" && agent.Role !== "broker")) {
    redirect("/dashboard")
  }

  // Get all active agents
  const { data: agents } = await supabase
    .from("agents")
    .select("id, Name, Email, Role")
    .eq("is_active", true)
    .order("Name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broadcast Email</h1>
        <p className="text-muted-foreground mt-2">Send announcements and updates to your team members</p>
      </div>

      <BroadcastEmailForm agents={agents || []} />
    </div>
  )
}
