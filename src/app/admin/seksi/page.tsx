'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Tags,
  Plus, 
  Shield, 
  Search, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Info, 
  Loader2,
  ListChecks,
  UserCircle,
  Briefcase,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface AnggotaSummary {
  id: string
  namaLengkap: string
  jenjang: string
}

interface Seksi {
  id: string
  nama: string
  bidang: string | null
  deskripsi: string | null
  tugas: string | null
  ketuaId: string | null
  ketua?: AnggotaSummary | null
  anggota?: AnggotaSummary[]
  peralatan?: any[]
  _count?: {
    anggota: number
    peralatan: number
  }
  createdAt: string
}

export default function SeksiPage() {
  // Data States
  const [seksiList, setSeksiList] = useState<Seksi[]>([])
  const [anggotaOptions, setAnggotaOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Filter States
  const [search, setSearch] = useState('')
  const [filterBidang, setFilterBidang] = useState('ALL')

  // Dialog & Selection States
  const [selectedSeksi, setSelectedSeksi] = useState<Seksi | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [formData, setFormData] = useState({
    nama: '',
    bidang: 'Umum',
    deskripsi: '',
    tugas: '',
    ketuaId: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setCurrentUser(JSON.parse(userData))
    fetchSeksi()
    fetchAnggotaOptions()
  }, [])

  const fetchSeksi = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/seksi', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSeksiList(data.data)
      }
    } catch (error) {
      toast.error('Gagal memuat data seksi')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnggotaOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/anggota', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAnggotaOptions(data)
      }
    } catch (error) {
      console.error('Error fetching anggota:', error)
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!formData.nama) {
      toast.error('Nama seksi wajib diisi')
      return
    }

    try {
      setSubmitLoading(true)
      const token = localStorage.getItem('token')
      const url = editingId ? `/api/seksi/${editingId}` : '/api/seksi'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
           ...formData,
           ketuaId: formData.ketuaId === 'none' ? null : formData.ketuaId
        })
      })

      if (response.ok) {
        toast.success(editingId ? 'Seksi berhasil diperbarui' : 'Seksi berhasil ditambahkan')
        setShowFormDialog(false)
        resetForm()
        fetchSeksi()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Terjadi kesalahan')
      }
    } catch (error) {
      toast.error('Kesalahan server')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteSeksi = async (id: string) => {
    if (!confirm('Hapus seksi ini? Seluruh data terkait akan terpengaruh.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/seksi/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Seksi berhasil dihapus')
        fetchSeksi()
      } else {
        toast.error('Gagal menghapus seksi')
      }
    } catch (error) {
      toast.error('Kesalahan server')
    }
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      bidang: 'Umum',
      deskripsi: '',
      tugas: '',
      ketuaId: ''
    })
    setEditingId(null)
  }

  const handleEdit = (seksi: Seksi) => {
    setFormData({
      nama: seksi.nama,
      bidang: seksi.bidang || 'Umum',
      deskripsi: seksi.deskripsi || '',
      tugas: seksi.tugas || '',
      ketuaId: seksi.ketuaId || 'none'
    })
    setEditingId(seksi.id)
    setShowFormDialog(true)
  }

  const openDetail = async (id: string) => {
    try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/seksi/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
            const data = await response.json()
            setSelectedSeksi(data.data)
            setShowDetailDialog(true)
        }
    } catch (error) {
        toast.error('Gagal memuat detail seksi')
    }
  }

  const filteredSeksi = seksiList.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || 
                          (s.bidang && s.bidang.toLowerCase().includes(search.toLowerCase()))
    const matchesBidang = filterBidang === 'ALL' || s.bidang === filterBidang
    return matchesSearch && matchesBidang
  })

  // Grouping for unique bidang list
  const uniqueBidang = Array.from(new Set(seksiList.map(s => s.bidang).filter(Boolean)))

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seksi & Bidang</h1>
          <p className="text-slate-500 font-medium">Struktur organisasi dan pembagian tugas operasional.</p>
        </div>
        {['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role) && (
          <Button 
            className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl font-bold h-12 px-6 shadow-lg shadow-indigo-100"
            onClick={() => { resetForm(); setShowFormDialog(true); }}
          >
            <Plus className="mr-2 h-5 w-5" /> Tambah Seksi
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari seksi atau bidang..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-indigo-500/20"
            />
          </div>
          <Select value={filterBidang} onValueChange={setFilterBidang}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl border-slate-200">
              <SelectValue placeholder="Pilih Bidang" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="ALL" className="font-bold">Semua Bidang</SelectItem>
              {uniqueBidang.map(b => (
                <SelectItem key={b} value={b || ''}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* List Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="font-medium">Memuat struktur organisasi...</p>
        </div>
      ) : filteredSeksi.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-4xl border border-dashed border-slate-200">
            <Shield className="h-16 w-16 text-slate-100 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak ada data seksi</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8">Data struktur organisasi belum tersedia atau tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeksi.map((seksi) => (
            <Card key={seksi.id} className="border-none shadow-sm rounded-3xl group hover:shadow-xl transition-all duration-300 bg-white overflow-hidden flex flex-col">
              <CardHeader className="p-6 pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[10px] tracking-widest px-3 py-1">
                    {seksi.bidang || 'Umum'}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{seksi.nama}</CardTitle>
                <CardDescription className="line-clamp-2 text-slate-500 font-medium">
                  {seksi.deskripsi || 'Tidak ada deskripsi.'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 pt-4 flex-1">
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <Avatar className="h-10 w-10 mr-3 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                        {seksi.ketua?.namaLengkap.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ketua Seksi</p>
                      <p className="font-bold text-slate-900 truncate">{seksi.ketua?.namaLengkap || 'Belum Ditentukan'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anggota</p>
                      <p className="font-black text-slate-900 text-lg">{seksi._count?.anggota || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peralatan</p>
                      <p className="font-black text-slate-900 text-lg">{seksi._count?.peralatan || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="p-6 pt-0 mt-auto flex gap-2">
                <Button 
                    className="flex-1 rounded-xl bg-slate-900 hover:bg-black font-bold h-11 shadow-sm"
                    onClick={() => openDetail(seksi.id)}
                >
                    Tugas & Struktur
                </Button>
                {['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role) && (
                    <>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-11 w-11 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleEdit(seksi)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-11 w-11 rounded-xl border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteSeksi(seksi.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={(open) => { setShowFormDialog(open); if(!open) resetForm(); }}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh] flex flex-col">
          <div className="p-8 bg-linear-to-br from-[#5E17EB] to-[#8C52FF] text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-black flex items-center tracking-tight">
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl mr-4">
                    {editingId ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                </div>
                {editingId ? 'Edit Struktur Seksi' : 'Registrasi Seksi Baru'}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium text-lg mt-2">
                Kelola unit organisasi dan pembagian tanggung jawab operasional.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-bold text-slate-700 ml-1 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-indigo-500" /> Nama Seksi / Bidang
                </Label>
                <Input 
                  placeholder="Contoh: Seksi Keamanan"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="h-14 rounded-2xl border-white bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-slate-700 ml-1 flex items-center">
                    <Tags className="h-4 w-4 mr-2 text-indigo-500" /> Kategori Bidang
                </Label>
                <Select value={formData.bidang} onValueChange={(v) => setFormData({...formData, bidang: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-white bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all">
                        <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="Umum" className="font-medium p-3">Umum</SelectItem>
                        <SelectItem value="Operasional" className="font-medium p-3">Operasional</SelectItem>
                        <SelectItem value="Pengembangan" className="font-medium p-3">Pengembangan</SelectItem>
                        <SelectItem value="Kesejahteraan" className="font-medium p-3">Kesejahteraan</SelectItem>
                        <SelectItem value="Keamanan" className="font-medium p-3">Keamanan</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-slate-700 ml-1 flex items-center">
                <UserCircle className="h-4 w-4 mr-2 text-indigo-500" /> Ketua Seksi (Pimpinan Unit)
              </Label>
              <Select value={formData.ketuaId} onValueChange={(v) => setFormData({...formData, ketuaId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-white bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all">
                  <SelectValue placeholder="Pilih Anggota sebagai Ketua" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl max-h-[300px]">
                  <SelectItem value="none" className="text-slate-400 p-3 italic">Belum Ada Ketua</SelectItem>
                  {anggotaOptions.map(a => (
                    <SelectItem key={a.id} value={a.id} className="font-medium p-3">
                      {a.namaLengkap} <span className="text-indigo-500 text-xs ml-2 font-bold">({a.jenjang})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <p className="text-xs text-indigo-600 font-bold">Hanya anggota terdaftar yang bisa dipilih sebagai pimpinan seksi.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-slate-700 ml-1">Deskripsi & Visi Seksi</Label>
              <Textarea 
                placeholder="Jelaskan tujuan seksi ini secara garis besar..."
                className="rounded-3xl border-white bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 min-h-[100px] p-5 font-medium leading-relaxed"
                value={formData.deskripsi}
                onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
              />
            </div>

            <div className="space-y-3 relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-3xl -z-10 rounded-full" />
              <Label className="font-bold ml-1 flex items-center text-indigo-600">
                <ListChecks className="h-5 w-5 mr-3" /> Rincian Tugas & Tanggung Jawab
              </Label>
              <Textarea 
                placeholder="Tuliskan rincian tugas harian, mingguan, atau tanggung jawab spesifik personel dalam seksi ini..."
                className="rounded-3xl border-indigo-100/50 bg-white shadow-lg shadow-indigo-500/5 min-h-[150px] p-5 font-medium leading-relaxed focus:border-indigo-500 selection:bg-indigo-100"
                value={formData.tugas}
                onChange={(e) => setFormData({...formData, tugas: e.target.value})}
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-4">Gunakan baris baru untuk setiap poin tugas.</p>
            </div>
          </div>

          <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0">
            <Button 
                variant="ghost" 
                className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50" 
                onClick={() => setShowFormDialog(false)}
            >
              Batalkan
            </Button>
            <Button 
              className="flex-2 h-14 rounded-2xl font-black bg-[#5E17EB] hover:bg-[#4a11c0] shadow-xl shadow-indigo-200 text-lg transition-all active:scale-95"
              onClick={handleCreateOrUpdate}
              disabled={submitLoading}
            >
              {submitLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (editingId ? 'Perbarui Struktur' : 'Simpan Struktur')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] sm:max-w-5xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh] flex flex-col">
          {selectedSeksi && (
            <>
              <div className="p-10 bg-linear-to-br from-[#5E17EB] via-[#6e2ef3] to-[#8C52FF] text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-3xl" />
                
                <DialogHeader className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-white/20 backdrop-blur-md text-white border-0 font-bold px-4 py-1.5 rounded-full text-xs tracking-wider">
                                    {selectedSeksi.bidang || 'Umum'}
                                </Badge>
                                <div className="h-1 w-1 rounded-full bg-white/40" />
                                <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">KODE: {selectedSeksi.id.slice(-6)}</span>
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tighter leading-tight">{selectedSeksi.nama}</DialogTitle>
                        </div>

                        {selectedSeksi.ketua && (
                           <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex items-center gap-5 shadow-2xl shadow-black/10">
                              <div className="relative">
                                <Avatar className="h-14 w-14 border-2 border-white/30 shadow-lg">
                                    <AvatarFallback className="bg-white text-[#5E17EB] font-black text-xl">
                                        {selectedSeksi.ketua.namaLengkap.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 h-4 w-4 rounded-full border-2 border-white" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.15em] mb-1">Pimpinan Unit</p>
                                <p className="font-extrabold text-white text-xl leading-none">{selectedSeksi.ketua.namaLengkap}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="border-white/30 text-white/80 text-[10px] font-bold px-2">
                                        {selectedSeksi.ketua.jenjang}
                                    </Badge>
                                </div>
                              </div>
                           </div>
                        )}
                    </div>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/70 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Tasks */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-150 rotate-12 transition-transform group-hover:scale-175 duration-700">
                                <ListChecks size={120} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center tracking-tight">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl mr-4">
                                    <ListChecks className="h-6 w-6" />
                                </div>
                                Pembagian Tugas & Tanggung Jawab
                            </h4>
                            <div className="relative">
                                {selectedSeksi.tugas ? (
                                    <div className="whitespace-pre-wrap text-slate-700 font-bold text-lg leading-relaxed bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100/50 shadow-inner">
                                        {selectedSeksi.tugas}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-slate-400 bg-slate-50/80 rounded-[2rem] border border-dashed border-slate-200">
                                        <Info className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">Deskripsi tugas operasional belum didefinisikan secara spesifik.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                             <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center tracking-tight">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl mr-4">
                                    <Info className="h-6 w-6" />
                                </div>
                                Visi & Deskripsi Unit
                            </h4>
                            <p className="text-slate-600 font-bold text-lg leading-relaxed px-2">
                                {selectedSeksi.deskripsi || 'Seksi ini merupakan bagian integral dari operasional Padepokan Satria Pinayungan.'}
                            </p>
                        </section>
                    </div>

                    {/* Right Column: Members & Equipment */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                             <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-black flex items-center text-slate-900 uppercase tracking-widest">
                                    <Users className="h-4 w-4 mr-3 text-indigo-600" /> Anggota Unit
                                </CardTitle>
                                <Badge className="bg-indigo-50 text-indigo-600 font-black rounded-lg px-3 py-1">
                                    {selectedSeksi.anggota?.length || 0}
                                </Badge>
                             </CardHeader>
                             <CardContent className="p-6">
                                {selectedSeksi.anggota && selectedSeksi.anggota.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedSeksi.anggota.map(m => (
                                            <div key={m.id} className="flex items-center p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                                <Avatar className="h-10 w-10 mr-4 shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
                                                    <AvatarFallback className="text-xs font-black bg-indigo-50 text-indigo-600">
                                                        {m.namaLengkap.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-black text-sm text-slate-900 truncate tracking-tight">{m.namaLengkap}</p>
                                                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">{m.jenjang}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Users className="h-6 w-6 text-slate-200" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Belum Ada Anggota</p>
                                    </div>
                                )}
                             </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-indigo-500/5 rounded-[2.5rem] bg-linear-to-br from-indigo-600 to-indigo-800 overflow-hidden text-white group cursor-pointer active:scale-95 transition-all">
                             <div className="p-10 text-center relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12">
                                    <Package size={80} />
                                </div>
                                <div className="p-4 bg-white/10 rounded-3xl w-fit mx-auto mb-6 backdrop-blur-md">
                                    <Settings className="h-8 w-8 text-white" />
                                </div>
                                <p className="text-5xl font-black mb-2 tabular-nums tracking-tighter">{selectedSeksi.peralatan?.length || 0}</p>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-8">Peralatan Terdata</p>
                                <Button className="w-full rounded-2xl bg-white text-indigo-600 font-black h-12 shadow-xl hover:bg-slate-50 transition-colors">
                                    Kelola Inventaris
                                </Button>
                             </div>
                        </Card>
                    </div>
                </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0 px-10">
                <Button 
                    variant="ghost" 
                    className="rounded-2xl px-10 font-bold h-14 text-slate-500" 
                    onClick={() => setShowDetailDialog(false)}
                >
                    Tutup Struktur
                </Button>
                {['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role) && (
                    <Button 
                        className="rounded-2xl px-10 font-black bg-[#5E17EB] hover:bg-[#4a11c0] text-white h-14 shadow-2xl shadow-indigo-500/20 text-lg transition-all active:scale-95" 
                        onClick={() => { setShowDetailDialog(false); handleEdit(selectedSeksi); }}
                    >
                        <Edit className="h-6 w-6 mr-3" /> Edit Struktur
                    </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
