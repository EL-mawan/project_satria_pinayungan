import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { robustDbOperation, formatDatabaseError } from '@/lib/db-utils'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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
    console.error('Auth verification failed:', error)
    return null
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['MASTER_ADMIN', 'BENDAHARA', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk menghapus data keuangan' },
      { status: 403 }
    )
  }

  try {
    await robustDbOperation(
      () => db.pengeluaran.delete({
        where: { id: params.id }
      }),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    return NextResponse.json({ message: 'Data pengeluaran berhasil dihapus' }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting pengeluaran:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json(
      { 
        error: dbError.message, 
        code: dbError.code,
        details: dbError.code === 'UNKNOWN' ? error.message : undefined 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['MASTER_ADMIN', 'BENDAHARA', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk mengubah data keuangan' },
      { status: 403 }
    )
  }

  try {
    const { jenis, tanggal, nominal, keterangan, bukti, kegiatanId, satuanHarga, qty, satuan } = await request.json()

    const updated = await robustDbOperation(
      () => db.pengeluaran.update({
        where: { id: params.id },
        data: {
          jenis,
          tanggal: new Date(tanggal),
          nominal: parseFloat(nominal),
          satuanHarga: satuanHarga ? parseFloat(satuanHarga) : null,
          qty: qty ? parseInt(qty) : null,
          satuan,
          keterangan,
          bukti,
          kegiatanId
        }
      }),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    return NextResponse.json({ 
      message: 'Data pengeluaran berhasil diubah',
      data: updated
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating pengeluaran:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json(
      { 
        error: dbError.message, 
        code: dbError.code,
        details: dbError.code === 'UNKNOWN' ? error.message : undefined 
      },
      { status: 500 }
    )
  }
}
