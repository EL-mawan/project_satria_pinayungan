import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const toRoman = (num: number) => {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return roman[num - 1] || num.toString();
};

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

// GET - List all surat keluar
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    // For next-number preview in frontend
    if (searchParams.get('action') === 'next-number') {
      const requestedDate = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date()
      const currentYear = requestedDate.getFullYear()
      const count = await db.suratKeluar.count({
        where: {
          createdAt: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1)
          }
        }
      })
      const month = toRoman(requestedDate.getMonth() + 1)
      const nextNomor = `${String(count + 1).padStart(3, '0')}/PSPRG-RG/${month}/${currentYear}`
      return NextResponse.json({ nextNomor })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const jenis = searchParams.get('jenis') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { nomor: { contains: search } },
        { tujuan: { contains: search } },
        { perihal: { contains: search } }
      ]
    }

    if (jenis) {
      where.jenis = jenis
    }

    if (status) {
      where.status = status
    }

    const [surat, total] = await Promise.all([
      db.suratKeluar.findMany({
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
      db.suratKeluar.count({ where })
    ])

    return NextResponse.json({
      data: surat,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching surat keluar:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new surat keluar
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission (SEKRETARIS or KETUA)
  if (!['MASTER_ADMIN', 'SEKRETARIS', 'KETUA'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki izin untuk membuat surat' },
      { status: 403 }
    )
  }

  try {
    const { nomor, tujuan, perihal, jenis, isi, template, tanggal } = await request.json()

    if (!tujuan || !perihal || !jenis) {
      return NextResponse.json(
        { error: 'Tujuan, perihal, dan jenis harus diisi' },
        { status: 400 }
      )
    }

    const month = toRoman(new Date(tanggal || new Date()).getMonth() + 1)
    const yearLetter = new Date(tanggal || new Date()).getFullYear()
    
    // Count existing surat for this year to get sequence number
    const count = await db.suratKeluar.count({
      where: {
        createdAt: {
          gte: new Date(yearLetter, 0, 1),
          lt: new Date(yearLetter + 1, 0, 1)
        }
      }
    })
    
    // Use provided nomor if exists, otherwise generate next
    const nomorSurat = nomor || `${String(count + 1).padStart(3, '0')}/PSPRG-RG/${month}/${yearLetter}`

    const surat = await db.suratKeluar.create({
      data: {
        nomor: nomorSurat,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        tujuan,
        perihal,
        jenis,
        isi,
        template,
        status: 'MENUNGGU_VALIDASI',
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Surat berhasil dibuat',
      data: surat
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating surat keluar:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}