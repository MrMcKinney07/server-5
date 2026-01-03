import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Get current profile picture to delete old one
    const { data: agent } = await supabase.from("agents").select("profile_picture_url").eq("id", user.id).single()

    // Delete old profile picture if it exists
    if (agent?.profile_picture_url) {
      try {
        await del(agent.profile_picture_url)
      } catch (error) {
        console.error("Failed to delete old profile picture:", error)
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `profile-pictures/${user.id}/${timestamp}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    // Update agent profile with new picture URL
    const { error: updateError } = await supabase
      .from("agents")
      .update({ profile_picture_url: blob.url })
      .eq("id", user.id)

    if (updateError) {
      // If database update fails, delete the uploaded file
      await del(blob.url)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
