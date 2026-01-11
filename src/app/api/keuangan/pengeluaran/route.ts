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

// GET - List all pengeluaran
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission (BENDAHARA or KETUA)
  if (!['MASTER_ADMIN', 'BENDAHARA', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk mengakses data keuangan' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const search = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { jenis: { contains: search } },
        { keterangan: { contains: search } }
      ]
    }

    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [pengeluaran, total] = await Promise.all([
      db.pengeluaran.findMany({
        where,
        include: {
          kegiatan: {
            select: {
              id: true,
              judul: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      db.pengeluaran.count({ where })
    ])

    // Calculate total
    const totalNominal = await db.pengeluaran.aggregate({
      where,
      _sum: {
        nominal: true
      }
    })

    return NextResponse.json({
      data: pengeluaran,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        total: total,
        totalNominal: totalNominal._sum.nominal || 0
      }
    })
  } catch (error) {
    console.error('Error fetching pengeluaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new pengeluaran
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission (BENDAHARA or KETUA)
  if (!['MASTER_ADMIN', 'BENDAHARA', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk menambah data keuangan' },
      { status: 403 }
    )
  }

  try {
    const { jenis, tanggal, nominal, keterangan, bukti, kegiatanId, satuanHarga, qty, satuan } = await request.json()

    if (!jenis || !tanggal || !nominal) {
      return NextResponse.json(
        { error: 'Jenis, tanggal, dan nominal harus diisi' },
        { status: 400 }
      )
    }

    if (nominal <= 0) {
      return NextResponse.json(
        { error: 'Nominal harus lebih dari 0' },
        { status: 400 }
      )
    }

    const pengeluaran = await db.pengeluaran.create({
      data: {
        jenis,
        tanggal: new Date(tanggal),
        nominal: parseFloat(nominal),
        satuanHarga: satuanHarga ? parseFloat(satuanHarga) : null,
        qty: qty ? parseInt(qty) : null,
        satuan,
        keterangan,
        bukti,
        kegiatanId,
        userId: user.id
      },
      include: {
        kegiatan: {
          select: {
            id: true,
            judul: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Pengeluaran berhasil dicatat',
      data: pengeluaran
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating pengeluaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}