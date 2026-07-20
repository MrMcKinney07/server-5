import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin, getCurrentAgent } from "@/lib/auth"
import { put, del } from "@vercel/blob"

export async function GET() {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("print_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ templates: data || [] })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

// Admin: list ALL templates including inactive
export async function PATCH() {
  try {
    await requireAdmin()
    const db = createServiceClient()
    const { data, error } = await db
      .from("print_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ templates: data || [] })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await requireAdmin()
    const formData = await request.formData()

    const previewFile = formData.get("preview_file") as File | null
    const templateFile = formData.get("template_file") as File | null
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const price = parseFloat(formData.get("price") as string) || 0
    const quantityOptions = JSON.parse((formData.get("quantity_options") as string) || "[]")
    const customizableLayers = JSON.parse((formData.get("customizable_layers") as string) || "[]")
    const fouroverProductUuid = formData.get("fourover_product_uuid") as string
    const fouroverRunsizeUuid = formData.get("fourover_runsize_uuid") as string
    const fouroverTurnaroundUuid = formData.get("fourover_turnaround_uuid") as string
    const fouroverColorspecUuid = formData.get("fourover_colorspec_uuid") as string

    if (!previewFile || !templateFile || !name || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload preview image to Blob
    const previewBlob = await put(`print-templates/previews/${Date.now()}-${previewFile.name}`, previewFile, {
      access: "public",
    })

    // Upload template file to Blob
    const templateBlob = await put(`print-templates/files/${Date.now()}-${templateFile.name}`, templateFile, {
      access: "public",
    })

    const db = createServiceClient()
    const { data, error } = await db
      .from("print_templates")
      .insert({
        name,
        category,
        description,
        preview_url: previewBlob.url,
        template_file_url: templateBlob.url,
        price,
        quantity_options: quantityOptions,
        customizable_layers: customizableLayers,
        fourover_product_uuid: fouroverProductUuid || null,
        fourover_runsize_uuid: fouroverRunsizeUuid || null,
        fourover_turnaround_uuid: fouroverTurnaroundUuid || null,
        fourover_colorspec_uuid: fouroverColorspecUuid || null,
        created_by: agent.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ template: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const db = createServiceClient()

    // Soft delete — keep the row but mark inactive
    const { error } = await db.from("print_templates").update({ is_active: false }).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}
