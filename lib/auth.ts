import { createClient, SupabaseConfigError } from "@/lib/supabase/server"
import type { Agent } from "@/lib/types/database"

export interface CurrentAgent extends Agent {
  user_id: string
  Role: string
  team_id: string | null
  exp_season: number
  exp_bank: number
  lifetime_xp: number
  prestige_tier: number
  prestige_icon_url: string | null
}

export { SupabaseConfigError }

export async function isDatabaseSetup(): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("agents").select("id").limit(1)
  // PGRST205 means table doesn't exist
  return !error || error.code !== "PGRST205"
}

/**
 * Get the current authenticated agent from Supabase
 * Returns null if not authenticated or agent not found
 * Throws SupabaseConfigError if env vars are missing
 */
export async function getCurrentAgent(): Promise<CurrentAgent | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Defensive guard for auth/session nullability (expected case)
  if (authError || !user) {
    return null
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*, exp_season, exp_bank, lifetime_xp, prestige_tier, prestige_icon_url")
    .eq("id", user.id)
    .maybeSingle()

  if (agentError) {
    // If table doesn't exist, return null gracefully
    if (agentError.code === "PGRST205") {
      return null
    }
    console.error("Agent query error:", agentError)
    return null
  }

  // Defensive guard for data nullability (user exists but no agent record)
  if (!agent) {
    const { data: newAgent, error: insertError } = await supabase
      .from("agents")
      .insert({
        id: user.id,
        Email: user.email || "",
        Name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        Phone: "",
        Role: "agent",
        exp_season: 0,
        exp_bank: 0,
        lifetime_xp: 0,
        prestige_tier: 1,
        prestige_icon_url: null,
      })
      .select()
      .single()

    if (insertError || !newAgent) {
      console.error("Failed to create new agent:", insertError)
      return null
    }

    return {
      id: newAgent.id,
      created_at: newAgent.created_at,
      email: newAgent.Email,
      full_name: newAgent.Name,
      phone: newAgent.Phone,
      role: newAgent.Role,
      Role: newAgent.Role,
      user_id: user.id,
      team_id: null,
      exp_season: newAgent.exp_season ?? 0,
      exp_bank: newAgent.exp_bank ?? 0,
      lifetime_xp: newAgent.lifetime_xp ?? 0,
      prestige_tier: newAgent.prestige_tier ?? 1,
      prestige_icon_url: newAgent.prestige_icon_url ?? null,
    } as CurrentAgent
  }

  return {
    id: agent.id,
    created_at: agent.created_at,
    email: agent.Email,
    full_name: agent.Name,
    phone: agent.Phone,
    role: agent.Role,
    Role: agent.Role,
    user_id: user.id,
    team_id: agent.team_id || null,
    exp_season: agent.exp_season ?? 0,
    exp_bank: agent.exp_bank ?? 0,
    lifetime_xp: agent.lifetime_xp ?? 0,
    prestige_tier: agent.prestige_tier ?? 1,
    prestige_icon_url: agent.prestige_icon_url ?? null,
  } as CurrentAgent
}

/**
 * Require authentication - throws redirect if not authenticated
 * Throws SupabaseConfigError if env vars are missing
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
 * Throws SupabaseConfigError if env vars are missing
 */
export async function requireAdmin(): Promise<CurrentAgent> {
  const agent = await requireAuth()

  if (agent.role !== "admin" && agent.role !== "broker") {
    const { redirect } = await import("next/navigation")
    redirect("/dashboard")
  }

  return agent
}
