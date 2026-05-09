import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Use a global to persist the singleton across hot reloads in development
const globalForSupabase = globalThis as typeof globalThis & {
  supabaseBrowserClient?: SupabaseClient
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    )
  }

  // Only reuse the cached instance if it was created with the same credentials
  if (globalForSupabase.supabaseBrowserClient) {
    return globalForSupabase.supabaseBrowserClient
  }

  globalForSupabase.supabaseBrowserClient = createSupabaseBrowserClient(url, key)

  return globalForSupabase.supabaseBrowserClient
}

export const createBrowserClient = createClient
