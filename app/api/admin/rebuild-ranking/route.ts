import { requireAdmin } from "@/lib/auth"
import { rebuildMonthlyRanking } from "@/lib/missions/rebuild-monthly-ranking"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Only admins can call this endpoint
    await requireAdmin()

    const rankings = await rebuildMonthlyRanking()

    return NextResponse.json({
      success: true,
      message: "Rankings rebuilt successfully",
      rankings,
    })
  } catch (error) {
    // Check if it's a redirect (from requireAdmin)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: "Failed to rebuild rankings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
