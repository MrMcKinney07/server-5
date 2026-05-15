import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send-email"

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Normalize payload from Calendly, Cal.com, or generic POST
function parseBookingPayload(body: any) {
  // Calendly v2
  if (body?.event === "invitee.created" || body?.payload?.invitee) {
    const invitee = body.payload?.invitee || {}
    const event   = body.payload?.scheduled_event || {}
    return {
      guestName:  invitee.name || "Someone",
      guestEmail: invitee.email || null,
      eventName:  event.name || "Appointment",
      startTime:  event.start_time || null,
      agentId:    body.payload?.tracking?.utm_content || null, // agent id passed via utm_content
    }
  }

  // Cal.com
  if (body?.triggerEvent === "BOOKING_CREATED" || body?.type === "BOOKING_CREATED") {
    const attendees = body.payload?.attendees || []
    const guest = attendees.find((a: any) => !a.organizer) || attendees[0] || {}
    return {
      guestName:  guest.name || "Someone",
      guestEmail: guest.email || null,
      eventName:  body.payload?.title || "Appointment",
      startTime:  body.payload?.startTime || null,
      agentId:    body.payload?.metadata?.agentId || null,
    }
  }

  // Generic / custom: { agent_id, guest_name, guest_email, event_name, start_time }
  return {
    guestName:  body.guest_name || body.guestName || "Someone",
    guestEmail: body.guest_email || body.guestEmail || null,
    eventName:  body.event_name || body.eventName || "Appointment",
    startTime:  body.start_time || body.startTime || null,
    agentId:    body.agent_id   || body.agentId   || null,
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { guestName, guestEmail, eventName, startTime, agentId } = parseBookingPayload(body)

    if (!agentId) {
      return NextResponse.json({ error: "No agent_id provided in payload" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Look up agent
    const { data: agent, error: agentErr } = await supabase
      .from("agents")
      .select("id, Name, Email, appointment_link")
      .eq("id", agentId)
      .single()

    if (agentErr || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Format start time nicely
    const formattedTime = startTime
      ? new Date(startTime).toLocaleString("en-US", {
          timeZone: "America/Chicago",
          weekday: "long",
          month:   "long",
          day:     "numeric",
          year:    "numeric",
          hour:    "numeric",
          minute:  "2-digit",
          hour12:  true,
        })
      : "TBD"

    const notifTitle   = "New Appointment Booked!"
    const notifMessage = `${guestName} booked "${eventName}" for ${formattedTime}`

    // 1. Persist notification
    await supabase.from("agent_notifications").insert({
      agent_id: agent.id,
      type:     "appointment",
      title:    notifTitle,
      message:  notifMessage,
      read:     false,
      metadata: { guestName, guestEmail, eventName, startTime, formattedTime },
    })

    // 2. Email the agent — congratulations with confetti styling
    if (agent.Email) {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); padding: 40px 32px 32px; text-align: center; }
    .confetti { font-size: 40px; display: block; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
    .header p  { color: #93c5fd; font-size: 14px; margin: 0; }
    .body { padding: 32px; }
    .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .card .label { font-size: 11px; font-weight: 600; color: #16a34a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .card .value { font-size: 16px; font-weight: 600; color: #111827; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 500; color: #111827; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .badge { display: inline-block; background: #fef9c3; color: #854d0e; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 4px 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="confetti">🎊</span>
      <h1>Congratulations, ${agent.Name}!</h1>
      <p>You have a new appointment booked</p>
    </div>
    <div class="body">
      <div class="card">
        <div class="label">Appointment</div>
        <div class="value">${eventName}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Client Name</span>
        <span class="detail-value">${guestName}</span>
      </div>
      ${guestEmail ? `
      <div class="detail-row">
        <span class="detail-label">Client Email</span>
        <span class="detail-value">${guestEmail}</span>
      </div>` : ""}
      <div class="detail-row">
        <span class="detail-label">Date &amp; Time</span>
        <span class="detail-value">${formattedTime}</span>
      </div>
      <div class="badge">McKinney Realty Co. — Keep up the great work!</div>
    </div>
    <div class="footer">
      This notification was sent to ${agent.Email} &mdash; McKinney Realty Co.
    </div>
  </div>
</body>
</html>`

      await sendEmail({
        to:      agent.Email,
        subject: `Congratulations! New appointment booked — ${guestName}`,
        body:    `Congratulations ${agent.Name}! ${guestName} just booked "${eventName}" for ${formattedTime}.`,
        html,
        from:    "McKinney Realty Co <noreply@mckinneyrealtyco.com>",
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Appointment Webhook]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
