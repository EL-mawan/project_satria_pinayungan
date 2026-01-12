'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  FileText, 
  Search, 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Send,
  Eye,
  CheckCircle
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import LaporanPDF from '../keuangan/components/LaporanPDF'

const IDR = ({ className }: { className?: string }) => (
  <div className={`${className} font-bold text-[10px] flex items-center justify-center`}>Rp</div>
)

interface LPJ {
  id: string
  periode: string
  tanggalMulai: string
  tanggalSelesai: string
  totalPemasukan: number
  totalPengeluaran: number
  saldo: number
  status: string
  keterangan?: string
  catatan?: string
  file?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

export default function LpjPage() {
  // Data States
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Filter States
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const { data: lpjData, isLoading: loading } = useQuery({
    queryKey: ['lpj', search, filterStatus],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterStatus !== 'ALL') params.append('status', filterStatus)
      
      const res = await fetch(`/api/keuangan/lpj?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch lpj')
      return res.json()
    },
    refetchInterval: 15000,
  })

  const lpjList = lpjData?.data || []

  // Dialog & Selection States
  const [selectedLPJ, setSelectedLPJ] = useState<LPJ | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Loading States
  const [submitLoading, setSubmitLoading] = useState(false)
  const [calcLoading, setCalcLoading] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // PDF Data State
  const [pdfData, setPdfData] = useState<{
    pemasukanList: any[]
    pengeluaranList: any[]
    summary: { totalPemasukan: number; totalPengeluaran: number; saldo: number }
    tanggalMulai?: string
    tanggalSelesai?: string
  }>({
    pemasukanList: [],
    pengeluaranList: [],
    summary: { totalPemasukan: 0, totalPengeluaran: 0, saldo: 0 },
    tanggalMulai: '',
    tanggalSelesai: ''
  })

  const [formData, setFormData] = useState({
    periode: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    totalPemasukan: 0,
    totalPengeluaran: 0,
    keterangan: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setCurrentUser(JSON.parse(userData))
  }, [])

  const handleCalculateSummary = async () => {
    if (!formData.tanggalMulai || !formData.tanggalSelesai) {
      toast.error('Pilih rentang tanggal terlebih dahulu')
      return
    }

    try {
      setCalcLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/keuangan/summary?startDate=${formData.tanggalMulai}&endDate=${formData.tanggalSelesai}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({
          ...prev,
          totalPemasukan: result.data.totalPemasukan,
          totalPengeluaran: result.data.totalPengeluaran
        }))
        toast.success('Data keuangan berhasil dikalkulasi')
      } else {
        toast.error('Gagal menghitung ringkasan keuangan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server')
    } finally {
      setCalcLoading(false)
    }
  }

  const handleCreateLPJ = async () => {
    if (!formData.periode || !formData.tanggalMulai || !formData.tanggalSelesai) {
      toast.error('Harap isi data wajib dengan lengkap')
      return
    }

    try {
      setSubmitLoading(true)
      const token = localStorage.getItem('token')
      
      const url = editingId ? `/api/keuangan/lpj/${editingId}` : '/api/keuangan/lpj'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingId ? 'LPJ berhasil diperbarui' : 'LPJ berhasil diajukan')
        setShowCreateDialog(false)
        resetForm()
        queryClient.invalidateQueries({ queryKey: ['lpj'] })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menyimpan LPJ', {
          description: data.details
        })
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server', {
        description: 'Pastikan koneksi internet stabil'
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string, catatan?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/keuangan/lpj/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status, catatan })
      })

      if (response.ok) {
        toast.success(`Status LPJ diperbarui menjadi ${status}`)
        setShowDetailDialog(false)
        setShowRejectDialog(false)
        setRejectReason('')
        queryClient.invalidateQueries({ queryKey: ['lpj'] })
      } else {
        toast.error('Gagal memperbarui status')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server')
    }
  }

  const handleDeleteLPJ = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    
    const toastId = toast.loading('Menghapus data LPJ...')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/keuangan/lpj/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('LPJ berhasil dihapus', { id: toastId })
        setShowDetailDialog(false)
        queryClient.invalidateQueries({ queryKey: ['lpj'] })
      } else {
        toast.error(data.error || 'Gagal menghapus data', { 
          id: toastId,
          description: data.code ? `Kode: ${data.code}` : undefined
        })
      }
    } catch (error) {
      console.error('Error deleting LPJ:', error)
      toast.error('Koneksi terputus. Silakan coba lagi', { 
        id: toastId,
        description: 'Periksa koneksi internet Anda'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      periode: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      totalPemasukan: 0,
      totalPengeluaran: 0,
      keterangan: ''
    })
    setEditingId(null)
  }

  /* PDF Download Handler */
  const pdfRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async (lpj: LPJ) => {
    if (!pdfRef.current) {
      toast.error('Komponen PDF belum siap')
      return
    }
    
    setIsGeneratingPdf(true)
    const toastId = toast.loading('Menyiapkan data laporan...')
    
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Sesi anda telah berakhir. Silakan login kembali.')
      }
      
      // 1. Fetch ALL pemasukan and pengeluaran to filter
      toast.loading('Mengambil data keuangan...', { id: toastId })
      
      // Use a timeout for fetch to prevent hanging
      const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)
        try {
          const response = await fetch(url, { ...options, signal: controller.signal })
          clearTimeout(id)
          return response
        } catch (error) {
          clearTimeout(id)
          throw error
        }
      }

      const [pemRes, pengRes] = await Promise.all([
        fetchWithTimeout(`/api/keuangan/pemasukan?limit=5000&startDate=${lpj.tanggalMulai}&endDate=${lpj.tanggalSelesai}`, { 
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store' 
        }),
        fetchWithTimeout(`/api/keuangan/pengeluaran?limit=5000&startDate=${lpj.tanggalMulai}&endDate=${lpj.tanggalSelesai}`, { 
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        })
      ])

      if (!pemRes.ok) {
        if (pemRes.status === 401) throw new Error('Sesi kadaluarsa. Harap Logout dan Login kembali.')
        const err = await pemRes.json().catch(() => ({}))
        throw new Error(err.error || `Gagal mengambil data pemasukan (${pemRes.status})`)
      }
      
      if (!pengRes.ok) {
        if (pengRes.status === 401) throw new Error('Sesi kadaluarsa. Harap Logout dan Login kembali.')
        const err = await pengRes.json().catch(() => ({}))
        throw new Error(err.error || `Gagal mengambil data pengeluaran (${pengRes.status})`)
      }

      const pemData = await pemRes.json()
      const pengData = await pengRes.json()

      const filteredPemasukan = pemData.data || []
      const filteredPengeluaran = pengData.data || []

      // 2. Validate Data Size
      if (filteredPemasukan.length + filteredPengeluaran.length > 3000) {
        toast.warning('Data laporan terlalu besar. PDF mungkin membutuhkan waktu lama untuk dibuat.', { id: toastId })
      }

      const totalPemasukan = filteredPemasukan.reduce((acc: number, curr: any) => acc + curr.nominal, 0)
      const totalPengeluaran = filteredPengeluaran.reduce((acc: number, curr: any) => acc + curr.nominal, 0)

      // 3. Set PDF Data
      setPdfData({
        pemasukanList: filteredPemasukan,
        pengeluaranList: filteredPengeluaran,
        summary: {
          totalPemasukan,
          totalPengeluaran,
          saldo: totalPemasukan - totalPengeluaran
        },
        tanggalMulai: lpj.tanggalMulai,
        tanggalSelesai: lpj.tanggalSelesai
      })

      // 4. Wait for render
      toast.loading('Membuat dokumen PDF...', { id: toastId })
      await new Promise(resolve => setTimeout(resolve, 1500)) // Increased wait time

      const element = pdfRef.current
      if (!element) {
        throw new Error('Element PDF tidak ditemukan/gagal dirender')
      }

      // Check content height
      if (element.clientHeight === 0) {
        throw new Error('Konten PDF kosong (height 0)')
      }

      const canvas = await html2canvas(element, {
        scale: 2.5, // Increased for better clarity/sharpness
        logging: false, // Turn off logging for production
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('laporan-pdf')
          if (clonedElement) {
            // Helper to convert any color to safe RGB/Hex using Canvas
            const ctx = document.createElement('canvas').getContext('2d');
            const getSafeColor = (color: string) => {
                if (!ctx || !color) return color;
                // If it's already safe, return it
                if (color.startsWith('#') || color.startsWith('rgb') || color === 'transparent') return color;
                
                // Try to convert using canvas
                ctx.fillStyle = color;
                const computed = ctx.fillStyle;
                if (computed && !computed.includes('lab') && !computed.includes('oklch')) {
                    return computed;
                }
                // Fallback if canvas also returns weird format or fails (unlikely in modern browsers for standard named colors, but lab support varies)
                return '#000000'; 
            };

            // Safe cleanup
            const head = clonedDoc.head;
            const styleTags = head.querySelectorAll('style, link[rel="stylesheet"]');
            styleTags.forEach(tag => tag.remove()); 

            // Add safe print styles
            const safeStyle = clonedDoc.createElement('style');
            safeStyle.innerHTML = `
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box !important; }
              body { background: white !important; margin: 0 !important; padding: 0 !important; color: black !important; }
              #laporan-pdf { display: block !important; visibility: visible !important; position: relative !important; left: 0 !important; top: 0 !important; }
              table { border-collapse: collapse !important; width: 100% !important; }
              th, td { border: 1px solid black !important; }
            `;
            head.appendChild(safeStyle);

            clonedElement.style.display = 'block'
            clonedElement.style.visibility = 'visible'
            
            // Force colors to safe values
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach((el: any) => {
              const styles = window.getComputedStyle(el);
              
              // Properties to sanitize
              const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor'];
              
              props.forEach(prop => {
                  const val = styles[prop as any];
                  if (val && (val.includes('lab') || val.includes('oklch'))) {
                       // Force convert to safe color
                       el.style[prop as any] = getSafeColor(val);
                  } else if (val && !el.style[prop as any]) {
                       // If explicit style missing, set it from computed (safely)
                       el.style[prop as any] = val;
                  }
              });

              // SVGs need special handling for fill/stroke
              if (el.tagName === 'svg' || el.tagName === 'path' || el.tagName === 'circle' || el.tagName === 'rect') {
                const fill = styles.fill;
                const stroke = styles.stroke;
                if (fill && fill !== 'none') el.style.fill = getSafeColor(fill);
                if (stroke && stroke !== 'none') el.style.stroke = getSafeColor(stroke);
              }
            })
          }
        }
      })
      
      const imgData = canvas.toDataURL('image/png')
      // Validate image data
      if (imgData === 'data:,' || imgData.length < 1000) {
        throw new Error('Gagal mengkonversi canvas ke gambar')
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Page 1
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Extra pages
      while (heightLeft > 0.5) {
        pdf.addPage()
        position = heightLeft - imgHeight
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `Laporan_LPJ_${lpj.periode.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
      pdf.save(fileName)
      
      toast.success('Laporan berhasil diunduh', { id: toastId })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(`Gagal: ${error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}`, { 
        id: toastId,
        duration: 5000,
        description: 'Periksa koneksi atau coba muat ulang halaman'
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleEditLPJ = (lpj: LPJ) => {
    setFormData({
        periode: lpj.periode,
        tanggalMulai: lpj.tanggalMulai.split('T')[0],
        tanggalSelesai: lpj.tanggalSelesai.split('T')[0],
        totalPemasukan: lpj.totalPemasukan,
        totalPengeluaran: lpj.totalPengeluaran,
        keterangan: lpj.keterangan || ''
    })
    setEditingId(lpj.id)
    setShowCreateDialog(true)
  }

  const formatIDDate = (dateString: string, detailed = false) => {
    if (!dateString) return '-'
    const options: Intl.DateTimeFormatOptions = detailed 
        ? { year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: '2-digit', day: '2-digit' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }

  const formatCurrency = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-600'
      case 'DIAJUKAN': return 'bg-amber-100 text-amber-600'
      case 'DISETUJUI': return 'bg-emerald-100 text-emerald-600'
      case 'DITOLAK': return 'bg-rose-100 text-rose-600'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Laporan Pertanggungjawaban (LPJ)</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">Arsip dan pengelolaan laporan keuangan padepokan.</p>
        </div>
        <div className="flex gap-2">
            <Button 
                className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl font-bold h-11 md:h-12 px-4 md:px-6 shadow-lg shadow-indigo-100 w-full md:w-auto text-sm md:text-base"
                onClick={() => setShowCreateDialog(true)}
            >
                <Plus className="mr-2 h-4 md:h-5 w-4 md:w-5" /> Buat LPJ
            </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total LPJ', value: lpjList.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Disetujui', value: lpjList.filter(l => l.status === 'DISETUJUI').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Menunggu', value: lpjList.filter(l => l.status === 'DIAJUKAN').length, icon: Info, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Draft', value: lpjList.filter(l => l.status === 'DRAFT').length, icon: Edit, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-xl md:rounded-2xl overflow-hidden">
            <CardContent className="p-3 md:p-5 flex items-center space-x-2 md:space-x-4">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-4 md:h-5 w-4 md:w-5" />
              </div>
              <div>
                <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider md:tracking-widest">{stat.label}</p>
                <p className="text-lg md:text-xl font-black text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-3 md:p-4 flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari periode atau keterangan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && queryClient.invalidateQueries({ queryKey: ['lpj'] })}
              className="pl-10 md:pl-11 h-10 md:h-11 bg-slate-50 border-none rounded-lg md:rounded-xl focus-visible:ring-indigo-500/20 text-sm md:text-base"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px] md:w-[160px] h-10 md:h-11 rounded-lg md:rounded-xl border-slate-200 text-sm md:text-base">
                    <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg md:rounded-xl border-slate-200">
                    <SelectItem value="ALL" className="font-bold text-sm md:text-base">Semua Status</SelectItem>
                    {[
                      { v: 'DRAFT', l: 'Draft' },
                      { v: 'DIAJUKAN', l: 'Diajukan' },
                      { v: 'DISETUJUI', l: 'Disetujui' },
                      { v: 'DITOLAK', l: 'Ditolak' }
                    ].map(item => (
                      <SelectItem key={item.v} value={item.v} className="font-medium text-sm md:text-base">{item.l}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['lpj'] })} className="h-10 md:h-11 rounded-lg md:rounded-xl bg-slate-900 border-none px-4 md:px-6 font-bold hover:bg-black transition-all text-sm md:text-base">
              Terapkan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LPJ List */}
      <div className="grid gap-6">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p className="font-medium">Memuat arsip laporan...</p>
             </div>
        ) : lpjList.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-4xl border border-dashed border-slate-200 shadow-sm animate-in fade-in zoom-in duration-500">
                <FileText className="h-16 w-16 text-slate-100 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada laporan pertanggungjawaban</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">Buat laporan pertama Anda untuk memulai pengarsipan keuangan yang tertib.</p>
                <Button 
                    className="bg-[#5E17EB] hover:bg-[#4a11c0] text-white rounded-xl font-bold h-11 px-8 shadow-lg shadow-indigo-100"
                    onClick={() => setShowCreateDialog(true)}
                >
                    <Plus className="mr-2 h-4 w-4" /> Mulai Buat Laporan
                </Button>
            </div>
        ) : (
            lpjList.map((lpj) => (
                <Card key={lpj.id} className="border-none shadow-sm rounded-2xl md:rounded-3xl group hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-0 flex flex-col lg:flex-row items-stretch">
                        <div className="p-4 md:p-6 flex-1 lg:border-r border-slate-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-4">
                                <h3 className="text-base md:text-xl font-extrabold text-slate-900 group-hover:text-[#5E17EB] transition-colors wrap-break-word">{lpj.periode}</h3>
                                <Badge className={`rounded-full px-2 md:px-3 py-1 font-bold border-none text-xs md:text-sm w-fit ${getStatusBadge(lpj.status)}`}>
                                    {lpj.status}
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider md:tracking-widest mb-1">Pemasukan</p>
                                    <p className="text-xs md:text-base font-extrabold text-emerald-600 wrap-break-word">{formatCurrency(lpj.totalPemasukan)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider md:tracking-widest mb-1">Pengeluaran</p>
                                    <p className="text-xs md:text-base font-extrabold text-rose-600 wrap-break-word">{formatCurrency(lpj.totalPengeluaran)}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider md:tracking-widest mb-1">Sisa Saldo</p>
                                    <p className="text-xs md:text-base font-extrabold text-[#5E17EB] wrap-break-word">{formatCurrency(lpj.saldo)}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center text-[10px] md:text-xs font-bold text-slate-400 gap-2 md:gap-y-2 md:gap-x-4">
                                <div className="flex items-center">
                                    <Calendar className="h-3 md:h-3.5 w-3 md:w-3.5 mr-1.5 shrink-0" />
                                    <span className="wrap-break-word">{formatIDDate(lpj.tanggalMulai)} - {formatIDDate(lpj.tanggalSelesai)}</span>
                                </div>
                                <div className="flex items-center">
                                    <Avatar className="h-5 md:h-6 w-5 md:w-6 mr-2 shrink-0">
                                        <AvatarFallback className="bg-slate-100 text-[9px] md:text-[10px]">{lpj.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">{lpj.user.name}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 md:p-6 flex flex-row flex-wrap lg:flex-col justify-center items-center gap-2 md:gap-3 lg:border-l lg:border-slate-100 bg-slate-50/30 border-t lg:border-t-0">
                            <Button 
                                variant="outline" 
                                size="icon"
                                className="h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl border-slate-200 bg-white text-slate-600 hover:text-[#5E17EB] hover:border-[#5E17EB]/30 hover:bg-indigo-50 transition-all duration-300 shadow-sm" 
                                onClick={() => {
                                    setSelectedLPJ(lpj)
                                    setShowDetailDialog(true)
                                }}
                                title="Lihat Detail"
                            >
                                <Eye className="h-4 md:h-5 w-4 md:w-5" />
                            </Button>

                            <Button 
                                variant="outline" 
                                size="icon"
                                className="h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-300 shadow-sm" 
                                onClick={() => handleDownloadPDF(lpj)}
                                disabled={isGeneratingPdf || (lpj.status !== 'DISETUJUI' && !['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role))}
                                title="Download LPJ"
                            >
                                {isGeneratingPdf ? <Loader2 className="h-4 md:h-5 w-4 md:w-5 animate-spin" /> : <Download className="h-4 md:h-5 w-4 md:w-5" />}
                            </Button>
                            
                            {(lpj.user.email === currentUser?.email || ['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role)) && (
                                <>
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        className="h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl border-slate-200 bg-white text-slate-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all duration-300 shadow-sm" 
                                        onClick={() => handleEditLPJ(lpj)}
                                        disabled={lpj.status === 'DISETUJUI' && !['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role)}
                                        title="Edit Laporan"
                                    >
                                        <Edit className="h-4 md:h-5 w-4 md:w-5" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        className="h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-300 shadow-sm" 
                                        onClick={() => handleDeleteLPJ(lpj.id)}
                                        disabled={lpj.status === 'DISETUJUI' && currentUser?.role === 'BENDAHARA'}
                                        title="Hapus Laporan"
                                    >
                                        <Trash2 className="h-4 md:h-5 w-4 md:w-5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>

      {/* Create LPJ Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl rounded-4xl p-0 overflow-hidden border-none shadow-2xl h-[90vh] overflow-y-auto">
          <div className="p-8 bg-[#5E17EB] text-white shrink-0">
            <DialogHeader>
               <DialogTitle className="text-2xl font-extrabold flex items-center">
                {editingId ? <Edit className="mr-3 h-6 w-6" /> : <Plus className="mr-3 h-6 w-6" />}
                {editingId ? 'Edit Draft Laporan' : 'Buat Laporan LPJ'}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium">
                Rekapitulasi keuangan periode tertentu untuk pertanggungjawaban.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 bg-white space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Nama Periode Laporan</Label>
                    <Input 
                        placeholder="Contoh: Laporan Rutin Januari 2024"
                        value={formData.periode}
                        onChange={(e) => setFormData({...formData, periode: e.target.value})}
                        className="h-12 rounded-2xl border-slate-200 font-bold"
                    />
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mb-2">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        Laporan ini secara otomatis merekapitulasi seluruh data keuangan (Pemasukan & Pengeluaran) yang telah dicatat pada sistem untuk rentang tanggal yang dipilih.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-slate-700 ml-1">Tanggal Mulai</Label>
                        <Input 
                            type="date"
                            className="h-12 rounded-2xl border-slate-200"
                            value={formData.tanggalMulai}
                            onChange={(e) => setFormData({...formData, tanggalMulai: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-slate-700 ml-1">Tanggal Selesai</Label>
                        <Input 
                            type="date"
                            className="h-12 rounded-2xl border-slate-200"
                            value={formData.tanggalSelesai}
                            onChange={(e) => setFormData({...formData, tanggalSelesai: e.target.value})}
                        />
                    </div>
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-indigo-900">Kalkulasi Keuangan Otomatis</h4>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg h-9"
                            onClick={handleCalculateSummary}
                            disabled={calcLoading}
                        >
                            {calcLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tarik Data"}
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Total Pemasukan</Label>
                            <div className="relative group">
                                <IDR className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                <Input 
                                    type="number"
                                    className="pl-10 h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold text-emerald-600"
                                    value={formData.totalPemasukan}
                                    onChange={(e) => setFormData({...formData, totalPemasukan: parseFloat(e.target.value) || 0})}
                                    readOnly={formData.totalPemasukan > 0}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Total Pengeluaran</Label>
                            <div className="relative">
                                <IDR className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500" />
                                <Input 
                                    type="number"
                                    className="pl-10 h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold text-rose-600"
                                    value={formData.totalPengeluaran}
                                    onChange={(e) => setFormData({...formData, totalPengeluaran: parseFloat(e.target.value) || 0})}
                                    readOnly={formData.totalPengeluaran > 0}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between px-2 text-indigo-900">
                        <span className="font-bold">Estimasi Saldo:</span>
                        <span className="text-lg font-black">{formatCurrency(formData.totalPemasukan - formData.totalPengeluaran)}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Keterangan Tambahan</Label>
                    <Textarea 
                        placeholder="Berikan ringkasan atau catatan penting untuk laporan ini..."
                        className="rounded-2xl border-slate-200 min-h-[100px]"
                        value={formData.keterangan}
                        onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                    />
                </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setShowCreateDialog(false)}>
                Batal
              </Button>
              <Button 
                className="flex-1 h-12 rounded-2xl font-extrabold bg-[#5E17EB] hover:bg-[#4a11c0] shadow-xl shadow-indigo-200"
                onClick={handleCreateLPJ}
                disabled={submitLoading}
              >
                {submitLoading ? <Loader2 className="h-5 w-5 animate-spin p-4" /> : (editingId ? 'Simpan Perubahan' : 'Simpan Draft Laporan')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail LPJ Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] sm:max-w-3xl rounded-4xl p-0 overflow-hidden border-none shadow-2xl h-[90vh] sm:h-[80vh] flex flex-col">
          {selectedLPJ && (
            <>
              <div className="p-8 bg-[#5E17EB] text-white shrink-0">
                <DialogHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-black mb-2">{selectedLPJ.periode}</DialogTitle>
                            <Badge className={`${getStatusBadge(selectedLPJ.status)} border-0 shadow-sm bg-white/90 font-bold px-3 py-1`}>
                                {selectedLPJ.status}
                            </Badge>
                        </div>
                         <div className="sm:text-right shrink-0">
                             <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest pl-1">Periode Transaksi</p>
                             <div className="flex items-center text-lg font-bold mt-1 bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                                <Calendar className="h-4.5 w-4.5 mr-2.5 opacity-80" />
                                {formatIDDate(selectedLPJ.tanggalMulai)} - {formatIDDate(selectedLPJ.tanggalSelesai)}
                             </div>
                         </div>
                    </div>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-white space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Total Pemasukan</p>
                        <div className="flex items-center">
                            <TrendingUp className="h-6 w-6 text-emerald-500 mr-3" />
                            <span className="text-2xl font-black text-slate-900">{formatCurrency(selectedLPJ.totalPemasukan)}</span>
                        </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-rose-50/50 border border-rose-100">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">Total Pengeluaran</p>
                        <div className="flex items-center">
                            <TrendingDown className="h-6 w-6 text-rose-500 mr-3" />
                            <span className="text-2xl font-black text-slate-900">{formatCurrency(selectedLPJ.totalPengeluaran)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
                    <div>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Saldo Akhir Periode</p>
                        <h4 className="text-3xl font-black text-indigo-900">{formatCurrency(selectedLPJ.saldo)}</h4>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <IDR className="h-8 w-8 text-indigo-600" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Ringkasan Laporan</h4>
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {selectedLPJ.keterangan || 'Tidak ada keterangan tambahan.'}
                    </div>
                </div>

                {selectedLPJ.catatan && (
                  <div className="space-y-3">
                      <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest pl-1">Catatan Admin</h4>
                      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-rose-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {selectedLPJ.catatan}
                      </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-indigo-600 text-white font-bold">{selectedLPJ.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Dibuat Oleh</p>
                            <p className="font-bold text-slate-900">{selectedLPJ.user.name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Buat</p>
                        <p className="font-bold text-slate-900">{new Date(selectedLPJ.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                {selectedLPJ.status === 'DRAFT' && selectedLPJ.user.email === currentUser?.email && (
                    <Button className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto" onClick={() => handleStatusUpdate(selectedLPJ.id, 'DIAJUKAN')}>
                        <Send className="h-4 w-4 mr-2" /> Ajukan Laporan
                    </Button>
                )}
                 {['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role) && selectedLPJ.status === 'DIAJUKAN' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="rounded-xl h-11 px-6 font-bold text-rose-600 border-rose-200 hover:bg-rose-50 w-full sm:w-auto" onClick={() => {
                            setRejectReason('')
                            setShowDetailDialog(false)
                            setShowRejectDialog(true)
                        }}>
                            <XCircle className="h-4 w-4 mr-2" /> Tolak
                        </Button>
                        <Button className="rounded-xl h-11 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto text-white shadow-lg shadow-emerald-600/20" onClick={() => handleStatusUpdate(selectedLPJ.id, 'DISETUJUI')}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Setuju
                        </Button>
                    </div>
                )}
                
                <Button variant="outline" className="rounded-xl h-11 px-6 font-bold w-full sm:w-auto" onClick={() => setShowDetailDialog(false)}>
                    Tutup
                </Button>
                
                <Button 
                    variant="outline" 
                    className="rounded-xl px-6 h-11 font-bold disabled:opacity-50 w-full sm:w-auto order-first sm:order-0" 
                    onClick={() => handleDownloadPDF(selectedLPJ!)}
                    disabled={isGeneratingPdf || (selectedLPJ.status !== 'DISETUJUI' && !['MASTER_ADMIN', 'KETUA'].includes(currentUser?.role))}
                >
                    {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} 
                    Download LPJ
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
              Tolak Laporan LPJ
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan atau catatan revisi untuk bendahara.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <Textarea 
                placeholder="Contoh: Lampiran tidak lengkap, nominal tidak sesuai..."
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
                        if (selectedLPJ) {
                            handleStatusUpdate(selectedLPJ.id, 'DITOLAK', rejectReason)
                        }
                    }}
                >
                    Kirim Penolakan
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden PDF Component */}
      <div className="absolute top-0 left-[-9999px] width-[210mm] overflow-visible -z-50">
        <LaporanPDF 
          ref={pdfRef}
          pemasukanList={pdfData.pemasukanList}
          pengeluaranList={pdfData.pengeluaranList}
          summary={pdfData.summary}
          tanggalMulai={pdfData.tanggalMulai}
          tanggalSelesai={pdfData.tanggalSelesai}
        />
      </div>
    </div>
  )
}
