import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        anggota: {
          select: {
            nomorInduk: true
          }
        }
      }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Gagal memuat data pengguna' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone, address } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        address
      }
    })

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Gagal membuat pengguna' }, { status: 500 })
  }
}
