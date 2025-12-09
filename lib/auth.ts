import { createClient } from "@/lib/supabase/server"
import type { Agent } from "@/lib/types/database"

export interface CurrentAgent extends Agent {
  user_id: string
}

export async function isDatabaseSetup(): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("agents").select("id").limit(1)
  // PGRST205 means table doesn't exist
  return !error || error.code !== "PGRST205"
}

/**
 * Get the current authenticated agent from Supabase
 * Returns null if not authenticated or agent not found
 */
export async function getCurrentAgent(): Promise<CurrentAgent | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: agent, error: agentError } = await supabase.from("agents").select("*").eq("id", user.id).maybeSingle()

  if (agentError) {
    // If table doesn't exist, return null gracefully
    if (agentError.code === "PGRST205") {
      return null
    }
    console.log("[v0] Agent query error:", agentError)
    return null
  }

  if (!agent) {
    const { data: newAgent, error: insertError } = await supabase
      .from("agents")
      .insert({
        id: user.id,
        Email: user.email || "",
        Name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        Phone: "",
        Role: "agent",
      })
      .select()
      .single()

    if (insertError || !newAgent) {
      console.log("[v0] Agent insert error:", insertError)
      return null
    }

    return {
      id: newAgent.id,
      created_at: newAgent.created_at,
      email: newAgent.Email,
      full_name: newAgent.Name,
      phone: newAgent.Phone,
      role: newAgent.Role,
      user_id: user.id,
    } as CurrentAgent
  }

  return {
    id: agent.id,
    created_at: agent.created_at,
    email: agent.Email,
    full_name: agent.Name,
    phone: agent.Phone,
    role: agent.Role,
    user_id: user.id,
  } as CurrentAgent
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth(): Promise<CurrentAgent> {
  const agent = await getCurrentAgent()

  if (!agent) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  return agent
}

/**
 * Require admin role - throws redirect if not admin
 */
export async function requireAdmin(): Promise<CurrentAgent> {
  const agent = await requireAuth()

  if (agent.role !== "admin" && agent.role !== "broker") {
    const { redirect } = await import("next/navigation")
    redirect("/dashboard")
  }

  return agent
}
