import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seksi = await db.seksi.findMany({
      include: {
        ketua: {
          select: {
            id: true,
            namaLengkap: true,
            jenjang: true
          }
        },
        _count: {
          select: {
            anggota: true,
            peralatan: true
          }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    })

    return NextResponse.json({ data: seksi })
  } catch (error) {
    console.error('Error fetching seksi:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !['MASTER_ADMIN', 'KETUA'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nama, bidang, deskripsi, tugas, ketuaId } = body

    if (!nama) {
      return NextResponse.json({ error: 'Nama seksi wajib diisi' }, { status: 400 })
    }

    const seksi = await db.seksi.create({
      data: {
        nama,
        bidang,
        deskripsi,
        tugas,
        ketuaId
      }
    })

    return NextResponse.json({ 
      message: 'Seksi berhasil dibuat',
      data: seksi 
    }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Nama seksi sudah ada' }, { status: 400 })
    }
    console.error('Error creating seksi:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
