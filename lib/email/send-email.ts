import { Resend } from "resend"

export interface EmailOptions {
  to: string
  subject: string
  body: string
  html?: string
  from?: string
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email Service] RESEND_API_KEY not configured")
    return false
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || "McKinney Realty Co <noreply@mckinneyrealtyco.com>",
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.html || options.body.replace(/\n/g, "<br>"),
    })

    if (error) {
      console.error("[Email Service] Failed to send email:", error)
      return false
    }

    console.log("[Email Service] Email sent successfully:", data?.id)
    return true
  } catch (error) {
    console.error("[Email Service] Error sending email:", error)
    return false
  }
}
