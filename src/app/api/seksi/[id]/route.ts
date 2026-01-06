import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

    const seksi = await db.seksi.update({
      where: { id },
      data: {
        nama,
        bidang,
        deskripsi,
        tugas,
        ketuaId
      }
    })

    return NextResponse.json({ 
      message: 'Seksi berhasil diperbarui',
      data: seksi 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
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

    await db.seksi.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Seksi berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
