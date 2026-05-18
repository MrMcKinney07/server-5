"use client"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Module-level singleton — only one GoTrueClient instance per browser context
let _client: ReturnType<typeof createSupabaseClient> | null = null

function createBrowserClient(url: string, key: string) {
  if (!_client) {
    _client = createSupabaseClient(url, key)
  }
  return _client
}

export function hasSupabaseCredentials() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// A safe no-op stub that matches the Supabase client surface used across the app.
// Returned when env credentials are not yet configured so auth-js is never
// instantiated and never makes network requests.
function createNoOpClient() {
  const noop = () => Promise.resolve({ data: null, error: null })
  const noopSelect = () => ({
    eq: () => noopSelect(),
    neq: () => noopSelect(),
    in: () => noopSelect(),
    order: () => noopSelect(),
    limit: () => noopSelect(),
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    select: () => noopSelect(),
    insert: () => noopSelect(),
    update: () => noopSelect(),
    delete: () => noopSelect(),
    upsert: () => noopSelect(),
    gte: () => noopSelect(),
    lte: () => noopSelect(),
    ilike: () => noopSelect(),
    is: () => noopSelect(),
    contains: () => noopSelect(),
    not: () => noopSelect(),
    then: (resolve: (v: any) => any) => Promise.resolve({ data: null, error: null }).then(resolve),
  })

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
    },
    from: (_table: string) => noopSelect(),
    storage: {
      from: (_bucket: string) => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    removeChannel: () => {},
  } as unknown as ReturnType<typeof createSupabaseClient>
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return createNoOpClient()
  }

  return createBrowserClient(url, key)
}

export { createClient as createBrowserClient }
