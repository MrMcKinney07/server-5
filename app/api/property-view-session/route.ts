import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { propertyId, sessionId, action, duration } = await request.json()

    if (action === "start") {
      // Get the saved property details
      const { data: property } = await supabase
        .from("saved_properties")
        .select("id, lead_id")
        .eq("id", propertyId)
        .single()

      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 })
      }

      // Get or create property_view record
      const { data: existingView } = await supabase
        .from("property_views")
        .select("id")
        .eq("lead_id", property.lead_id)
        .eq("saved_property_id", property.id)
        .single()

      let viewId = existingView?.id

      if (!viewId) {
        const { data: newView } = await supabase
          .from("property_views")
          .insert({
            lead_id: property.lead_id,
            saved_property_id: property.id,
            view_count: 0,
          })
          .select("id")
          .single()

        viewId = newView?.id
      }

      // Create a new session
      const { data: session } = await supabase
        .from("property_view_sessions")
        .insert({
          property_view_id: viewId,
          lead_id: property.lead_id,
          saved_property_id: property.id,
          user_agent: request.headers.get("user-agent") || undefined,
        })
        .select("id")
        .single()

      return NextResponse.json({ sessionId: session?.id })
    } else if (action === "end" && sessionId && duration) {
      // Update session with end time and duration
      await supabase
        .from("property_view_sessions")
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq("id", sessionId)

      // Get the session to find the property_view_id
      const { data: session } = await supabase
        .from("property_view_sessions")
        .select("property_view_id, saved_property_id")
        .eq("id", sessionId)
        .single()

      if (session) {
        // Calculate total and average duration
        const { data: allSessions } = await supabase
          .from("property_view_sessions")
          .select("duration_seconds")
          .eq("property_view_id", session.property_view_id)
          .not("duration_seconds", "is", null)

        const totalDuration = allSessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0
        const avgDuration = allSessions && allSessions.length > 0 ? Math.floor(totalDuration / allSessions.length) : 0

        // Update property_views with aggregated data
        await supabase
          .from("property_views")
          .update({
            view_count: allSessions?.length || 0,
            total_duration_seconds: totalDuration,
            average_duration_seconds: avgDuration,
            last_session_duration_seconds: duration,
            last_viewed_at: new Date().toISOString(),
          })
          .eq("id", session.property_view_id)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Property view session error:", error)
    return NextResponse.json({ error: "Failed to track session" }, { status: 500 })
  }
}
