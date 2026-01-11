'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Users, 
  ListTodo, 
  Printer,
  Edit,
  Sparkles,
  Wand2,
  Eye,
  FileCheck,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Calendar
} from 'lucide-react'

const IDR = ({ className }: { className?: string }) => (
  <div className={`${className} font-bold text-[10px] flex items-center justify-center`}>Rp</div>
)
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

// --- Types ---
interface Pimpinan {
  role: string
  name: string
}

interface RABItem {
  nama: string
  spesifikasi: string
  jumlah: number
  satuan: string
  hargaSatuan: number
  totalHarga: number
}

interface ProposalFoto {
  url: string
  deskripsi: string
}

interface ProposalData {
  nomor: string
  lampiran: string
  perihal: string
  penerima: {
    nama: string
    jabatan: string
    instansi: string
    alamat: string
  }
  latarBelakang: string
  suratPengantar: string
  tujuan: string[]
  struktur: {
    pimpinanAtas: Pimpinan[]
    pimpinanTeknis: Pimpinan[]
    administrasi: Pimpinan[]
    operasional: string[]
  }
  rab: RABItem[]
  tanggal: string
  tempat: string
  namaKetua: string
  namaGuruBesar: string
  namaKetuaRW: string
  namaKetuaRT: string
  namaKetuaIPARGA: string
  namaKetuaDPD: string
  logoKiri?: string
  logoKanan?: string
  namaKopSurat: string
  alamatKopSurat: string
  kontakKopSurat: string
  penutup: string
  bulkRecipients?: { nama: string, jabatan: string, alamat: string }[]
  lampiranFoto: ProposalFoto[]
  waktuKegiatan: string
  tempatKegiatan: string
  showWaktuTempat: boolean
}

const initialData: ProposalData = {
  namaKopSurat: 'PADEPOKAN SATRIA PINAYUNGAN RAGAS GRENYANG',
  alamatKopSurat: 'KAMPUNG RAGAS GRENYANG DESA ARGAWANA\nKECAMATAN PULOAMPEL KABUPATEN\nSERANG-BANTEN',
  kontakKopSurat: 'Jl. Puloampel KM.19 Ds. Argawana Kode Pos 42455 / no.tlp 0819 1114 1616 - 0896 4756 5908',
  nomor: '',
  lampiran: '',
  perihal: '',
  penerima: {
    nama: '',
    jabatan: '',
    instansi: '',
    alamat: ''
  },
  suratPengantar: '',
  penutup: '',
  latarBelakang: '',
  tujuan: [],
  struktur: {
    pimpinanAtas: [
      { role: 'Pelindung (RW)', name: '' },
      { role: 'Penasehat (RT)', name: '' },
      { role: 'Ketua Pemuda', name: '' }
    ],
    pimpinanTeknis: [
      { role: 'Guru Besar', name: '' },
      { role: 'Ketua Padepokan', name: '' }
    ],
    administrasi: [
      { role: 'Sekretaris', name: '' },
      { role: 'Bendahara', name: '' }
    ],
    operasional: []
  },
  rab: [],
  tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  tempat: 'Serang',
  namaKetua: '',
  namaGuruBesar: '',
  namaKetuaRW: '',
  namaKetuaRT: '',
  namaKetuaIPARGA: '',
  namaKetuaDPD: '',
  logoKiri: "/padepokan-logo.png",
  logoKanan: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Ipsi_logo.png/600px-Ipsi_logo.png",
  lampiranFoto: [],
  waktuKegiatan: '',
  tempatKegiatan: '',
  showWaktuTempat: false
}

export default function ProposalBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proposalId = searchParams.get('id')
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(!!proposalId)

  // View Mode State (Local) - Initially false, will be set based on proposal status
  // View Mode State (Local) - Initially check URL param
  const [isViewMode, setIsViewMode] = useState(searchParams.get('mode') === 'view')
  
  const [data, setData] = useState<ProposalData>(initialData)
  const [activeTab, setActiveTab] = useState('umum')
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null)
  const [history, setHistory] = useState<Partial<ProposalData>>({})
  const [bulkRecipients, setBulkRecipients] = useState<{ nama: string, jabatan: string, alamat: string }[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [currentRecipientIndex, setCurrentRecipientIndex] = useState(0)
  const previewRef = useRef<HTMLDivElement>(null)

  // Status & Role State
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [proposalStatus, setProposalStatus] = useState<string>('DRAFT')
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [tempRejectionReason, setTempRejectionReason] = useState('')
  
  // Date Input State (YYYY-MM-DD)
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0])

  // Sync formatted date to data.tanggal whenever dateInput changes
  useEffect(() => {
    if (dateInput) {
        const date = new Date(dateInput)
        const formatted = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        setData(prev => ({ ...prev, tanggal: formatted }))
    }
  }, [dateInput])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const role = user.user?.role || user.role
        setCurrentUserRole(role)
        
        // KETUA can only view, not edit
        if (role === 'KETUA') {
          setIsViewMode(true)
        }
      } catch (e) {
        console.error('Failed to parse user', e)
      }
    }
  }, [])





  // Sync logic: Keep Structure names and Signatory names in sync
  useEffect(() => {
    const syncStructureToSigs = () => {
      setData(prev => ({
        ...prev,
        namaKetua: prev.struktur.pimpinanTeknis[1]?.name || prev.namaKetua,
        namaGuruBesar: prev.struktur.pimpinanTeknis[0]?.name || prev.namaGuruBesar,
        namaKetuaRW: prev.struktur.pimpinanAtas[0]?.name?.split('(')[0]?.trim() || prev.namaKetuaRW,
        namaKetuaRT: prev.struktur.pimpinanAtas[1]?.name?.split('(')[0]?.trim() || prev.namaKetuaRT,
        namaKetuaIPARGA: prev.struktur.pimpinanAtas[2]?.name || prev.namaKetuaIPARGA
      }))
    }
    // Only sync when structure names change to avoid infinite loops
    // But since we want "relational" feel, we'll use a specific handler instead of a broad Effect
  }, [])

  const updateStrukturName = (category: 'pimpinanAtas' | 'pimpinanTeknis' | 'administrasi', index: number, name: string) => {
    setData(prev => {
      const newStruktur = { ...prev.struktur }
      newStruktur[category][index].name = name
      
      const updates: Partial<ProposalData> = { struktur: newStruktur }
      
      // Relational Syncing
      if (category === 'pimpinanTeknis' && index === 1) updates.namaKetua = name
      if (category === 'pimpinanTeknis' && index === 0) updates.namaGuruBesar = name
      if (category === 'pimpinanAtas' && index === 0) updates.namaKetuaRW = name.split('(')[0].trim()
      if (category === 'pimpinanAtas' && index === 1) updates.namaKetuaRT = name.split('(')[0].trim()
      if (category === 'pimpinanAtas' && index === 2) updates.namaKetuaIPARGA = name
      
      return { ...prev, ...updates }
    })
  }

  const handleAiGenerate = async (type: 'background' | 'objectives' | 'cover-letter' | 'closing') => {
    setIsAiLoading(type)
    try {
      const response = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: data.perihal,
          recipient: data.penerima.nama
        })
      })
      const result = await response.json()
      if (result.success) {
        if (type === 'background') {
          setHistory(prev => ({ ...prev, latarBelakang: data.latarBelakang }))
          setData(prev => ({ ...prev, latarBelakang: result.content }))
          toast.success('Narasi latar belakang berhasil direkomendasikan AI')
        } else if (type === 'cover-letter') {
          setHistory(prev => ({ ...prev, suratPengantar: data.suratPengantar }))
          setData(prev => ({ ...prev, suratPengantar: result.content }))
          toast.success('Surat pengantar berhasil direkomendasikan AI')
        } else if (type === 'closing') {
          setHistory(prev => ({ ...prev, penutup: data.penutup }))
          setData(prev => ({ ...prev, penutup: result.content }))
          toast.success('Kalimat penutup berhasil direkomendasikan AI')
        } else {
          setData(prev => ({ ...prev, tujuan: JSON.parse(result.content) }))
          toast.success('Poin tujuan berhasil direkomendasikan AI')
        }
      }
    } catch (error) {
      toast.error('Gagal memanggil asisten AI')
    } finally {
      setIsAiLoading(null)
    }
  }

  const handleUndo = (type: 'background' | 'cover-letter' | 'closing') => {
      if (type === 'background' && history.latarBelakang) {
          setData(prev => ({ ...prev, latarBelakang: history.latarBelakang! }))
          setHistory(prev => {
              const newHist = { ...prev }
              delete newHist.latarBelakang
              return newHist
          })
          toast.info('Perubahan latar belakang dibatalkan')
      } else if (type === 'cover-letter' && history.suratPengantar) {
          setData(prev => ({ ...prev, suratPengantar: history.suratPengantar! }))
          setHistory(prev => {
              const newHist = { ...prev }
              delete newHist.suratPengantar
              return newHist
          })
          toast.info('Perubahan surat pengantar dibatalkan')
      } else if (type === 'closing' && history.penutup) {
          setData(prev => ({ ...prev, penutup: history.penutup! }))
          setHistory(prev => {
              const newHist = { ...prev }
              delete newHist.penutup
              return newHist
          })
          toast.info('Perubahan kalimat penutup dibatalkan')
      }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'logoKiri' | 'logoKanan') => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setData(prev => ({ ...prev, [side]: reader.result as string }))
        toast.success(`Logo ${side === 'logoKiri' ? 'Kiri' : 'Kanan'} berhasil diupdate`)
      }
      reader.readAsDataURL(file)
    }
  }

  const fetchNextNomorSurat = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/surat/keluar?action=next-number', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.nextNomor) {
          setData(prev => ({ ...prev, nomor: json.nextNomor }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch next nomor surat', error)
    }
  }

  useEffect(() => {
    if (proposalId) {
      fetchExistingProposal()
    } else {
      // Reset to initial data when creating new proposal
      setData(initialData)
      setBulkRecipients([])
      setProposalStatus('DRAFT')
      setRejectionReason('')
      setIsLoadingInitialData(false)
      fetchNextNomorSurat()
    }
  }, [proposalId])

  const fetchExistingProposal = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/surat/keluar/${proposalId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data && json.data.isi) {
          try {
            const parsed = JSON.parse(json.data.isi)
            // Merge with initialData to ensure new fields (like suratPengantar) exist for old records
            setData({ ...initialData, ...parsed })
            if (parsed.bulkRecipients) {
                setBulkRecipients(parsed.bulkRecipients)
            }
            if (json.data.status) {
                setProposalStatus(json.data.status)
                // DIRECT SWITCH: If validated OR requested via URL, immediately show view mode
                if (json.data.status === 'VALIDASI' || searchParams.get('mode') === 'view') {
                    setIsViewMode(true)
                }
            }

            // Load Date from DB
            if (json.data.tanggal) {
                setDateInput(new Date(json.data.tanggal).toISOString().split('T')[0])
            }
            if (json.data.catatan) setRejectionReason(json.data.catatan)
          } catch (e) {
            console.error('Failed to parse proposal JSON', e)
          }
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data proposal')
    } finally {
        setIsLoadingInitialData(false)
    }
  }

  const handlePenerimaChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      penerima: { ...prev.penerima, [field]: value }
    }))
  }

  const addTujuan = () => {
    setData(prev => ({
      ...prev,
      tujuan: [...prev.tujuan, '']
    }))
  }

  const updateTujuan = (index: number, value: string) => {
    const newTujuan = [...data.tujuan]
    newTujuan[index] = value
    setData(prev => ({ ...prev, tujuan: newTujuan }))
  }

  const removeTujuan = (index: number) => {
    setData(prev => ({
      ...prev,
      tujuan: prev.tujuan.filter((_, i) => i !== index)
    }))
  }

  const addRab = () => {
    setData(prev => ({
      ...prev,
      rab: [...prev.rab, { nama: '', spesifikasi: '', jumlah: 1, satuan: 'pcs', hargaSatuan: 0, totalHarga: 0 }]
    }))
  }

  const updateRab = (index: number, field: keyof RABItem, value: any) => {
    const newRab = [...data.rab]
    const item = { ...newRab[index], [field]: value }
    
    // Recalculate total
    if (field === 'jumlah' || field === 'hargaSatuan') {
      item.totalHarga = (Number(item.jumlah) || 0) * (Number(item.hargaSatuan) || 0)
    }
    
    newRab[index] = item
    setData(prev => ({ ...prev, rab: newRab }))
  }

  const removeRab = (index: number) => {
    setData(prev => ({
      ...prev,
      rab: prev.rab.filter((_, i) => i !== index)
    }))
  }

  const calculateTotalRab = () => {
    return data.rab.reduce((acc, item) => acc + (item.totalHarga || 0), 0)
  }

  const addLampiranFoto = () => {
      setData(prev => ({
          ...prev,
          lampiranFoto: [...prev.lampiranFoto, { url: '', deskripsi: '' }]
      }))
  }

  const updateLampiranFoto = (index: number, field: keyof ProposalFoto, value: string) => {
      const newFotos = [...data.lampiranFoto]
      newFotos[index] = { ...newFotos[index], [field]: value }
      setData(prev => ({ ...prev, lampiranFoto: newFotos }))
  }

  const removeLampiranFoto = (index: number) => {
      setData(prev => ({
          ...prev,
          lampiranFoto: prev.lampiranFoto.filter((_, i) => i !== index)
      }))
  }

  const handleLampiranFotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
          const reader = new FileReader()
          reader.onloadend = () => {
              updateLampiranFoto(index, 'url', reader.result as string)
          }
          reader.readAsDataURL(file)
      }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const url = proposalId ? `/api/surat/keluar/${proposalId}` : '/api/surat/keluar'
      const method = proposalId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tujuan: bulkRecipients.length > 0 
            ? `${bulkRecipients.length} Penerima`
            : `${data.penerima.nama} - ${data.penerima.jabatan || ''} (${data.penerima.alamat || data.penerima.instansi || ''})`,
          perihal: data.perihal,
          jenis: 'PROPOSAL',
          isi: JSON.stringify({ ...data, bulkRecipients }), // Include bulk recipients state
          template: 'PROPOSAL_MODERN', // Keeping this tag for identifying the specialized format
          // If editing: maintain status unless it's draft/rejected which should be waiting validasi on regular submit.
          // If new: default to MENUNGGU_VALIDASI (since the button is "Ajukan")
          status: proposalId ? ((proposalStatus === 'DRAFT' || proposalStatus === 'DITOLAK') ? 'MENUNGGU_VALIDASI' : proposalStatus) : 'MENUNGGU_VALIDASI',
          // Force Date to match user input
          tanggal: new Date(dateInput).toISOString(),
          // IF status is REJECTED, explicitly ensure reset (redundant but safe)
          ...(proposalStatus === 'DITOLAK' ? { status: 'MENUNGGU_VALIDASI', catatan: null } : {})
        })
      })

      if (response.ok) {
        // If it was rejected, we just reset it to waiting validation
        if (proposalStatus === 'DITOLAK') {
             setProposalStatus('MENUNGGU_VALIDASI')
             setRejectionReason('')
             toast.success('Proposal berhasil diperbarui dan diajukan ulang')
        } else {
             toast.success(proposalId ? 'Perubahan berhasil disimpan' : 'Proposal berhasil diajukan')
        }
        
        // Give time for toast to be seen
        setTimeout(() => {
             router.refresh()
             router.push('/admin/surat')
        }, 1500)
      } else {
        const err = await response.json()
        toast.error(err.error || 'Gagal menyimpan proposal')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsSaving(false)
    }
  }

  /* Excel & Bulk Logic */
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
        { Nama: 'Bpk. Contoh 1', Jabatan: 'Ketua DPRD', Alamat: 'Serang' },
        { Nama: 'Ibu. Contoh 2', Jabatan: 'Kepala Dinas', Alamat: 'Cilegon' }
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template Penerima")
    XLSX.writeFile(wb, "Template_Penerima_Proposal.xlsx")
  }

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleExcelUpload called', e)
    const file = e.target.files?.[0]
    console.log('File selected:', file)
    if (file) {
        const reader = new FileReader()
        reader.onload = (evt) => {
            console.log('File loaded, parsing...')
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws) as any[]
            console.log('Parsed data:', data)
            
            const recipients = data.map((row) => ({
                nama: row['Nama'] || row['nama'] || '',
                jabatan: row['Jabatan'] || row['jabatan'] || '',
                alamat: row['Alamat'] || row['alamat'] || row['Tempat'] || row['tempat'] || ''
            })).filter(r => r.nama)

            console.log('Recipients:', recipients)
            setBulkRecipients(recipients)
            if (recipients.length > 0) {
                setCurrentRecipientIndex(0) // Reset to first recipient
                toast.success(`Berhasil memuat ${recipients.length} penerima dari Excel`)
            } else {
                toast.error('Tidak ada data penerima yang valid ditemukan')
            }
        }
        reader.onerror = (error) => {
            console.error('FileReader error:', error)
            toast.error('Gagal membaca file Excel')
        }
        reader.readAsBinaryString(file)
    } else {
        console.log('No file selected')
    }
  }

  // Navigation functions for bulk recipients
  const handlePreviousRecipient = () => {
    if (currentRecipientIndex > 0) {
        setCurrentRecipientIndex(prev => prev - 1)
    }
  }

  const handleNextRecipient = () => {
    if (currentRecipientIndex < bulkRecipients.length - 1) {
        setCurrentRecipientIndex(prev => prev + 1)
    }
  }

  // Auto-update preview when navigating through recipients
  useEffect(() => {
    if (bulkRecipients.length > 0 && bulkRecipients[currentRecipientIndex]) {
        const recipient = bulkRecipients[currentRecipientIndex]
        setData(prev => ({
            ...prev,
            penerima: {
                ...prev.penerima,
                nama: recipient.nama,
                jabatan: recipient.jabatan,
                alamat: recipient.alamat
            }
        }))
    }
  }, [currentRecipientIndex, bulkRecipients])

  const handleBulkGenerate = async () => {
    if (bulkRecipients.length === 0) return
    const originalPenerima = { ...data.penerima } // Backup original
    
    setIsBulkProcessing(true)
    const zip = new JSZip()
    const folder = zip.folder(`Proposal_${data.perihal.replace(/\s+/g, '_')}_Massal`)

    try {
        toast.info('Memulai proses generate massal. Mohon jangan tutup halaman...')
        await document.fonts.ready

        for (let i = 0; i < bulkRecipients.length; i++) {
            const recipient = bulkRecipients[i]
            
            // 1. Update State
            setData(prev => ({
                ...prev,
                penerima: {
                    ...prev.penerima,
                    nama: recipient.nama,
                    jabatan: recipient.jabatan,
                    alamat: recipient.alamat || prev.penerima.alamat 
                }
            }))

            // 2. Wait for React Render & Browser Paint
            await new Promise(r => setTimeout(r, 600)) // 600ms buffer

            // 3. Capture PDF
            if (!previewRef.current) continue
            const doc = new jsPDF('p', 'mm', 'a4')
            const pages = previewRef.current.querySelectorAll('.proposal-page')
            
            for (let j = 0; j < pages.length; j++) {
                const page = pages[j] as HTMLElement
                const canvas = await html2canvas(page, {
                    scale: 2, // Slightly lower scale for bulk to save memory/time
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 794,
                    windowHeight: 1123,
                    onclone: (clonedDoc) => {
                        const existingStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                        existingStyles.forEach(s => s.remove());
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
                          * { font-family: 'Crimson Pro', serif !important; color: #000 !important; }
                          .proposal-page { width: 794px !important; height: 1123px !important; padding: 50px 80px !important; background: white !important; }
                          .kop-wrapper { display: flex !important; justify-content: space-between !important; align-items: center !important; }
                          .kop-logo { width: 22mm !important; height: 22mm !important; object-fit: contain !important; }
                          .kop-text { text-align: center !important; flex: 1 !important; }
                          .divider-line-container { width: 100% !important; margin-bottom: 20px !important; }
                          .line-thick { border-top: 2.5px solid black !important; margin-bottom: 1.5px !important; }
                          .line-thin { border-top: 1px solid black !important; }
                        `;
                        clonedDoc.head.appendChild(style);
                        const allElements = clonedDoc.getElementsByTagName('*');
                        for (let k = 0; k < allElements.length; k++) {
                            const el = allElements[k] as HTMLElement;
                            if (el.getAttribute('style')?.includes('oklch')) {
                                el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#000000');
                            }
                        }
                    }
                })
                
                const imgData = canvas.toDataURL('image/jpeg', 0.9)
                if (j > 0) doc.addPage()
                doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
            }

            const blob = doc.output('blob')
            folder?.file(`${i+1}_${recipient.nama.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob)
            toast.info(`Berhasil: ${recipient.nama} (${i+1}/${bulkRecipients.length})`)
        }

        const zipContent = await zip.generateAsync({ type: 'blob' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(zipContent)
        link.download = `Proposal_Massal_${new Date().toISOString().slice(0,10)}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success(`Berhasil mengunduh ${bulkRecipients.length} proposal!`)

    } catch (e) {
        console.error(e)
        toast.error('Gagal generate massal')
    } finally {
        setData(prev => ({ ...prev, penerima: originalPenerima }))
        setIsBulkProcessing(false)
    }
  }

  const generatePDF = async () => {
    if (!previewRef.current) return
    setIsGeneratingPDF(true)
    toast.info('Sedang menyiapkan PDF kualitas tinggi, mohon tunggu...')

    try {
      await document.fonts.ready; // Ensure all fonts are loaded
      const doc = new jsPDF('p', 'mm', 'a4')
      const pages = previewRef.current.querySelectorAll('.proposal-page')
      
      // Delay to ensure everything is settled
      await new Promise(r => setTimeout(r, 700));

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        const canvas = await html2canvas(page, {
          scale: 3, // High quality scale
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDoc) => {
            // 1. Atomic Sanitation: Remove ALL original styles to kill oklch for good
            const existingStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            existingStyles.forEach(s => s.remove());

            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
              
              * {
                font-family: 'Crimson Pro', 'Times New Roman', serif !important;
                -webkit-font-smoothing: antialiased !important;
                color: #000000 !important;
              }

              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .proposal-page {
                width: 794px !important;
                height: 1123px !important;
                padding: 50px 80px !important;
                background: white !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                border: none !important;
                margin: 0 !important;
              }

              /* HELPER CLASSES FOR COMPONENT STYLING MAINTENANCE IN PDF */
              /* We re-assert these specific classes to ensure they hold up against any potential defaults, */
              /* but we DO NOT broadly reset 'p' or 'div' to avoid breaking inline styles. */

              .kop-wrapper {
                 display: flex !important;
                 justify-content: space-between !important;
                 align-items: center !important;
                 margin-bottom: 5px !important;
                 width: 100% !important;
              }

              .kop-logo {
                 width: 22mm !important;
                 height: 22mm !important;
                 object-fit: contain !important;
              }

              .kop-text {
                 text-align: center !important;
                 flex: 1 !important;
                 padding: 0 10px !important;
              }

              .divider-line-container { width: 100% !important; margin-bottom: 20px !important; }
              .line-thick { border-top: 2.5px solid black !important; margin-bottom: 1.5px !important; }
              .line-thin { border-top: 1px solid black !important; }

              .data-table { width: 100% !important; border-collapse: collapse !important; margin-top: 20px !important; }
              .data-table th, .data-table td { border: 1px solid #000000 !important; padding: 10px 8px !important; }

              .list-item { display: flex !important; margin-bottom: 8px !important; }
              .list-number { width: 30px !important; flex-shrink: 0 !important; font-weight: bold !important; }
              
              .h2-wrapper { display: flex !important; align-items: center !important; margin-bottom: 25px !important; }
              .h2-bar { width: 10px !important; height: 35px !important; background-color: black !important; margin-right: 15px !important; flex-shrink: 0 !important; }
            `;
            clonedDoc.head.appendChild(style);

            // 2. Clean up inline styles on ALL elements just in case
            const allElements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i] as HTMLElement;
              if (el.getAttribute('style')?.includes('oklch')) {
                 el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#000000');
              }
            }
          }
        })
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0)
        const imgWidth = 210 // A4 size in mm
        const imgHeight = 297 // Exact A4 height in mm
        
        if (i > 0) doc.addPage()
        // Force the image to cover exactly one A4 page
        doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
      }
      
      doc.save(`Proposal_${data.perihal.replace(/\s+/g, '_')}.pdf`)
      toast.success('PDF berhasil diunduh')
    } catch (error) {
      console.error('PDF Error:', error)
      toast.error('Gagal membuat PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleStatusChange = async (newStatus: 'VALIDASI' | 'DITOLAK', catatan?: string) => {
    setIsSaving(true)
    try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/surat/keluar/${proposalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: newStatus,
                catatan: catatan
            })
        })

        if (response.ok) {
            setProposalStatus(newStatus)
            if (catatan) setRejectionReason(catatan)
            toast.success(newStatus === 'VALIDASI' ? 'Proposal berhasil disetujui' : 'Proposal berhasil ditolak')
            setIsRejectDialogOpen(false)
            router.refresh()
        } else {
            const err = await response.json()
            toast.error(err.error || 'Gagal mengubah status proposal')
        }
    } catch (error) {
        toast.error('Terjadi kesalahan koneksi')
    } finally {
        setIsSaving(false)
    }
  }

  const isDownloadActive = () => {
      // Master Admin & Ketua can always download to check
      if (currentUserRole === 'MASTER_ADMIN' || currentUserRole === 'KETUA') return true
      // Others can only download if Validated
      return proposalStatus === 'VALIDASI'
  }


  if (isLoadingInitialData) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-[#5E17EB]/30 border-t-[#5E17EB] rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium">Memuat data proposal...</p>
              </div>
          </div>
      )
  }

  return (
    <div className={isViewMode ? "" : "flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 pb-20 px-2 md:px-6 lg:px-0"}>
      {/* Form Section */}
      {!isViewMode && (
      <div className="flex-1 space-y-4 md:space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-slate-500 hover:text-[#5E17EB] self-start" onClick={() => router.push('/admin/surat')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {proposalId ? 'Edit Proposal' : 'Pembuat Proposal Digital'}
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Format otomatis sesuai standar Padepokan</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-slate-100 p-1 md:p-1.5 rounded-2xl md:rounded-3xl h-14 md:h-16 mb-4 md:mb-6">
            <TabsTrigger value="umum" className="rounded-2xl font-bold data-[state=active]:bg-white data-[state=active]:text-[#5E17EB] data-[state=active]:shadow-sm transition-all">
              <FileText className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Umum</span>
            </TabsTrigger>
            <TabsTrigger value="struktur" className="rounded-2xl font-bold data-[state=active]:bg-white data-[state=active]:text-[#5E17EB] data-[state=active]:shadow-sm transition-all">
              <Users className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Struktur</span>
            </TabsTrigger>
            <TabsTrigger value="rab" className="rounded-2xl font-bold data-[state=active]:bg-white data-[state=active]:text-[#5E17EB] data-[state=active]:shadow-sm transition-all">
              <IDR className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">RAB</span>
            </TabsTrigger>
            <TabsTrigger value="ttd" className="rounded-2xl font-bold data-[state=active]:bg-white data-[state=active]:text-[#5E17EB] data-[state=active]:shadow-sm transition-all">
              <FileCheck className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Penutup</span>
            </TabsTrigger>
          </TabsList>

          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-4 sm:p-5 md:p-8 lg:p-10">
              <TabsContent value="umum" className="space-y-8 mt-0">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Nama Kop Surat</Label>
                  <Input 
                    value={data.namaKopSurat} 
                    onChange={(e) => setData({ ...data, namaKopSurat: e.target.value })} 
                    className="h-12 rounded-2xl border-slate-200 font-bold"
                    placeholder="Nama Organisasi..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Alamat Kop Surat (Header)</Label>
                  <Textarea 
                    value={data.alamatKopSurat} 
                    onChange={(e) => setData({ ...data, alamatKopSurat: e.target.value })} 
                    className="min-h-[80px] rounded-2xl border-slate-200"
                    placeholder="Alamat Lengkap..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Kontak Kop Surat (Footer)</Label>
                  <Input 
                    value={data.kontakKopSurat} 
                    onChange={(e) => setData({ ...data, kontakKopSurat: e.target.value })} 
                    className="h-12 rounded-2xl border-slate-200"
                    placeholder="Kontak / Kode Pos..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Nomor Surat (Otomatis/Manual)</Label>
                    <Input className="h-12 rounded-2xl border-slate-200" value={data.nomor} onChange={(e) => setData({ ...data, nomor: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Lampiran</Label>
                    <Input className="h-12 rounded-2xl border-slate-200" value={data.lampiran} onChange={(e) => setData({ ...data, lampiran: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="font-bold text-slate-700 ml-1">Tempat Surat</Label>
                        <Input 
                            className="h-12 rounded-2xl border-slate-200" 
                            value={data.tempat} 
                            onChange={(e) => setData({ ...data, tempat: e.target.value })} 
                            placeholder="Contoh: Serang"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="font-bold text-slate-700 ml-1">Tanggal Surat</Label>
                        <Input 
                            type="date"
                            className="h-12 rounded-2xl border-slate-200" 
                            value={dateInput}
                            onChange={(e) => setDateInput(e.target.value)} 
                        />
                     </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Perihal Proposal</Label>
                  <Input value={data.perihal} onChange={(e) => setData({ ...data, perihal: e.target.value })} className="h-12 rounded-2xl border-slate-200 font-bold text-[#5E17EB]" />
                </div>
                
                <div className="p-5 md:p-8 bg-slate-50/50 rounded-3xl md:rounded-4xl border border-slate-100 space-y-6">
                   <h3 className="font-extrabold text-[#5E17EB] flex items-center text-base md:text-lg">
                     <div className="w-8 h-8 rounded-xl bg-[#5E17EB]/10 flex items-center justify-center mr-3 shrink-0">
                          <FileText className="h-4 w-4" />
                     </div>
                     Tujuan / Penerima Proposal
                   </h3>
                   
                   {/* Excel Import Utility */}
                   <div className="bg-slate-50 border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-5 mb-4">
                        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm">Import Data Penerima (Excel)</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-md">
                                    Upload file Excel (.xlsx) dengan kolom: Nama, Jabatan, Alamat. 
                                </p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleDownloadTemplate}
                                    className="rounded-xl h-9 text-xs text-slate-600 hover:text-slate-900"
                                >
                                    <FileText className="h-3 w-3 mr-2" /> Template
                                </Button>
                                <Button variant="secondary" size="sm" className="rounded-xl h-9 text-xs relative overflow-hidden bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">
                                    <label className="cursor-pointer flex items-center justify-center w-full h-full px-4 absolute inset-0">
                                        <Upload className="h-3 w-3 mr-2" /> Upload Excel
                                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                                    </label>
                                    <span className="opacity-0">Upload Excel</span>
                                </Button>
                            </div>
                        </div>

                        {bulkRecipients.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-white px-3 py-1 text-sm rounded-lg">
                                            {bulkRecipients.length} Penerima
                                        </Badge>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Preview: <span className="font-bold text-slate-700">{bulkRecipients[currentRecipientIndex]?.nama}</span>
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePreviousRecipient}
                                            disabled={currentRecipientIndex === 0}
                                            className="rounded-lg h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-xs font-bold text-slate-600 min-w-[50px] text-center">
                                            {currentRecipientIndex + 1} / {bulkRecipients.length}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNextRecipient}
                                            disabled={currentRecipientIndex === bulkRecipients.length - 1}
                                            className="rounded-lg h-8 w-8 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                   </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider ml-1">Nama Penerima</Label>
                      <Input className="h-12 rounded-xl bg-white border-slate-200" value={data.penerima.nama} onChange={(e) => handlePenerimaChange('nama', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider ml-1">Jabatan / Komisi</Label>
                      <Input className="h-12 rounded-xl bg-white border-slate-200" value={data.penerima.jabatan} onChange={(e) => handlePenerimaChange('jabatan', e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider ml-1">Tempat / Domisili</Label>
                      <Input className="h-12 rounded-xl bg-white border-slate-200" value={data.penerima.alamat} onChange={(e) => handlePenerimaChange('alamat', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50/50 rounded-4xl border border-slate-100 space-y-6">
                  <h3 className="font-extrabold text-[#5E17EB] flex items-center text-lg">
                    <div className="w-8 h-8 rounded-xl bg-[#5E17EB]/10 flex items-center justify-center mr-3">
                         <ImageIcon className="h-4 w-4" />
                    </div>
                    Pengaturan Logo Kop Surat
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Kiri */}
                    <div className="space-y-4">
                        <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider ml-1">Logo Kiri (Utama)</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {data.logoKiri ? (
                                    <img src={data.logoKiri} alt="Logo Kiri" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-slate-200" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <Button variant="outline" size="sm" className="rounded-xl w-full h-10 border-slate-200 border-2 font-bold hover:bg-[#5E17EB]/5 hover:text-[#5E17EB] transition-all" asChild>
                                    <label className="cursor-pointer">
                                        <Upload className="h-4 w-4 mr-2" /> Ganti Logo
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logoKiri')} />
                                    </label>
                                </Button>
                                <p className="text-[10px] text-slate-400 font-medium leading-tight">Gunakan File PNG/JPG (Transparan lebih baik)</p>
                            </div>
                        </div>
                    </div>

                    {/* Logo Kanan */}
                    <div className="space-y-4">
                        <Label className="text-slate-500 font-bold text-xs uppercase tracking-wider ml-1">Logo Kanan (Pendamping)</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {data.logoKanan ? (
                                    <img src={data.logoKanan} alt="Logo Kanan" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-slate-200" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <Button variant="outline" size="sm" className="rounded-xl w-full h-10 border-slate-200 border-2 font-bold hover:bg-[#5E17EB]/5 hover:text-[#5E17EB] transition-all" asChild>
                                    <label className="cursor-pointer">
                                        <Upload className="h-4 w-4 mr-2" /> Ganti Logo
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logoKanan')} />
                                    </label>
                                </Button>
                                <p className="text-[10px] text-slate-400 font-medium leading-tight">Biasanya logo IPSI atau Organisasi terkait</p>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                     <Label className="font-bold text-slate-700">Isi Surat Pengantar</Label>
                     <div className="flex gap-2">
                        {history.suratPengantar && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8"
                                onClick={() => handleUndo('cover-letter')}
                                title="Kembalikan teks sebelumnya"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Undo
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl text-[#5E17EB] hover:bg-[#5E17EB]/5 h-8"
                            onClick={() => handleAiGenerate('cover-letter')}
                            disabled={isAiLoading === 'cover-letter'}
                        >
                            {isAiLoading === 'cover-letter' ? (
                                <div className="w-4 h-4 border-2 border-[#5E17EB]/30 border-t-[#5E17EB] rounded-full animate-spin mr-2"></div>
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Rekomendasi AI
                        </Button>
                     </div>
                  </div>
                  <Textarea 
                    value={data.suratPengantar} 
                    onChange={(e) => setData({ ...data, suratPengantar: e.target.value })}
                    className="min-h-[250px] rounded-3xl border-slate-200 focus:ring-[#5E17EB]/20 text-slate-700 leading-relaxed p-6 shadow-inner bg-slate-50/30"
                    placeholder="Tuliskan isi surat pengantar..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="font-bold text-slate-700">Narasi Latar Belakang</Label>
                    <div className="flex gap-2">
                        {history.latarBelakang && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8"
                                onClick={() => handleUndo('background')}
                                title="Kembalikan teks sebelumnya"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Undo
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl text-[#5E17EB] hover:bg-[#5E17EB]/5 h-8"
                            onClick={() => handleAiGenerate('background')}
                            disabled={isAiLoading === 'background'}
                        >
                            {isAiLoading === 'background' ? (
                            <div className="w-4 h-4 border-2 border-[#5E17EB]/30 border-t-[#5E17EB] rounded-full animate-spin mr-2"></div>
                            ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Rekomendasi AI
                        </Button>
                    </div>
                  </div>
                  <Textarea 
                    value={data.latarBelakang} 
                    onChange={(e) => setData({ ...data, latarBelakang: e.target.value })}
                    className="min-h-[180px] rounded-3xl border-slate-200 focus:ring-[#5E17EB]/20 text-slate-700 leading-relaxed p-6 shadow-inner bg-slate-50/30"
                    placeholder="Tuliskan alasan permohonan ini diajukan..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-slate-700 ml-1">Maksud dan Tujuan (Poin Ringkas)</Label>
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl text-[#5E17EB] hover:bg-[#5E17EB]/5 h-8"
                            onClick={() => handleAiGenerate('objectives')}
                            disabled={isAiLoading === 'objectives'}
                        >
                            <Sparkles className="h-4 w-4 mr-2" /> AI Suggest
                        </Button>
                        <Button variant="ghost" size="sm" onClick={addTujuan} className="rounded-xl text-slate-500 hover:bg-slate-100 h-8">
                            <Plus className="h-4 w-4 mr-1" /> Tambah Manual
                        </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {data.tujuan.map((t, i) => (
                      <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                        <div className="w-8 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 font-bold text-slate-400">
                           {i+1}
                        </div>
                        <Input value={t} onChange={(e) => updateTujuan(i, e.target.value)} className="rounded-xl h-12 border-slate-200" />
                        <Button variant="ghost" size="icon" onClick={() => removeTujuan(i)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl shrink-0">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-slate-50/50 rounded-4xl border border-slate-100 space-y-6 mt-8 transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-[#5E17EB] flex items-center text-lg">
                      <div className="w-8 h-8 rounded-xl bg-[#5E17EB]/10 flex items-center justify-center mr-3">
                           <Calendar className="h-4 w-4" />
                      </div>
                      Waktu dan Tempat Pelaksanaan
                    </h3>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer" htmlFor="toggle-waktu">
                            {data.showWaktuTempat ? 'Aktif' : 'Nonaktif'}
                        </Label>
                        <input 
                            id="toggle-waktu"
                            type="checkbox" 
                            className="hidden"
                            checked={data.showWaktuTempat}
                            onChange={(e) => setData({ ...data, showWaktuTempat: e.target.checked })}
                        />
                        <div 
                            onClick={() => setData({ ...data, showWaktuTempat: !data.showWaktuTempat })}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${data.showWaktuTempat ? 'bg-[#5E17EB]' : 'bg-slate-300'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${data.showWaktuTempat ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                  </div>

                  {data.showWaktuTempat ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700 ml-1">Hari & Waktu</Label>
                            <Input 
                                value={data.waktuKegiatan} 
                                onChange={(e) => setData({ ...data, waktuKegiatan: e.target.value })} 
                                className="h-12 rounded-2xl border-slate-200"
                                placeholder="Contoh: Minggu, 20 Januari 2026..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700 ml-1">Tempat Lokasi</Label>
                            <Input 
                                value={data.tempatKegiatan} 
                                onChange={(e) => setData({ ...data, tempatKegiatan: e.target.value })} 
                                className="h-12 rounded-2xl border-slate-200"
                                placeholder="Contoh: Lapangan Padepokan Satria Pinayungan..."
                            />
                        </div>
                      </div>
                  ) : (
                      <div className="py-4 text-center">
                          <p className="text-sm text-slate-400 font-medium italic">Bagian ini tidak akan muncul di proposal jika dinonaktifkan.</p>
                      </div>
                  )}
                </div>

                <div className="pt-8 flex justify-end">
                    <Button onClick={() => setActiveTab('struktur')} className="rounded-2xl h-12 bg-[#5E17EB]/10 text-[#5E17EB] hover:bg-[#5E17EB]/20 font-bold px-8 shadow-sm">
                        Lanjut ke Struktur <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              </TabsContent>

              <TabsContent value="struktur" className="space-y-10 mt-0">
                 {/* Pimpinan Atas */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#5E17EB] rounded-full"></div>
                        <h3 className="font-extrabold text-lg text-slate-800">Pimpinan Atas (Penanggung Jawab)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {data.struktur.pimpinanAtas.map((p, i) => (
                        <div key={i} className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                           <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">{p.role}</Label>
                           <Input 
                            value={p.name} 
                            className="h-11 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                            onChange={(e) => updateStrukturName('pimpinanAtas', i, e.target.value)} 
                           />
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Pimpinan Teknis */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        <h3 className="font-extrabold text-lg text-slate-800">Pimpinan Teknis (Padepokan)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {data.struktur.pimpinanTeknis.map((p, i) => (
                        <div key={i} className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                           <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">{p.role}</Label>
                           <Input 
                            value={p.name} 
                            className="h-11 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                            onChange={(e) => updateStrukturName('pimpinanTeknis', i, e.target.value)} 
                           />
                        </div>
                      ))}
                    </div>
                 </div>
                  {/* Administrasi & Keuangan */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                         <h3 className="font-extrabold text-lg text-slate-800">Administrasi & Keuangan (Sekretaris & Bendahara)</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {data.struktur.administrasi.map((p, i) => (
                         <div key={i} className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">{p.role}</Label>
                            <Input 
                             value={p.name} 
                             className="h-11 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                             onChange={(e) => updateStrukturName('administrasi', i, e.target.value)} 
                            />
                         </div>
                       ))}
                     </div>
                  </div>

                 {/* Operasional */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                        <h3 className="font-extrabold text-lg text-slate-800">Divisi Operasional (Anggota)</h3>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl border-slate-200" onClick={() => {
                        const newStruktur = {...data.struktur}
                        newStruktur.operasional.push('')
                        setData({...data, struktur: newStruktur})
                      }}>
                        <Plus className="h-4 w-4 mr-2" /> Tambah Anggota
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.struktur.operasional.map((name, i) => (
                        <div key={i} className="flex group animate-in zoom-in-95 duration-200">
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">{i+1}</span>
                            <Input 
                                value={name} 
                                placeholder={`Nama Anggota ${i+1}`}
                                onChange={(e) => {
                                const newStruktur = {...data.struktur}
                                newStruktur.operasional[i] = e.target.value
                                setData({...data, struktur: newStruktur})
                                }} 
                                className="h-11 pl-8 rounded-xl border-slate-200 bg-white"
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                const newStruktur = {...data.struktur}
                                newStruktur.operasional = newStruktur.operasional.filter((_, idx) => idx !== i)
                                setData({...data, struktur: newStruktur})
                            }} 
                            className="text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl ml-1 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="pt-10 flex justify-between border-t border-slate-100 mt-8">
                    <Button onClick={() => setActiveTab('umum')} variant="ghost" className="rounded-2xl h-12 text-slate-400 font-bold hover:bg-slate-50">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                    <Button onClick={() => setActiveTab('rab')} className="rounded-2xl h-12 bg-[#5E17EB]/10 text-[#5E17EB] hover:bg-[#5E17EB]/20 font-bold px-8 shadow-sm">
                        Lanjut ke RAB <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              </TabsContent>

              <TabsContent value="rab" className="space-y-8 mt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                    <h3 className="font-extrabold text-xl font-slate-900">Rencana Anggaran Biaya (RAB)</h3>
                  </div>
                  <Button onClick={addRab} className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6 h-12 shadow-lg shadow-emerald-200">
                    <Plus className="h-4 w-4 mr-2" /> Tambah Barang
                  </Button>
                </div>

                <div className="overflow-hidden overflow-x-auto rounded-3xl border border-slate-100 shadow-sm bg-slate-50/30">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-[#5E17EB]/5 text-[#5E17EB] font-bold text-[10px] uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-4 md:px-6 py-5">Item & Spesifikasi</th>
                        <th className="px-2 md:px-4 py-5 w-24 text-center">Jumlah</th>
                        <th className="px-4 md:px-6 py-5 w-40">Harga Satuan</th>
                        <th className="px-4 md:px-6 py-5 w-48">Total</th>
                        <th className="px-2 md:px-4 py-5 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.rab.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                                <Input value={item.nama} placeholder="Nama Barang" onChange={(e) => updateRab(i, 'nama', e.target.value)} className="h-10 text-sm font-bold border-none bg-slate-50 focus:bg-white rounded-lg px-3 shadow-none" />
                                <Input value={item.spesifikasi} placeholder="Spesifikasi / Merk" onChange={(e) => updateRab(i, 'spesifikasi', e.target.value)} className="h-8 text-xs text-slate-500 border-none bg-transparent focus:bg-white rounded-lg px-3 shadow-none" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Input type="number" value={item.jumlah} onChange={(e) => updateRab(i, 'jumlah', e.target.value)} className="h-10 text-center font-bold border-slate-100 rounded-lg shadow-none" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                <Input type="number" value={item.hargaSatuan} onChange={(e) => updateRab(i, 'hargaSatuan', e.target.value)} className="h-10 pl-10 border-slate-100 rounded-lg shadow-none font-medium" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block mb-1">Subtotal</span>
                                <span className="text-lg font-extrabold text-slate-900">
                                    IDR {(item.totalHarga).toLocaleString('id-ID')}
                                </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Button variant="ghost" size="icon" onClick={() => removeRab(i)} className="text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#5E17EB]/5">
                      <tr>
                        <td colSpan={3} className="px-6 py-6 text-right">
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Total Estimasi Anggaran</span>
                        </td>
                        <td colSpan={2} className="px-6 py-6">
                            <span className="text-2xl font-black text-[#5E17EB]">
                                IDR {calculateTotalRab().toLocaleString('id-ID')}
                            </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Lampiran Foto Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h3 className="font-extrabold text-xl font-slate-900">Lampiran Foto & Dokumentasi</h3>
                        </div>
                        <Button onClick={addLampiranFoto} variant="outline" className="rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 px-6 h-12 shadow-sm font-bold">
                            <Plus className="h-4 w-4 mr-2" /> Tambah Foto
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.lampiranFoto.map((foto, i) => (
                            <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl bg-white overflow-hidden p-6 relative group">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeLampiranFoto(i)} 
                                    className="absolute top-4 right-4 z-10 text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                
                                <div className="space-y-4">
                                    <div className="relative group/img aspect-video rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all">
                                        {foto.url ? (
                                            <>
                                                <img src={foto.url} className="w-full h-full object-cover" alt={`Lampiran ${i + 1}`} />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                                                    <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black rounded-xl font-bold">Ganti Foto</Button>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                    onChange={(e) => handleLampiranFotoUpload(i, e)}
                                                />
                                            </>
                                        ) : (
                                            <div className="text-center p-6">
                                                <div className="mx-auto w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 mb-3 group-hover/img:bg-blue-100 group-hover/img:text-blue-500 transition-all">
                                                    <Download className="h-6 w-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-400">Pilih Foto Barang</p>
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                    onChange={(e) => handleLampiranFotoUpload(i, e)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deskripsi Foto</Label>
                                            <span className={`text-[10px] font-bold ${foto.deskripsi.length >= 30 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {foto.deskripsi.length}/30
                                            </span>
                                        </div>
                                        <Input 
                                            value={foto.deskripsi} 
                                            onChange={(e) => updateLampiranFoto(i, 'deskripsi', e.target.value.slice(0, 30))}
                                            placeholder="Contoh: Tampak depan speaker"
                                            className="h-12 border-slate-100 rounded-2xl bg-white shadow-none focus-visible:ring-blue-400/20 font-medium"
                                            maxLength={30}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {data.lampiranFoto.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-medium italic">Belum ada foto yang dilampirkan.</p>
                                <Button variant="ghost" className="mt-4 text-[#5E17EB] font-bold" onClick={addLampiranFoto}>
                                    <Plus className="h-4 w-4 mr-2" /> Mulai Tambah Foto
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-10 flex justify-between border-t border-slate-100 mt-8">
                    <Button onClick={() => setActiveTab('struktur')} variant="ghost" className="rounded-2xl h-12 text-slate-400 font-bold hover:bg-slate-50">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                    <Button onClick={() => setActiveTab('ttd')} className="rounded-2xl h-12 bg-[#5E17EB]/10 text-[#5E17EB] hover:bg-[#5E17EB]/20 font-bold px-8 shadow-sm">
                        Lanjut ke Penutup <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              </TabsContent>

              <TabsContent value="ttd" className="space-y-8 mt-0">
                <div className="space-y-3">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="font-bold text-slate-700">Kalimat Penutup</Label>
                        <div className="flex gap-2">
                            {history.penutup && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8"
                                    onClick={() => handleUndo('closing')}
                                    title="Kembalikan teks sebelumnya"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Undo
                                </Button>
                            )}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-xl text-[#5E17EB] hover:bg-[#5E17EB]/5 h-8"
                                onClick={() => handleAiGenerate('closing')}
                                disabled={isAiLoading === 'closing'}
                            >
                                {isAiLoading === 'closing' ? (
                                <div className="w-4 h-4 border-2 border-[#5E17EB]/30 border-t-[#5E17EB] rounded-full animate-spin mr-2"></div>
                                ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                Rekomendasi AI
                            </Button>
                        </div>
                      </div>
                      <Textarea 
                        value={data.penutup} 
                        onChange={(e) => {
                            const val = e.target.value
                            setData(prev => ({ ...prev, penutup: val }))
                        }}
                        className="min-h-[150px] rounded-3xl border-slate-200 focus:ring-[#5E17EB]/20 text-slate-700 leading-relaxed p-6 shadow-inner bg-slate-50/30"
                        placeholder="Tuliskan kalimat penutup..."
                      />
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Lokasi Penerbitan</Label>
                    <Input className="h-12 rounded-2xl border-slate-200" value={data.tempat} onChange={(e) => setData({ ...data, tempat: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Tanggal Surat</Label>
                    <Input className="h-12 rounded-2xl border-slate-200" value={data.tanggal} onChange={(e) => setData({ ...data, tanggal: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-6 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#5E17EB] rounded-full"></div>
                        <h3 className="font-extrabold text-lg text-slate-800">Nama Penandatangan (Dibuat & Mengetahui)</h3>
                    </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { label: 'Ketua Padepokan', key: 'namaKetua' },
                            { label: 'Guru Besar', key: 'namaGuruBesar' },
                            { label: 'Ketua RW', key: 'namaKetuaRW' },
                            { label: 'Ketua RT', key: 'namaKetuaRT' },
                            { label: 'Ketua Pemuda', key: 'namaKetuaIPARGA' },
                            { label: 'Ketua DPD Bandrong', key: 'namaKetuaDPD' }
                        ].map((field) => (
                             <div key={field.key} className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">{field.label}</Label>
                                <Input 
                                    value={(data as any)[field.key]} 
                                    className="h-11 rounded-xl bg-white border-slate-200 font-bold text-[#5E17EB]"
                                    onChange={(e) => {
                                        const name = e.target.value
                                        setData(prev => {
                                            const next = { ...prev, [field.key]: name }
                                            const newStruktur = { ...next.struktur }
                                            
                                            // Reverse Relational Syncing
                                            if (field.key === 'namaKetua') newStruktur.pimpinanTeknis[1].name = name
                                            if (field.key === 'namaGuruBesar') newStruktur.pimpinanTeknis[0].name = name
                                            if (field.key === 'namaKetuaRW') newStruktur.pimpinanAtas[0].name = `${name} ( Ketua RW )`
                                            if (field.key === 'namaKetuaRT') newStruktur.pimpinanAtas[1].name = `${name} ( Ketua RT- 015 )`
                                            if (field.key === 'namaKetuaIPARGA') newStruktur.pimpinanAtas[2].name = name
                                            
                                            return { ...next, struktur: newStruktur }
                                        })
                                    }} 
                                />
                             </div>
                        ))}
                   </div>
                </div>
              </TabsContent>
            </CardContent>
            
            <div className="p-5 md:p-8 lg:p-10 bg-slate-50 border-t">
               <Button 
                className="w-full h-14 rounded-3xl font-black bg-[#5E17EB] hover:bg-[#4a11c0] shadow-[0_15px_30px_rgba(94,23,235,0.25)] text-white transition-all text-lg scale-100 hover:scale-[1.02]"
                onClick={handleSave}
                disabled={isSaving}
               >
                 {isSaving ? (
                    <span className="flex items-center justify-center">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Memproses...
                    </span>
                 ) : (
                    <span className="flex items-center justify-center">
                        <FileCheck className="h-5 w-5 mr-3" />
                        {proposalStatus === 'DITOLAK' ? 'Ajukan Ulang' : (proposalId ? 'Simpan Perubahan' : 'Ajukan Proposal')}
                    </span>
                 )}
               </Button>
            </div>
          </Card>
        </Tabs>
      </div>
      )}

      {/* Preview Section */}
      <div 
        className={isViewMode ? "fixed inset-0 overflow-y-auto flex justify-center py-10 px-4 bg-slate-100" : "w-full lg:w-[650px] shrink-0"}
        style={isViewMode ? { zIndex: 40, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' } : undefined}
      >
        <div className={isViewMode ? "w-full max-w-[850px] animate-in zoom-in-95 duration-300" : "lg:sticky lg:top-10 w-full max-w-[850px]"}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 md:mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
                 {isViewMode && (
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-slate-500 hover:text-[#5E17EB]" onClick={() => router.push('/admin/surat')}>
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /> 
                    </Button>
                 )}
                 <h2 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">Digital Preview</h2>
            </div>
            
            <div className="flex items-center gap-3">
                {bulkRecipients.length > 0 && (
                  <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm border border-slate-200 mr-2">
                     <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-slate-100" onClick={handlePreviousRecipient} disabled={currentRecipientIndex === 0}>
                       <ChevronLeft className="h-4 w-4" />
                     </Button>
                     <span className="text-xs font-bold text-slate-600 min-w-[50px] text-center">
                       {currentRecipientIndex + 1} / {bulkRecipients.length}
                     </span>
                     <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-slate-100" onClick={handleNextRecipient} disabled={currentRecipientIndex === bulkRecipients.length - 1}>
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                  </div>
                )}

                {!isViewMode && <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold px-3 py-1 text-xs sm:text-sm rounded-full">Ready for Export</Badge>}
                
                {/* Status Badge */}
                <Badge className={`px-3 py-1 text-xs sm:text-sm rounded-full border-none font-bold ${
                    proposalStatus === 'VALIDASI' ? 'bg-emerald-500 text-white' : 
                    proposalStatus === 'DITOLAK' ? 'bg-rose-500 text-white' : 
                    'bg-amber-100 text-amber-700'
                }`}>
                    {proposalStatus === 'VALIDASI' ? 'DISETUJUI' : 
                     proposalStatus === 'DITOLAK' ? 'DITOLAK' : 
                     'MENUNGGU REVIEW'}
                </Badge>
            </div>
          </div>

          {/* Action Bar for Approval/Rejection & Download */}
           <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2 w-full lg:w-auto">
                <Button 
                    onClick={generatePDF} 
                    disabled={!isDownloadActive()}
                    className={`flex-1 sm:flex-none rounded-xl font-bold ${!isDownloadActive() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    variant={isDownloadActive() ? "default" : "secondary"}
                >
                    <Download className="mr-2 h-4 w-4" /> Unduh PDF
                </Button>
                {bulkRecipients.length > 0 && (
                    <Button 
                        onClick={handleBulkGenerate} 
                        disabled={!isDownloadActive() || isBulkProcessing}
                        className={`flex-1 sm:flex-none rounded-xl font-bold bg-[#5E17EB] text-white hover:bg-[#4a11c0] ${!isDownloadActive() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isBulkProcessing ? (
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        ) : (
                             <Users className="mr-2 h-4 w-4" /> 
                        )}
                        Unduh Massal ({bulkRecipients.length})
                    </Button>
                )}
             </div>

             {/* Admin / Ketua Actions */}
             {(currentUserRole === 'MASTER_ADMIN' || currentUserRole === 'KETUA') && proposalId && (
                 <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 w-full lg:w-auto">
                    {proposalStatus !== 'VALIDASI' && (
                        <Button 
                            onClick={() => handleStatusChange('VALIDASI')}
                            className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold"
                            disabled={isSaving}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Terima Proposal
                        </Button>
                    )}
                    
                    {proposalStatus !== 'DITOLAK' && (
                        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                            <Button 
                                variant="destructive"
                                className="flex-1 sm:flex-none rounded-xl font-bold bg-rose-500 hover:bg-rose-600"
                                disabled={isSaving}
                                onClick={() => setIsRejectDialogOpen(true)}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Tolak
                            </Button>
                            <DialogContent className="rounded-3xl z-[9999]">
                                <DialogHeader>
                                    <DialogTitle>Tolak Proposal?</DialogTitle>
                                    <DialogDescription>
                                        Berikan alasan penolakan atau catatan revisi untuk pemohon.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                     <div className="space-y-2">
                                        <Label>Catatan Revisi</Label>
                                        <Textarea 
                                            value={tempRejectionReason}
                                            onChange={(e) => setTempRejectionReason(e.target.value)}
                                            placeholder="Contoh: Perbaiki rincian anggaran..."
                                            className="rounded-xl"
                                        />
                                     </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="rounded-xl">Batal</Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => handleStatusChange('DITOLAK', tempRejectionReason)}
                                        className="rounded-xl bg-rose-500 hover:bg-rose-600"
                                        disabled={!tempRejectionReason.trim()}
                                    >
                                        Konfirmasi Penolakan
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                 </div>
             )}
          </div>

          {/* Rejection Notice - Displayed to users other than Master Admin and Ketua */}
          {proposalStatus === 'DITOLAK' && rejectionReason && !['MASTER_ADMIN', 'KETUA'].includes(currentUserRole || '') && (
              <div className="mb-6 bg-rose-50 border border-rose-100 rounded-3xl p-6 animate-in slide-in-from-top-2">
                  <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                          <AlertCircle className="h-5 w-5 text-rose-600" />
                      </div>
                      <div className="space-y-1">
                          <h4 className="font-bold text-rose-700 text-lg">Proposal Perlu Revisi</h4>
                          <p className="text-rose-600/80 leading-relaxed">
                              {rejectionReason}
                          </p>
                      </div>
                  </div>
              </div>
          )}
          
          <div className="bg-[#DFE3ED] p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-[3.5rem] shadow-2xl h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] overflow-y-auto space-y-8 sm:space-y-12 flex flex-col items-center custom-scrollbar">
            {/* Real pages rendered inside - Container shadow only for UI */}
              <div ref={previewRef} className="proposal-content flex flex-col gap-6 sm:gap-8 scale-[0.45] origin-top sm:scale-[0.6] md:scale-[0.65] lg:scale-[0.68] xl:scale-[0.75]">
                <div className="shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden">
                  <Page1 data={data} />
                </div>
                <div className="shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden">
                  <Page2 data={data} />
                </div>
                <div className="shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden">
                  <Page3 data={data} />
                </div>
                
                {/* DYNAMIC RAB PAGES */}
                {(() => {
                    const rabChunks: RABItem[][] = [];
                    const chunkSize = 15; // Adjusted for better fit
                    for (let i = 0; i < data.rab.length; i += chunkSize) {
                        rabChunks.push(data.rab.slice(i, i + chunkSize));
                    }
                    
                    // Always show at least one RAB page even if empty
                    if (rabChunks.length === 0) rabChunks.push([] as RABItem[]);

                    return rabChunks.map((chunk, idx) => (
                        <div key={`rab-page-${idx}`} className="shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden">
                            <Page4 
                                data={data} 
                                items={chunk} 
                                isLast={idx === rabChunks.length - 1} 
                                pageNum={idx + 1}
                            />
                        </div>
                    ));
                })()}

                {/* DYNAMIC DOCUMENTATION PAGES */}
                {(() => {
                    const fotoChunks: ProposalFoto[][] = [];
                    const chunkSize = 4; // 2x2 grid
                    for (let i = 0; i < data.lampiranFoto.length; i += chunkSize) {
                        fotoChunks.push(data.lampiranFoto.slice(i, i + chunkSize));
                    }

                    return fotoChunks.map((chunk, idx) => (
                        <div key={`foto-page-${idx}`} className="shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden">
                            <PageFoto 
                                data={data} 
                                photos={chunk} 
                                pageNum={idx + 1}
                            />
                        </div>
                    ));
                })()}

                <div className="shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden">
                  <Page5 data={data} />
                </div>
              </div>

             <div className="mt-4 pb-12 flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <div className="h-px w-12 bg-slate-300"></div>
                Akhir Preview Proposal
                <div className="h-px w-12 bg-slate-300"></div>
             </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
         @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        
        .proposal-page {
            font-family: 'Crimson Pro', serif !important;
            -webkit-print-color-adjust: exact;
            background-color: #ffffff !important;
            color: #000000 !important;
        }

        .proposal-page * {
            border-color: #000000 !important;
        }

        .proposal-page .bg-slate-50 {
            background-color: #f8fafc !important;
        }

        /* Helper classes for consistency */
        .line-thick { border-top: 2.5px solid black; margin-bottom: 1.5px; }
        .line-thin { border-top: 1px solid black; }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}

// --- Page Components ---

const PageWrapper = ({ children, data }: { children: React.ReactNode, data: ProposalData }) => {
    return (
       <div className="proposal-page relative flex flex-col" 
            style={{ 
              width: '794px', 
              height: '1123px', 
              padding: '50px 80px', 
              color: '#000000', 
              backgroundColor: '#ffffff',
              boxShadow: 'none',
              margin: '0 auto',
              fontFamily: "'Crimson Pro', serif",
              lineHeight: '1.4',
              boxSizing: 'border-box',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
        
        {/* Kop Surat Flex Layout for Perfect Alignment */}
        <div className="kop-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', width: '100%' }}>
            <div style={{ width: '90px', display: 'flex', justifyContent: 'center' }}>
                <img className="kop-logo" src={data.logoKiri || "/padepokan-logo.png"} alt="Logo" style={{ width: '83px', height: '83px', objectFit: 'contain' }} />
            </div>
            
            <div className="kop-text" style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                <h1 style={{ fontWeight: 'bold', fontSize: '13pt', lineHeight: '1.1', margin: '0', textTransform: 'uppercase' }}>
                  {data.namaKopSurat}
                </h1>
                {data.alamatKopSurat.split('\n').map((line, i) => (
                    <h2 key={i} style={{ fontWeight: 'normal', fontSize: '11pt', lineHeight: '1.1', margin: '1px 0', textTransform: 'uppercase' }}>
                        {line}
                    </h2>
                ))}
                <p style={{ fontWeight: 'normal', fontSize: '8.5pt', lineHeight: '1.2', margin: '4px 0 0 0', fontStyle: 'italic', textTransform: 'none' }}>
                  {data.kontakKopSurat}
                </p>
            </div>

            <div style={{ width: '90px', display: 'flex', justifyContent: 'center' }}>
                <img className="kop-logo" src={data.logoKanan || "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Ipsi_logo.png/600px-Ipsi_logo.png"} alt="Logo" style={{ width: '83px', height: '83px', objectFit: 'contain' }} />
            </div>
            
        </div>
        
        {/* Decorative Divider Line - More stable dual-block for PDF */}
        <div className="divider-line-container" style={{ width: '100%', marginBottom: '15px', marginTop: '1px' }}>
            <div className="line-thick" style={{ borderTop: '2.5px solid black', marginBottom: '1.5px' }}></div>
            <div className="line-thin" style={{ borderTop: '1px solid black' }}></div>
        </div>

        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    )
  }
  
  function Page1({ data }: { data: ProposalData }) {
    return (
      <PageWrapper data={data}>
        <div style={{ fontSize: '12pt', textAlign: 'justify' }}>
          <table style={{ width: '100%', marginBottom: '15px' }}>
            <tbody>
              <tr>
                <td style={{ width: '100px' }}>Nomor</td>
                <td style={{ width: '15px' }}>:</td>
                <td style={{ fontWeight: 'bold' }}>{data.nomor}</td>
              </tr>
              <tr>
                <td>Lampiran</td>
                <td>:</td>
                <td>{data.lampiran}</td>
              </tr>
              <tr>
                <td>Perihal</td>
                <td>:</td>
                <td><span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{data.perihal}</span></td>
              </tr>
            </tbody>
          </table>
  
          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '0' }}>Kepada Yth.</p>
            <p style={{ fontWeight: 'bold', margin: '2px 0', fontSize: '13pt' }}>{data.penerima.nama}</p>
            {data.penerima.jabatan && <p style={{ fontWeight: 'bold', margin: '0' }}>({data.penerima.jabatan})</p>}
            <p style={{ margin: '8px 0 2px 0' }}>di -</p>
            <p style={{ paddingLeft: '24px', margin: '0', fontWeight: 'bold' }}>{data.penerima.alamat}</p>
          </div>
  
          <div className="surat-body" style={{ marginBottom: '10px' }}>
            {(data.suratPengantar || '').split('\n').map((line, i) => {
                if (!line.trim()) return <br key={i} />
                const isSalam = line.toLowerCase().includes('assalamu') || line.toLowerCase().includes('wassalamu')
                return (
                    <p key={i} style={{ 
                        margin: isSalam ? '10px 0' : '8px 0', 
                        textIndent: isSalam ? '0' : '40px',
                        fontStyle: isSalam ? 'italic' : 'normal',
                        fontWeight: isSalam ? 'bold' : 'normal',
                        textAlign: 'justify'
                    }}>
                        {line}
                    </p>
                )
            })}
          </div>
  
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
             <p>{data.tempat}, {data.tanggal}</p>
          </div>
  
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0' }}>Ketua Padepokan</p>
              <div style={{ height: '40px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0', fontSize: '13pt' }}>{data.namaKetua}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0' }}>Guru Besar Padepokan</p>
              <div style={{ height: '40px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0', fontSize: '13pt' }}>{data.namaGuruBesar}</p>
            </div>
          </div>
  
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '2px' }}>Mengetahui,</p>
            <p style={{ margin: '0', lineHeight: '1.2' }}>Ketua DPD Bandrong</p>
            <p style={{ margin: '0', lineHeight: '1.1', fontSize: '11pt' }}>Kabupaten Serang</p>
            <div style={{ height: '48px' }}></div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0', fontSize: '13pt'}}>{data.namaKetuaDPD}</p>
          </div>
        </div>
      </PageWrapper>
    )
  }
  
  function Page2({ data }: { data: ProposalData }) {
    return (
      <PageWrapper data={data}>
        <div style={{ fontSize: '12pt' }}>
          <div className="h2-wrapper" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <span className="h2-bar" style={{ width: '10px', height: '35px', backgroundColor: 'black', marginRight: '15px' }}></span>
            <h2 style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', margin: 0 }}>I. Pendahuluan</h2>
          </div>
          
          <div style={{ marginBottom: '25px', marginLeft: '30px' }}>
             <h3 style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '10px' }}>A. Latar Belakang</h3>
             <div style={{ textAlign: 'justify', textIndent: '40px', whiteSpace: 'pre-wrap' }}>
               {data.latarBelakang}
             </div>
          </div>
  
          <div style={{ marginLeft: '30px' }}>
             <h3 style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '10px' }}>B. Maksud Dan Tujuan</h3>
             <div style={{ paddingLeft: '10px' }}>
                {data.tujuan.map((t, i) => (
                  <div key={i} className="list-item" style={{ display: 'flex', marginBottom: '8px', textAlign: 'justify' }}>
                    <span className="list-number" style={{ width: '30px', flexShrink: 0}}>{i + 1}.</span>
                    <span>{t}</span>
                  </div>
                ))}
             </div>
          </div>

          {data.showWaktuTempat && (
              <div style={{ marginLeft: '30px', marginTop: '25px' }}>
                 <h3 style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '10px' }}>C. Waktu Dan Tempat Pelaksanaan</h3>
                 <div style={{ paddingLeft: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr', marginBottom: '5px' }}>
                       <span>Hari / Waktu</span> <span>:</span> <span>{data.waktuKegiatan || '-'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr' }}>
                       <span>Tempat</span> <span>:</span> <span>{data.tempatKegiatan || '-'}</span>
                    </div>
                 </div>
              </div>
          )}
        </div>
      </PageWrapper>
    )
  }
  
  function Page3({ data }: { data: ProposalData }) {
    return (
      <PageWrapper data={data}>
        <div style={{ fontSize: '12pt' }}>
          <div className="h2-wrapper" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <span className="h2-bar" style={{ width: '10px', height: '35px', backgroundColor: 'black', marginRight: '15px' }}></span>
            <h2 style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', margin: 0 }}>II. Struktur Organisasi</h2>
          </div>  
          <div style={{ marginLeft: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
               <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                   <span style={{ width: '6px', height: '6px', backgroundColor: 'black', borderRadius: '50%', marginRight: '10px' }}></span>
                   PIMPINAN ATAS (PENANGGUNG JAWAB)
               </h3>
               <div style={{ marginLeft: '25px' }}>
                 {data.struktur.pimpinanAtas.map((p, i) => (
                   <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 15px 1fr', marginBottom: '3px' }}>
                     <span style={{ fontWeight: 'bold' }}>{p.role}</span> <span>:</span> <span>{p.name}</span>
                   </div>
                 ))}
               </div>
            </div>
  
            <div style={{ marginBottom: '20px' }}>
               <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                   <span style={{ width: '6px', height: '6px', backgroundColor: 'black', borderRadius: '50%', marginRight: '10px' }}></span>
                   PIMPINAN TEKNIS (PADEPOKAN)
               </h3>
               <div style={{ marginLeft: '25px' }}>
                 {data.struktur.pimpinanTeknis.map((p, i) => (
                   <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 15px 1fr', marginBottom: '3px' }}>
                     <span style={{ fontWeight: 'bold' }}>{p.role}</span> <span>:</span> <span>{p.name}</span>
                   </div>
                 ))}
               </div>
            </div>
  
            <div style={{ marginBottom: '20px' }}>
               <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                   <span style={{ width: '6px', height: '6px', backgroundColor: 'black', borderRadius: '50%', marginRight: '10px' }}></span>
                   ADMINISTRASI & KEUANGAN
               </h3>
               <div style={{ marginLeft: '25px' }}>
                 {data.struktur.administrasi.map((p, i) => (
                   <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 15px 1fr', marginBottom: '3px' }}>
                     <span style={{ fontWeight: 'bold' }}>{p.role}</span> <span>:</span> <span>{p.name}</span>
                   </div>
                 ))}
               </div>
            </div>
  
            <div>
               <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                   <span style={{ width: '6px', height: '6px', backgroundColor: 'black', borderRadius: '50%', marginRight: '10px' }}></span>
                   DIVISI OPERASIONAL (ANGGOTA)
               </h3>
               <div style={{ marginLeft: '25px', display: 'grid', gridTemplateColumns: '1fr', gap: '3px' }}>
                  {data.struktur.operasional.map((name, i) => (
                    <div key={i} style={{ display: 'flex' }}>
                      <span style={{ width: '25px', flexShrink: 0 }}>{i+1}.</span>
                      <span>{name}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }
  
  function Page4({ data, items, isLast, pageNum }: { data: ProposalData, items: RABItem[], isLast: boolean, pageNum: number }) {
    const total = data.rab.reduce((sum, item) => sum + (item.totalHarga || 0), 0)
  
    return (
      <PageWrapper data={data}>
        <div style={{ fontSize: '12pt', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="h2-wrapper" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <span className="h2-bar" style={{ width: '10px', height: '35px', backgroundColor: 'black', marginRight: '15px' }}></span>
            <h2 style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', margin: 0 }}>
                III. Rencana Kebutuhan Alat {pageNum > 1 ? `(Bersambung - Hal ${pageNum})` : ''}
            </h2>
          </div>  
          
          {pageNum === 1 && (
              <p style={{ textIndent: '40px', marginBottom: '20px' }}>Berikut adalah estimasi yang dibutuhkan dalam rangka menunjang kegiatan seni budaya di Padepokan:</p>
          )}
          
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid black', padding: '10px 5px', textAlign: 'center', width: '40px', fontSize: '10pt' }}>No.</th>
                <th style={{ border: '1px solid black', padding: '10px 5px', textAlign: 'center', fontSize: '10pt' }}>Nama Barang</th>
                <th style={{ border: '1px solid black', padding: '10px 5px', textAlign: 'center', fontSize: '10pt' }}>Spesifikasi</th>
                <th style={{ border: '1px solid black', padding: '10px 5px', textAlign: 'center', width: '70px', fontSize: '10pt' }}>Jumlah</th>
                <th style={{ border: '1px solid black', padding: '10px 5px', textAlign: 'center', fontSize: '10pt' }}>Harga Satuan</th>
                <th style={{ border: '1px solid black', padding: '10px 5px', textAlign: 'center', fontSize: '10pt' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid black', padding: '8px 5px', textAlign: 'center' }}>{(pageNum - 1) * 15 + i + 1}</td>
                  <td style={{ border: '1px solid black', padding: '8px 5px', fontWeight: 'bold' }}>{item.nama}</td>
                  <td style={{ border: '1px solid black', padding: '8px 5px', fontSize: '11pt' }}>{item.spesifikasi}</td>
                  <td style={{ border: '1px solid black', padding: '8px 5px', textAlign: 'center' }}>{item.jumlah} {item.satuan}</td>
                  <td style={{ border: '1px solid black', padding: '8px 5px', textAlign: 'right' }}>IDR {item.hargaSatuan.toLocaleString('id-ID')}</td>
                  <td style={{ border: '1px solid black', padding: '8px 5px', textAlign: 'right', fontWeight: 'bold' }}>IDR {item.totalHarga.toLocaleString('id-ID')}</td>
                </tr>
              ))}
              
              {/* Fill remaining space to keep layout consistent if needed */}
              {items.length < 15 && !isLast && Array.from({ length: 15 - items.length }).map((_, idx) => (
                  <tr key={`empty-${idx}`} style={{ height: '37px' }}>
                      <td style={{ border: '1px solid black' }}></td>
                      <td style={{ border: '1px solid black' }}></td>
                      <td style={{ border: '1px solid black' }}></td>
                      <td style={{ border: '1px solid black' }}></td>
                      <td style={{ border: '1px solid black' }}></td>
                      <td style={{ border: '1px solid black' }}></td>
                  </tr>
              ))}
            </tbody>
            {isLast && (
                <tfoot>
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2' }}>
                    <td colSpan={5} style={{ border: '1px solid black', padding: '12px 15px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>Total Biaya</td>
                    <td style={{ border: '1px solid black', padding: '12px 5px', textAlign: 'right', fontSize: '13pt' }}>IDR {total.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
            )}
          </table>
          
          <div style={{ flex: 1 }}></div>
          <div style={{ textAlign: 'right', fontSize: '8pt', fontStyle: 'italic', color: '#94a3b8' }}>
              Hal {pageNum} - Rencana Anggaran Biaya
          </div>
        </div>
      </PageWrapper>
    )
  }

  function PageFoto({ data, photos, pageNum }: { data: ProposalData, photos: ProposalFoto[], pageNum: number }) {
    return (
        <PageWrapper data={data}>
          <div style={{ fontSize: '12pt', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="h2-wrapper" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
              <span className="h2-bar" style={{ width: '10px', height: '35px', backgroundColor: 'black', marginRight: '15px' }}></span>
              <h2 style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', margin: 0 }}>
                  IV. Lampiran Dokumentasi {pageNum > 1 ? `(Hal ${pageNum})` : ''}
              </h2>
            </div>
            
            <p style={{ marginBottom: '30px', fontStyle: 'italic' }}>Berikut adalah referensi visual / dokumentasi perangkat yang diajukan:</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '30px', flex: 1 }}>
                {photos.map((foto, i) => (
                    <div key={i} style={{ border: '1px solid #000000', borderRadius: '5px', overflow: 'hidden', padding: '15px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                        {foto.url && (
                            <div style={{ flex: 1, width: '100%', borderRadius: '3px', overflow: 'hidden', marginBottom: '15px', border: '1px solid #eee' }}>
                                <img src={foto.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                        <div style={{ textAlign: 'center', padding: '10px', borderTop: '1px solid black' }}>
                            <p style={{ fontSize: '11pt', fontWeight: 'bold', color: '#000000', margin: 0, textTransform: 'uppercase' }}>{foto.deskripsi}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ textAlign: 'right', fontSize: '8pt', fontStyle: 'italic', color: '#94a3b8', marginTop: '20px' }}>
                Hal {pageNum} - Lampiran Dokumentasi
            </div>
          </div>
        </PageWrapper>
    )
  }
  
  function Page5({ data }: { data: ProposalData }) {
    const sectionNumber = data.lampiranFoto && data.lampiranFoto.length > 0 ? "V" : "IV";
    
    return (
      <PageWrapper data={data}>
        <div style={{ fontSize: '12pt', textAlign: 'justify' }}>
          <div style={{ width: '100%', marginBottom: '40px' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', borderLeft: '8px solid black', paddingLeft: '15px', marginBottom: '20px' }}>
                {sectionNumber}. Penutup
            </h2>
            {data.penutup && data.penutup.split('\n').map((line, i) => (
               <div key={`close-${i}`} style={{ textIndent: '40px', marginBottom: '10px' }}>
                 {line}
               </div>
            ))}
          </div>
  
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', width: '100%', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ marginBottom: '2px' }}>Ketua Padepokan</p>
              <div style={{ height: '65px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt' }}>{data.namaKetua}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ marginBottom: '2px' }}>Guru Besar Padepokan</p>
              <div style={{ height: '65px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt'}}>{data.namaGuruBesar}</p>
            </div>
          </div>
  
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
            <p style={{ fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'underline', fontSize: '11pt' }}>Mengetahui,</p>
          </div>
  
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', width: '100%', marginBottom: '20px', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0' }}>Ketua RW 008</p>
              <div style={{ height: '65px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt' }}>{data.namaKetuaRW}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0' }}>Ketua RT 015</p>
              <div style={{ height: '65px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt' }}>{data.namaKetuaRT}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0', lineHeight: '1.2' }}>Ketua Pemuda</p>
              <p style={{ fontSize: '9pt', margin: '0', fontStyle: 'italic' }}>(Ikatan Pemuda Ragas Grenyang)</p>
              <div style={{ height: '65px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt' }}>{data.namaKetuaIPARGA}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0', lineHeight: '1.2' }}>Ketua DPD Bandrong</p>
              <p style={{ fontSize: '9pt', margin: '0', fontStyle: 'italic' }}>(Kabupaten Serang)</p>
              <div style={{ height: '65px' }}></div>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt' }}>{data.namaKetuaDPD}</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }
