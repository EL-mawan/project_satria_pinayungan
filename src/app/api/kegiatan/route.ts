
import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const kegiatan = await prisma.kegiatan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(kegiatan)
  } catch (error) {
    console.error('Error fetching kegiatan:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      judul, 
      deskripsi, 
      tanggal, 
      lokasi, 
      jenis, 
      status 
    } = body

    // Validation
    if (!judul || !tanggal || !jenis) {
      return NextResponse.json(
        { error: 'Judul, Tanggal, dan Jenis kegiatan wajib diisi' },
        { status: 400 }
      )
    }

    const kegiatan = await prisma.kegiatan.create({
      data: {
        judul,
        deskripsi,
        tanggal: new Date(tanggal),
        lokasi,
        jenis,
        status: status || 'TERJADWAL'
      }
    })

    return NextResponse.json(kegiatan, { status: 201 })
  } catch (error) {
    console.error('Error creating kegiatan:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}