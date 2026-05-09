import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

// POST /api/admin/commission - create or update a commission plan and/or assign to agent
export async function POST(req: NextRequest) {
  try {
    // Server-side admin check — non-brokers get a 403
    const agent = await requireAdmin()
    const supabase = await createClient()
    const body = await req.json()
    const { action } = body

    if (action === "create_plan") {
      const { name, description, split_percentage, marketing_fund_threshold, monthly_fee, transaction_fee, is_default, is_active } = body
      const { data, error } = await supabase
        .from("commission_plans")
        .insert({
          name,
          description: description || null,
          split_percentage: Number(split_percentage),
          marketing_fund_threshold: Number(marketing_fund_threshold),
          monthly_fee: Number(monthly_fee),
          transaction_fee: Number(transaction_fee),
          is_default: !!is_default,
          is_active: is_active !== false,
        })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ plan: data })
    }

    if (action === "update_plan") {
      const { plan_id, name, description, split_percentage, marketing_fund_threshold, monthly_fee, transaction_fee, is_default, is_active } = body
      const { data, error } = await supabase
        .from("commission_plans")
        .update({
          name,
          description: description || null,
          split_percentage: Number(split_percentage),
          marketing_fund_threshold: Number(marketing_fund_threshold),
          monthly_fee: Number(monthly_fee),
          transaction_fee: Number(transaction_fee),
          is_default: !!is_default,
          is_active: is_active !== false,
        })
        .eq("id", plan_id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ plan: data })
    }

    if (action === "assign_plan") {
      const { agent_id, plan_id, effective_date, existing_agent_plan_id } = body

      if (existing_agent_plan_id) {
        const { error } = await supabase
          .from("agent_commission_plans")
          .update({ plan_id })
          .eq("id", existing_agent_plan_id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      } else {
        const { error } = await supabase.from("agent_commission_plans").insert({
          agent_id,
          plan_id,
          effective_date: effective_date || new Date().toISOString().split("T")[0],
          cap_progress: 0,
          ytd_gci: 0,
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === "assign_custom_plan") {
      const { agent_id, existing_agent_plan_id, split_percentage, marketing_fund_threshold, transaction_fee } = body
      const customPlanName = `Custom Plan - Agent ${agent_id.slice(0, 8)}`

      // Upsert a custom plan for this agent
      const { data: existingPlan } = await supabase
        .from("commission_plans")
        .select("id")
        .eq("name", customPlanName)
        .maybeSingle()

      let planId: string

      if (existingPlan) {
        await supabase
          .from("commission_plans")
          .update({
            split_percentage: Number(split_percentage),
            marketing_fund_threshold: Number(marketing_fund_threshold),
            transaction_fee: Number(transaction_fee),
          })
          .eq("id", existingPlan.id)
        planId = existingPlan.id
      } else {
        const { data: newPlan, error: planError } = await supabase
          .from("commission_plans")
          .insert({
            name: customPlanName,
            description: "Custom commission plan",
            split_percentage: Number(split_percentage),
            marketing_fund_threshold: Number(marketing_fund_threshold),
            transaction_fee: Number(transaction_fee),
            monthly_fee: 0,
            is_default: false,
            is_active: true,
          })
          .select()
          .single()

        if (planError) return NextResponse.json({ error: planError.message }, { status: 400 })
        planId = newPlan.id
      }

      if (existing_agent_plan_id) {
        await supabase
          .from("agent_commission_plans")
          .update({ plan_id: planId })
          .eq("id", existing_agent_plan_id)
      } else {
        await supabase.from("agent_commission_plans").insert({
          agent_id,
          plan_id: planId,
          effective_date: new Date().toISOString().split("T")[0],
          cap_progress: 0,
          ytd_gci: 0,
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err: any) {
    // requireAdmin throws a redirect for non-admins — catch it and return 403
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
