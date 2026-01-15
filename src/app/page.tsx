'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Calendar, 
  Award, 
  Target,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  ChevronRight,
  Shield,
  Heart,
  Sword,
  ArrowRight,
  Menu,
  X,
  Camera,
  Maximize2,
  Star,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

// Icon mapping for dynamic icons
const IconMap: any = {
  Users, Calendar, Award, Target, Star, Zap, Shield, Heart, Sword
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('visi')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { toast } = useToast()

  // Content States with Defaults
  const [hero, setHero] = useState({
    title: 'Padepokan Satria Pinayungan Ragas Grenyang',
    subtitle: 'Melestarikan Budaya, Membentuk Karakter',
    description: 'Bergabunglah dengan kami dalam perjalanan spiritual dan fisik untuk menguasai seni bela diri tradisional Nusantara.',
    imageUrl: ''
  })

  // Profile defaults
  const [profile, setProfile] = useState({
    visi: '"Menjadi wadah pencak silat terkemuka yang mampu mencetak pendekar berintegritas, berbudi luhur, dan tangguh dalam menjaga identitas budaya bangsa."',
    misi: [
      'Meningkatkan kemampuan fisik dan spiritual anggota secara progresif',
      'Mengembangkan kurikulum bela diri tradisional yang relevan dengan zaman',
      'Menjalin sinergi erat antar perguruan silat di tingkat nasional dan mancanegara'
    ],
    filosofi: 'Ajaran kami menekankan pada Keseimbangan Batin. Bahwa senjata terkuat bukanlah raga yang kokoh, namun kejernihan hati dan ketepatan langkah dalam menghadapi badai kehidupan.',
    yearsExp: '15+',
    graduates: '500+'
  })

  // Activities defaults
  const [activities, setActivities] = useState({
    title: 'Agenda & Kegiatan Pekanan',
    description: 'Program rutin pengembangan teknik, spiritual, dan kedisiplinan setiap anggota.',
    items: [
      { title: 'Latihan Rutin', icon: 'Users', time: 'Minggu, 06:00', desc: 'Pengasahan teknik dasar, pernapasan, dan meditasi pagi.', color: 'bg-blue-50 text-blue-600' },
      { title: 'Pengesahan', icon: 'Award', time: 'Tiap Semester', desc: 'Ujian kenaikan tingkat untuk mengukur kemajuan pendekar.', color: 'bg-indigo-50 text-indigo-600' },
      { title: 'Acara Adat', icon: 'Calendar', time: 'Momen Tradisi', desc: 'Peringatan tradisi budaya luhur dan silaturahmi akbar.', color: 'bg-purple-50 text-purple-600' },
      { title: 'Seminar & Workshop', icon: 'Target', time: 'Tiap 3 Bulan', desc: 'Pembelajaran teknik lanjutan bersama dewan guru pusat.', color: 'bg-slate-100 text-slate-700' }
    ]
  })

  // Stats defaults
  const [stats, setStats] = useState([
    { label: 'Anggota Aktif', val: '250+' },
    { label: 'Cabang Daerah', val: '08' },
    { label: 'Pelatih Ahli', val: '12' },
    { label: 'Penghargaan', val: '45' }
  ])

  // Gallery defaults
  const [gallery, setGallery] = useState([
    { title: 'Semangat Latihan Pagi', cat: 'Latihan Rutin', img: '/gallery-1.png' },
    { title: 'Festival Jawara Banten', cat: 'Event Budaya', img: '/gallery-2.png' },
    { title: 'Tebar Kasih Sesama', cat: 'Aksi Sosial', img: '/gallery-3.png' }
  ])

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)

  // Fetch Content on Load
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/home-content')
        if (response.ok) {
          const { data } = await response.json()
          
          data.forEach((item: any) => {
            if (item.section === 'hero') {
              setHero({
                title: item.title || hero.title,
                subtitle: item.subtitle || hero.subtitle,
                description: item.description || hero.description,
                imageUrl: item.imageUrl || ''
              })
            }
            if (item.section === 'profile' && item.content) {
              try {
                const parsed = JSON.parse(item.content)
                setProfile(prev => ({ ...prev, ...parsed }))
              } catch (e) {}
            }
            if (item.section === 'activities') {
               try {
                 const parsedContent = item.content ? JSON.parse(item.content) : []
                 setActivities({
                    title: item.title || activities.title,
                    description: item.description || activities.description,
                    items: parsedContent.length > 0 ? parsedContent : activities.items
                 })
               } catch (e) {}
            }
            if (item.section === 'stats' && item.content) {
              try {
                setStats(JSON.parse(item.content))
              } catch (e) {}
            }
            if (item.section === 'gallery' && item.content) {
              try {
                setGallery(JSON.parse(item.content))
              } catch (e) {}
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch home content')
      }
    }

    fetchContent()

    // Scroll Reveal Intersection Observer
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible')
        }
      })
    }, observerOptions)

    const targets = document.querySelectorAll('.reveal-on-scroll')
    targets.forEach(target => observer.observe(target))

    return () => observer.disconnect()
  }, [])

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({
        title: "Perhatian",
        description: "Mohon lengkapi nama, email, dan pesan Anda.",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      })

      if (response.ok) {
        toast({
          title: "Pesan Terkirim!",
          description: "Terima kasih, kami akan segera menghubungi Anda.",
        })
        setContactForm({ name: '', email: '', subject: '', message: '' })
      } else {
        throw new Error('Gagal mengirim pesan')
      }
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Maaf, terjadi kesalahan saat mengirim pesan.",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform overflow-hidden p-1.5 border border-slate-100">
                <img src="/padepokan-logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-[#1E293B] tracking-tight leading-none">Satria Pinayungan</h1>
                <p className="text-xs md:text-sm text-slate-400 uppercase tracking-widest font-bold mt-1">Ragas Grenyang</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-10">
              {['Beranda', 'Profil', 'Kegiatan', 'Anggota', 'Galeri', 'Kontak'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className="text-base md:text-lg font-extrabold text-slate-600 hover:text-[#5E17EB] transition-colors relative group/link"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#5E17EB] transition-all group-hover/link:w-full"></span>
                </a>
              ))}
              <Link href="/login">
                <Button className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl font-black px-8 h-12 text-base shadow-lg shadow-[#5E17EB]/20 transition-all hover:scale-105 active:scale-95">
                  Portal Admin
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-600 h-12 w-12 rounded-xl"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="p-6 space-y-4">
              {['Beranda', 'Profil', 'Kegiatan', 'Anggota', 'Galeri', 'Kontak'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-lg font-bold text-slate-600 hover:text-[#5E17EB] px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {item}
                </a>
              ))}
              <div className="pt-4">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#5E17EB] text-white rounded-xl font-black h-14 text-lg shadow-lg shadow-[#5E17EB]/20">
                    Portal Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={hero.imageUrl ? { backgroundImage: `url(${hero.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {hero.imageUrl && <div className="absolute inset-0 bg-white/90 backdrop-blur-xs"></div>}

        {/* Animated Background Elements */}
        {!hero.imageUrl && (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#5E17EB]/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2 animate-float-delayed"></div>
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-purple-400/5 rounded-full blur-[80px] -z-10 -translate-x-1/2 -translate-y-1/2 animate-pulse-soft"></div>
          </>
        )}
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-10 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8">
            <div className="relative inline-block group">
               <div className="absolute inset-0 bg-[#5E17EB]/20 rounded-full blur-2xl transform scale-150 group-hover:scale-175 transition-transform duration-1000 opacity-50"></div>
               <img 
                 src="/padepokan-logo.png" 
                 alt="Padepokan Logo" 
                 className="relative w-48 h-48 md:w-72 md:h-72 mx-auto object-contain drop-shadow-2xl transform hover:scale-110 hover:rotate-2 transition-all duration-700 pointer-events-auto cursor-zoom-in"
               />
            </div>
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            <Badge className="inline-flex mb-8 px-4 py-2 md:px-5 md:py-2 rounded-full bg-[#5E17EB]/10 text-[#5E17EB] border-none font-bold text-[10px] md:text-sm uppercase tracking-widest shadow-sm hover:bg-[#5E17EB]/20 transition-colors cursor-default whitespace-normal text-center leading-relaxed h-auto">
              {hero.subtitle}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-none tracking-tight">
              {hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
              {hero.description}
            </p>
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500 fill-mode-both flex justify-center">
             <a href="#nilai-luhur" className="cursor-pointer group">
               <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center animate-bounce mt-10 transition-colors group-hover:border-[#5E17EB] group-hover:bg-[#5E17EB]/5">
                  <ChevronRight className="h-6 w-6 text-slate-400 rotate-90 group-hover:text-[#5E17EB] transition-colors" />
               </div>
             </a>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="nilai-luhur" className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 reveal-on-scroll">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Nilai-Nilai Luhur</h2>
            <div className="w-24 h-2 bg-[#5E17EB] mx-auto rounded-full mb-8"></div>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Tiga pilar utama yang menjadi fondasi setiap prajurit Padepokan Satria Pinayungan
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: 'Ketegasan', icon: Shield, desc: 'Membangun karakter yang kuat, berani, dan tegas dalam menghadapi tantangan hidup.', color: 'from-blue-600 to-[#5E17EB]', delay: '0' },
              { title: 'Persaudaraan', icon: Heart, desc: 'Menjalin kekeluargaan dan persaudaraan yang erat di antara sesama anggota.', color: 'from-purple-600 to-indigo-700', delay: '150' },
              { title: 'Kebudayaan', icon: Sword, desc: 'Melestarikan warisan budaya dan seni bela diri tradisional Indonesia secara turun-temurun.', color: 'from-indigo-500 to-blue-700', delay: '300' }
            ].map((item, i) => (
              <Card 
                key={i} 
                className="reveal-on-scroll border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[3rem] bg-white hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 group overflow-hidden"
                style={{ transitionDelay: `${item.delay}ms` }}
              >
                <div className={`h-2 w-full bg-linear-to-r ${item.color}`}></div>
                <CardHeader className="pt-12 pb-6 text-center">
                  <div className={`w-24 h-24 bg-linear-to-br ${item.color} rounded-4xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-100 group-hover:rotate-6 transition-all duration-500`}>
                    <item.icon className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-black text-slate-900 mb-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-12 px-10 text-center text-slate-500 font-medium leading-relaxed text-lg">
                  {item.desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section id="profil" className="py-32 px-4 sm:px-6 lg:px-8 bg-[#F8F9FC] relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#5E17EB]/5 rounded-full blur-[120px] animate-pulse-soft"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 reveal-on-scroll">
              <Badge className="mb-6 bg-blue-100 text-[#5E17EB] border-none font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-lg">Eksistensi & Dedikasi</Badge>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
                Kisah Perjalanan & <br />
                <span className="text-[#5E17EB]">Filosofi Ragas Grenyang</span>
              </h2>
              <p className="text-xl text-slate-500 mb-10 font-medium leading-relaxed">
                Padepokan Satria Pinayungan Ragas Grenyang didirikan untuk melestarikan 
                seni bela diri tradisional Indonesia. Nama <span className="text-slate-900 font-black">"Pinayungan"</span> berarti naungan, 
                sedangkan <span className="text-[#5E17EB] font-black">"Ragas Grenyang"</span> melambangkan gerakan dinamis penuh tenaga batin yang meledak namun tetap terkendali.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="p-8 bg-white rounded-4xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                  <h4 className="text-4xl font-black text-[#5E17EB] mb-2 group-hover:scale-110 transition-transform inline-block">{profile.yearsExp}</h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tahun Berdiri</p>
                </div>
                <div className="p-8 bg-white rounded-4xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                  <h4 className="text-4xl font-black text-[#5E17EB] mb-2 group-hover:scale-110 transition-transform inline-block">{profile.graduates}</h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lulusan Anggota</p>
                </div>
              </div>

              <div className="flex space-x-2 p-1.5 bg-white/50 backdrop-blur-md rounded-2xl border border-white mb-8">
                {['visi', 'misi', 'filosofi'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 rounded-xl text-sm font-black capitalize transition-all duration-300 ${
                      activeTab === tab 
                        ? 'bg-[#5E17EB] text-white shadow-xl shadow-[#5E17EB]/30 scale-[1.02]' 
                        : 'text-slate-400 hover:bg-white hover:text-[#5E17EB]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[220px] transition-all duration-500 reveal-on-scroll">
                {activeTab === 'visi' && (
                  <div className="animate-in fade-in duration-500">
                    <p className="text-xl text-slate-600 font-medium leading-relaxed italic border-l-4 border-[#5E17EB] pl-6 py-2">
                      {profile.visi}
                    </p>
                  </div>
                )}
                {activeTab === 'misi' && (
                  <div className="animate-in fade-in duration-500">
                    <ul className="space-y-5 text-lg text-slate-600 font-medium">
                      {profile.misi.map((m, i) => (
                        <li key={i} className="flex items-start"><div className="w-2.5 h-2.5 bg-[#5E17EB] rounded-full mr-5 mt-2.5 shrink-0 shadow-[0_0_12px_#5E17EB]"></div>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeTab === 'filosofi' && (
                  <div className="animate-in fade-in duration-500">
                    <p className="text-xl text-slate-600 font-medium leading-relaxed">
                      {profile.filosofi}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 relative group reveal-on-scroll">
              <div className="absolute inset-0 bg-linear-to-tr from-[#5E17EB] to-blue-400 rounded-[4rem] blur-[60px] opacity-20 group-hover:opacity-30 transition-all duration-1000 group-hover:scale-105"></div>
              <div className="relative aspect-4/5 bg-slate-200 rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white group-hover:rotate-1 transition-all duration-700">
                 <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
                 <div className="absolute bottom-12 left-12 right-12 text-white">
                    <Badge className="bg-white/20 backdrop-blur-md border-none mb-4 font-bold rounded-lg px-3 py-1">Pusat Latihan</Badge>
                    <h3 className="text-3xl md:text-4xl font-black leading-tight group-hover:translate-x-2 transition-transform duration-500">Kesatriaan Utama <br />Ragas Grenyang</h3>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Preview */}
      <section id="kegiatan" className="py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 reveal-on-scroll">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{activities.title}</h2>
              <p className="text-xl text-slate-500 mt-6 font-medium max-w-xl">{activities.description}</p>
            </div>
            
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {activities.items.map((act: any, i) => {
               const IconComponent = IconMap[act.icon] || Users
               return (
                <div key={i} className="reveal-on-scroll group p-10 bg-[#F8F9FC] rounded-[3rem] hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-slate-100 flex flex-col justify-between" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div>
                    <div className={`w-16 h-16 ${act.color} rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-4">{act.title}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed mb-6 text-base group-hover:text-slate-600 transition-colors">{act.desc}</p>
                  </div>
                  <Badge className="bg-white text-[#5E17EB] border border-blue-50 font-black rounded-full px-5 py-2 text-sm shadow-sm w-fit self-start">{act.time}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Mini Section */}
      <section id="anggota" className="py-24 bg-[#5E17EB] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 animate-float" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center text-white reveal-on-scroll" style={{ transitionDelay: `${i * 100}ms` }}>
                <h3 className="text-5xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-lg">{stat.val}</h3>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeri" className="py-32 px-4 sm:px-6 lg:px-8 bg-[#F8F9FC] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 reveal-on-scroll">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Galeri <span className="text-[#5E17EB]">Dinamika Padepokan</span></h2>
            <div className="w-24 h-2 bg-[#5E17EB] mx-auto rounded-full mb-8"></div>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Dokumentasi visual perjalanan, semangat juang, dan kebersamaan keluarga besar Satria Pinayungan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {gallery.map((item, i) => (
              <div 
                key={i} 
                className="reveal-on-scroll group relative bg-white rounded-[3rem] overflow-hidden shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-700"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="aspect-4/3 overflow-hidden relative">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-6 text-center">
                    <Button 
                      variant="secondary" 
                      className="rounded-full h-14 w-14 p-0 bg-white/30 backdrop-blur-xl text-white border-none transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500 cursor-pointer hover:bg-white/50"
                      onClick={() => setSelectedImage(item.img)}
                    >
                      <Maximize2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <Badge className="absolute top-6 left-6 bg-white/95 backdrop-blur-md text-[#5E17EB] border-none font-black rounded-xl px-4 py-2 shadow-xl">
                    {item.cat}
                  </Badge>
                </div>
                <div className="p-10">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-[#5E17EB] transition-colors duration-300 leading-tight">{item.title}</h3>
                  <div className="mt-4 flex items-center text-[#5E17EB] font-bold text-sm">
                    Lihat Dokumentasi <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>


        </div>
      </section>

      {/* Contact Section */}
      <section id="kontak" className="py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="reveal-on-scroll">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight leading-tight">Mulai Perjalanan <br /> <span className="text-[#5E17EB]">Baru Anda</span></h2>
              <p className="text-xl text-slate-500 mb-12 font-medium leading-relaxed max-w-xl">
                Jadilah bagian dari penjaga warisan budaya bangsa. Hubungi humas kami untuk konsultasi pendaftaran atau jadwal kunjungan padepokan.
              </p>
              
              <div className="space-y-8">
                {[
                  { icon: MapPin, title: 'Lokasi Padepokan', detail: 'Jl. Nasional XIX, Desa Argawana, Banten, Indonesia', color: 'bg-blue-50 text-blue-600' },
                  { icon: Phone, title: 'Konsultasi (WA)', detail: '+62 89647565908', color: 'bg-green-50 text-green-600' },
                  { icon: Mail, title: 'Korespondensi', detail: 'arirusmawan418@gmail.com', color: 'bg-purple-50 text-purple-600' }
                ].map((info, i) => (
                  <div key={i} className="flex items-center space-x-6 group">
                    <div className={`w-14 h-14 ${info.color} rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                      <info.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{info.title}</p>
                      <p className="text-xl text-slate-900 font-black tracking-tight">{info.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex space-x-6">
                {[Facebook, Instagram, Youtube].map((Icon, i) => (
                  <Button key={i} variant="ghost" size="icon" className="w-14 h-14 rounded-2xl bg-slate-50 hover:bg-[#5E17EB] text-slate-400 hover:text-white transition-all shadow-sm">
                    <Icon className="h-6 w-6" />
                  </Button>
                ))}
              </div>
            </div>

            <Card className="reveal-on-scroll border-none shadow-[0_40px_100px_rgba(94,23,235,0.08)] rounded-[3.5rem] p-10 md:p-14 bg-[#F8F9FC] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#5E17EB]/5 rounded-bl-full transform group-hover:scale-150 transition-transform duration-1000"></div>
              <CardHeader className="p-0 mb-10 text-center lg:text-left">
                <CardTitle className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Kirim Pesan Langsung</CardTitle>
                <CardDescription className="text-lg text-slate-500 font-medium">Tim kami akan merespons dalam waktu kurang dari 24 jam.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Nama Lengkap</label>
                    <input 
                      className="w-full h-16 px-6 rounded-2xl border-white bg-white shadow-sm focus:ring-4 focus:ring-[#5E17EB]/10 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300" 
                      placeholder="Andi Pratama"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Alamat Email</label>
                    <input 
                      className="w-full h-16 px-6 rounded-2xl border-white bg-white shadow-sm focus:ring-4 focus:ring-[#5E17EB]/10 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300" 
                      placeholder="andi@mail.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Subjek Pesan</label>
                  <input 
                    className="w-full h-16 px-6 rounded-2xl border-white bg-white shadow-sm focus:ring-4 focus:ring-[#5E17EB]/10 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300" 
                    placeholder="Pertanyaan Pendaftaran"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Pesan Anda</label>
                  <textarea 
                    className="w-full min-h-[160px] p-6 rounded-2xl border-white bg-white shadow-sm focus:ring-4 focus:ring-[#5E17EB]/10 outline-none font-bold text-slate-900 transition-all resize-none placeholder:text-slate-300" 
                    placeholder="Tuliskan di sini..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={handleContactSubmit}
                  disabled={sending}
                  className="w-full h-18 bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-3xl font-black text-xl shadow-2xl shadow-[#5E17EB]/30 mt-6 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center">
                  {sending ? (
                    <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Kirim Pesan Sekarang
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#5E17EB] to-transparent opacity-30"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-4 mb-10 group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-2xl group-hover:rotate-6 transition-transform duration-500">
                  <img src="/padepokan-logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-2xl tracking-tight leading-none">Satria Pinayungan</h3>
                  <p className="text-white/50 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Ragas Grenyang</p>
                </div>
              </div>
              <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10 pr-4">
                Menjaga dan melestarikan warisan silat Ragas Grenyang yang menjunjung tinggi kebenaran, ketegasan, and persaudaraan abadi.
              </p>
              <div className="flex space-x-4">
                {[Facebook, Instagram, Youtube].map((Icon, i) => (
                  <Button key={i} variant="ghost" size="icon" className="w-12 h-12 rounded-xl bg-white/5 hover:bg-[#5E17EB] text-white transition-all transform hover:-translate-y-1">
                    <Icon className="h-5 w-5" />
                  </Button>
                ))}
              </div>
            </div>

            {[
              { name: 'Menu Navigasi', items: ['Visi Misi', 'Sejarah', 'Jadwal Latihan', 'Pendaftaran Anggota'] },
              { name: 'Cabang Utama', items: ['Pusat Banten'] },
              { name: 'Informasi Legal', items: ['AD / ART Padepokan', 'Kebijakan Privasi', 'Syarat & Ketentuan', 'Struktur Organisasi'] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-black text-sm uppercase tracking-[0.3em] text-[#5E17EB] mb-10">{col.name}</h4>
                <ul className="space-y-6">
                  {col.items.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 font-bold hover:text-white transition-all text-base flex items-center group">
                        <div className="w-1.5 h-1.5 bg-[#5E17EB] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Separator className="my-20 bg-white/5" />

          <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 font-black text-xs uppercase tracking-[0.4em]">
            <p>© 2026 Padepokan Satria Pinayungan. Created by <a href="https://arwan.id" target="_blank" rel="noopener noreferrer" className="text-[#5E17EB] hover:text-white transition-colors">Ari rusmawan</a>.</p>
            <div className="flex space-x-12 mt-8 md:mt-0">
               <span className="hover:text-white cursor-pointer transition-colors">Digital Portal</span>
               <span className="hover:text-white cursor-pointer transition-colors">Member Link</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Image Modal/Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-10 w-10" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full View" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}