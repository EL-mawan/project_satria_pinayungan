'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Home, Save, FileText, AlertCircle, Mail, Trash2, Eye, EyeOff, Clock, User, Phone, Plus, X, Image as ImageIcon, LayoutList, BarChart3, Target } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ContentSection {
  id?: string
  section: string
  title?: string
  subtitle?: string
  description?: string
  imageUrl?: string
  content?: string
}

interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  isRead: boolean
  createdAt: string
}

interface ActivityItem {
  title: string
  icon: string
  time: string
  desc: string
  color: string
}

interface GalleryItem {
  title: string
  cat: string
  img: string
}

interface StatItem {
  label: string
  val: string
}

export default function HomeContentPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

  const [heroContent, setHeroContent] = useState<ContentSection>({
    section: 'hero',
    title: 'Padepokan Satria Pinayungan Ragas Grenyang',
    subtitle: 'Melestarikan Budaya, Membentuk Karakter',
    description: 'Bergabunglah dengan kami dalam perjalanan spiritual dan fisik untuk menguasai seni bela diri tradisional Nusantara.',
    imageUrl: ''
  })

  const [aboutContent, setAboutContent] = useState<ContentSection>({
    section: 'about',
    title: 'Tentang Padepokan',
    description: 'Padepokan Satria Pinayungan Ragas Grenyang adalah wadah pelestarian seni bela diri tradisional yang mengedepankan nilai-nilai luhur budaya Nusantara.'
  })

  const [profileContent, setProfileContent] = useState<ContentSection>({
    section: 'profile',
    content: JSON.stringify({
      shortDesc: '...',
      visi: '...',
      misi: ['...'],
      filosofi: '...'
    })
  })

  const [activitiesContent, setActivitiesContent] = useState<ContentSection>({
    section: 'activities',
    title: 'Agenda & Kegiatan Pekanan',
    description: 'Program rutin pengembangan teknik, spiritual, dan kedisiplinan setiap anggota.',
    content: JSON.stringify([])
  })

  // Parsed states for complex JSON content to make editing easier
  const [parsedProfile, setParsedProfile] = useState({
    shortDesc: '',
    visi: '',
    misi: [''],
    filosofi: '',
    yearsExp: '15+',
    graduates: '500+'
  })

  const [parsedActivities, setParsedActivities] = useState<ActivityItem[]>([
    { title: 'Latihan Rutin', icon: 'Users', time: 'Minggu, 06:00', desc: 'Pengasahan teknik dasar.', color: 'bg-blue-50 text-blue-600' }
  ])

  const [parsedStats, setParsedStats] = useState<StatItem[]>([
    { label: 'Anggota Aktif', val: '250+' },
    { label: 'Cabang Daerah', val: '08' },
    { label: 'Pelatih Ahli', val: '12' },
    { label: 'Penghargaan', val: '45' }
  ])

  const [parsedGallery, setParsedGallery] = useState<GalleryItem[]>([
    { title: 'Semangat Latihan', cat: 'Latihan Rutin', img: '/gallery-1.png' }
  ])

  useEffect(() => {
    fetchContent()
    fetchMessages()
  }, [])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/home-content', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { data } = await response.json()
        
        data.forEach((item: ContentSection) => {
          if (item.section === 'hero') setHeroContent(item)
          if (item.section === 'about') setAboutContent(item)
          
          if (item.section === 'profile') {
            setProfileContent(item)
            if (item.content) {
              try {
                const parsed = JSON.parse(item.content)
                setParsedProfile(parsed)
              } catch (e) {
                console.error('Error parsing profile content')
              }
            }
          }

          if (item.section === 'activities') {
            setActivitiesContent(item)
            if (item.content) {
              try {
                const parsed = JSON.parse(item.content)
                setParsedActivities(parsed)
              } catch (e) { console.error(e) }
            }
          }

          if (item.section === 'stats') {
             if (item.content) {
               try {
                 setParsedStats(JSON.parse(item.content))
               } catch (e) { console.error(e) }
             }
          }

          if (item.section === 'gallery') {
            if (item.content) {
              try {
                setParsedGallery(JSON.parse(item.content))
              } catch (e) { console.error(e) }
            }
          }
        })
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/contact-messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { data, unreadCount: count } = await response.json()
        setMessages(data)
        setUnreadCount(count)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const saveContent = async (section: string, data?: any) => {
    setSaving(true)
    let contentToSave: ContentSection | null = null

    if (section === 'hero') contentToSave = heroContent
    if (section === 'about') contentToSave = aboutContent
    if (section === 'profile') {
      contentToSave = { ...profileContent, content: JSON.stringify(parsedProfile) }
    }
    if (section === 'activities') {
      contentToSave = { ...activitiesContent, content: JSON.stringify(parsedActivities) }
    }
    if (section === 'stats') {
      contentToSave = { section: 'stats', content: JSON.stringify(parsedStats) }
    }
    if (section === 'gallery') {
      contentToSave = { section: 'gallery', content: JSON.stringify(parsedGallery) }
    }

    if (!contentToSave) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/home-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contentToSave)
      })

      const resData = await response.json()

      if (response.ok) {
        toast({
          title: "Berhasil!",
          description: "Konten berhasil diperbarui",
        })
      } else {
        toast({
          title: "Gagal!",
          description: resData.error || "Terjadi kesalahan",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error!",
        description: "Terjadi kesalahan sistem",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleReadStatus = async (messageId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/contact-messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: !currentStatus })
      })

      if (response.ok) {
        fetchMessages()
        toast({
          title: "Berhasil!",
          description: `Pesan ditandai sebagai ${!currentStatus ? 'sudah dibaca' : 'belum dibaca'}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error!",
        description: "Gagal mengubah status pesan",
        variant: "destructive"
      })
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/contact-messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchMessages()
        toast({
          title: "Berhasil!",
          description: "Pesan berhasil dihapus",
        })
      }
    } catch (error) {
      toast({
        title: "Error!",
        description: "Gagal menghapus pesan",
        variant: "destructive"
      })
    }
  }

  const handleMisiChange = (index: number, value: string) => {
    const newMisi = [...parsedProfile.misi]
    newMisi[index] = value
    setParsedProfile({ ...parsedProfile, misi: newMisi })
  }

  const addMisi = () => {
    setParsedProfile({ ...parsedProfile, misi: [...parsedProfile.misi, ''] })
  }

  const removeMisi = (index: number) => {
    const newMisi = parsedProfile.misi.filter((_, i) => i !== index)
    setParsedProfile({ ...parsedProfile, misi: newMisi })
  }

  const updateActivity = (index: number, field: string, value: string) => {
    const newItems = [...parsedActivities]
    newItems[index] = { ...newItems[index], [field]: value }
    setParsedActivities(newItems)
  }

  const addActivity = () => {
    setParsedActivities([...parsedActivities, { title: 'Kegiatan Baru', icon: 'Users', time: 'Waktu', desc: 'Deskripsi', color: 'bg-blue-50 text-blue-600' }])
  }

  const removeActivity = (index: number) => {
    setParsedActivities(parsedActivities.filter((_, i) => i !== index))
  }

  const updateStat = (index: number, field: string, value: string) => {
      const newStats = [...parsedStats]
      newStats[index] = { ...newStats[index], [field]: value }
      setParsedStats(newStats)
  }

  const updateGallery = (index: number, field: string, value: string) => {
    const newItems = [...parsedGallery]
    newItems[index] = { ...newItems[index], [field]: value }
    setParsedGallery(newItems)
  }

  const addGallery = () => {
    setParsedGallery([...parsedGallery, { title: 'Foto Baru', cat: 'Kategori', img: '' }])
  }

  const removeGallery = (index: number) => {
    setParsedGallery(parsedGallery.filter((_, i) => i !== index))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E17EB] mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Memuat konten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-[#5E17EB]/10 rounded-2xl flex items-center justify-center">
            <Home className="h-6 w-6 text-[#5E17EB]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Kelola Konten Halaman Utama</h1>
            <p className="text-slate-500 font-medium">Edit teks, kegiatan, galeri, dan kelola pesan masuk</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="flex w-full flex-wrap h-auto gap-2 p-1 bg-slate-100/50 rounded-xl">
          <TabsTrigger value="hero" className="font-bold flex-1">Hero</TabsTrigger>
          <TabsTrigger value="profile" className="font-bold flex-1">Profil</TabsTrigger>
          <TabsTrigger value="activities" className="font-bold flex-1">Kegiatan</TabsTrigger>
          <TabsTrigger value="stats" className="font-bold flex-1">Statistik</TabsTrigger>
          <TabsTrigger value="gallery" className="font-bold flex-1">Galeri</TabsTrigger>
          <TabsTrigger value="messages" className="font-bold flex-1 relative">
            Pesan
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 rounded-full">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-linear-to-r from-[#5E17EB]/5 to-purple-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-[#5E17EB]" />
                <span>Hero Section</span>
              </CardTitle>
              <CardDescription>Bagian utama yang pertama kali dilihat pengunjung</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Judul Utama</Label>
                <Input
                  id="hero-title"
                  value={heroContent.title || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, title: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Subjudul</Label>
                <Input
                  id="hero-subtitle"
                  value={heroContent.subtitle || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-description">Deskripsi</Label>
                <Textarea
                  id="hero-description"
                  value={heroContent.description || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, description: e.target.value })}
                  className="min-h-[120px] rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-image">URL Gambar Background (Opsional)</Label>
                <Input
                  id="hero-image"
                  value={heroContent.imageUrl || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, imageUrl: e.target.value })}
                  className="h-12 rounded-xl"
                  placeholder="/hero-bg.jpg"
                />
              </div>

              <Button onClick={() => saveContent('hero')} disabled={saving} className="w-full h-12 rounded-xl font-bold bg-[#5E17EB]">
                {saving ? 'Menyimpan...' : 'Simpan Hero'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Section */}
        <TabsContent value="profile">
          <Card className="border-none shadow-xl">
             <CardHeader className="bg-linear-to-r from-[#5E17EB]/5 to-purple-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-[#5E17EB]" />
                <span>Profil & Filosofi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Tahun Berdiri (Statistik)</Label>
                   <Input 
                      value={parsedProfile.yearsExp} 
                      onChange={(e) => setParsedProfile({...parsedProfile, yearsExp: e.target.value})}
                      className="rounded-xl"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Jumlah Lulusan (Statistik)</Label>
                   <Input 
                      value={parsedProfile.graduates} 
                      onChange={(e) => setParsedProfile({...parsedProfile, graduates: e.target.value})}
                      className="rounded-xl"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                   <Label>Visi</Label>
                   <Textarea 
                      value={parsedProfile.visi} 
                      onChange={(e) => setParsedProfile({...parsedProfile, visi: e.target.value})}
                      className="rounded-xl"
                   />
               </div>

               <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <Label>Misi</Label>
                     <Button type="button" variant="outline" size="sm" onClick={addMisi}><Plus className="h-3 w-3 mr-1" /> Tambah</Button>
                   </div>
                   {parsedProfile.misi.map((m, i) => (
                     <div key={i} className="flex gap-2">
                       <Input value={m} onChange={(e) => handleMisiChange(i, e.target.value)} className="rounded-xl" />
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeMisi(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                     </div>
                   ))}
               </div>

               <div className="space-y-2">
                   <Label>Filosofi</Label>
                   <Textarea 
                      value={parsedProfile.filosofi} 
                      onChange={(e) => setParsedProfile({...parsedProfile, filosofi: e.target.value})}
                      className="rounded-xl min-h-[100px]"
                   />
               </div>

               <Button onClick={() => saveContent('profile')} disabled={saving} className="w-full h-12 rounded-xl font-bold bg-[#5E17EB]">
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Section */}
        <TabsContent value="activities">
          <Card className="border-none shadow-xl">
             <CardHeader className="bg-linear-to-r from-[#5E17EB]/5 to-purple-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <LayoutList className="h-5 w-5 text-[#5E17EB]" />
                <span>Kegiatan Pekanan (Preview)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Judul Seksi</Label>
                  <Input 
                    value={activitiesContent.title || ''} 
                    onChange={(e) => setActivitiesContent({...activitiesContent, title: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi Seksi</Label>
                  <Textarea
                    value={activitiesContent.description || ''} 
                    onChange={(e) => setActivitiesContent({...activitiesContent, description: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Daftar Kegiatan</Label>
                  {parsedActivities.map((act, i) => (
                    <Card key={i} className="p-4 border border-slate-200">
                      <div className="grid md:grid-cols-2 gap-4 mb-2">
                         <div className="space-y-1">
                           <Label className="text-xs">Judul</Label>
                           <Input value={act.title} onChange={(e) => updateActivity(i, 'title', e.target.value)} className="h-9" />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">Waktu</Label>
                           <Input value={act.time} onChange={(e) => updateActivity(i, 'time', e.target.value)} className="h-9" />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">Icon (Lucide Name)</Label>
                            <select 
                             className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                             value={act.icon}
                             onChange={(e) => updateActivity(i, 'icon', e.target.value)}
                            >
                              <option value="Users">Users</option>
                              <option value="Award">Award</option>
                              <option value="Calendar">Calendar</option>
                              <option value="Target">Target</option>
                              <option value="Star">Star</option>
                              <option value="Zap">Zap</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">Warna (Preview Class)</Label>
                           <Input value={act.color} onChange={(e) => updateActivity(i, 'color', e.target.value)} className="h-9" placeholder="bg-blue-50 text-blue-600" />
                         </div>
                      </div>
                      <div className="space-y-1 mb-2">
                         <Label className="text-xs">Deskripsi Singkat</Label>
                         <Input value={act.desc} onChange={(e) => updateActivity(i, 'desc', e.target.value)} className="h-9" />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeActivity(i)} className="text-red-500 w-full h-8"><Trash2 className="h-3 w-3 mr-1"/> Hapus</Button>
                    </Card>
                  ))}
                  <Button variant="outline" onClick={addActivity} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Kegiatan
                  </Button>
                </div>

              <Button onClick={() => saveContent('activities')} disabled={saving} className="w-full h-12 rounded-xl font-bold bg-[#5E17EB]">
                {saving ? 'Menyimpan...' : 'Simpan Kegiatan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Section */}
        <TabsContent value="stats">
           <Card className="border-none shadow-xl">
             <CardHeader className="bg-linear-to-r from-[#5E17EB]/5 to-purple-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-[#5E17EB]" />
                <span>Statistik Anggota</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {parsedStats.map((stat, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-2">
                      <Label>Label {i+1}</Label>
                      <Input value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} className="mb-2" />
                      <Label>Nilai {i+1}</Label>
                      <Input value={stat.val} onChange={(e) => updateStat(i, 'val', e.target.value)} />
                    </div>
                  ))}
                </div>
               <Button onClick={() => saveContent('stats')} disabled={saving} className="w-full h-12 rounded-xl font-bold bg-[#5E17EB]">
                {saving ? 'Menyimpan...' : 'Simpan Statistik'}
              </Button>
            </CardContent>
           </Card>
        </TabsContent>

         {/* Gallery Section */}
         <TabsContent value="gallery">
           <Card className="border-none shadow-xl">
             <CardHeader className="bg-linear-to-r from-[#5E17EB]/5 to-purple-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-[#5E17EB]" />
                <span>Highlight Galeri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {parsedGallery.map((item, i) => (
                     <Card key={i} className="p-4 border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                       <div className="space-y-3 mb-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Judul</Label>
                            <Input value={item.title} onChange={(e) => updateGallery(i, 'title', e.target.value)} className="h-8 text-xs rounded-lg" placeholder="Judul foto..." />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Kategori</Label>
                            <Input value={item.cat} onChange={(e) => updateGallery(i, 'cat', e.target.value)} className="h-8 text-xs rounded-lg" placeholder="Contoh: Latihan" />
                          </div>
                       
                          <div className="space-y-1">
                             <Label className="text-xs">Gambar</Label>
                             <div className="relative group/image">
                               <Input 
                                 type="file" 
                                 accept="image/*"
                                 onChange={(e) => {
                                   const file = e.target.files?.[0]
                                   if (file) {
                                     const reader = new FileReader()
                                     reader.onloadend = () => {
                                       updateGallery(i, 'img', reader.result as string)
                                     }
                                     reader.readAsDataURL(file)
                                   }
                                 }}
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                               />
                               <div className="h-32 w-full rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 group-hover/image:bg-slate-100 transition-colors overflow-hidden">
                                  {item.img ? (
                                    <img src={item.img} alt="Preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-center p-2">
                                      <ImageIcon className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                                      <span className="text-[10px] text-slate-400">Klik untuk upload</span>
                                    </div>
                                  )}
                               </div>
                             </div>
                          </div>
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => removeGallery(i)} className="text-red-500 w-full h-8 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 className="h-3 w-3 mr-1"/> Hapus</Button>
                     </Card>
                   ))}
                   
                   <Button variant="outline" onClick={addGallery} className="h-auto min-h-[250px] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-[#5E17EB] hover:border-[#5E17EB]/30 transition-all rounded-xl">
                     <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                       <Plus className="h-5 w-5" />
                     </div>
                     <span className="text-sm font-medium">Tambah Galeri</span>
                   </Button>
                </div>

               <Button onClick={() => saveContent('gallery')} disabled={saving} className="w-full h-12 rounded-xl font-bold bg-[#5E17EB]">
                {saving ? 'Menyimpan...' : 'Simpan Galeri'}
              </Button>
            </CardContent>
           </Card>
        </TabsContent>

        {/* Messages Section */}
        <TabsContent value="messages">
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-linear-to-r from-[#5E17EB]/5 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-[#5E17EB]" />
                    <span>Pesan Masuk</span>
                  </CardTitle>
                  <CardDescription>Pesan dari form kontak di halaman utama</CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {unreadCount} Belum Dibaca
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Belum ada pesan masuk</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <Card key={msg.id} className={`${!msg.isRead ? 'border-[#5E17EB] bg-[#5E17EB]/5' : 'border-slate-200'}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4 text-slate-500" />
                              <span className="font-bold text-slate-900">{msg.name}</span>
                              {!msg.isRead && (
                                <Badge className="bg-red-500 text-white text-xs">Baru</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{msg.email}</span>
                              </div>
                              {msg.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{msg.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(msg.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleReadStatus(msg.id, msg.isRead)}
                              className="h-8 w-8 p-0"
                            >
                              {msg.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMessage(msg.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {msg.subject && (
                          <p className="font-bold text-slate-700 mb-2">Subjek: {msg.subject}</p>
                        )}
                        <p className="text-slate-600 whitespace-pre-wrap">{msg.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert className="mt-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 font-medium">
          Perubahan konten akan langsung terlihat di halaman utama. Pesan yang masuk akan muncul secara real-time.
        </AlertDescription>
      </Alert>
    </div>
  )
}
