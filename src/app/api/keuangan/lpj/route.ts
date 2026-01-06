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

// GET - List all LPJ
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission (BENDAHARA, KETUA, MASTER_ADMIN)
  if (!['MASTER_ADMIN', 'BENDAHARA', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk mengakses data LPJ' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { periode: { contains: search } },
        { keterangan: { contains: search } }
      ]
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    const [lpj, total] = await Promise.all([
      db.lPJ.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.lPJ.count({ where })
    ])

    return NextResponse.json({
      data: lpj,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching LPJ:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new LPJ
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission
  if (!['MASTER_ADMIN', 'BENDAHARA', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk membuat LPJ' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { 
      periode, 
      tanggalMulai, 
      tanggalSelesai, 
      totalPemasukan, 
      totalPengeluaran, 
      keterangan, 
      file 
    } = body

    if (!periode || !tanggalMulai || !tanggalSelesai || totalPemasukan === undefined || totalPengeluaran === undefined) {
      return NextResponse.json(
        { error: 'Data wajib harus diisi lengkap' },
        { status: 400 }
      )
    }

    const tp = parseFloat(totalPemasukan.toString())
    const te = parseFloat(totalPengeluaran.toString())
    const saldo = tp - te

    const lpj = await db.lPJ.create({
      data: {
        periode,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        totalPemasukan: tp,
        totalPengeluaran: te,
        saldo,
        keterangan,
        file,
        status: 'DIAJUKAN',
        userId: user.id
      }
    })

    return NextResponse.json({
      message: 'LPJ berhasil dibuat',
      data: lpj
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating LPJ:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    )
  }
}