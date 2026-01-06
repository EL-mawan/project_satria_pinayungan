'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Search, Filter, Loader2, MoreVertical, Edit, Trash, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function AnggotaPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form State
  const initialFormState = {
    namaLengkap: '',
    email: '',
    password: '',
    nomorInduk: '',
    tempatLahir: '',
    tanggalLahir: '',
    telepon: '',
    alamat: '',
    jenjang: 'PUTIH',
    status: 'AKTIF'
  }
  
  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/anggota')
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data anggota',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleEdit = (member: any) => {
    setEditingId(member.id)
    setFormData({
      namaLengkap: member.namaLengkap,
      email: member.user?.email || '',
      password: '', // Password empty on edit unless changing
      nomorInduk: member.nomorInduk,
      tempatLahir: member.tempatLahir || '',
      tanggalLahir: member.tanggalLahir ? new Date(member.tanggalLahir).toISOString().split('T')[0] : '',
      telepon: member.telepon || '',
      alamat: member.alamat || '',
      jenjang: member.jenjang,
      status: member.status
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus anggota ${nama}? Data akun juga akan dihapus permanen.`)) return

    try {
      const res = await fetch(`/api/anggota/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: 'Data anggota berhasil dihapus'
        })
        fetchMembers()
      } else {
        toast({
          title: 'Gagal',
          description: 'Gagal menghapus data',
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
      const url = editingId ? `/api/anggota/${editingId}` : '/api/anggota'
      const method = editingId ? 'PATCH' : 'POST'
      
      // Filter out empty password on edit
      const payload = { ...formData }
      if (editingId && !payload.password) {
          delete (payload as any).password
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingId ? 'Data anggota diperbarui' : 'Anggota baru berhasil ditambahkan'
        })
        setIsDialogOpen(false)
        fetchMembers()
        resetForm()
      } else {
        toast({
          title: 'Gagal',
          description: data.error || 'Terjadi kesalahan saat menyimpan data',
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

  const filteredMembers = members.filter(member => 
    member.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nomorInduk.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getJenjangColor = (jenjang: string) => {
    switch(jenjang) {
      case 'PUTIH': return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'HIJAU': return 'bg-green-100 text-green-800 border-green-200'
      case 'BIRU': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COKLAT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MERAH': return 'bg-red-100 text-red-800 border-red-200'
      case 'HITAM': return 'bg-slate-900 text-slate-100 border-slate-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'AKTIF': return 'bg-emerald-50 text-emerald-600'
      case 'TIDAK_AKTIF': return 'bg-red-50 text-red-600'
      case 'CUTI': return 'bg-yellow-50 text-yellow-600'
      default: return 'bg-slate-50 text-slate-600'
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Data Anggota</h1>
          <p className="text-slate-500 font-medium">Kelola data anggota, siswa, dan pelatih</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl font-bold h-12 px-6 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
              <Plus className="mr-2 h-5 w-5" /> Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#5E17EB]">
                  {editingId ? 'Edit Anggota' : 'Tambah Anggota Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit informasi anggota yang sudah terdaftar.' : 'Isi formulir berikut untuk mendaftarkan anggota baru. Akun pengguna akan otomatis dibuat.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* Data Pribadi */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Informasi Anggota</h3>

                  <div className="grid md:grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-red-500">*</span></Label>
                        <Input id="namaLengkap" name="namaLengkap" required 
                        value={formData.namaLengkap} onChange={handleInputChange} 
                        className="rounded-xl h-11" placeholder="Nama Lengkap" />
                    </div>
                  </div>
                </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                  <Input id="tempatLahir" name="tempatLahir" 
                    value={formData.tempatLahir} onChange={handleInputChange} 
                    className="rounded-xl h-11" placeholder="Kota Kelahiran" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                  <Input id="tanggalLahir" name="tanggalLahir" type="date"
                    value={formData.tanggalLahir} onChange={handleInputChange} 
                    className="rounded-xl h-11" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telepon">No. Telepon / WA</Label>
                  <Input id="telepon" name="telepon" 
                    value={formData.telepon} onChange={handleInputChange} 
                    className="rounded-xl h-11" placeholder="08..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alamat">Alamat Lengkap</Label>
                  <Input id="alamat" name="alamat" 
                    value={formData.alamat} onChange={handleInputChange} 
                    className="rounded-xl h-11" placeholder="Alamat domisili" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="jenjang">Tingkatan / Sabuk</Label>
                  <Select name="jenjang" value={formData.jenjang} onValueChange={(v) => handleSelectChange('jenjang', v)}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Pilih Tingkatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUTIH">Putih</SelectItem>
                      <SelectItem value="HIJAU">Hijau</SelectItem>
                      <SelectItem value="BIRU">Biru</SelectItem>
                      <SelectItem value="COKLAT">Coklat</SelectItem>
                      <SelectItem value="MERAH">Merah</SelectItem>
                      <SelectItem value="HITAM">Hitam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status Keanggotaan</Label>
                  <Select name="status" value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                      <SelectItem value="CUTI">Cuti / Vakum</SelectItem>
                      <SelectItem value="KELUAR">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {editingId && (
                  <div className="space-y-4 border-t pt-4">
                     <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ganti Password (Opsional)</h3>
                     <div className="space-y-2">
                       <Label htmlFor="password">Password Baru</Label>
                       <Input id="password" name="password" type="password"
                         value={formData.password} onChange={handleInputChange} 
                         className="rounded-xl h-11" placeholder="Kosongkan jika tidak ingin mengganti" />
                     </div>
                  </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 px-6">Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl h-11 px-6">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : (editingId ? 'Simpan Perubahan' : 'Simpan Anggota')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-linear-to-r from-[#5E17EB]/5 to-purple-50 border-b flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-[#5E17EB]/10 rounded-xl flex items-center justify-center">
               <Users className="h-5 w-5 text-[#5E17EB]" />
            </div>
            <div>
               <CardTitle className="text-lg">Daftar Anggota</CardTitle>
               <p className="text-sm text-slate-500">Total {members.length} anggota terdaftar</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama atau NIA..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-[250px] rounded-xl border-slate-200 focus:border-[#5E17EB] focus:ring-[#5E17EB]" 
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl shrink-0">
              <Filter className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6">NIA / Nama</TableHead>
                  <TableHead>Tingkatan</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#5E17EB] mb-2" />
                          <p>Memuat data...</p>
                        </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                          Belum ada data anggota yang ditemukan.
                      </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                      <TableCell className="py-4 pl-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border-2 border-slate-200">
                              {member.namaLengkap.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{member.namaLengkap}</p>
                              <p className="text-xs text-slate-500 font-mono">{member.nomorInduk}</p>
                            </div>
                          </div>
                      </TableCell>
                      <TableCell>
                          <Badge variant="outline" className={`${getJenjangColor(member.jenjang)} rounded-lg px-2 py-1`}>
                            {member.jenjang}
                          </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="text-sm">
                            <p className="text-slate-900">{member.telepon || '-'}</p>
                            <p className="text-xs text-slate-500">{member.user?.email}</p>
                          </div>
                      </TableCell>
                      <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                            {member.status.replace('_', ' ')}
                          </span>
                      </TableCell>
                      <TableCell>
                          <span className="text-sm text-slate-600">
                            {new Date(member.tanggalGabung).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(member)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => handleDelete(member.id, member.namaLengkap)}>
                                <Trash className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4 p-4">
            {loading ? (
               <div className="text-center py-12 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5E17EB] mb-2 mx-auto" />
                  <p>Memuat data...</p>
               </div>
            ) : filteredMembers.length === 0 ? (
               <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                  Belum ada data anggota yang ditemukan.
               </div>
            ) : (
              filteredMembers.map((member) => (
                <div key={member.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-4 relative">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border-2 border-slate-200">
                            {member.namaLengkap.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{member.namaLengkap}</p>
                            <p className="text-xs text-slate-500 font-mono">{member.nomorInduk}</p>
                        </div>
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg -mr-2">
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(member)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => handleDelete(member.id, member.namaLengkap)}>
                            <Trash className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                          <p className="text-xs text-slate-500">Tingkatan</p>
                          <Badge variant="outline" className={`${getJenjangColor(member.jenjang)} rounded-lg px-2 py-0.5 text-xs`}>
                             {member.jenjang}
                          </Badge>
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs text-slate-500">Status</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                             {member.status.replace('_', ' ')}
                          </span>
                      </div>
                      <div className="space-y-1 col-span-2">
                          <p className="text-xs text-slate-500">Kontak</p>
                          <p className="text-slate-900 truncate">{member.user?.email}</p>
                          <p className="text-slate-900">{member.telepon || '-'}</p>
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
