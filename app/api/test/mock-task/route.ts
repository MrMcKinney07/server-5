import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Grab the agent's first lead to attach the task to
  const { data: lead } = await supabase
    .from("leads")
    .select("id, first_name, last_name")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!lead) {
    return NextResponse.json({ error: "No leads found. Create a lead first so the task can be attached to one." }, { status: 404 })
  }

  // Due today at noon local time (stored as UTC)
  const now = new Date()
  const dueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString()

  const { data: task, error } = await supabase
    .from("activities")
    .insert({
      agent_id: user.id,
      lead_id: lead.id,
      activity_type: "follow_up",
      subject: `Follow up with ${lead.first_name || ""} ${lead.last_name || "Test Lead"}`.trim(),
      description: "This is a mock follow-up task created for testing the Follow Up Tasks widget.",
      due_at: dueAt,
      completed: false,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    taskId: task.id,
    leadName: `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
    dueAt,
  })
}
