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
  Plus, 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Info, 
  Loader2,
  Tags,
  QrCode,
  Box,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Trash,
  Image as ImageIcon,
  Shield,
  Upload,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface Peralatan {
  id: string
  nama: string
  kode: string
  seksiId: string | null
  seksi?: {
    id: string
    nama: string
  } | null
  jumlah: number
  kondisi: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | 'HABIS'
  keterangan: string | null
  foto: string | null
  createdAt: string
  _count: {
    riwayatPemakaian: number
  }
}

interface SeksiOption {
  id: string
  nama: string
}

export default function PeralatanPage() {
  // Data States
  const [peralatanList, setPeralatanList] = useState<Peralatan[]>([])
  const [seksiOptions, setSeksiOptions] = useState<SeksiOption[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Filter States
  const [search, setSearch] = useState('')
  const [filterSeksi, setFilterSeksi] = useState('ALL')
  const [filterKondisi, setFilterKondisi] = useState('ALL')

  // Dialog States
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [formData, setFormData] = useState({
    nama: '',
    kode: '',
    seksiId: 'none',
    jumlah: '1',
    kondisi: 'BAIK',
    keterangan: '',
    foto: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setCurrentUser(JSON.parse(userData))
    fetchPeralatan()
    fetchSeksiOptions()
  }, [])

  const fetchPeralatan = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/peralatan', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPeralatanList(data.data)
      }
    } catch (error) {
      toast.error('Gagal memuat daftar peralatan')
    } finally {
      setLoading(false)
    }
  }

  const fetchSeksiOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/seksi', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSeksiOptions(data.data)
      }
    } catch (error) {
      console.error('Error fetching seksi options:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!formData.nama || !formData.kode) {
      toast.error('Nama dan Kode wajib diisi')
      return
    }

    try {
      setSubmitLoading(true)
      const token = localStorage.getItem('token')
      const url = editingId ? `/api/peralatan/${editingId}` : '/api/peralatan'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          seksiId: formData.seksiId === 'none' ? null : formData.seksiId
        })
      })

      if (response.ok) {
        toast.success(editingId ? 'Peralatan berhasil diperbarui' : 'Peralatan berhasil ditambahkan')
        setShowFormDialog(false)
        resetForm()
        fetchPeralatan()
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

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus peralatan ini dari inventaris?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/peralatan/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Peralatan berhasil dihapus')
        fetchPeralatan()
      } else {
        toast.error('Gagal menghapus peralatan')
      }
    } catch (error) {
      toast.error('Kesalahan server')
    }
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      kode: '',
      seksiId: 'none',
      jumlah: '1',
      kondisi: 'BAIK',
      keterangan: '',
      foto: ''
    })
    setEditingId(null)
  }

  const handleEdit = (alat: Peralatan) => {
    setFormData({
      nama: alat.nama,
      kode: alat.kode,
      seksiId: alat.seksiId || 'none',
      jumlah: alat.jumlah.toString(),
      kondisi: alat.kondisi,
      keterangan: alat.keterangan || '',
      foto: alat.foto || ''
    })
    setEditingId(alat.id)
    setShowFormDialog(true)
  }

  const filteredPeralatan = peralatanList.filter(alat => {
    const matchesSearch = alat.nama.toLowerCase().includes(search.toLowerCase()) || 
                          alat.kode.toLowerCase().includes(search.toLowerCase())
    const matchesSeksi = filterSeksi === 'ALL' || alat.seksiId === filterSeksi
    const matchesKondisi = filterKondisi === 'ALL' || alat.kondisi === filterKondisi
    return matchesSearch && matchesSeksi && matchesKondisi
  })

  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case 'BAIK': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'RUSAK_RINGAN': return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'RUSAK_BERAT': return 'bg-rose-50 text-rose-600 border-rose-100'
      case 'HABIS': return 'bg-slate-50 text-slate-600 border-slate-100'
      default: return 'bg-slate-50 text-slate-600'
    }
  }

  // Statistics
  const stats = {
    total: peralatanList.reduce((acc, curr) => acc + curr.jumlah, 0),
    baik: peralatanList.filter(a => a.kondisi === 'BAIK').reduce((acc, curr) => acc + curr.jumlah, 0),
    rusak: peralatanList.filter(a => a.kondisi.startsWith('RUSAK')).reduce((acc, curr) => acc + curr.jumlah, 0),
    habis: peralatanList.filter(a => a.kondisi === 'HABIS').reduce((acc, curr) => acc + curr.jumlah, 0)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventaris Peralatan</h1>
          <p className="text-slate-500 font-medium">Pengelolaan aset dan sarana prasarana Padepokan.</p>
        </div>
        {['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(currentUser?.role) && (
          <Button 
            className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl font-bold h-12 px-6 shadow-lg shadow-indigo-100"
            onClick={() => { resetForm(); setShowFormDialog(true); }}
          >
            <Plus className="mr-2 h-5 w-5" /> Tambah Asset
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Barang', val: stats.total, icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Kondisi Baik', val: stats.baik, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Perlu Perbaikan', val: stats.rusak, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Habis Pakai', val: stats.habis, icon: Trash, color: 'text-slate-600', bg: 'bg-slate-100' }
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-2xl font-black text-slate-900">{item.val} Unit</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari nama atau kode peralatan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-indigo-500/20 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterSeksi} onValueChange={setFilterSeksi}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Seksi" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="ALL" className="font-bold">Semua Seksi</SelectItem>
                {seksiOptions.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterKondisi} onValueChange={setFilterKondisi}>
              <SelectTrigger className="w-full sm:w-[160px] h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Kondisi" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="ALL" className="font-bold">Semua Kondisi</SelectItem>
                <SelectItem value="BAIK">Baik</SelectItem>
                <SelectItem value="RUSAK_RINGAN">Rusak Ringan</SelectItem>
                <SelectItem value="RUSAK_BERAT">Rusak Berat</SelectItem>
                <SelectItem value="HABIS">Habis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="font-medium tracking-tight">Menghubungkan ke gudang inventaris...</p>
        </div>
      ) : filteredPeralatan.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-4xl border border-dashed border-slate-200">
            <Package className="h-16 w-16 text-slate-100 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Gudang Kosong</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">Tidak ada peralatan yang ditemukan dengan filter saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPeralatan.map((alat) => (
            <Card key={alat.id} className="border-none shadow-sm rounded-3xl group hover:shadow-xl transition-all duration-300 bg-white overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                {alat.foto ? (
                    <img src={alat.foto} alt={alat.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                )}
                <Badge className={`absolute top-4 right-4 border shadow-sm font-bold ${getKondisiBadge(alat.kondisi)}`}>
                  {alat.kondisi.replace('_', ' ')}
                </Badge>
                <div className="absolute top-4 left-4 whitespace-nowrap bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center tracking-widest shadow-lg">
                    <QrCode className="h-3 w-3 mr-1.5" />
                    {alat.kode}
                </div>
              </div>
              
              <CardContent className="p-6 flex-1">
                <div className="mb-4">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                    {alat.seksi?.nama || 'ASET UMUM'}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#5E17EB] transition-colors">
                    {alat.nama}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 px-3 py-2 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah</p>
                        <p className="font-black text-slate-900">{alat.jumlah} Unit</p>
                    </div>
                </div>

                <p className="text-xs font-medium text-slate-500 line-clamp-2">
                    {alat.keterangan || 'Tidak ada catatan tambahan.'}
                </p>
              </CardContent>

              <div className="p-6 pt-0 border-t border-slate-50 mt-auto bg-slate-50/10 flex items-center justify-between">
                <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <ClipboardList className="h-3.5 w-3.5 mr-1" />
                    {alat._count.riwayatPemakaian} Pemakaian
                </div>
                {['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'].includes(currentUser?.role) && (
                    <div className="flex gap-1.5">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleEdit(alat)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(alat.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={(open) => { setShowFormDialog(open); if(!open) resetForm(); }}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh] flex flex-col">
          <div className="p-8 bg-linear-to-br from-slate-900 to-slate-800 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-black flex items-center tracking-tight">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl mr-4">
                    <Box className="h-6 w-6 text-indigo-400" />
                </div>
                {editingId ? 'Edit Data Aset' : 'Registrasi Asset Baru'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-lg mt-2">
                Pastikan data inventaris tercatat secara akurat untuk pelacakan optimal.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-bold text-slate-700 ml-1 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-indigo-500" /> Nama Peralatan
                </Label>
                <Input 
                  placeholder="Contoh: Matras Olahraga"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="h-14 rounded-2xl border-white bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-slate-700 ml-1 flex items-center">
                    <QrCode className="h-4 w-4 mr-2 text-indigo-500" /> Kode Aset / QR
                </Label>
                <Input 
                  placeholder="ALAT-001"
                  value={formData.kode}
                  onChange={(e) => setFormData({...formData, kode: e.target.value})}
                  className="h-14 rounded-2xl border-white bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-indigo-500" /> Seksi Unit Penanggung Jawab
                </Label>
                <Select value={formData.seksiId} onValueChange={(v) => setFormData({...formData, seksiId: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-white bg-white shadow-sm font-bold text-slate-800">
                        <SelectValue placeholder="Pilih Seksi Unit" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="none" className="p-3">Aset Umum (Tanpa Seksi)</SelectItem>
                        {seksiOptions.map(s => (
                            <SelectItem key={s.id} value={s.id} className="p-3 font-medium">{s.nama}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                    <Label className="font-bold text-slate-700 ml-1 flex items-center">
                        <Box className="h-4 w-4 mr-2 text-indigo-500" /> Jumlah Unit
                    </Label>
                    <div className="relative">
                        <Input 
                            type="number"
                            value={formData.jumlah}
                            onChange={(e) => setFormData({...formData, jumlah: e.target.value})}
                            className="h-14 rounded-2xl border-white bg-white shadow-sm font-bold tabular-nums pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Unit</span>
                    </div>
                </div>
                <div className="space-y-3 md:col-span-2">
                    <Label className="font-bold text-slate-700 ml-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" /> Kondisi Fisik Barang
                    </Label>
                    <Select value={formData.kondisi} onValueChange={(v: any) => setFormData({...formData, kondisi: v})}>
                        <SelectTrigger className="h-14 rounded-2xl border-white bg-white shadow-sm font-bold">
                            <SelectValue placeholder="Pilih Kondisi" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Kategori Kondisi</p>
                            </div>
                            <SelectItem value="BAIK" className="p-3 text-emerald-600 font-bold">Berfungsi Sangat Baik</SelectItem>
                            <SelectItem value="RUSAK_RINGAN" className="p-3 text-amber-600 font-bold">Rusak Ringan (Bisa Diperbaiki)</SelectItem>
                            <SelectItem value="RUSAK_BERAT" className="p-3 text-rose-600 font-bold">Rusak Berat (Akan Diganti)</SelectItem>
                            <SelectItem value="HABIS" className="p-3 text-slate-600 font-bold">Sudah Habis Pakai</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-slate-700 ml-1 flex items-center">
                <ClipboardList className="h-4 w-4 mr-2 text-indigo-500" /> Catatan Lokasi & Detail
              </Label>
              <Textarea 
                placeholder="Tambahkan catatan lokasi penyimpanan spesifik atau detail kendala teknis..."
                className="rounded-3xl border-white bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 min-h-[120px] p-5 font-medium leading-relaxed"
                value={formData.keterangan}
                onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-slate-700 ml-1 flex items-center">
                <ImageIcon className="h-4 w-4 mr-2 text-indigo-500" /> Foto Asset Peralatan
              </Label>
              
              <div className="space-y-4">
                {formData.foto ? (
                  <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-indigo-100 shadow-inner group">
                    <img 
                      src={formData.foto} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="rounded-xl font-bold bg-rose-500 hover:bg-rose-600"
                        onClick={() => setFormData(prev => ({ ...prev, foto: '' }))}
                      >
                        <X className="h-4 w-4 mr-2" /> Hapus Foto
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-1">Klik untuk upload foto</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">PNG, JPG atau WEBP (Maks. 2MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0 px-10">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-500" onClick={() => setShowFormDialog(false)}>
              Batal
            </Button>
            <Button 
              className="flex-2 h-14 rounded-2xl font-black bg-[#5E17EB] hover:bg-[#4a11c0] shadow-2xl shadow-indigo-500/20 text-lg transition-all active:scale-95 text-white"
              onClick={handleCreateOrUpdate}
              disabled={submitLoading}
            >
              {submitLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (editingId ? 'Simpan Perubahan' : 'Registrasi Barang')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
