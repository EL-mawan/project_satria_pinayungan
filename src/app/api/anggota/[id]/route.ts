
import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { hash } from 'bcryptjs'

// GET Single Member
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const member = await prisma.anggota.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        seksiKetua: true
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PATCH Update Member
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { 
      namaLengkap, 
      nomorInduk, 
      tempatLahir, 
      tanggalLahir, 
      telepon, 
      alamat, 
      jenjang, 
      status,
      // Optional password update
      newPassword
    } = body

    const member = await prisma.anggota.findUnique({
      where: { id: params.id }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check unique NIA if changed
    if (nomorInduk && nomorInduk !== member.nomorInduk) {
      const exists = await prisma.anggota.findUnique({
        where: { nomorInduk }
      })
      if (exists) {
        return NextResponse.json(
          { error: 'Nomor Induk sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Update Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Anggota Data
      const updatedMember = await tx.anggota.update({
        where: { id: params.id },
        data: {
          namaLengkap,
          nomorInduk,
          tempatLahir,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
          telepon,
          alamat,
          jenjang,
          status
        }
      })

      // 2. Update User Data (Name, Phone, Address) linked to this member
      await tx.user.update({
        where: { id: member.userId },
        data: {
          name: namaLengkap,
          phone: telepon,
          address: alamat,
          // Only update password if provided
          ...(newPassword ? { password: await hash(newPassword, 12) } : {})
        }
      })

      return updatedMember
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE Member
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const member = await prisma.anggota.findUnique({
      where: { id: params.id }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    // Transaction to delete both member and user
    await prisma.$transaction(async (tx) => {
      // Delete Anggota first (this might trigger cascade if configured, but let's be safe)
      // Actually because Anggota has FK to User with onDelete Cascade, deleting User deletes Anggota.
      // But we want to delete Anggota... wait. 
      // User -> Anggota (No, Anggota has userId FK).
      // If we delete User, Anggota is deleted.
      // If we delete Anggota, User REMAINS unless logic says otherwise.
      // Usually "Anggota" implies an Account. So we should delete the User.
      
      await tx.user.delete({
        where: { id: member.userId }
      })
    })

    return NextResponse.json({ message: 'Anggota berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
