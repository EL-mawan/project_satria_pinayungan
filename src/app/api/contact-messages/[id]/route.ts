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

// PATCH - Mark message as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'MASTER_ADMIN') {
    return NextResponse.json(
      { error: 'Hanya Master Admin yang dapat mengubah status pesan' },
      { status: 403 }
    )
  }

  try {
    const { isRead } = await request.json()

    const message = await db.contactMessage.update({
      where: { id: params.id },
      data: { isRead }
    })

    return NextResponse.json({
      message: 'Status pesan berhasil diperbarui',
      data: message
    })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'MASTER_ADMIN') {
    return NextResponse.json(
      { error: 'Hanya Master Admin yang dapat menghapus pesan' },
      { status: 403 }
    )
  }

  try {
    await db.contactMessage.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Pesan berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
