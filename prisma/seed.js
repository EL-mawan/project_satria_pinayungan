const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo users
  const users = [
    {
      email: 'ketua@satriapinayungan.org',
      name: 'Ahmad Satria',
      role: 'KETUA',
      password: 'admin123'
    },
    {
      email: 'sekretaris@satriapinayungan.org',
      name: 'Siti Nurhaliza',
      role: 'SEKRETARIS',
      password: 'admin123'
    },
    {
      email: 'bendahara@satriapinayungan.org',
      name: 'Budi Santoso',
      role: 'BENDAHARA',
      password: 'admin123'
    },
    {
      email: 'anggota@satriapinayungan.org',
      name: 'Rina Wijaya',
      role: 'ANGGOTA',
      password: 'admin123'
    }
  ]

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role
      }
    })

    // Create anggota data for non-admin users
    if (userData.role === 'ANGGOTA') {
      await prisma.anggota.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          nomorInduk: `ANG${Date.now().toString().slice(-6)}`,
          namaLengkap: userData.name,
          jenjang: 'PUTIH',
          status: 'AKTIF'
        }
      })
    }

    console.log(`Created user: ${userData.email} with role: ${userData.role}`)
  }

  // Create sample seksi
  const seksiData = [
    { nama: 'Seksi Latihan', deskripsi: 'Mengatur jadwal dan materi latihan' },
    { nama: 'Seksi Acara', deskripsi: 'Menyelenggarakan acara dan kegiatan' },
    { nama: 'Seksi Keamanan', deskripsi: 'Menjaga keamanan dan ketertiban' },
    { nama: 'Seksi Perlengkapan', deskripsi: 'Mengelola peralatan dan inventaris' },
    { nama: 'Seksi Humas', deskripsi: 'Hubungan masyarakat dan publikasi' }
  ]

  for (const seksi of seksiData) {
    await prisma.seksi.upsert({
      where: { nama: seksi.nama },
      update: {},
      create: seksi
    })
  }

  // Create sample kegiatan
  const kegiatanData = [
    {
      judul: 'Latihan Rutin Mingguan',
      deskripsi: 'Latihan rutin untuk semua anggota',
      tanggal: new Date(),
      lokasi: 'Lapangan Padepokan',
      jenis: 'LATIHAN'
    },
    {
      judul: 'Ujian Kenaikan Tingkat',
      deskripsi: 'Pengesahan sabuk hijau ke biru',
      tanggal: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      lokasi: 'Gelanggang Utama',
      jenis: 'PENGESAHAN'
    }
  ]

  for (const kegiatan of kegiatanData) {
    await prisma.kegiatan.create({
      data: kegiatan
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })