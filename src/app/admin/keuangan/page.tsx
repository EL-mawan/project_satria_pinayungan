'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Receipt,
  Calculator,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Info
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import LaporanPDF from './components/LaporanPDF'

const IDR = ({ className }: { className?: string }) => (
  <div className={`${className} font-bold text-[10px] flex items-center justify-center`}>Rp</div>
)

interface Pemasukan {
  id: string
  sumber: string
  tanggal: string
  nominal: number
  unitSumber?: string
  qty?: number
  keterangan?: string
  bukti?: string
}

interface Pengeluaran {
  id: string
  jenis: string
  tanggal: string
  nominal: number
  satuanHarga?: number
  qty?: number
  satuan?: string
  keterangan?: string
  bukti?: string
  kegiatan?: {
    id: string
    judul: string
  }
}

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
  user: {
    name: string
    email: string
  }
}

function KeuanganContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(tabParam || 'pemasukan')
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLPJDialog, setShowLPJDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: pemasukanData, isLoading: loadingPemasukan } = useQuery({
    queryKey: ['pemasukan'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/keuangan/pemasukan', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch pemasukan')
      return res.json()
    },
    refetchInterval: 10000, // Auto sync every 10 seconds
    refetchOnWindowFocus: true
  })

  const { data: pengeluaranData, isLoading: loadingPengeluaran } = useQuery({
    queryKey: ['pengeluaran'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/keuangan/pengeluaran', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch pengeluaran')
      return res.json()
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true
  })

  const { data: lpjData, isLoading: loadingLPJ } = useQuery({
    queryKey: ['lpj'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/keuangan/lpj', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch lpj')
      return res.json()
    }
  })

  const { data: kegiatanData } = useQuery({
    queryKey: ['kegiatan'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kegiatan', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch kegiatan')
      return res.json()
    }
  })

  const pemasukanList = pemasukanData?.data || []
  const pengeluaranList = pengeluaranData?.data || []
  const lpjList = lpjData?.data || []
  const kegiatanList = kegiatanData?.data || []
  const loading = loadingPemasukan || loadingPengeluaran || loadingLPJ

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        if (parsedUser.role === 'KETUA') {
          router.push('/admin/lpj')
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [router])
  
  const [formData, setFormData] = useState({
    sumber: '',
    jenis: '',
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    unitSumber: '',
    qty: '',
    satuanHarga: '',
    satuan: '',
    keterangan: '',
    kegiatanId: '',
    bukti: ''
  })

  const [lpjFormData, setLpjFormData] = useState({
    periode: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    keterangan: ''
  })

  // PDF Data State for filtered report
  const [pdfData, setPdfData] = useState<{
    pemasukanList: Pemasukan[]
    pengeluaranList: Pengeluaran[]
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

  const summary = {
    totalPemasukan: pemasukanData?.summary?.totalNominal || 0,
    totalPengeluaran: pengeluaranData?.summary?.totalNominal || 0,
    saldo: (pemasukanData?.summary?.totalNominal || 0) - (pengeluaranData?.summary?.totalNominal || 0)
  }

  const formatCurrency = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, bukti: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Auto-calculate nominal for Pengeluaran
  useEffect(() => {
    if (activeTab === 'pengeluaran') {
      const price = parseFloat(formData.satuanHarga) || 0
      const qty = parseFloat(formData.qty) || 0
      if (price > 0 && qty > 0) {
        setFormData(prev => ({ ...prev, nominal: (price * qty).toString() }))
      }
    }
  }, [formData.satuanHarga, formData.qty, activeTab])

  const handleCreateRecord = async () => {
    setCreateLoading(true)
    let endpoint = activeTab === 'pemasukan' ? '/api/keuangan/pemasukan' : '/api/keuangan/pengeluaran'
    let method = 'POST'

    if (editingId) {
      endpoint += `/${editingId}`
      method = 'PATCH'
    }

    const payload = activeTab === 'pemasukan' 
      ? { 
          sumber: formData.sumber, 
          tanggal: formData.tanggal, 
          nominal: formData.nominal, 
          unitSumber: formData.unitSumber,
          qty: formData.qty,
          keterangan: formData.keterangan,
          bukti: formData.bukti 
        }
      : { 
          jenis: formData.jenis, 
          tanggal: formData.tanggal, 
          nominal: formData.nominal,
          satuanHarga: formData.satuanHarga,
          qty: formData.qty,
          satuan: formData.satuan, 
          keterangan: formData.keterangan, 
          kegiatanId: (formData.kegiatanId === 'none' || !formData.kegiatanId) ? null : formData.kegiatanId,
          bukti: formData.bukti
        }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(endpoint, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(`${activeTab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} berhasil ${editingId ? 'diperbarui' : 'dicatat'}`)
        setShowCreateDialog(false)
        setEditingId(null)
        setFormData({
          sumber: '',
          jenis: '',
          tanggal: new Date().toISOString().split('T')[0],
          nominal: '',
          unitSumber: '',
          qty: '',
          satuanHarga: '',
          satuan: '',
          keterangan: '',
          kegiatanId: '',
          bukti: ''
        })
        
        // Invalidate queries to refresh data quickly
        queryClient.invalidateQueries({ queryKey: ['pemasukan'] })
        queryClient.invalidateQueries({ queryKey: ['pengeluaran'] })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menyimpan data')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCreateLPJ = async () => {
    setCreateLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/keuangan/lpj', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(lpjFormData)
      })

      if (response.ok) {
        toast.success('Laporan LPJ berhasil dibuat')
        setShowLPJDialog(false)
        setLpjFormData({
          periode: '',
          tanggalMulai: '',
          tanggalSelesai: '',
          keterangan: ''
        })
        // Invalidate queries to refresh data quickly
        queryClient.invalidateQueries({ queryKey: ['lpj'] })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal membuat LPJ')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setFormData({
      sumber: item.sumber || '',
      jenis: item.jenis || '',
      tanggal: new Date(item.tanggal).toISOString().split('T')[0],
      nominal: item.nominal.toString(),
      unitSumber: item.unitSumber || '',
      qty: item.qty ? item.qty.toString() : '',
      satuanHarga: item.satuanHarga ? item.satuanHarga.toString() : '',
      satuan: item.satuan || '',
      keterangan: item.keterangan || '',
      kegiatanId: item.kegiatan?.id || 'none',
      bukti: item.bukti || ''
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    
    const toastId = toast.loading('Menghapus data...')
    
    try {
      const token = localStorage.getItem('token')
      const endpoint = activeTab === 'pemasukan' 
        ? `/api/keuangan/pemasukan/${id}` 
        : `/api/keuangan/pengeluaran/${id}`
        
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Data berhasil dihapus', { id: toastId })
        // Invalidate queries to refresh data quickly
        queryClient.invalidateQueries({ queryKey: ['pemasukan'] })
        queryClient.invalidateQueries({ queryKey: ['pengeluaran'] })
      } else {
        toast.error(data.error || 'Gagal menghapus data', { 
          id: toastId,
          description: data.details || (data.code ? `Kode: ${data.code}` : undefined)
        })
      }
    } catch (error) {
      console.error('Error deleting data:', error)
      toast.error('Koneksi terputus. Silakan coba lagi', { 
        id: toastId,
        description: 'Periksa koneksi internet Anda'
      })
    }
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

  /* PDF Download Handler */
  const pdfRef = useRef<HTMLDivElement>(null)
  
  const handleDownloadPDF = async (lpj: LPJ) => {
    if (!pdfRef.current) return
    
    setIsGeneratingPdf(true)
    const toastId = toast.loading('Menyiapkan data laporan...')
    
    try {
      // 1. Filter data based on LPJ dates
      const startDate = new Date(lpj.tanggalMulai)
      const endDate = new Date(lpj.tanggalSelesai)
      // Adjust endDate to include the full day
      endDate.setHours(23, 59, 59, 999)

      const filteredPemasukan = pemasukanList.filter(item => {
        const date = new Date(item.tanggal)
        return date >= startDate && date <= endDate
      })

      const filteredPengeluaran = pengeluaranList.filter(item => {
        const date = new Date(item.tanggal)
        return date >= startDate && date <= endDate
      })

      const totalPemasukan = filteredPemasukan.reduce((acc, curr) => acc + curr.nominal, 0)
      const totalPengeluaran = filteredPengeluaran.reduce((acc, curr) => acc + curr.nominal, 0)

      // 2. Set PDF Data
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

      // 3. Wait for render (short delay to ensure state update and DOM sync)
      await new Promise(resolve => setTimeout(resolve, 500))

      const element = pdfRef.current
      
      const canvas = await html2canvas(element, {
        scale: 2, 
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794, // Approx 210mm at 96dpi
        ignoreElements: (element) => {
          // Ignore elements that might have unsupported color formats
          return element.classList?.contains('ignore-pdf') || false
        },
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('laporan-pdf')
          if (clonedElement) {
            clonedElement.style.display = 'block'
            clonedElement.style.visibility = 'visible'
            clonedElement.style.position = 'relative'
            clonedElement.style.left = '0'
            clonedElement.style.top = '0'
            
            // Inject a style tag to override any potential problematic Tailwind colors
            const style = clonedDoc.createElement('style')
            style.innerHTML = `
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              *, ::before, ::after {
                --tw-ring-color: transparent !important;
                --tw-shadow: 0 0 #0000 !important;
                --tw-shadow-colored: 0 0 #0000 !important;
                --tw-outline-style: none !important;
                font-family: serif !important;
              }
            `
            clonedDoc.head.appendChild(style)

            // Force all colors to be standard hex/rgb
            const allElements = clonedElement.querySelectorAll('*')

            // Helper to convert lab/oklch to safe colors if found
            const sanitizeValue = (val: string, fallback: string) => {
              if (!val) return fallback;
              const v = val.toLowerCase();
              if (v.includes('lab(') || v.includes('oklch(') || v.includes('hwb(') || v.includes('oklab(')) {
                return fallback;
              }
              return val;
            };

            allElements.forEach((el: any) => {
              const styles = window.getComputedStyle(el);
              
              // Force direct styles for html2canvas to pick up
              el.style.backgroundColor = sanitizeValue(styles.backgroundColor, '#ffffff');
              el.style.color = sanitizeValue(styles.color, '#000000');
              el.style.borderColor = sanitizeValue(styles.borderColor, '#000000');
              el.style.boxShadow = 'none';
              el.style.outline = 'none';
              
              if (el.tagName === 'svg' || el.tagName === 'path') {
                el.style.fill = sanitizeValue(styles.fill, 'currentColor');
                el.style.stroke = sanitizeValue(styles.stroke, 'currentColor');
              }
            })
          }
        }
      })
      
      const imgData = canvas.toDataURL('image/png')
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

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Subsequent pages if any
      while (heightLeft > 0.5) { // Small buffer for rounding
        pdf.addPage()
        position = heightLeft - imgHeight
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Laporan_Keuangan_${new Date().getTime()}.pdf`)
      
      toast.success('Laporan berhasil diunduh', { id: toastId })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(`Gagal membuat PDF: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`, { id: toastId })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl h-32 animate-pulse bg-white"></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Off-screen PDF Component for Capture */}
      <div className="fixed top-0 left-[-9999px] -z-50">
        <LaporanPDF 
          ref={pdfRef}
          pemasukanList={pdfData.pemasukanList}
          pengeluaranList={pdfData.pengeluaranList}
          summary={pdfData.summary}
          tanggalMulai={pdfData.tanggalMulai}
          tanggalSelesai={pdfData.tanggalSelesai}
        />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Keuangan</h1>
        <p className="text-slate-500 mt-1 font-medium">Monitoring arus kas dan laporan pertanggungjawaban padepokan.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Pemasukan', value: summary.totalPemasukan, icon: ArrowUpRight, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
          { title: 'Total Pengeluaran', value: summary.totalPengeluaran, icon: ArrowDownRight, color: 'text-rose-600', bgColor: 'bg-rose-50' },
          { title: 'Saldo Terkini', value: summary.saldo, icon: IDR, color: 'text-[#5E17EB]', bgColor: 'bg-[#5E17EB]/5' }
        ].map((item, idx) => (
          <Card key={idx} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl group hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${item.bgColor} ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="h-2 w-12 bg-slate-50 rounded-full"></div>
              </div>
              <div className="mt-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.title}</p>
                <h3 className={`text-2xl font-extrabold mt-1 ${item.color}`}>{formatCurrency(item.value)}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex overflow-x-auto md:inline-flex w-full md:w-auto scrollbar-hide">
            <TabsList className="bg-transparent border-none gap-2 h-auto p-0 flex w-full md:w-auto min-w-max">
              {[
                { id: 'pemasukan', label: 'Pemasukan', icon: TrendingUp },
                { id: 'pengeluaran', label: 'Pengeluaran', icon: TrendingDown }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className={`
                    rounded-xl px-4 md:px-6 py-2.5 font-bold transition-all h-auto flex-1 md:flex-none
                    data-[state=active]:bg-[#5E17EB] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#5E17EB]/20
                    text-slate-500 hover:bg-slate-50
                  `}
                >
                  <tab.icon className="h-4 w-4 mr-2 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Download button moved to LPJ */}
            <Button 
              className={`rounded-xl h-11 font-bold shadow-lg transition-all w-full md:w-auto ${
                activeTab === 'pemasukan' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 
                'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              {activeTab === 'pemasukan' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={`Cari data ${activeTab}...`} 
              className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-[#5E17EB]/20 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 font-bold">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Tab Contents */}
        <TabsContent value="pemasukan" className="mt-0">
          <div className="grid gap-4">
            {pemasukanList.filter(item => item.sumber.toLowerCase().includes(search.toLowerCase())).map((item) => (
              <Card key={item.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl hover:shadow-lg transition-all duration-300 bg-white group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      <TrendingUp className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-[#5E17EB] transition-colors">{item.sumber}</h4>
                        <span className="text-emerald-600 font-extrabold text-lg">{formatCurrency(item.nominal)}</span>
                      </div>
                      <div className="flex items-center text-sm font-medium text-slate-500">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        <span className="mx-2 opacity-30">•</span>
                        <span className="truncate">{item.keterangan || 'Tanpa keterangan'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-[#5E17EB] hover:bg-[#5E17EB]/5" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pemasukanList.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                <TrendingUp className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Belum ada pemasukan</h3>
                <p className="text-slate-500">Mulai catat pemasukan untuk monitoring kas.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pengeluaran" className="mt-0">
          <div className="grid gap-4">
            {pengeluaranList.filter(item => item.jenis.toLowerCase().includes(search.toLowerCase())).map((item) => (
              <Card key={item.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl hover:shadow-lg transition-all duration-300 bg-white group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                      <TrendingDown className="h-7 w-7 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-[#5E17EB] transition-colors">{item.jenis}</h4>
                        <span className="text-rose-600 font-extrabold text-lg">{formatCurrency(item.nominal)}</span>
                      </div>
                      <div className="flex items-center text-sm font-medium text-slate-500">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        <span className="mx-2 opacity-30">•</span>
                        <span className="truncate">{item.keterangan || 'Tanpa keterangan'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-[#5E17EB] hover:bg-[#5E17EB]/5" onClick={() => handleEdit(item)}>
                         <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pengeluaranList.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                <TrendingDown className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Belum ada pengeluaran</h3>
                <p className="text-slate-500">Mulai catat pengeluaran operasional.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Pemasukan/Pengeluaran Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) {
          setEditingId(null)
          setFormData({
            sumber: '',
            jenis: '',
            tanggal: new Date().toISOString().split('T')[0],
            nominal: '',
            unitSumber: '',
            qty: '',
            satuanHarga: '',
            satuan: '',
            keterangan: '',
            kegiatanId: '',
            bukti: ''
          })
        }
      }}>
        <DialogContent className="max-w-md rounded-4xl p-0 overflow-hidden border-none shadow-2xl">
          <div className={`p-8 ${activeTab === 'pemasukan' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold flex items-center">
                {activeTab === 'pemasukan' ? <TrendingUp className="mr-3 h-6 w-6" /> : <TrendingDown className="mr-3 h-6 w-6" />}
                {editingId ? 'Edit' : 'Tambah'} {activeTab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium">
                Catat mutasi kas baru untuk {activeTab === 'pemasukan' ? 'pemasukan' : 'pengeluaran'} padepokan.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 ml-1">
                {activeTab === 'pemasukan' ? 'Sumber Pemasukan' : 'Nama Barang / Jenis Pengeluaran'}
              </Label>
              <Input
                placeholder={activeTab === 'pemasukan' ? "Contoh: Iuran Bulanan" : "Contoh: Konsumsi Latihan"}
                className="h-12 rounded-2xl border-slate-200 focus:ring-[#5E17EB]/20"
                value={activeTab === 'pemasukan' ? formData.sumber : formData.jenis}
                onChange={(e) => setFormData({ ...formData, [activeTab === 'pemasukan' ? 'sumber' : 'jenis']: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Tanggal</Label>
                <Input
                  type="date"
                  className="h-12 rounded-2xl border-slate-200"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                />
              </div>
              
              {activeTab === 'pemasukan' ? (
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Unit Sumber</Label>
                  <Input
                    placeholder="Contoh: Orang"
                    className="h-12 rounded-2xl border-slate-200"
                    value={formData.unitSumber}
                    onChange={(e) => setFormData({ ...formData, unitSumber: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                   <Label className="font-bold text-slate-700 ml-1">Satuan Harga</Label>
                   <Input
                     type="number"
                     placeholder="0"
                     className="h-12 rounded-2xl border-slate-200"
                     value={formData.satuanHarga}
                     onChange={(e) => setFormData({ ...formData, satuanHarga: e.target.value })}
                   />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Qty</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-12 rounded-2xl border-slate-200"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                />
              </div>
              
              {activeTab === 'pengeluaran' && (
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Satuan</Label>
                  <Input
                    placeholder="Pcs/Kg"
                    className="h-12 rounded-2xl border-slate-200"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  />
                </div>
              )}
              
              <div className={`${activeTab === 'pengeluaran' ? 'col-span-1' : 'col-span-2'} space-y-2`}>
                <Label className="font-bold text-slate-700 ml-1">Total (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-12 rounded-2xl border-slate-200"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                />
              </div>
            </div>

            {activeTab === 'pengeluaran' && (
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Kegiatan Terkait (Opsional)</Label>
                <Select value={formData.kegiatanId} onValueChange={(val) => setFormData({ ...formData, kegiatanId: val })}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                    <SelectValue placeholder="Pilih kegiatan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {kegiatanList.map(kg => <SelectItem key={kg.id} value={kg.id}>{kg.judul}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 ml-1">Keterangan</Label>
              <Textarea
                placeholder="Tambahkan catatan tambahan jika perlu..."
                className="rounded-2xl border-slate-200 min-h-[100px]"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setShowCreateDialog(false)}>
                Batal
              </Button>
              <Button 
                className={`flex-1 h-12 rounded-2xl font-extrabold shadow-lg ${activeTab === 'pemasukan' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'}`}
                onClick={handleCreateRecord}
                disabled={createLoading}
              >
                {createLoading ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function KeuanganPage() {
  return (
    <Suspense fallback={null}>
      <KeuanganContent />
    </Suspense>
  )
}