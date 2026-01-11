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

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const kegiatan = await prisma.kegiatan.findMany({
      orderBy: { tanggal: 'desc' },
      take: 100
    })

    return NextResponse.json(kegiatan)
  } catch (error) {
    console.error('Error fetching kegiatan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user || !['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { judul, deskripsi, tanggal, lokasi, jenis, status } = body

    if (!judul || !tanggal || !jenis) {
      return NextResponse.json({ error: 'Judul, Tanggal, dan Jenis kegiatan wajib diisi' }, { status: 400 })
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}