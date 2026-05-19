import { createClient, createServiceClient, hasSupabaseCredentials } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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

export async function isDatabaseSetup(): Promise<boolean> {
  const hasCreds = hasSupabaseCredentials()
  console.log("[v0] isDatabaseSetup — hasCreds:", hasCreds)
  if (!hasCreds) return false
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from("agents").select("id").limit(1)
    console.log("[v0] isDatabaseSetup — db error:", error?.code, error?.message)
    return !error || error.code !== "PGRST205"
  } catch (e) {
    console.log("[v0] isDatabaseSetup — caught:", e)
    return false
  }
}

/**
 * Get the current authenticated agent from Supabase
 * Returns null if not authenticated or agent not found
 */
export async function getCurrentAgent(): Promise<CurrentAgent | null> {
  if (!hasSupabaseCredentials()) return null
  let authClient: Awaited<ReturnType<typeof createClient>>
  let db: ReturnType<typeof createServiceClient>
  try {
    authClient = await createClient()
    db = createServiceClient()
  } catch (e) {
    console.log("[v0] getCurrentAgent — createClient error:", e)
    return null
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser()

  console.log("[v0] getCurrentAgent — user:", user?.id, "authError:", authError?.message)

  if (authError || !user) {
    return null
  }

  const { data: agent, error: agentError } = await db
    .from("agents")
    .select("*, exp_season, exp_bank, lifetime_xp, prestige_tier, prestige_icon_url")
    .eq("id", user.id)
    .maybeSingle()

  if (agentError) {
    // If table doesn't exist, return null gracefully
    if (agentError.code === "PGRST205") {
      return null
    }
    return null
  }

  if (!agent) {
    // Use role from user metadata if available (set during signup for admins/brokers)
    // Otherwise default to "agent"
    const userRole = (user.user_metadata?.role as string) || "agent"

    const { data: newAgent, error: insertError } = await db
      .from("agents")
      .insert({
        id: user.id,
        Email: user.email || "",
        Name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        Phone: "",
        Role: userRole,
        exp_season: 0,
        exp_bank: 0,
        lifetime_xp: 0,
        prestige_tier: 1,
        prestige_icon_url: null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: existingAgent } = await db
          .from("agents")
          .select("*, exp_season, exp_bank, lifetime_xp, prestige_tier, prestige_icon_url")
          .eq("id", user.id)
          .single()

        if (existingAgent) {
          return {
            ...existingAgent,
            email: existingAgent.Email,
            full_name: existingAgent.Name,
            phone: existingAgent.Phone,
            role: existingAgent.Role,
            Role: existingAgent.Role,
            user_id: user.id,
            team_id: existingAgent.team_id || null,
            exp_season: existingAgent.exp_season || 0,
            exp_bank: existingAgent.exp_bank || 0,
            lifetime_xp: existingAgent.lifetime_xp || 0,
            prestige_tier: existingAgent.prestige_tier || 1,
            prestige_icon_url: existingAgent.prestige_icon_url || null,
          } as CurrentAgent
        }
      }
      return null
    }

    if (!newAgent) {
      return null
    }

    return {
      ...newAgent,
      email: newAgent.Email,
      full_name: newAgent.Name,
      phone: newAgent.Phone,
      role: newAgent.Role,
      Role: newAgent.Role,
      user_id: user.id,
      team_id: null,
      exp_season: newAgent.exp_season,
      exp_bank: newAgent.exp_bank,
      lifetime_xp: newAgent.lifetime_xp,
      prestige_tier: newAgent.prestige_tier,
      prestige_icon_url: newAgent.prestige_icon_url,
    } as CurrentAgent
  }

  return {
    ...agent,
    email: agent.Email,
    full_name: agent.Name,
    phone: agent.Phone,
    role: agent.Role,
    Role: agent.Role,
    user_id: user.id,
    team_id: agent.team_id || null,
    exp_season: agent.exp_season || 0,
    exp_bank: agent.exp_bank || 0,
    lifetime_xp: agent.lifetime_xp || 0,
    prestige_tier: agent.prestige_tier || 1,
    prestige_icon_url: agent.prestige_icon_url || null,
  } as CurrentAgent
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth(): Promise<CurrentAgent> {
  const agent = await getCurrentAgent()

  if (!agent) {
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
    redirect("/dashboard")
  }

  return agent
}
