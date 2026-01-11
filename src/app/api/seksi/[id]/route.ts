import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { robustDbOperation, formatDatabaseError } from '@/lib/db-utils'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const seksi = await db.seksi.findUnique({
      where: { id },
      include: {
        ketua: true,
        anggota: {
          select: {
            id: true,
            namaLengkap: true,
            jenjang: true,
            status: true
          }
        },
        peralatan: true
      }
    })

    if (!seksi) {
      return NextResponse.json({ error: 'Seksi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: seksi })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !['MASTER_ADMIN', 'KETUA'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { nama, bidang, deskripsi, tugas, ketuaId } = body

    const seksi = await robustDbOperation(
      () => db.seksi.update({
        where: { id },
        data: {
          nama,
          bidang,
          deskripsi,
          tugas,
          ketuaId
        }
      }),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    return NextResponse.json({ 
      message: 'Seksi berhasil diperbarui',
      data: seksi 
    })
  } catch (error: any) {
    console.error('Error updating seksi:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json({ 
      error: dbError.message,
      code: dbError.code 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !['MASTER_ADMIN'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingSeksi = await robustDbOperation(
      () => db.seksi.findUnique({ where: { id } }),
      { maxRetries: 2 }
    )

    if (!existingSeksi) {
      return NextResponse.json({ error: 'Seksi tidak ditemukan' }, { status: 404 })
    }

    await robustDbOperation(
      () => db.seksi.delete({
        where: { id }
      }),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    return NextResponse.json({ message: 'Seksi berhasil dihapus' }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting seksi:', error)
    const dbError = formatDatabaseError(error)
    return NextResponse.json({ 
      error: dbError.message,
      code: dbError.code 
    }, { status: 500 })
  }
}
