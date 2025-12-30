import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      contact_id,
      lead_id,
      transaction_type,
      property_address,
      sale_price,
      commission_rate,
      contract_date,
      closing_date,
      notes,
      agent_id,
    } = body

    // Calculate commissions
    const gross_commission = sale_price * (commission_rate / 100)

    // Insert transaction into database
    const { data: transaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        agent_id: agent_id || user.id,
        contact_id,
        lead_id: lead_id || null,
        transaction_type,
        property_address,
        sale_price,
        commission_rate,
        gross_commission,
        contract_date,
        closing_date: closing_date || null,
        notes,
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error inserting transaction:", insertError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    return NextResponse.json({
      transaction,
    })
  } catch (error) {
    console.error("[v0] Transaction creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
