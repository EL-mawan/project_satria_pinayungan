import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
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
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(req)
  if (!user || !['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { judul, deskripsi, tanggal, lokasi, jenis, status } = body

    const existingKegiatan = await prisma.kegiatan.findUnique({
      where: { id: params.id }
    })

    if (!existingKegiatan) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    const updatedKegiatan = await prisma.kegiatan.update({
      where: { id: params.id },
      data: {
        judul,
        deskripsi,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        lokasi,
        jenis,
        status
      }
    })

    return NextResponse.json(updatedKegiatan)
  } catch (error) {
    console.error('Error updating kegiatan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
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
    const existingKegiatan = await prisma.kegiatan.findUnique({
      where: { id: params.id }
    })

    if (!existingKegiatan) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    await prisma.kegiatan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting kegiatan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
