/**
 * SMS sending service placeholder.
 *
 * To integrate a real SMS provider:
 * 1. Install the provider SDK (e.g., twilio)
 * 2. Configure API credentials via environment variables
 * 3. Replace the placeholder implementation below
 *
 * Example providers:
 * - Twilio: https://www.twilio.com/docs/sms
 * - MessageBird: https://developers.messagebird.com
 * - Vonage: https://developer.vonage.com/messaging/sms
 */

export interface SmsOptions {
  to: string
  body: string
}

export async function sendSms(options: SmsOptions): Promise<boolean> {
  // PLACEHOLDER: Replace with actual SMS provider
  console.log("[SMS Service] Would send SMS:", {
    to: options.to,
    bodyPreview: options.body.substring(0, 50) + "...",
  })

  // Example Twilio implementation:
  // import twilio from 'twilio'
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  // await client.messages.create({
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: options.to,
  //   body: options.body,
  // })

  return true
}
