import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return await db.user.findUnique({ where: { id: decoded.userId } })
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Tanggal mulai dan selesai harus diisi' }, { status: 400 })
  }

  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const [pemasukan, pengeluaran] = await Promise.all([
      db.pemasukan.aggregate({
        where: {
          tanggal: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          nominal: true
        }
      }),
      db.pengeluaran.aggregate({
        where: {
          tanggal: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          nominal: true
        }
      })
    ])

    const totalPemasukan = pemasukan._sum.nominal || 0
    const totalPengeluaran = pengeluaran._sum.nominal || 0
    const saldo = totalPemasukan - totalPengeluaran

    return NextResponse.json({
      data: {
        totalPemasukan,
        totalPengeluaran,
        saldo,
        period: { start, end }
      }
    })
  } catch (error) {
    console.error('Error calculating summary:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
