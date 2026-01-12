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
      where: { id: decoded.userId },
      include: { anggota: true }
    })
    return user
  } catch (error) {
    return null
  }
}

// GET - Get single surat keluar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const surat = await db.suratKeluar.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!surat) {
      return NextResponse.json(
        { error: 'Surat tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: surat })
  } catch (error) {
    console.error('Error fetching surat keluar:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update surat keluar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission
  if (!['MASTER_ADMIN', 'SEKRETARIS', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk mengubah surat' },
      { status: 403 }
    )
  }

  try {
    const { nomor, tujuan, perihal, jenis, isi, template, status, catatan, tanggal } = await request.json()

    const existingSurat = await db.suratKeluar.findUnique({
      where: { id }
    })

    if (!existingSurat) {
      return NextResponse.json(
        { error: 'Surat tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only allow editing if status is DRAFT, MENUNGGU_VALIDASI, or DITOLAK
    if (!['DRAFT', 'MENUNGGU_VALIDASI', 'DITOLAK'].includes(existingSurat.status) && !['MASTER_ADMIN', 'KETUA'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Surat sudah tidak dapat diubah karena sudah diproses' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (nomor) updateData.nomor = nomor
    if (tujuan) updateData.tujuan = tujuan
    if (perihal) updateData.perihal = perihal
    if (jenis) updateData.jenis = jenis
    if (isi !== undefined) updateData.isi = isi
    if (template !== undefined) updateData.template = template
    if (catatan !== undefined) updateData.catatan = catatan
    if (tanggal) updateData.tanggal = new Date(tanggal)
    
    // Allow status change if:
    // 1. User is Master Admin or Ketua
    // 2. OR User is resubmitting (changing DRAFT/DITOLAK -> MENUNGGU_VALIDASI)
    if (status) {
        const isResubmitting = status === 'MENUNGGU_VALIDASI' && ['DRAFT', 'DITOLAK'].includes(existingSurat.status)
        if (['MASTER_ADMIN', 'KETUA'].includes(user.role) || isResubmitting) {
            updateData.status = status
        }
    }

    const surat = await db.suratKeluar.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Surat berhasil diperbarui',
      data: surat
    })
  } catch (error) {
    console.error('Error updating surat keluar:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete surat keluar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission
  if (!['MASTER_ADMIN', 'SEKRETARIS', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk menghapus surat' },
      { status: 403 }
    )
  }

  try {
    const existingSurat = await db.suratKeluar.findUnique({
      where: { id }
    })

    if (!existingSurat) {
      return NextResponse.json(
        { error: 'Surat tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only allow deletion if status is DRAFT, or if user is MASTER_ADMIN for processed letters
    if (existingSurat.status !== 'DRAFT' && user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Master Admin yang dapat menghapus surat yang sudah divalidasi atau dalam proses' },
        { status: 403 }
      )
    }

    await db.suratKeluar.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Surat berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting surat keluar:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}