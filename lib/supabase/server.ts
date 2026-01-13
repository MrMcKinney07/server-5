import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

class SupabaseConfigError extends Error {
  constructor(missingVars: string[]) {
    super(`Supabase configuration error: Missing environment variables: ${missingVars.join(", ")}`)
    this.name = "SupabaseConfigError"
  }
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Strict validation - fail loudly if env vars are missing
  const missing: string[] = []
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  if (missing.length > 0) {
    throw new SupabaseConfigError(missing)
  }

  const cookieStore = await cookies()

  return createSupabaseServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing user sessions.
        }
      },
    },
  })
}

export { createClient as createServerClient }
export { SupabaseConfigError }
