'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Search, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Filter,
  Calendar,
  Mail,
  FileCheck,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Send,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Surat {
  id: string
  nomor: string
  tanggal: string
  tujuan: string
  perihal: string
  jenis: string
  status: string
  isi?: string
  template?: string
  catatan?: string
  user: {
    name: string
    email: string
  }
}

interface CreateSuratData {
  tujuan: string
  perihal: string
  jenis: string
  isi: string
  template: string
  tanggal: string
}

export default function SuratPage() {
  const router = useRouter()
  const [suratList, setSuratList] = useState<Surat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedSurat, setSelectedSurat] = useState<Surat | null>(null)
  const [createData, setCreateData] = useState<CreateSuratData>({
    tujuan: '',
    perihal: '',
    jenis: '',
    isi: '',
    template: 'BASIC',
    tanggal: new Date().toISOString().split('T')[0]
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ role?: string, email?: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setCurrentUser(payload)
        } catch (e) {
            console.error('Error decoding token:', e)
        }
    }
  }, [])

  const jenisOptions = [
    { value: 'UNDANGAN', label: 'Surat Undangan' },
    { value: 'PROPOSAL', label: 'Surat Proposal' },
    { value: 'RESMI', label: 'Surat Resmi' },
    { value: 'LAINNYA', label: 'Surat Lainnya' }
  ]

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'MENUNGGU_VALIDASI', label: 'Menunggu Validasi' },
    { value: 'VALIDASI', label: 'Validasi' },
    { value: 'DITOLAK', label: 'Ditolak' }
  ]

  const handleStatusUpdate = async (id: string, newStatus: string, notes?: string) => {
    try {
        const token = localStorage.getItem('token')
        const body: any = { status: newStatus }
        if (notes) body.catatan = notes

        const res = await fetch(`/api/surat/keluar/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(body)
        })

        if (res.ok) {
            toast.success(`Surat berhasil ${newStatus === 'VALIDASI' ? 'disetujui' : 'ditolak'}`)
            setShowDetailDialog(false)
            setShowRejectDialog(false)
            fetchSurat()
        } else {
            const data = await res.json()
            toast.error(data.error || 'Gagal memperbarui status surat')
        }
    } catch (error) {
        toast.error('Terjadi kesalahan server')
    }
  }

  const fetchSurat = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      })
      if (search) params.append('search', search)
      if (filterJenis) params.append('jenis', filterJenis)
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/surat/keluar?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSuratList(data.data)
      }
    } catch (error) {
      console.error('Error fetching surat:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurat()
  }, [search, filterJenis, filterStatus])

  const resetForm = () => {
    setCreateData({
      tujuan: '',
      perihal: '',
      jenis: '',
      isi: '',
      template: 'BASIC',
      tanggal: new Date().toISOString().split('T')[0]
    })
    setEditingId(null)
  }

  const handleOpenCreate = (jenis: string = '') => {
    if (jenis === 'PROPOSAL') {
      router.push('/admin/surat/proposal/baru')
      return
    }
    if (jenis === 'UNDANGAN') {
      router.push('/admin/surat/undangan/baru')
      return
    }
    resetForm()
    if (jenis) {
      setCreateData(prev => ({ ...prev, jenis }))
    }
    setShowCreateDialog(true)
  }

  const handleEdit = (surat: Surat) => {
    if (surat.jenis === 'PROPOSAL') {
      router.push(`/admin/surat/proposal/baru?id=${surat.id}`)
      return
    }
    if (surat.jenis === 'UNDANGAN') {
      router.push(`/admin/surat/undangan/baru?id=${surat.id}`)
      return
    }
    setEditingId(surat.id)
    setCreateData({
        tujuan: surat.tujuan,
        perihal: surat.perihal,
        jenis: surat.jenis,
        isi: surat.isi || '', 
        template: surat.template || 'BASIC',
        tanggal: new Date(surat.tanggal).toISOString().split('T')[0]
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (id: string, perihal: string, onSuccess?: () => void) => {
      if (!confirm(`Apakah Anda yakin ingin menghapus surat "${perihal}"?`)) return

      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/surat/keluar/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
            toast.success('Surat berhasil dihapus')
            onSuccess?.()
            fetchSurat()
        } else {
            const data = await res.json()
            toast.error(data.error || 'Gagal menghapus surat')
        }
      } catch (error) {
          toast.error('Terjadi kesalahan server')
      }
  }

  const handleSubmitSurat = async () => {
    setCreateLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = editingId ? `/api/surat/keluar/${editingId}` : '/api/surat/keluar'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createData)
      })

      if (response.ok) {
        toast.success(editingId ? 'Surat berhasil diperbarui' : 'Surat berhasil dibuat')
        setShowCreateDialog(false)
        resetForm()
        fetchSurat()
      } else {
        const data = await response.json()
        toast.error(data.error || (editingId ? 'Gagal memperbarui surat' : 'Gagal membuat surat'))
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleViewDetail = (surat: Surat) => {
      if (surat.jenis === 'PROPOSAL') {
          router.push(`/admin/surat/proposal/baru?id=${surat.id}&mode=view`)
          return
      }
      if (surat.jenis === 'UNDANGAN') {
          router.push(`/admin/surat/undangan/baru?id=${surat.id}&mode=view`)
          return
      }
      setSelectedSurat(surat)
      setShowDetailDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-600'
      case 'MENUNGGU_VALIDASI': return 'bg-amber-100 text-amber-600'
      case 'VALIDASI': return 'bg-emerald-100 text-emerald-600'
      case 'DITOLAK': return 'bg-rose-100 text-rose-600'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'UNDANGAN': return 'bg-[#5E17EB]/10 text-[#5E17EB]'
      case 'PROPOSAL': return 'bg-indigo-100 text-indigo-700'
      case 'RESMI': return 'bg-cyan-100 text-cyan-700'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl h-48 animate-pulse bg-white"></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Surat</h1>
          <p className="text-slate-500 mt-1 font-medium">Pengelolaan surat keluar dan permohonan validasi administrasi.</p>
        </div>
        <div className="flex flex-row items-center gap-3">
          {currentUser?.role !== 'KETUA' && (
            <Button variant="outline" className="flex-1 sm:flex-none rounded-xl border-slate-200 h-11 font-bold text-slate-600">
              Arsip
            </Button>
          )}
          {currentUser?.role !== 'KETUA' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="flex-1 sm:flex-none rounded-xl bg-[#5E17EB] hover:bg-[#4a11c0] h-11 font-bold shadow-lg shadow-[#5E17EB]/20"
                >
                  <Plus className="h-5 w-5 mr-1 sm:mr-2" />
                  <span className="truncate">Baru</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl min-w-[200px] p-2 shadow-2xl border-none">
                <DropdownMenuItem 
                  className="rounded-xl h-11 font-bold text-slate-700 focus:bg-[#5E17EB]/5 focus:text-[#5E17EB] cursor-pointer"
                  onClick={() => handleOpenCreate('PROPOSAL')}
                >
                  <FileText className="mr-2 h-4 w-4" /> Surat Proposal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl h-11 font-bold text-slate-700 focus:bg-[#5E17EB]/5 focus:text-[#5E17EB] cursor-pointer"
                  onClick={() => handleOpenCreate('UNDANGAN')}
                >
                  <Mail className="mr-2 h-4 w-4" /> Surat Undangan
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl h-11 font-bold text-slate-700 focus:bg-[#5E17EB]/5 focus:text-[#5E17EB] cursor-pointer"
                  onClick={() => handleOpenCreate('RESMI')}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" /> Surat Resmi
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl h-11 font-bold text-slate-700 focus:bg-[#5E17EB]/5 focus:text-[#5E17EB] cursor-pointer"
                  onClick={() => handleOpenCreate('LAINNYA')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Surat Lain-lain
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { title: 'Total', value: suratList.length, icon: Mail, color: 'text-[#5E17EB]', bgColor: 'bg-[#5E17EB]/5' },
          { title: 'Menunggu', value: suratList.filter(s => s.status === 'MENUNGGU_VALIDASI').length, icon: ShieldCheck, color: 'text-amber-600', bgColor: 'bg-amber-50' },
          { title: 'Valid', value: suratList.filter(s => s.status === 'VALIDASI').length, icon: FileCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
          { title: 'Ditolak', value: suratList.filter(s => s.status === 'DITOLAK').length, icon: Trash2, color: 'text-rose-600', bgColor: 'bg-rose-50' }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl bg-white overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nomor surat atau perihal..." 
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl shadow-none focus-visible:ring-[#5E17EB]/20 font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-row gap-2 w-full lg:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 sm:h-12 flex-1 lg:w-[150px] rounded-2xl border-slate-200 text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterJenis} onValueChange={setFilterJenis}>
                <SelectTrigger className="h-10 sm:h-12 flex-1 lg:w-[150px] rounded-2xl border-slate-200 text-xs sm:text-sm">
                  <SelectValue placeholder="Jenis" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ALL">Semua Jenis</SelectItem>
                  {jenisOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surat List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suratList.map((surat) => (
          <Card key={surat.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden border-t-4 border-t-transparent hover:border-t-[#5E17EB]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-4">
                <Badge className={`rounded-full px-3 py-1 font-bold border-none transition-all ${getJenisBadge(surat.jenis)}`}>
                  {surat.jenis}
                </Badge>
                <Badge className={`rounded-full px-3 py-1 font-bold border-none transition-all ${getStatusBadge(surat.status)}`}>
                  {surat.status}
                </Badge>
              </div>
              <CardTitle className="text-lg font-extrabold text-slate-900 group-hover:text-[#5E17EB] transition-colors leading-tight line-clamp-2">
                {surat.perihal}
              </CardTitle>
              <p className="text-[11px] font-bold text-slate-400 mt-2 tracking-widest uppercase">{surat.nomor}</p>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center text-sm font-medium text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                    <Send className="h-4 w-4 text-slate-400" />
                  </div>
                  <span className="truncate">{surat.tujuan}</span>
                </div>
                
                <div className="flex items-center text-sm font-medium text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  {new Date(surat.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#5E17EB]/10 text-[#5E17EB] text-[10px] font-bold">
                        {surat.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-bold text-slate-400">By {surat.user.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="hidden md:flex space-x-1">
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-[#5E17EB] hover:bg-[#5E17EB]/5" onClick={() => handleViewDetail(surat)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye h-4 w-4" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </Button>
                      {currentUser?.role !== 'KETUA' && (
                        <>
                          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-[#5E17EB] hover:bg-[#5E17EB]/5 disabled:opacity-30 disabled:hover:bg-transparent" onClick={() => {
                              if (surat.jenis === 'PROPOSAL') {
                                  router.push(`/admin/surat/proposal/baru?id=${surat.id}`)
                              } else if (surat.jenis === 'UNDANGAN') {
                                  router.push(`/admin/surat/undangan/baru?id=${surat.id}`)
                              } else {
                                  router.push(`/admin/surat/proposal/baru?id=${surat.id}`)
                              }
                          }} disabled={surat.status !== 'VALIDASI' && !(currentUser && (currentUser.role === 'KETUA' || currentUser.role === 'MASTER_ADMIN' || currentUser.email === 'ketua@satriapinayungan.org'))}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed" onClick={() => handleEdit(surat)} disabled={surat.status === 'VALIDASI'}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent" onClick={() => handleDelete(surat.id, surat.perihal)} disabled={surat.status !== 'DRAFT' && !(currentUser && currentUser.role === 'MASTER_ADMIN')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-[#5E17EB]">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl min-w-[150px]">
                                <DropdownMenuItem onClick={() => handleViewDetail(surat)}>
                                    <Eye className="mr-2 h-4 w-4" /> Detail
                                </DropdownMenuItem>
                                {currentUser?.role !== 'KETUA' && (
                                  <>
                                    <DropdownMenuItem onClick={() => {
                                        if (surat.jenis === 'PROPOSAL') {
                                            router.push(`/admin/surat/proposal/baru?id=${surat.id}`)
                                        } else if (surat.jenis === 'UNDANGAN') {
                                            router.push(`/admin/surat/undangan/baru?id=${surat.id}`)
                                        } else {
                                            router.push(`/admin/surat/proposal/baru?id=${surat.id}`)
                                        }
                                    }} disabled={surat.status !== 'VALIDASI' && !(currentUser && (currentUser.role === 'KETUA' || currentUser.role === 'MASTER_ADMIN' || currentUser.email === 'ketua@satriapinayungan.org'))}>
                                        <Download className="mr-2 h-4 w-4" /> Unduh
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(surat)} disabled={surat.status === 'VALIDASI'}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 disabled:opacity-50" onClick={() => handleDelete(surat.id, surat.perihal)} disabled={surat.status !== 'DRAFT' && !(currentUser && currentUser.role === 'MASTER_ADMIN')}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {suratList.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] shadow-sm border border-slate-100">
            <Mail className="h-20 w-20 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900">Belum Ada Surat</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">Klik tombol 'Buat Surat Baru' untuk mulai mengelola administrasi surat menyurat.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Surat Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] sm:max-w-xl rounded-4xl p-0 overflow-hidden border-none shadow-2xl max-h-[96vh] overflow-y-auto">
          <div className="p-6 sm:p-8 bg-[#5E17EB] text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold flex items-center">
                <FileText className="mr-3 h-6 w-6" />
                {editingId ? 'Edit Surat' : 'Buat Surat Baru'}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium">
                {editingId ? 'Perbarui informasi surat.' : 'Isi detail surat di bawah untuk diterbitkan dan menunggu validasi.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 sm:p-8 bg-white space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Tujuan Surat</Label>
                <Input
                  placeholder="Nama Instansi/Orang"
                  className="h-12 rounded-2xl border-slate-200"
                  value={createData.tujuan}
                  onChange={(e) => setCreateData({ ...createData, tujuan: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Tanggal Surat</Label>
                <Input
                  type="date"
                  className="h-12 rounded-2xl border-slate-200"
                  value={createData.tanggal}
                  onChange={(e) => setCreateData({ ...createData, tanggal: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Jenis Surat</Label>
                <Select value={createData.jenis} onValueChange={(val) => setCreateData({ ...createData, jenis: val })}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {jenisOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Perihal</Label>
                <Input
                  placeholder="Subjek Utama Surat"
                  className="h-12 rounded-2xl border-slate-200"
                  value={createData.perihal}
                  onChange={(e) => setCreateData({ ...createData, perihal: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 ml-1">Isi Ringkas / Deskripsi</Label>
              <Textarea
                placeholder="Tuliskan poin-poin utama atau isi surat di sini..."
                className="rounded-2xl border-slate-200 min-h-[150px]"
                value={createData.isi}
                onChange={(e) => setCreateData({ ...createData, isi: e.target.value })}
              />
            </div>

            {!editingId && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
                   <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-xs text-amber-700 font-medium leading-relaxed">
                     Nomor surat akan di-generate secara otomatis oleh sistem setelah Anda menyimpan draft ini.
                   </p>
                </div>
            )}

            <div className="pt-4 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setShowCreateDialog(false)}>
                Batal
              </Button>
              <Button 
                className="flex-1 h-12 rounded-2xl font-extrabold bg-[#5E17EB] hover:bg-[#4a11c0] shadow-lg shadow-[#5E17EB]/20"
                onClick={handleSubmitSurat}
                disabled={createLoading}
              >
                {createLoading ? 'Memproses...' : (editingId ? 'Simpan Perubahan' : 'Simpan & Ajukan')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Detail View Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] sm:max-w-3xl rounded-4xl p-0 overflow-hidden border-none shadow-2xl h-[90vh] sm:h-[80vh] flex flex-col">
            {selectedSurat && (
                <>
                <div className="p-6 sm:p-8 bg-[#5E17EB] text-white shrink-0">
                    <DialogHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                             <div>
                                <DialogTitle className="text-xl sm:text-2xl font-extrabold mb-2">{selectedSurat.perihal}</DialogTitle>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                                        {selectedSurat.jenis}
                                    </Badge>
                                    <Badge className={`${getStatusBadge(selectedSurat.status)} border-0 shadow-sm bg-white/90`}>
                                        {selectedSurat.status}
                                    </Badge>
                                </div>
                             </div>
                             <div className="sm:text-right">
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Nomor Surat</p>
                                <p className="text-lg sm:text-xl font-mono font-bold mt-1">{selectedSurat.nomor}</p>
                             </div>
                        </div>
                    </DialogHeader>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-white space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Tujuan</h4>
                            <div className="flex items-center text-slate-800 font-bold text-lg">
                                <Send className="h-5 w-5 mr-3 text-[#5E17EB]" />
                                {selectedSurat.tujuan}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal</h4>
                             <div className="flex items-center text-slate-800 font-bold text-lg">
                                <Calendar className="h-5 w-5 mr-3 text-[#5E17EB]" />
                                {new Date(selectedSurat.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Isi Surat / Keterangan</h4>
                        {selectedSurat.status === 'DITOLAK' && selectedSurat.catatan && (
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4 flex items-start gap-3">
                                <Info className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-rose-700 mb-1">Ditolak: Perlu Revisi</h4>
                                    <p className="text-rose-600/90 text-sm leading-relaxed">{selectedSurat.catatan}</p>
                                </div>
                            </div>
                        )}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedSurat.isi || 'Tidak ada isi surat.'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                         <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[#5E17EB] text-white font-bold">
                                    {selectedSurat.user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Dibuat Oleh</p>
                                <p className="font-bold text-slate-900">{selectedSurat.user.name}</p>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 bg-slate-50 border-t shrink-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    {currentUser && (currentUser.role === 'KETUA' || currentUser.role === 'MASTER_ADMIN' || currentUser.email === 'ketua@satriapinayungan.org') && (selectedSurat.status === 'MENUNGGU_VALIDASI' || selectedSurat.status === 'DRAFT') && (
                        <>
                             <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl px-6 font-bold" onClick={() => {
                                 setRejectReason('')
                                 setShowDetailDialog(false)
                                 setShowRejectDialog(true)
                             }}>
                                <XCircle className="h-4 w-4 mr-2" /> Tolak
                            </Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 font-bold text-white shadow-lg shadow-emerald-600/20" onClick={() => handleStatusUpdate(selectedSurat.id, 'VALIDASI')}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Setujui
                            </Button>
                        </>
                    )}
                    <Button className="rounded-xl px-6 h-11 sm:h-10 font-bold bg-[#5E17EB] hover:bg-[#4a11c0] w-full sm:w-auto" onClick={() => setShowDetailDialog(false)}>
                        Tutup
                    </Button>
                    <Button 
                        variant="outline" 
                        className="rounded-xl px-6 h-11 sm:h-10 font-bold disabled:opacity-50 w-full sm:w-auto order-first sm:order-0" 
                        onClick={() => {
                            if (selectedSurat.jenis === 'PROPOSAL') {
                                router.push(`/admin/surat/proposal/baru?id=${selectedSurat.id}`)
                            } else if (selectedSurat.jenis === 'UNDANGAN') {
                                router.push(`/admin/surat/undangan/baru?id=${selectedSurat.id}`)
                            } else {
                                router.push(`/admin/surat/proposal/baru?id=${selectedSurat.id}`)
                            }
                        }}
                        disabled={selectedSurat.status !== 'VALIDASI' && !(currentUser && (currentUser.role === 'KETUA' || currentUser.role === 'MASTER_ADMIN' || currentUser.email === 'ketua@satriapinayungan.org'))}
                    >
                        <Download className="h-4 w-4 mr-2" /> Unduh
                    </Button>
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="w-[90vw] sm:max-w-md rounded-4xl border-none shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center text-rose-600">
              <XCircle className="mr-2 h-5 w-5" />
              Tolak Surat
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan atau catatan revisi untuk pemohon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <Textarea 
                placeholder="Contoh: Format surat salah, perbaiki tanggal..."
                className="min-h-[100px] rounded-xl border-slate-200"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
             />
             <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowRejectDialog(false)} className="rounded-xl font-bold">Batal</Button>
                <Button 
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                    onClick={() => {
                        if (!rejectReason.trim()) {
                            toast.error('Harap berikan alasan penolakan')
                            return
                        }
                        if (selectedSurat) {
                            handleStatusUpdate(selectedSurat.id, 'DITOLAK', rejectReason)
                        }
                    }}
                >
                    Kirim Penolakan
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}