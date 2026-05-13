import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const supabase = await createClient()
    const body = await request.json()
    const { action, ...data } = body

    if (action === "create") {
      const { error, data: article } = await supabase
        .from("knowledge_articles")
        .insert({
          title: data.title,
          content: data.content,
          category: data.category,
          related_mission_template_id: data.related_mission_template_id || null,
          is_published: data.is_published ?? false,
          file_url: data.file_url || null,
          file_name: data.file_name || null,
          file_type: data.file_type || null,
        })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ article })
    }

    if (action === "update") {
      const updateData: Record<string, unknown> = {
        title: data.title,
        content: data.content,
        category: data.category,
        related_mission_template_id: data.related_mission_template_id || null,
        is_published: data.is_published ?? false,
        updated_at: new Date().toISOString(),
      }

      if (data.file_url !== undefined) {
        updateData.file_url = data.file_url
        updateData.file_name = data.file_name
        updateData.file_type = data.file_type
      }

      const { error, data: article } = await supabase
        .from("knowledge_articles")
        .update(updateData)
        .eq("id", data.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ article })
    }

    if (action === "toggle_published") {
      const { error } = await supabase
        .from("knowledge_articles")
        .update({ is_published: data.is_published })
        .eq("id", data.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("knowledge_articles")
        .delete()
        .eq("id", data.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error?.digest?.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized - brokers only" }, { status: 403 })
    }
    console.error("Knowledge API error:", error)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}
