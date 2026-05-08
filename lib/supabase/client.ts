import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Use a global to persist the singleton across hot reloads in development
const globalForSupabase = globalThis as typeof globalThis & {
  supabaseBrowserClient?: SupabaseClient
}

export function createClient() {
  if (globalForSupabase.supabaseBrowserClient) {
    return globalForSupabase.supabaseBrowserClient
  }

  globalForSupabase.supabaseBrowserClient = createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return globalForSupabase.supabaseBrowserClient
}

export const createBrowserClient = createClient
