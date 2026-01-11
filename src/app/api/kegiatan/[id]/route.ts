import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { robustDbOperation, formatDatabaseError } from '@/lib/db-utils'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return await prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch (error) {
    return null
  }
}

// PATCH - Update Kegiatan
// PATCH - Update Kegiatan
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(req)
  if (!user || !['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { judul, deskripsi, tanggal, lokasi, jenis, status } = body

    const existingKegiatan = await robustDbOperation(
      () => prisma.kegiatan.findUnique({
        where: { id }
      }),
      { maxRetries: 2, timeoutMs: 5000 }
    )

    if (!existingKegiatan) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan', code: 'NOT_FOUND' }, { status: 404 })
    }

    const updatedKegiatan = await robustDbOperation(
      () => prisma.kegiatan.update({
        where: { id },
        data: {
          judul,
          deskripsi,
          tanggal: tanggal ? new Date(tanggal) : undefined,
          lokasi,
          jenis,
          status
        }
      }),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    return NextResponse.json(updatedKegiatan)
  } catch (error: any) {
    console.error('Error updating kegiatan:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json({ 
      error: dbError.message, 
      code: dbError.code 
    }, { status: 500 })
  }
}

// DELETE - Remove Kegiatan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(req)
  if (!user || !['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    const existingKegiatan = await robustDbOperation(
      () => prisma.kegiatan.findUnique({
        where: { id }
      }),
      { maxRetries: 2, timeoutMs: 5000 }
    )

    if (!existingKegiatan) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan', code: 'NOT_FOUND' }, { status: 404 })
    }

    await robustDbOperation(
      () => prisma.kegiatan.delete({
        where: { id }
      }),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting kegiatan:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json({ 
      error: dbError.message, 
      code: dbError.code 
    }, { status: 500 })
  }
}
