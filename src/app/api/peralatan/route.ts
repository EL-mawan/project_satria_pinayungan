import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const seksiId = searchParams.get('seksiId')
    const kondisi = searchParams.get('kondisi')

    const where: any = {}
    if (seksiId && seksiId !== 'ALL') where.seksiId = seksiId
    if (kondisi && kondisi !== 'ALL') where.kondisi = kondisi

    const peralatan = await db.peralatan.findMany({
      where,
      include: {
        seksi: {
          select: {
            id: true,
            nama: true,
            bidang: true
          }
        },
        _count: {
          select: {
            riwayatPemakaian: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: peralatan })
  } catch (error) {
    console.error('Error fetching peralatan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!nama || !kode) {
      return NextResponse.json({ error: 'Nama dan Kode alat wajib diisi' }, { status: 400 })
    }

    const peralatan = await db.peralatan.create({
      data: {
        nama,
        kode,
        seksiId: seksiId === 'none' ? null : seksiId,
        jumlah: parseInt(jumlah) || 1,
        kondisi: kondisi || 'BAIK',
        keterangan,
        foto
      }
    })

    return NextResponse.json({ 
      message: 'Peralatan berhasil ditambahkan',
      data: peralatan 
    }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Kode peralatan sudah terdaftar' }, { status: 400 })
    }
    console.error('Error creating peralatan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
