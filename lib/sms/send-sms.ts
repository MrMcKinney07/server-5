import twilio from "twilio"

export interface SmsOptions {
  to: string
  body: string
}

export async function sendSms(options: SmsOptions): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.error("[SMS Service] Twilio credentials not configured")
    return false
  }

  try {
    const client = twilio(accountSid, authToken)

    // Format phone number to E.164 if needed
    let toNumber = options.to.replace(/\D/g, "")
    if (toNumber.length === 10) {
      toNumber = `+1${toNumber}`
    } else if (!toNumber.startsWith("+")) {
      toNumber = `+${toNumber}`
    }

    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: options.body,
    })

    console.log("[SMS Service] SMS sent successfully:", message.sid)
    return true
  } catch (error) {
    console.error("[SMS Service] Error sending SMS:", error)
    return false
  }
}
