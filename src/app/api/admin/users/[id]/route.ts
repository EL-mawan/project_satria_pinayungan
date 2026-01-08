import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const { name, email, password, role, phone, address } = await request.json()

    // Cek apakah email sudah digunakan oleh user lain
    if (email) {
      const existingUser = await db.user.findFirst({
        where: { 
          email,
          id: { not: id }
        }
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Email sudah digunakan oleh pengguna lain' }, { status: 400 })
      }
    }

    const data: any = {}
    if (name) data.name = name
    if (email) data.email = email
    if (role) data.role = role
    if (phone !== undefined) data.phone = phone
    if (address !== undefined) data.address = address
    
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await db.user.update({
      where: { id },
      data
    })

    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    
    // Mencegah penghapusan diri sendiri bisa dilakukan di frontend atau di sini jika kita punya akses ke session user.
    // Untuk saat ini kita izinkan penghapusan user manapun.

    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: 'User deleted' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 })
  }
}
