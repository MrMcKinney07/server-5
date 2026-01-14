import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const {
      fullName,
      email,
      phone,
      role,
      password,
      licenseNumber,
      licenseExpiry,
      startDate,
      teamId,
      commissionPlanId,
      address,
      city,
      state,
      zip,
      emergencyContactName,
      emergencyContactPhone,
      bio,
    } = await request.json()

    // Validate inputs
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: existingAgent } = await serviceSupabase
      .from("agents")
      .select("id, Name, Email, Role, is_active, created_at")
      .ilike("Email", email)
      .maybeSingle()

    const { data: existingAuthUsers } = await serviceSupabase.auth.admin.listUsers()
    const existingAuthUser = existingAuthUsers?.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())

    // Only error if BOTH agent record AND auth user exist (true duplicate)
    if (existingAgent && existingAuthUser) {
      return NextResponse.json(
        {
          error: "An agent with this email address already exists in the database.",
          details: {
            name: existingAgent.Name,
            email: existingAgent.Email,
            role: existingAgent.Role,
            isActive: existingAgent.is_active,
            createdAt: existingAgent.created_at,
          },
        },
        { status: 409 },
      )
    }

    // If only agent exists but no auth user (shouldn't happen but handle it)
    if (existingAgent && !existingAuthUser) {
      console.log("[v0] Found orphaned agent record without auth user, will create auth account")
    }

    let authUserId: string

    if (existingAuthUser) {
      console.log("[v0] Found existing auth user without agent record, promoting to agent")
      authUserId = existingAuthUser.id

      // Update their password to the new one provided
      await serviceSupabase.auth.admin.updateUserById(authUserId, {
        password,
        user_metadata: {
          full_name: fullName,
        },
      })
    } else {
      console.log("[v0] No existing auth user found, creating new account")

      const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      })

      if (authError) {
        console.error("Error creating auth user:", authError)
        return NextResponse.json({ error: authError.message || "Failed to create user account" }, { status: 400 })
      }

      authUserId = authData.user.id
    }

    try {
      let finalCommissionPlanId = commissionPlanId && commissionPlanId !== "default" ? commissionPlanId : null
      if (!finalCommissionPlanId) {
        const { data: defaultPlan } = await serviceSupabase
          .from("commission_plans")
          .select("id")
          .eq("is_default", true)
          .single()

        if (defaultPlan) {
          finalCommissionPlanId = defaultPlan.id
        }
      }

      const { data: agent, error: agentError } = await serviceSupabase
        .from("agents")
        .insert({
          id: authUserId,
          Name: fullName,
          Email: email,
          Phone: phone || null,
          Role: role || "agent",
          is_active: true,
          created_at: new Date().toISOString(),
          license_number: licenseNumber || null,
          license_expiry: licenseExpiry || null,
          start_date: startDate || new Date().toISOString().split("T")[0],
          team_id: teamId && teamId !== "none" ? teamId : null,
          commission_plan_id: finalCommissionPlanId,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          bio: bio || null,
        })
        .select()
        .single()

      if (agentError) {
        console.error("Error creating agent:", agentError)
        if (!existingAuthUser) {
          await serviceSupabase.auth.admin.deleteUser(authUserId)
        }
        return NextResponse.json({ error: "Failed to create agent record. Please try again." }, { status: 500 })
      }

      if (finalCommissionPlanId) {
        await serviceSupabase.from("agent_commission_plans").insert({
          agent_id: authUserId,
          plan_id: finalCommissionPlanId,
          effective_date: startDate || new Date().toISOString().split("T")[0],
        })
      }

      const currentMonthYear = new Date().toISOString().slice(0, 7) // Format: YYYY-MM
      await serviceSupabase.from("monthly_agent_stats").insert({
        agent_id: authUserId,
        month_year: currentMonthYear,
        total_xp_earned: 0,
        missions_completed: 0,
        rank: 999, // Temporary rank, will be recalculated on next rebuild
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .credentials { background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; }
              .credential-item { margin: 15px 0; }
              .credential-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              .credential-value { font-size: 16px; color: #111827; margin-top: 5px; font-family: 'Courier New', monospace; }
              .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Welcome to M1 Command Center!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ${existingAuthUser ? "agent" : ""} account has been ${existingAuthUser ? "activated" : "created"}</p>
              </div>
              <div class="content">
                <p>Hi ${fullName},</p>
                <p>Welcome to the McKinney Realty team! Your M1 Command Center ${existingAuthUser ? "agent access has been activated" : "account has been set up"} and is ready to use.</p>
                
                <div class="credentials">
                  <h3 style="margin-top: 0; color: #111827;">Your Login Credentials</h3>
                  <div class="credential-item">
                    <div class="credential-label">Email</div>
                    <div class="credential-value">${email}</div>
                  </div>
                  <div class="credential-item">
                    <div class="credential-label">${existingAuthUser ? "New Password" : "Temporary Password"}</div>
                    <div class="credential-value">${password}</div>
                  </div>
                </div>

                ${
                  startDate
                    ? `
                <div class="info-box">
                  <strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                `
                    : ""
                }

                <div class="warning">
                  <strong>⚠️ Important:</strong> ${existingAuthUser ? "Your password has been updated." : "Please change your password after your first login for security purposes."}
                </div>

                <div style="text-align: center;">
                  <a href="${appUrl}/auth/login" class="button">Sign In Now</a>
                </div>

                <p style="margin-top: 30px;"><strong>What's Next?</strong></p>
                <ul style="line-height: 2;">
                  <li>Sign in to your account</li>
                  <li>Complete your profile setup</li>
                  <li>Upload your profile picture</li>
                  <li>Review your mission dashboard</li>
                  <li>Start earning XP and climbing the leaderboard</li>
                </ul>

                <p>If you have any questions or need assistance, please don't hesitate to reach out to your team leader or admin.</p>

                <p style="margin-top: 30px;">Welcome aboard!</p>
                <p><strong>The McKinney Realty Team</strong></p>
              </div>
              <div class="footer">
                <p>McKinney Realty Co. © ${new Date().getFullYear()}</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `

      sendEmail({
        to: email,
        subject: `Welcome to M1 Command Center - Your ${existingAuthUser ? "Agent Access is" : "Account is"} Ready!`,
        body: `Welcome to M1 Command Center!\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nSign in at: ${appUrl}/auth/login\n\n${existingAuthUser ? "Your password has been updated." : "Please change your password after your first login."}`,
        html: emailHtml,
      })
        .then(() => {
          console.log("[v0] Welcome email sent successfully to", email)
        })
        .catch((emailError) => {
          console.error("[v0] Failed to send welcome email (agent creation succeeded):", emailError)
          // Silently fail - agent creation was successful
        })

      return NextResponse.json({
        success: true,
        agent,
        message: `Agent account ${existingAuthUser ? "activated" : "created"} successfully`,
      })
    } catch (innerError) {
      console.error("Error during agent creation:", innerError)
      if (!existingAuthUser) {
        await serviceSupabase.auth.admin.deleteUser(authUserId)
      }
      throw innerError
    }
  } catch (error) {
    console.error("Error in create agent route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
