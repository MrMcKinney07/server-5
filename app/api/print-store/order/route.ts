import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentAgent, requireAdmin } from "@/lib/auth"
import { put } from "@vercel/blob"
import { uploadFileTo4over, submit4overOrder, has4overCredentials } from "@/lib/4over/client"
import { getStripe, getStripeProductPrice } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const agent = await getCurrentAgent()
    if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()

    const templateId = formData.get("template_id") as string
    const quantity = parseInt(formData.get("quantity") as string) || 1
    const clientTotalPrice = parseFloat(formData.get("total_price") as string) || 0
    const customization = JSON.parse((formData.get("customization") as string) || "{}")
    const shippingAddress = JSON.parse((formData.get("shipping_address") as string) || "{}")
    const previewImageFile = formData.get("preview_image") as File | null

    if (!templateId) return NextResponse.json({ error: "Missing template_id" }, { status: 400 })
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    const db = createServiceClient()

    // Fetch template for 4over UUIDs
    const { data: template } = await db
      .from("print_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const quantityOption = Array.isArray(template.quantity_options)
      ? template.quantity_options.find((option: { qty: number }) => option.qty === quantity)
      : null
    const unitPrice = Number(quantityOption?.price ?? template.price)
    const totalPrice = unitPrice
    if (!Number.isFinite(totalPrice) || totalPrice <= 0 || (clientTotalPrice > 0 && Math.abs(clientTotalPrice - totalPrice) > 0.01)) {
      return NextResponse.json({ error: "Price or quantity does not match this product" }, { status: 400 })
    }

    // Upload customized preview to Blob
    let previewUrl = ""
    if (previewImageFile) {
      const blob = await put(
        `print-orders/${agent.id}/${Date.now()}-preview.png`,
        previewImageFile,
        { access: "public" }
      )
      previewUrl = blob.url
    }

    // Save order to DB first (always)
    const { data: order, error: orderError } = await db
      .from("print_orders")
      .insert({
        agent_id: agent.id,
        template_id: templateId,
        customization: { ...customization, preview_url: previewUrl },
        quantity,
        total_price: totalPrice,
        status: "pending",
        shipping_address: shippingAddress,
      })
      .select()
      .single()

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

    const origin = request.headers.get("origin") || new URL(request.url).origin
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `${template.name} — ${quantity.toLocaleString()} units` },
          unit_amount: getStripeProductPrice(totalPrice),
        },
        quantity: 1,
      }],
      customer_email: shippingAddress.email || agent.Email || undefined,
      metadata: { order_id: order.id, template_id: templateId, agent_id: agent.id },
      success_url: `${origin}/dashboard/marketing?checkout=success`,
      cancel_url: `${origin}/dashboard/marketing?checkout=cancelled`,
      integration_identifier: `marketing_store_${Math.random().toString(36).slice(2, 10)}`,
    })

    return NextResponse.json({ order, checkoutUrl: session.url })

    // Submit to 4over if credentials are configured and template has UUIDs
    if (
      has4overCredentials() &&
      template.fourover_product_uuid &&
      template.fourover_runsize_uuid &&
      template.fourover_turnaround_uuid &&
      template.fourover_colorspec_uuid &&
      previewImageFile
    ) {
      try {
        const fileBuffer = await previewImageFile.arrayBuffer()
        const { file_uuid } = await uploadFileTo4over({
          fileBuffer,
          filename: `order-${order.id}.png`,
          contentType: "image/png",
        })

        const { order_id, status } = await submit4overOrder({
          product_uuid: template.fourover_product_uuid,
          runsize_uuid: template.fourover_runsize_uuid,
          turnaround_uuid: template.fourover_turnaround_uuid,
          colorspec_uuid: template.fourover_colorspec_uuid,
          file_uuid,
          quantity,
          shipping: {
            name: shippingAddress.name || agent.Name || "",
            address1: shippingAddress.address1 || shippingAddress.address || "",
            address2: shippingAddress.address2 || "",
            city: shippingAddress.city || "",
            state: shippingAddress.state || "",
            zip: shippingAddress.zip || "",
            phone: shippingAddress.phone || agent.Phone || "",
            email: shippingAddress.email || agent.Email || "",
          },
          reference: order.id,
        })

        // Update order with 4over ID
        await db
          .from("print_orders")
          .update({ fourover_order_id: order_id, status: "submitted" })
          .eq("id", order.id)

        return NextResponse.json({ order: { ...order, fourover_order_id: order_id, status: "submitted" } })
      } catch (fouroverErr: any) {
        // 4over failed — order stays pending for manual fulfillment
        console.error("[print-store] 4over submission failed:", fouroverErr?.message)
        return NextResponse.json({
          order,
          warning: "Order saved but 4over submission failed. Admin will process manually.",
        })
      }
    }

    return NextResponse.json({ order })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Order failed" }, { status: 500 })
  }
}

// Admin: list all orders
export async function GET() {
  try {
    await requireAdmin()
    const db = createServiceClient()
    const { data, error } = await db
      .from("print_orders")
      .select("*, agent:agents(id, Name, Email), template:print_templates(id, name, category)")
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ orders: data || [] })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}
