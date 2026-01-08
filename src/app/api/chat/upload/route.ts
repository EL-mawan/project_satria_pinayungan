import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'chat')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const extension = path.extname(originalName)
    const nameWithoutExt = path.basename(originalName, extension)
    const fileName = `${nameWithoutExt}-${timestamp}${extension}`
    const filePath = path.join(uploadsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return public URL
    const fileUrl = `/uploads/chat/${fileName}`
    
    // Determine file type
    let fileType = 'document'
    const mimeType = file.type
    if (mimeType.startsWith('image/')) fileType = 'image'
    else if (mimeType.startsWith('video/')) fileType = 'video'
    else if (mimeType.startsWith('audio/')) fileType = 'audio'

    return NextResponse.json({
      url: fileUrl,
      name: originalName,
      size: file.size,
      type: fileType
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
