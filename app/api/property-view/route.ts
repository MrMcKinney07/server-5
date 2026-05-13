import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// API route to track when a lead views a property (called from shared link)
export async function POST(request: NextRequest) {
  try {
    const { lead_id, saved_property_id } = await request.json()

    if (!lead_id || !saved_property_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if view record exists
    const { data: existingView } = await supabase
      .from("property_views")
      .select("id, view_count")
      .eq("lead_id", lead_id)
      .eq("saved_property_id", saved_property_id)
      .single()

    if (existingView) {
      // Update existing view count
      await supabase
        .from("property_views")
        .update({
          view_count: (existingView.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq("id", existingView.id)
    } else {
      // Create new view record
      await supabase.from("property_views").insert({
        lead_id,
        saved_property_id,
        view_count: 1,
        last_viewed_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking property view:", error)
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
  }
}
