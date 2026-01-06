import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to verify token and get user
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })
    return user
  } catch (error) {
    return null
  }
}

// GET - Get all home content or specific section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    if (section) {
      const content = await db.homeContent.findUnique({
        where: { section }
      })
      return NextResponse.json({ data: content })
    }

    const allContent = await db.homeContent.findMany({
      orderBy: { section: 'asc' }
    })

    return NextResponse.json({ data: allContent })
  } catch (error) {
    console.error('Error fetching home content:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create or update home content (Master Admin only)
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only MASTER_ADMIN can edit home content
  if (user.role !== 'MASTER_ADMIN') {
    return NextResponse.json(
      { error: 'Hanya Master Admin yang dapat mengedit konten' },
      { status: 403 }
    )
  }

  try {
    const { section, title, subtitle, description, imageUrl, content } = await request.json()

    if (!section) {
      return NextResponse.json(
        { error: 'Section harus diisi' },
        { status: 400 }
      )
    }

    const homeContent = await db.homeContent.upsert({
      where: { section },
      update: {
        title,
        subtitle,
        description,
        imageUrl,
        content
      },
      create: {
        section,
        title,
        subtitle,
        description,
        imageUrl,
        content
      }
    })

    return NextResponse.json({
      message: 'Konten berhasil diperbarui',
      data: homeContent
    })
  } catch (error) {
    console.error('Error updating home content:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
