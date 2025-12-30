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
      sync_to_skyslope,
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

    let skyslope_synced = false

    // Sync to Skyslope if enabled and API key is available
    if (sync_to_skyslope && process.env.SKYSLOPE_API_KEY) {
      try {
        const skyslopeResponse = await fetch("https://api.skyslope.com/api/v2/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SKYSLOPE_API_KEY}`,
          },
          body: JSON.stringify({
            address: property_address,
            salePrice: sale_price,
            transactionType: transaction_type,
            contractDate: contract_date,
            closingDate: closing_date,
            status: "Active",
            // Add other Skyslope-specific fields as needed
          }),
        })

        if (skyslopeResponse.ok) {
          const skyslopeData = await skyslopeResponse.json()

          // Update transaction with Skyslope ID
          await supabase
            .from("transactions")
            .update({
              notes: `${notes}\n\nSkyslope ID: ${skyslopeData.id || "N/A"}`,
            })
            .eq("id", transaction.id)

          skyslope_synced = true
        } else {
          console.error("[v0] Skyslope sync failed:", await skyslopeResponse.text())
        }
      } catch (skyslopeError) {
        console.error("[v0] Skyslope sync error:", skyslopeError)
      }
    }

    return NextResponse.json({
      transaction,
      skyslope_synced,
    })
  } catch (error) {
    console.error("[v0] Transaction creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
