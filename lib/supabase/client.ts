import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("[v0] Supabase environment variables not set:", {
      url: supabaseUrl ? "SET" : "MISSING",
      key: supabaseKey ? "SET" : "MISSING",
    })
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  console.log("[v0] Creating Supabase client with URL:", supabaseUrl)

  return createSupabaseBrowserClient(supabaseUrl, supabaseKey)
}

export const createBrowserClient = createClient
