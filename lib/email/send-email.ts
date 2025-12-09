/**
 * Email sending service placeholder.
 *
 * To integrate a real email provider:
 * 1. Install the provider SDK (e.g., @sendgrid/mail, resend, nodemailer)
 * 2. Configure API key via environment variable
 * 3. Replace the placeholder implementation below
 *
 * Example providers:
 * - Resend: https://resend.com/docs
 * - SendGrid: https://docs.sendgrid.com
 * - AWS SES: https://docs.aws.amazon.com/ses
 */

export interface EmailOptions {
  to: string
  subject: string
  body: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // PLACEHOLDER: Replace with actual email provider
  console.log("[Email Service] Would send email:", {
    to: options.to,
    subject: options.subject,
    bodyPreview: options.body.substring(0, 100) + "...",
  })

  // Example Resend implementation:
  // import { Resend } from 'resend'
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'McKinney One <noreply@mckinneyone.com>',
  //   to: options.to,
  //   subject: options.subject,
  //   text: options.body,
  //   html: options.html,
  // })

  return true
}
