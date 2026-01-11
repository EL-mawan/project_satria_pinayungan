import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { robustDbOperation, formatDatabaseError } from '@/lib/db-utils'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return await db.user.findUnique({ where: { id: decoded.userId } })
  } catch (error) {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    
    const lpj = await robustDbOperation(
      () => db.lPJ.findUnique({
        where: { id },
        select: {
          id: true,
          periode: true,
          tanggalMulai: true,
          tanggalSelesai: true,
          totalPemasukan: true,
          totalPengeluaran: true,
          saldo: true,
          keterangan: true,
          catatan: true,
          status: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      { maxRetries: 2, timeoutMs: 8000 }
    )

    if (!lpj) return NextResponse.json({ error: 'LPJ tidak ditemukan' }, { status: 404 })

    return NextResponse.json({ data: lpj })
  } catch (error: any) {
    console.error('Error fetching LPJ detail:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json({ 
      error: dbError.message, 
      code: dbError.code 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { status, keterangan, periode, totalPemasukan, totalPengeluaran, catatan } = body

    const existingLPJ = await robustDbOperation(
      () => db.lPJ.findUnique({ where: { id } }),
      { maxRetries: 2, timeoutMs: 8000 }
    )
    
    if (!existingLPJ) return NextResponse.json({ error: 'LPJ tidak ditemukan' }, { status: 404 })

    // Permission check
    if (status && !['MASTER_ADMIN', 'KETUA'].includes(user.role)) {
       // Only Master Admin/Ketua can change status to APPROVED/REJECTED
       if (status === 'DISETUJUI' || status === 'DITOLAK') {
         return NextResponse.json({ error: 'Izin ditolak' }, { status: 403 })
       }
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (keterangan !== undefined) updateData.keterangan = keterangan
    if (catatan !== undefined) updateData.catatan = catatan
    if (periode) updateData.periode = periode
    if (totalPemasukan !== undefined) updateData.totalPemasukan = parseFloat(totalPemasukan.toString())
    if (totalPengeluaran !== undefined) updateData.totalPengeluaran = parseFloat(totalPengeluaran.toString())
    
    if (updateData.totalPemasukan !== undefined || updateData.totalPengeluaran !== undefined) {
      const tp = updateData.totalPemasukan ?? existingLPJ.totalPemasukan
      const te = updateData.totalPengeluaran ?? existingLPJ.totalPengeluaran
      updateData.saldo = tp - te
    }

    const lpj = await robustDbOperation(
      () => db.lPJ.update({
        where: { id },
        data: updateData
      }),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    return NextResponse.json({ message: 'LPJ berhasil diperbarui', data: lpj })
  } catch (error: any) {
    console.error('Error updating LPJ:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json({ 
      error: dbError.message, 
      code: dbError.code 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    
    const lpj = await robustDbOperation(
      () => db.lPJ.findUnique({ where: { id } }),
      { maxRetries: 2, timeoutMs: 8000 }
    )
    
    if (!lpj) return NextResponse.json({ error: 'LPJ tidak ditemukan' }, { status: 404 })

    if (lpj.userId !== user.id && user.role !== 'MASTER_ADMIN') {
      return NextResponse.json({ error: 'Izin ditolak' }, { status: 403 })
    }

    if (lpj.status === 'DISETUJUI' && user.role === 'BENDAHARA') {
      return NextResponse.json({ error: 'LPJ yang sudah disetujui tidak dapat dihapus' }, { status: 403 })
    }

    await robustDbOperation(
      () => db.lPJ.delete({ where: { id } }),
      { maxRetries: 3, timeoutMs: 10000 }
    )
    
    return NextResponse.json({ message: 'LPJ berhasil dihapus' }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting LPJ:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json({ 
      error: dbError.message, 
      code: dbError.code 
    }, { status: 500 })
  }
}
