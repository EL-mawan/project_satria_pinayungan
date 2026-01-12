import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyAuth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await verifyAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'MASTER_ADMIN' && session.role !== 'KETUA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const targetUser = await db.user.findUnique({ where: { id } })
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Role Protection Logic: Only MASTER_ADMIN can manage MASTER_ADMIN & KETUA
    if ((targetUser.role === 'MASTER_ADMIN' || targetUser.role === 'KETUA') && session.role !== 'MASTER_ADMIN') {
      return NextResponse.json({ error: 'Hanya Master Admin yang dapat mengelola akun Ketua atau Master Admin' }, { status: 403 })
    }

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
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await verifyAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'MASTER_ADMIN' && session.role !== 'KETUA') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    
    // Self-deletion check
    if (id === session.id) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri di sini' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Role Protection Logic: Only MASTER_ADMIN can delete MASTER_ADMIN & KETUA
    if ((targetUser.role === 'MASTER_ADMIN' || targetUser.role === 'KETUA') && session.role !== 'MASTER_ADMIN') {
      return NextResponse.json({ error: 'Hanya Master Admin yang dapat menghapus akun Ketua atau Master Admin' }, { status: 403 })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: 'User deleted' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 })
  }
}
