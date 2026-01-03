import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    // Get current user to verify admin/broker role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is admin or broker
    const { data: currentAgent } = await supabase.from("agents").select("Role").eq("id", user.id).single()

    if (!currentAgent || !["admin", "broker"].includes(currentAgent.Role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get the agent to delete
    const { data: agentToDelete } = await supabase.from("agents").select("id, Email, Name").eq("id", params.id).single()

    if (!agentToDelete) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Create service client for auth operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Delete from agents table first
    const { error: deleteAgentError } = await serviceSupabase.from("agents").delete().eq("id", params.id)

    if (deleteAgentError) {
      console.error("[v0] Error deleting agent record:", deleteAgentError)
      return NextResponse.json({ error: "Failed to delete agent record" }, { status: 500 })
    }

    // Delete from auth.users
    const { error: deleteAuthError } = await serviceSupabase.auth.admin.deleteUser(params.id)

    if (deleteAuthError) {
      console.error("[v0] Error deleting auth user:", deleteAuthError)
      // Agent record is already deleted, so we continue
      return NextResponse.json(
        {
          success: true,
          message: "Agent record deleted, but auth user may still exist",
          warning: "Manual cleanup of auth user may be required",
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${agentToDelete.Name} from the system`,
    })
  } catch (error) {
    console.error("[v0] Error in agent deletion:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
