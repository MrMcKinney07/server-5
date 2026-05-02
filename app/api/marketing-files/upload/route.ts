import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'general'
    const templateName = formData.get('templateName') as string || file.name

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create a unique path for the file
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const pathname = `marketing/${user.id}/${category}/${timestamp}-${safeName}`

    const blob = await put(pathname, file, {
      access: 'private',
    })

    // Store file metadata in Supabase
    const { error: dbError } = await supabase
      .from('marketing_files')
      .insert({
        agent_id: user.id,
        pathname: blob.pathname,
        filename: file.name,
        template_name: templateName,
        category,
        content_type: file.type,
        size: file.size,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // File was uploaded but metadata save failed - still return success
    }

    return NextResponse.json({ 
      pathname: blob.pathname,
      filename: file.name,
      category,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
