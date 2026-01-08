'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, Settings, Search, Filter, Loader2, MoreVertical, Edit, Trash, Mail, Phone, MapPin, Shield, User as UserIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form State
  const initialFormState = {
    name: '',
    email: '',
    password: '',
    role: 'ANGGOTA',
    phone: '',
    address: ''
  }
  
  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    // Check role
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setCurrentUser(parsedUser)
      if (parsedUser.role !== 'MASTER_ADMIN' && parsedUser.role !== 'KETUA') {
        router.push('/admin/dashboard')
        return
      }
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data pengguna',
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

  const handleEdit = (user: any) => {
    setEditingId(user.id)
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password empty on edit unless changing
      role: user.role,
      phone: user.phone || '',
      address: user.address || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${name}? Semua data terkait akan ikut terhapus.`)) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: 'Pengguna berhasil dihapus'
        })
        fetchUsers()
      } else {
        toast({
          title: 'Gagal',
          description: 'Gagal menghapus pengguna',
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
      const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users'
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
          description: editingId ? 'Data pengguna diperbarui' : 'Pengguna baru berhasil ditambahkan'
        })
        setIsDialogOpen(false)
        fetchUsers()
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

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'MASTER_ADMIN': return 'bg-rose-50 text-rose-600 border-rose-100'
      case 'KETUA': return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'SEKRETARIS': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'BENDAHARA': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'ANGGOTA': return 'bg-slate-50 text-slate-600 border-slate-100'
      default: return 'bg-slate-50 text-slate-600'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-[#4338CA]/10 rounded-2xl">
              <Settings className="h-8 w-8 text-[#4338CA]" />
            </div>
            Pengaturan Akun
          </h1>
          <p className="text-slate-500 font-medium ml-1">Manajemen akses dan kontrol pengguna aplikasi</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-2xl font-bold h-12 px-6 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
              <Plus className="mr-2 h-5 w-5" /> Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 bg-[#4338CA]/10 rounded-lg">
                  <UserIcon className="h-5 w-5 text-[#4338CA]" />
                </div>
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </DialogTitle>
              <DialogDescription>
                Silakan lengkapi detail informasi akun pengguna di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Nama Lengkap</Label>
                    <Input name="name" required value={formData.name} onChange={handleInputChange} 
                      className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" placeholder="Masukkan nama lengkap" />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Email Address</Label>
                    <Input name="email" type="email" required value={formData.email} onChange={handleInputChange}
                      className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" placeholder="nama@email.com" />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Peran (Role)</Label>
                    <Select name="role" value={formData.role} onValueChange={(v) => handleSelectChange('role', v)}>
                        <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Pilih Peran" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100">
                            <SelectItem value="MASTER_ADMIN">Master Admin</SelectItem>
                            <SelectItem value="KETUA">Ketua</SelectItem>
                            <SelectItem value="SEKRETARIS">Sekretaris</SelectItem>
                            <SelectItem value="BENDAHARA">Bendahara</SelectItem>
                            <SelectItem value="ANGGOTA">Anggota</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Password {editingId && '(Opsional)'}</Label>
                    <Input name="password" type="password" required={!editingId} value={formData.password} onChange={handleInputChange}
                      className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" placeholder={editingId ? "Kosongkan jika tidak ganti" : "Buat password"} />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-slate-700">No. Telepon</Label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange}
                      className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" placeholder="08..." />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Alamat</Label>
                    <Input name="address" value={formData.address} onChange={handleInputChange}
                      className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" placeholder="Alamat lengkap" />
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold text-slate-500">Batal</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-100">
                    {isSubmitting ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (editingId ? 'Simpan Perubahan' : 'Buat Pengguna')}
                  </Button>
                </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardHeader className="bg-white border-b border-slate-50 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-[#4338CA] to-[#3730A3] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
               <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
               <CardTitle className="text-2xl font-black text-slate-900">Kontrol Akses</CardTitle>
               <p className="text-sm font-semibold text-slate-500 tracking-tight">Total {users.length} Akun Terdaftar</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#4338CA] transition-colors" />
              <Input 
                placeholder="Cari user atau email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full md:w-[320px] h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#4338CA]/10 transition-all font-medium" 
              />
            </div>
            <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white hover:border-[#4338CA] group transition-all">
              <Filter className="h-5 w-5 text-slate-500 group-hover:text-[#4338CA]" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-6 pl-10 font-bold text-slate-900 uppercase tracking-widest text-[10px]">Identitas</TableHead>
                  <TableHead className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Email & Akun</TableHead>
                  <TableHead className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Hak Akses</TableHead>
                  <TableHead className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Kontak & Alamat</TableHead>
                  <TableHead className="pr-10 text-right font-bold text-slate-900 uppercase tracking-widest text-[10px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="h-12 w-12 border-4 border-[#4338CA]/20 border-t-[#4338CA] rounded-full animate-spin" />
                          <p className="text-slate-500 font-bold tracking-tight">Menyinkronkan data pengguna...</p>
                        </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center opacity-40">
                            <UserIcon className="h-20 w-20 text-slate-300 mb-4" />
                            <p className="text-xl font-bold text-slate-400">Pengguna tidak ditemukan</p>
                          </div>
                      </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="group hover:bg-slate-50/80 border-slate-50 transition-all duration-300">
                      <TableCell className="py-8 pl-10">
                          <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                                    user.role === 'MASTER_ADMIN' ? 'bg-rose-100 text-rose-600' : 
                                    user.role === 'KETUA' ? 'bg-amber-100 text-amber-600' :
                                    'bg-indigo-100 text-[#4338CA]'
                                }`}>
                                {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white" />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-lg group-hover:text-[#4338CA] transition-colors">{user.name}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 border-none px-2">
                                        UID: {user.id.slice(-6)}
                                    </Badge>
                                    {user.anggota && (
                                        <Badge variant="outline" className="text-[10px] font-black uppercase bg-[#4338CA]/10 text-[#4338CA] border-none px-2">
                                            ANIA: {user.anggota.nomorInduk}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="h-4 w-4 shrink-0" />
                                <span className="font-bold text-sm tracking-tight">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Shield className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Active Member Account</span>
                            </div>
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[10px] tracking-wide uppercase ${getRoleBadgeColor(user.role)} shadow-sm`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                user.role === 'MASTER_ADMIN' ? 'bg-rose-500' : 
                                user.role === 'KETUA' ? 'bg-amber-500' :
                                'bg-slate-500'
                            }`} />
                            {user.role.replace('_', ' ')}
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold">{user.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium truncate max-w-[150px]">{user.address || 'N/A'}</span>
                            </div>
                          </div>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                          {/* Guru Besar (MASTER_ADMIN) protection: Only MASTER_ADMIN can manage other MASTER_ADMINs */}
                          {(user.role !== 'MASTER_ADMIN' || currentUser?.role === 'MASTER_ADMIN') ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-white hover:shadow-xl transition-all">
                                  <MoreVertical className="h-5 w-5 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px] rounded-[24px] border-slate-50 shadow-2xl p-2 animate-in slide-in-from-top-1">
                                <DropdownMenuLabel className="px-4 py-3 font-black text-slate-900 text-xs uppercase tracking-widest">Kontrol User</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="cursor-pointer rounded-xl p-3 focus:bg-indigo-50 group" onClick={() => handleEdit(user)}>
                                  <Edit className="mr-3 h-4 w-4 text-slate-400 group-hover:text-[#4338CA]" /> 
                                  <span className="font-bold text-slate-600 group-hover:text-[#4338CA]">Ubah Detail</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="cursor-pointer rounded-xl p-3 focus:bg-rose-50 group" onClick={() => handleDelete(user.id, user.name)}>
                                  <Trash className="mr-3 h-4 w-4 text-slate-400 group-hover:text-rose-600" /> 
                                  <span className="font-bold text-slate-600 group-hover:text-rose-600">Hapus Akun</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="flex justify-end pr-4">
                              <Badge className="bg-slate-100 text-slate-400 border-none font-bold text-[10px] py-1 px-3 rounded-lg flex items-center gap-1.5">
                                <Shield className="h-3 w-3" /> TERKUNCI
                              </Badge>
                            </div>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Visual Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl rounded-3xl bg-indigo-50/50 p-6 flex items-center gap-5">
            <div className="h-14 w-14 bg-[#4338CA] rounded-2xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-bold text-indigo-900">Kontrol Role</p>
                <p className="text-xs text-indigo-600 font-medium">Pengaturan hak akses berdasarkan tingkatan organisasi.</p>
            </div>
        </Card>
        <Card className="border-none shadow-xl rounded-3xl bg-rose-50/50 p-6 flex items-center gap-5">
            <div className="h-14 w-14 bg-rose-500 rounded-2xl flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-bold text-rose-900">Email & Login</p>
                <p className="text-xs text-rose-600 font-medium">Gunakan email yang valid untuk proses autentikasi sistem.</p>
            </div>
        </Card>
        <Card className="border-none shadow-xl rounded-3xl bg-emerald-50/50 p-6 flex items-center gap-5">
            <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-bold text-emerald-900">Keamanan SI</p>
                <p className="text-xs text-emerald-600 font-medium">Selalu jaga kerahasiaan password dan update secara berkala.</p>
            </div>
        </Card>
      </div>
    </div>
  )
}
