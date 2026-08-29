import "server-only"
import Stripe from "stripe"

let stripeClient: Stripe | undefined

export function getStripe() {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) throw new Error("Stripe is not configured")
    stripeClient = new Stripe(secretKey)
  }
  return stripeClient
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET
}

export function getStripeProductPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid product price")
  return Math.round(price * 100)
}
