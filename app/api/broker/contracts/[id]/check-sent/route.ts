import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { grantXP } from "@/lib/xp-service"
import { NextResponse } from "next/server"

const CLOSE_XP = 15

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const agent = await requireAuth()
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isBroker = agent.Role === "admin" || agent.Role === "broker"
  if (!isBroker) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id: contractId } = await params

  // Fetch the full contract so we can compute commission and create the transaction record
  const { data: contract, error: fetchError } = await supabase
    .from("executed_contracts")
    .select("*")
    .eq("id", contractId)
    .single()

  if (fetchError || !contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 })

  // Mark payment as sent
  const { error } = await supabase
    .from("executed_contracts")
    .update({ payment_status: "sent" })
    .eq("id", contractId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute gross commission from stored sale_price + commission fields
  let grossCommission: number | null = null
  if (contract.sale_price && contract.commission_value) {
    if (contract.commission_type === "percent") {
      grossCommission = (contract.sale_price * contract.commission_value) / 100
    } else {
      grossCommission = contract.commission_value
    }
  }

  // Create a transactions record for reporting / history
  const serviceClient = createServiceClient()
  await serviceClient.from("transactions").insert({
    agent_id: contract.agent_id,
    transaction_type: contract.transaction_type,
    property_address: contract.property_address,
    sale_price: contract.sale_price ?? null,
    commission_rate: contract.commission_type === "percent" ? contract.commission_value : null,
    gross_commission: grossCommission,
    contract_date: contract.contract_date,
    closing_date: contract.expected_closing_date ?? null,
    status: "closed",
    notes: contract.notes ?? null,
  })

  // Award 15 XP to the agent for closing
  await grantXP(contract.agent_id, CLOSE_XP, "Contract closed — check sent", "CONTRACT")

  return NextResponse.json({ success: true })
}
