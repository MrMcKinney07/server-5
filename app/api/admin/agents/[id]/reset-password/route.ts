import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { id } = params

    // Get agent's email
    const { data: agent } = await supabase.from("agents").select("Email").eq("id", id).single()

    if (!agent?.Email) {
      return NextResponse.json({ error: "Agent email not found" }, { status: 404 })
    }

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(agent.Email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/reset-password`,
    })

    if (error) {
      console.error("Error sending password reset:", error)
      return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password reset email sent successfully" })
  } catch (error) {
    console.error("Error in password reset:", error)
    return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 })
  }
}
