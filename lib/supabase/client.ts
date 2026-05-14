"use client"

import { createBrowserClient } from "@supabase/ssr"

export function hasSupabaseCredentials() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a minimal no-op client so callers don't crash, but no network
    // requests are ever made to a placeholder host.
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        // Disable automatic session refresh so auth-js never fires network calls
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: () => Promise.reject(new Error("Supabase credentials not configured")),
      },
    })
  }

  return createBrowserClient(url, key)
}

export { createClient as createBrowserClient }
