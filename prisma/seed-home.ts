
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Home Content...')

  // Hero Section
  const hero = await prisma.homeContent.upsert({
    where: { section: 'hero' },
    update: {},
    create: {
      section: 'hero',
      title: 'Padepokan Satria Pinayungan Ragas Grenyang',
      subtitle: 'Melestarikan Budaya, Membentuk Karakter',
      description: 'Bergabunglah dengan kami dalam perjalanan spiritual dan fisik untuk menguasai seni bela diri tradisional Nusantara.',
      imageUrl: ''
    },
  })
  console.log('Hero seeded:', hero.section)

  // Profile Section (combining Visi, Misi, Filosofi, Stats into JSON)
  const profileContent = {
    visi: '"Menjadi wadah pencak silat terkemuka yang mampu mencetak pendekar berintegritas, berbudi luhur, dan tangguh dalam menjaga identitas budaya bangsa."',
    misi: [
      'Meningkatkan kemampuan fisik dan spiritual anggota secara progresif',
      'Mengembangkan kurikulum bela diri tradisional yang relevan dengan zaman',
      'Menjalin sinergi erat antar perguruan silat di tingkat nasional dan mancanegara'
    ],
    filosofi: 'Ajaran kami menekankan pada Keseimbangan Batin. Bahwa senjata terkuat bukanlah raga yang kokoh, namun kejernihan hati dan ketepatan langkah dalam menghadapi badai kehidupan.',
    yearsExp: '15+',
    graduates: '500+'
  }

  const profile = await prisma.homeContent.upsert({
    where: { section: 'profile' },
    update: {},
    create: {
      section: 'profile',
      content: JSON.stringify(profileContent)
    },
  })
  console.log('Profile seeded:', profile.section)

  // Activities Section
  const activitiesList = [
    { title: 'Latihan Rutin', icon: 'Users', time: 'Minggu, 06:00', desc: 'Pengasahan teknik dasar, pernapasan, dan meditasi pagi.', color: 'bg-blue-50 text-blue-600' },
    { title: 'Pengesahan', icon: 'Award', time: 'Tiap Semester', desc: 'Ujian kenaikan tingkat untuk mengukur kemajuan pendekar.', color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Acara Adat', icon: 'Calendar', time: 'Momen Tradisi', desc: 'Peringatan tradisi budaya luhur dan silaturahmi akbar.', color: 'bg-purple-50 text-purple-600' },
    { title: 'Seminar & Workshop', icon: 'Target', time: 'Tiap 3 Bulan', desc: 'Pembelajaran teknik lanjutan bersama dewan guru pusat.', color: 'bg-slate-100 text-slate-700' }
  ]

  const activities = await prisma.homeContent.upsert({
    where: { section: 'activities' },
    update: {},
    create: {
      section: 'activities',
      title: 'Agenda & Kegiatan Pekanan',
      description: 'Program rutin pengembangan teknik, spiritual, dan kedisiplinan setiap anggota.',
      content: JSON.stringify(activitiesList)
    },
  })
  console.log('Activities seeded:', activities.section)

  // Stats Section (Anggota numbers)
  const statsList = [
    { label: 'Anggota Aktif', val: '250+' },
    { label: 'Cabang Daerah', val: '08' },
    { label: 'Pelatih Ahli', val: '12' },
    { label: 'Penghargaan', val: '45' }
  ]

  const stats = await prisma.homeContent.upsert({
    where: { section: 'stats' },
    update: {},
    create: {
      section: 'stats',
      content: JSON.stringify(statsList)
    },
  })
  console.log('Stats seeded:', stats.section)

  // Gallery Section
  const galleryList = [
    { title: 'Semangat Latihan Pagi', cat: 'Latihan Rutin', img: '/gallery-1.png' },
    { title: 'Festival Jawara Banten', cat: 'Event Budaya', img: '/gallery-2.png' },
    { title: 'Tebar Kasih Sesama', cat: 'Aksi Sosial', img: '/gallery-3.png' }
  ]

  const gallery = await prisma.homeContent.upsert({
    where: { section: 'gallery' },
    update: {},
    create: {
      section: 'gallery',
      content: JSON.stringify(galleryList)
    },
  })
  console.log('Gallery seeded:', gallery.section)

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
