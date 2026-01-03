import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const { agentId, newPassword } = await request.json()

    // Create service client with admin privileges
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

    // Get the agent details
    const { data: agent, error: agentError } = await serviceSupabase
      .from("agents")
      .select("*, id as agent_id")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Update the password in Supabase Auth
    const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(agent.id, { password: newPassword })

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
    }

    // Send password reset email
    try {
      await sendEmail({
        to: agent.Email,
        subject: "Your Password Has Been Reset",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Password Reset Confirmation</h2>
            <p>Hi ${agent.Name},</p>
            <p>Your password has been reset by an administrator.</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>New Temporary Password:</strong></p>
              <p style="font-family: monospace; font-size: 18px; color: #0f172a; margin: 10px 0;">${newPassword}</p>
            </div>
            <p>Please sign in and change your password immediately.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Sign In Now
            </a>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              If you didn't request this password reset, please contact your administrator immediately.
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("[v0] Email sending failed (non-blocking):", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("[v0] Error in password reset:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
