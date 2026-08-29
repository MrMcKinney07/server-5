import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const secret = getStripeWebhookSecret()
  if (!secret) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 })

  const signature = request.headers.get("stripe-signature")
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })

  try {
    const payload = await request.text()
    const event = getStripe().webhooks.constructEvent(payload, signature, secret)
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (orderId && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")) {
      if (session.payment_status === "paid") {
        const db = createServiceClient()
        await db.from("print_orders").update({ status: "paid" }).eq("id", orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[stripe-webhook] Invalid event:", error)
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
  }
}
