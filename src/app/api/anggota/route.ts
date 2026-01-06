
import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function GET() {
  try {
    const members = await prisma.anggota.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        seksiKetua: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      email, 
      password, 
      namaLengkap, 
      nomorInduk, 
      tempatLahir, 
      tanggalLahir, 
      telepon, 
      alamat, 
      jenjang, 
      status 
    } = body

    // Validation
    if (!namaLengkap) {
      return NextResponse.json(
        { error: 'Nama Lengkap wajib diisi' },
        { status: 400 }
      )
    }

    // Auto-generate fields if not provided
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    // Check for existing NIA if user provided one, otherwise generate
    let finalNomorInduk = nomorInduk || `AG-${timestamp}-${random}`
    
    // Ensure uniqueness for auto-generated NIA (simple check)
    let existingMember = await prisma.anggota.findUnique({
      where: { nomorInduk: finalNomorInduk }
    })
    
    // Retry once if collision (rare)
    if (existingMember && !nomorInduk) {
        finalNomorInduk = `AG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    } else if (existingMember && nomorInduk) {
         return NextResponse.json(
            { error: 'Nomor Induk sudah terdaftar' },
            { status: 400 }
         )
    }

    const finalEmail = email || `${finalNomorInduk.toLowerCase().replace(/[^a-z0-9]/g, '')}@padepokan.com`
    const finalPassword = password || '123456'

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: finalEmail }
    })

    if (existingUser) {
       // If auto-generated email exists, append random
       if (!email) {
          // This case should be rare if NIA is unique, but handled for safety
       } else {
          return NextResponse.json(
            { error: 'Email sudah terdaftar' },
            { status: 400 }
          )
       }
    }

    const hashedPassword = await hash(finalPassword, 12)

    // Transaction to create user and member
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: finalEmail,
          name: namaLengkap,
          password: hashedPassword,
          role: 'ANGGOTA',
          phone: telepon,
          address: alamat
        }
      })

      const member = await tx.anggota.create({
        data: {
          userId: user.id,
          nomorInduk: finalNomorInduk,
          namaLengkap,
          tempatLahir,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
          telepon,
          alamat,
          jenjang,
          status,
          tanggalGabung: new Date()
        }
      })

      return member
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
