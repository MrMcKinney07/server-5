"use client"

import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = "https://uycumplltmplglqzmdno.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3VtcGxsdG1wbGdscXptZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDg2NjEsImV4cCI6MjA4MDUyNDY2MX0.hCjBk6JiHaggrLtXP_sXiPZQLD-1OaP80KZT--tkWUs"

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export { createClient as createBrowserClient }
