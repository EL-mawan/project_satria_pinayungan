'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, MapPin, Loader2, Clock, MoreVertical, Edit, Trash, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function KegiatanPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [editingId, setEditingId] = useState<string | null>(null)

  const initialFormState = {
    judul: '',
    jenis: 'LATIHAN',
    tanggal: '',
    waktu: '',
    lokasi: '',
    deskripsi: '',
    status: 'TERJADWAL'
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/kegiatan')
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar kegiatan',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setEditingId(null)
  }

  const handleEdit = (activity: any) => {
    const dateObj = new Date(activity.tanggal)
    setEditingId(activity.id)
    setFormData({
      judul: activity.judul,
      jenis: activity.jenis,
      tanggal: format(dateObj, 'yyyy-MM-dd'),
      waktu: format(dateObj, 'HH:mm'),
      lokasi: activity.lokasi || '',
      deskripsi: activity.deskripsi || '',
      status: activity.status
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string, judul: string, onSuccess?: () => void) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kegiatan "${judul}"?`)) return

    try {
      const res = await fetch(`/api/kegiatan/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: 'Kegiatan berhasil dihapus'
        })
        onSuccess?.()
        fetchActivities()
      } else {
        toast({
          title: 'Gagal',
          description: 'Gagal menghapus kegiatan',
          variant: 'destructive'
        })
      }
    } catch (error) {
       toast({
        title: 'Error',
        description: 'Terjadi kesalahan sistem',
        variant: 'destructive'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Combine Date and Time
      const dateTimeString = `${formData.tanggal}T${formData.waktu || '00:00'}`
      
      const payload = {
        ...formData,
        tanggal: new Date(dateTimeString).toISOString()
      }

      const url = editingId ? `/api/kegiatan/${editingId}` : '/api/kegiatan'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingId ? 'Kegiatan berhasil diperbarui' : 'Kegiatan baru berhasil ditambahkan'
        })
        setIsDialogOpen(false)
        resetForm()
        fetchActivities()
      } else {
        toast({
          title: 'Gagal',
          description: data.error || 'Gagal menyimpan kegiatan',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan sistem',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getJenisColor = (jenis: string) => {
    switch(jenis) {
      case 'LATIHAN': return 'bg-blue-100 text-blue-700 hover:bg-blue-100/80'
      case 'PENGESAHAN': return 'bg-purple-100 text-purple-700 hover:bg-purple-100/80'
      case 'ACARA_ADAT': return 'bg-amber-100 text-amber-700 hover:bg-amber-100/80'
      case 'LOMBA': return 'bg-red-100 text-red-700 hover:bg-red-100/80'
      case 'RAPAT': return 'bg-slate-100 text-slate-700 hover:bg-slate-100/80'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'TERJADWAL': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'BERLANGSUNG': return 'text-green-600 bg-green-50 border-green-200'
      case 'SELESAI': return 'text-slate-600 bg-slate-50 border-slate-200'
      case 'DIBATALKAN': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-slate-600'
    }
  }

  /* State for View Detail */
  const [viewActivity, setViewActivity] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleViewDetail = (activity: any) => {
    setViewActivity(activity)
    setIsDetailOpen(true)
  }

  const openEditFromDetail = () => {
    if (viewActivity) {
      handleEdit(viewActivity)
      setIsDetailOpen(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Agenda & Kegiatan</h1>
          <p className="text-slate-500 font-medium">Jadwal latihan dan acara padepokan</p>
        </div>
        
        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl font-bold h-12 px-6 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95 w-full md:w-auto">
              <Plus className="mr-2 h-5 w-5" /> Tambah Kegiatan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#5E17EB]">
                  {editingId ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}
              </DialogTitle>
              <DialogDescription>
                  {editingId ? 'Perbarui informasi kegiatan.' : 'Buat jadwal kegiatan atau acara baru untuk anggota.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="judul">Nama Kegiatan <span className="text-red-500">*</span></Label>
                    <Input id="judul" name="judul" required 
                    value={formData.judul} onChange={handleInputChange} 
                    className="rounded-xl h-11" placeholder="Contoh: Latihan Rutin Minggu Pagi" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="jenis">Jenis Kegiatan</Label>
                        <Select name="jenis" value={formData.jenis} onValueChange={(v) => handleSelectChange('jenis', v)}>
                            <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Pilih Jenis" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LATIHAN">Latihan</SelectItem>
                                <SelectItem value="PENGESAHAN">Pengesahan / Ujian</SelectItem>
                                <SelectItem value="ACARA_ADAT">Acara Adat</SelectItem>
                                <SelectItem value="LOMBA">Pertandingan / Lomba</SelectItem>
                                <SelectItem value="SEMINAR">Seminar / Workshop</SelectItem>
                                <SelectItem value="RAPAT">Rapat Pengurus</SelectItem>
                                <SelectItem value="LAINNYA">Lainnya</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                            <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TERJADWAL">Terjadwal</SelectItem>
                                <SelectItem value="BERLANGSUNG">Sedang Berlangsung</SelectItem>
                                <SelectItem value="SELESAI">Selesai</SelectItem>
                                <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tanggal">Tanggal <span className="text-red-500">*</span></Label>
                        <Input id="tanggal" name="tanggal" type="date" required
                        value={formData.tanggal} onChange={handleInputChange} 
                        className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="waktu">Waktu</Label>
                        <Input id="waktu" name="waktu" type="time"
                        value={formData.waktu} onChange={handleInputChange} 
                        className="rounded-xl h-11" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lokasi">Lokasi</Label>
                    <Input id="lokasi" name="lokasi" 
                    value={formData.lokasi} onChange={handleInputChange} 
                    className="rounded-xl h-11" placeholder="Tempat kegiatan berlangsung" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="deskripsi">Deskripsi / Catatan</Label>
                    <Textarea id="deskripsi" name="deskripsi" 
                    value={formData.deskripsi} onChange={handleInputChange} 
                    className="rounded-xl min-h-[100px]" placeholder="Informasi tambahan mengenai kegiatan ini..." />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 px-6">Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl h-11 px-6">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : (editingId ? 'Simpan Perubahan' : 'Simpan Kegiatan')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Detail View Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden">
             {viewActivity && (
               <>
                 <DialogHeader className="sr-only">
                   <DialogTitle>{viewActivity.judul}</DialogTitle>
                   <DialogDescription>Detail informasi kegiatan {viewActivity.judul}</DialogDescription>
                 </DialogHeader>
                 <div className="h-40 bg-linear-to-r from-[#5E17EB] to-purple-600 relative p-8 flex flex-col justify-end">
                    <div className="absolute top-6 right-6 flex gap-2">
                         <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                            {viewActivity.jenis.replace('_', ' ')}
                         </Badge>
                         <Badge className={`${getStatusColor(viewActivity.status)} border-0 shadow-sm bg-white/90`}>
                            {viewActivity.status}
                         </Badge>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">{viewActivity.judul}</h2>
                    <div className="flex items-center text-white/90 text-sm gap-4">
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {format(new Date(viewActivity.tanggal), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                        </div>
                        <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {format(new Date(viewActivity.tanggal), 'HH:mm')} WIB
                        </div>
                    </div>
                 </div>
                 <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
                                    <MapPin className="h-5 w-5 mr-2 text-[#5E17EB]" /> Lokasi
                                </h3>
                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {viewActivity.lokasi || 'Lokasi belum ditentukan'}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Deskripsi Kegiatan</h3>
                                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {viewActivity.deskripsi || 'Tidak ada deskripsi tambahan.'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-slate-50 border-slate-200 shadow-none">
                                <CardContent className="p-4 space-y-3">
                                    <h4 className="font-bold text-slate-900 text-sm">Informasi Lain</h4>
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Dibuat</span>
                                            <span className="font-medium text-slate-900">
                                                {format(new Date(viewActivity.createdAt), 'd MMM yyyy', { locale: idLocale })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Update</span>
                                            <span className="font-medium text-slate-900">
                                                {format(new Date(viewActivity.updatedAt), 'd MMM yyyy', { locale: idLocale })}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                 </div>
                 <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-xl px-6">
                        Tutup
                    </Button>
                 </div>
               </>
             )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
           <Loader2 className="h-10 w-10 animate-spin text-[#5E17EB] mb-4" />
           <p className="text-slate-500 font-medium">Memuat jadwal kegiatan...</p>
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-0 gap-0">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                <Calendar className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Belum Ada Kegiatan</h3>
                <p className="text-slate-500 max-w-sm mt-2">Belum ada agenda atau kegiatan yang dijadwalkan. Tambahkan kegiatan baru untuk memulai.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
                <Card key={activity.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden p-0 gap-0">
                    <CardHeader className="relative p-0 h-32 bg-linear-to-br from-[#5E17EB] to-purple-600">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute top-4 left-4 flex gap-2">
                             <Badge className={`${getJenisColor(activity.jenis)} border-0 shadow-sm`}>
                                {activity.jenis.replace('_', ' ')}
                             </Badge>
                        </div>
                        
                        <div className="absolute bottom-4 left-4 text-white">
                           <p className="text-xs font-medium opacity-90 mb-1 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(activity.tanggal), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                           </p>
                           <h3 className="text-lg font-bold leading-tight line-clamp-2">{activity.judul}</h3>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 bg-white">
                        <div className="flex items-start justify-between">
                            <Badge variant="outline" className={`${getStatusColor(activity.status)} rounded-md`}>
                                {activity.status}
                            </Badge>
                            <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                {format(new Date(activity.tanggal), 'HH:mm')} WIB
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-start text-sm text-slate-600">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-[#5E17EB]" />
                                <span className="line-clamp-2">{activity.lokasi || 'Lokasi belum ditentukan'}</span>
                            </div>
                            {activity.deskripsi && (
                                <p className="text-sm text-slate-500 line-clamp-3 pl-6">
                                    {activity.deskripsi}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 text-slate-600 hover:text-[#5E17EB] border-slate-200" onClick={() => handleViewDetail(activity)}>
                              <Info className="h-4 w-4 mr-2" /> Detail
                          </Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 text-slate-600 hover:text-[#5E17EB] border-slate-200" onClick={() => handleEdit(activity)}>
                              <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleDelete(activity.id, activity.judul)}>
                              <Trash className="h-4 w-4" />
                          </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  )
}
