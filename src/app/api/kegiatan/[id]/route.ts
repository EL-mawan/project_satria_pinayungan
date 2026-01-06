
import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// PATCH - Update Kegiatan
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { 
      judul, 
      deskripsi, 
      tanggal, 
      lokasi, 
      jenis, 
      status 
    } = body

    // Validation (ensure at least some data is present, though strictly not required for partial updates, checking existence is good)
    const existingKegiatan = await prisma.kegiatan.findUnique({
      where: { id: params.id }
    })

    if (!existingKegiatan) {
      return NextResponse.json(
        { error: 'Kegiatan tidak ditemukan' },
        { status: 404 }
      )
    }

    const updatedKegiatan = await prisma.kegiatan.update({
      where: { id: params.id },
      data: {
        judul,
        deskripsi,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        lokasi,
        jenis,
        status
      }
    })

    return NextResponse.json(updatedKegiatan)
  } catch (error) {
    console.error('Error updating kegiatan:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove Kegiatan
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingKegiatan = await prisma.kegiatan.findUnique({
      where: { id: params.id }
    })

    if (!existingKegiatan) {
      return NextResponse.json(
        { error: 'Kegiatan tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.kegiatan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting kegiatan:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
