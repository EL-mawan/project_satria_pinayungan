import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Anggota Counts
    const totalAnggota = await prisma.anggota.count()
    const anggotaAktif = await prisma.anggota.count({
      where: { status: 'AKTIF' }
    })

    // 2. Kegiatan Counts
    const totalKegiatan = await prisma.kegiatan.count()
    const kegiatanTerjadwal = await prisma.kegiatan.count({
      where: { status: 'TERJADWAL' }
    })

    // 3. Keuangan (Pemasukan & Pengeluaran)
    const pemasukanAgg = await prisma.pemasukan.aggregate({
      _sum: { nominal: true }
    })
    const pengeluaranAgg = await prisma.pengeluaran.aggregate({
      _sum: { nominal: true }
    })
    const totalPemasukan = pemasukanAgg._sum.nominal || 0
    const totalPengeluaran = pengeluaranAgg._sum.nominal || 0

    // 4. Pending Items
    const suratMenunggu = await prisma.suratKeluar.count({
      where: { status: 'MENUNGGU_VALIDASI' }
    })
    const lpjMenunggu = await prisma.lPJ.count({
      where: { status: 'DIAJUKAN' } // LPJ status is DIAJUKAN for pending
    })

    // 5. Recent Activities
    // Fetch last 3 items from Kegiatan, Surat, and maybe Pemasukan/Pengeluaran?
    // User dashboard mock showed Kegiatan and Surat.
    
    const recentKegiatan = await prisma.kegiatan.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        judul: true,
        jenis: true,
        status: true,
        tanggal: true,
        lokasi: true
      }
    })

    const recentSurat = await prisma.suratKeluar.findMany({
       take: 3,
       orderBy: { createdAt: 'desc' },
       select: {
         id: true,
         perihal: true,
         jenis: true,
         status: true,
         tanggal: true,
         tujuan: true
       }
    })

    // Combine and sort
    const activities = [
        ...recentKegiatan.map(k => ({
            id: k.id,
            title: k.judul,
            subtitle: k.jenis,
            type: 'kegiatan',
            status: k.status.toLowerCase(),
            date: new Date(k.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            amount: '-', // Kegiatan usually doesn't have direct amount here unless linked to budget
            location: k.lokasi || 'Padepokan'
        })),
        ...recentSurat.map(s => ({
            id: s.id,
            title: s.perihal,
            subtitle: s.tujuan,
            type: 'surat',
            status: s.status === 'MENUNGGU_VALIDASI' ? 'menunggu' : (s.status === 'VALIDASI' ? 'selesai' : 'draft'),
            date: new Date(s.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            amount: '-',
            location: 'Sekretariat'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)


    return NextResponse.json({
      totalAnggota,
      anggotaAktif,
      totalKegiatan,
      kegiatanTerjadwal,
      totalPemasukan,
      totalPengeluaran,
      suratMenunggu,
      lpjMenunggu,
      recentActivities: activities
    })

  } catch (error) {
    console.error('Dashboard Stats Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
