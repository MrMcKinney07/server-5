import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { assignLeadToNextAgent } from "@/lib/leads/assign-lead-to-next-agent"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Only admins can trigger system assignment
    await requireAdmin()

    const { id } = await params

    const assignedAgentId = await assignLeadToNextAgent(id)

    if (!assignedAgentId) {
      return NextResponse.json({ error: "No eligible agents available for assignment" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      assignedAgentId,
    })
  } catch (error) {
    console.error("Error in assign-system:", error)
    return NextResponse.json({ error: "Failed to assign lead" }, { status: 500 })
  }
}
