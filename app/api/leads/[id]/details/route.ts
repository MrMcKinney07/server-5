import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key")
  return apiKey === process.env.ZAPIER_API_KEY
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized. Provide x-api-key header or api_key query param." }, { status: 401 })
  }

  try {
    const { id } = await params

    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .select("id, first_name, last_name, phone, email, source, status, assigned_agent_id, assigned_at, raw_payload, created_at, contact_id")
      .eq("id", id)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Get assigned agent name
    let assignedRepName: string | null = null
    if (lead.assigned_agent_id) {
      const { data: agent } = await supabaseAdmin
        .from("agents")
        .select("full_name")
        .eq("id", lead.assigned_agent_id)
        .single()
      assignedRepName = agent?.full_name || null
    }

    const payload = (lead.raw_payload as Record<string, unknown>) || {}

    return NextResponse.json({
      leadId: lead.id,
      dealSize: payload.deal_size || null,
      buyerName: `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || null,
      propertyAddress: payload.property_address || null,
      leadSource: lead.source,
      status: lead.status,
      phone: lead.phone || null,
      email: lead.email || null,
      assignedRepId: lead.assigned_agent_id,
      assignedRepName,
      assignedAt: lead.assigned_at,
      createdAt: lead.created_at,
    })
  } catch (error) {
    console.error("Error in lead details endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
