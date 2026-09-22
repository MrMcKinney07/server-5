import { sendEmail } from "@/lib/email/send-email"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get("to") || "mrmckinney@mckinneyrealtyco.com"

    const result = await sendEmail({
      to: testEmail,
      subject: "Resend Domain Verification Test",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Resend Domain Verified!</h2>
          <p>This email was successfully sent to: <strong>${testEmail}</strong></p>
          <p>Your domain is now verified and you can send emails to any recipient.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: result,
      message: result
        ? `Test email sent successfully to ${testEmail}`
        : `Failed to send test email to ${testEmail}`,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
