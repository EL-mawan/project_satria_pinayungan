import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const alat = await db.peralatan.findUnique({
      where: { id },
      include: {
        seksi: true,
        riwayatPemakaian: {
          orderBy: {
            tanggalPakai: 'desc'
          },
          take: 10
        }
      }
    })

    if (!alat) {
      return NextResponse.json({ error: 'Peralatan tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: alat })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const auth = await verifyAuth(request)
    if (!auth || !['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { 
      nama, 
      kode, 
      seksiId, 
      jumlah, 
      kondisi, 
      keterangan, 
      foto 
    } = body

    const alat = await db.peralatan.update({
      where: { id },
      data: {
        nama,
        kode,
        seksiId: seksiId === 'none' ? null : seksiId,
        jumlah: jumlah ? parseInt(jumlah) : undefined,
        kondisi,
        keterangan,
        foto
      }
    })

    return NextResponse.json({ 
      message: 'Peralatan berhasil diperbarui',
      data: alat 
    })
  } catch (error) {
    console.error('Error updating peralatan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const auth = await verifyAuth(request)
    if (!auth || !['MASTER_ADMIN', 'KETUA'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await db.peralatan.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Peralatan berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
