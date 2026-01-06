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

// GET - List all pemasukan
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { sumber: { contains: search } },
        { keterangan: { contains: search } }
      ]
    }

    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [pemasukan, total] = await Promise.all([
      db.pemasukan.findMany({
        where,
        orderBy: { tanggal: 'desc' },
        skip,
        take: limit
      }),
      db.pemasukan.count({ where })
    ])

    // Calculate total
    const totalNominal = await db.pemasukan.aggregate({
      where,
      _sum: {
        nominal: true
      }
    })

    return NextResponse.json({
      data: pemasukan,
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
    console.error('Error fetching pemasukan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new pemasukan
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
    const { sumber, tanggal, nominal, keterangan, bukti } = await request.json()

    if (!sumber || !tanggal || !nominal) {
      return NextResponse.json(
        { error: 'Sumber, tanggal, dan nominal harus diisi' },
        { status: 400 }
      )
    }

    if (nominal <= 0) {
      return NextResponse.json(
        { error: 'Nominal harus lebih dari 0' },
        { status: 400 }
      )
    }

    const pemasukan = await db.pemasukan.create({
      data: {
        sumber,
        tanggal: new Date(tanggal),
        nominal: parseFloat(nominal),
        keterangan,
        bukti,
        userId: user.id
      }
    })

    return NextResponse.json({
      message: 'Pemasukan berhasil dicatat',
      data: pemasukan
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating pemasukan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}