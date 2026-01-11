'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Save, 
  Download, 
  ChevronLeft, 
  Eye,
  Upload,
  Calendar,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  Building,
  FileText,
  Users,
  Feather,
  PenTool,
  Printer
} from 'lucide-react'
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
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

// --- Types ---
interface UndanganData {
  nomor: string
  perihal: string
  tanggal: string
  penerima: {
    nama: string
    jabatan: string
    tempat: string
  }
  textPembuka: string
  acara: {
    hari: string
    tanggal: string
    tempat: string
  }
  textPenutup: string
  namaKetua: string
  namaSekretaris: string
  namaGuruBesar: string
  logoKiri?: string
  logoKanan?: string
  namaKopSurat: string
  alamatKopSurat: string
  kontakKopSurat: string
  tempat: string
  bulkRecipients?: { nama: string, jabatan: string, tempat: string }[]
}

const initialData: UndanganData = {
  namaKopSurat: 'PADEPOKAN SATRIA PINAYUNGAN RAGAS GRENYANG',
  alamatKopSurat: 'KAMPUNG RAGAS GRENYANG DESA ARGAWANA\nKECAMATAN PULOAMPEL KABUPATEN\nSERANG-BANTEN',
  kontakKopSurat: 'Jl. Puloampel KM.19 Ds. Argawana Kode Pos 42455 / no.tlp 0819 1114 1616 - 0896 4756 5908',
  nomor: '',
  perihal: '',
  tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  penerima: {
    nama: '',
    jabatan: '',
    tempat: ''
  },
  textPembuka: 'Assalamualaikum. Wr. Wb.\n\nSalam silaturahmi kami sampaikan, teriring doa semoga bapak beserta keluarga selalu berada dalam lindungan Allah SWT, diberikan kesehatan, serta kelancaran dalam segala urusan.',
  acara: {
    hari: '',
    tanggal: '',
    tempat: ''
  },
  textPenutup: 'Demikian surat undangan ini kami sampaikan, semoga dapat dikabulkan serta dapat dipahami, dan besar harapan kami semoga bapak pimpinan dapat merealisasikan undangan tersebut atas perhatiannya kami ucapkan terimakasih.\n\nWassalamu a\'laikum wr.wb',
  namaKetua: '',
  namaSekretaris: '',
  namaGuruBesar: '',
  logoKiri: "/padepokan-logo.png",
  logoKanan: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Ipsi_logo.png/600px-Ipsi_logo.png",
  tempat: 'Argawana'
}

export default function UndanganBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const undanganId = searchParams.get('id')
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(!!undanganId)
  
  const [data, setData] = useState<UndanganData>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isViewMode, setIsViewMode] = useState(searchParams.get('mode') === 'view')
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Envelope State
  const [showEnvelope, setShowEnvelope] = useState(false)

  // Bulk State
  const [bulkRecipients, setBulkRecipients] = useState<{ nama: string, jabatan: string, tempat: string }[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [currentRecipientIndex, setCurrentRecipientIndex] = useState(0)

  // Status & Role State
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [undanganStatus, setUndanganStatus] = useState<string>('DRAFT')
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [tempRejectionReason, setTempRejectionReason] = useState('')
  const [generatingField, setGeneratingField] = useState<'pembuka' | 'penutup' | null>(null)
  
  // AI Variations State
  const [aiVariations, setAiVariations] = useState<{ pembuka: string[], penutup: string[] }>({ pembuka: [], penutup: [] })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const role = user.user?.role || user.role
        setCurrentUserRole(role)
        
        if (role === 'KETUA') {
          setIsViewMode(true)
        }
      } catch (e) {
        console.error('Failed to parse user', e)
      }
    }
  }, [])

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
    if (undanganId) {
      fetchExistingUndangan()
    } else {
      setData(initialData)
      setUndanganStatus('DRAFT')
      setIsLoadingInitialData(false)
      fetchNextNomorSurat()
    }
  }, [undanganId])

  const fetchExistingUndangan = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/surat/keluar/${undanganId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data && json.data.isi) {
          try {
            const parsed = JSON.parse(json.data.isi)
            setData({ ...initialData, ...parsed })
            if (parsed.bulkRecipients) {
              setBulkRecipients(parsed.bulkRecipients)
            }
            if (json.data.status) {
              setUndanganStatus(json.data.status)
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
            console.error('Failed to parse undangan JSON', e)
          }
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data undangan')
    } finally {
      setIsLoadingInitialData(false)
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

  const handleAIGenerate = async (field: 'pembuka' | 'penutup') => {
    // Check if we already have variations loaded
    const currentVariations = aiVariations[field]
    if (currentVariations.length > 0) {
      // Find current text index
      const currentText = field === 'pembuka' ? data.textPembuka : data.textPenutup
      const currentIndex = currentVariations.indexOf(currentText)
      
      // Calculate next index
      const nextIndex = (currentIndex + 1) % currentVariations.length
      const nextText = currentVariations[nextIndex]
      
      setData(prev => ({
        ...prev,
        [field === 'pembuka' ? 'textPembuka' : 'textPenutup']: nextText
      }))
      
      toast.success(`Menampilkan variasi ke-${nextIndex + 1} dari ${currentVariations.length}`)
      return
    }

    setGeneratingField(field)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })
      if (res.ok) {
        const json = await res.json()
        if (json.text) {
          setData(prev => ({
            ...prev,
            [field === 'pembuka' ? 'textPembuka' : 'textPenutup']: json.text
          }))
          
          if (json.variations && Array.isArray(json.variations)) {
            setAiVariations(prev => ({
              ...prev,
              [field]: json.variations
            }))
            toast.success(`AI menemukan ${json.variations.length} rekomendasi text. Klik lagi untuk ganti.`)
          } else {
            toast.success('Berhasil generate text dengan AI')
          }
        }
      } else {
        toast.error('Gagal generate text')
      }
    } catch (e) {
      toast.error('Gagal menghubungi layanan AI')
    } finally {
      setGeneratingField(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const url = undanganId ? `/api/surat/keluar/${undanganId}` : '/api/surat/keluar'
      const method = undanganId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tujuan: bulkRecipients.length > 0 ? `${bulkRecipients.length} Penerima` : `${data.penerima.nama} di ${data.penerima.tempat}`,
          perihal: data.perihal,
          jenis: 'UNDANGAN',
          isi: JSON.stringify({ ...data, bulkRecipients }),
          template: 'UNDANGAN_FORMAL',
          tanggal: new Date(dateInput).toISOString(),
          status: undanganId ? ((undanganStatus === 'DRAFT' || undanganStatus === 'DITOLAK') ? 'MENUNGGU_VALIDASI' : undanganStatus) : 'MENUNGGU_VALIDASI',
          ...(undanganStatus === 'DITOLAK' ? { status: 'MENUNGGU_VALIDASI', catatan: null } : {})
        })
      })

      if (response.ok) {
        if (undanganStatus === 'DITOLAK') {
             setUndanganStatus('MENUNGGU_VALIDASI')
             setRejectionReason('')
             toast.success('Undangan berhasil diperbarui dan diajukan ulang')
        } else {
             toast.success(undanganId ? 'Perubahan berhasil disimpan' : 'Undangan berhasil diajukan')
        }
        setTimeout(() => {
          router.refresh()
          router.push('/admin/surat')
        }, 1500)
      } else {
        const err = await response.json()
        toast.error(err.error || 'Gagal menyimpan undangan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadTemplate = () => {
    const wsData = [
      { Nama: 'Bpk. Nama Contoh 1', Jabatan: 'Ketua DPRD Kota Serang', Tempat: 'Serang' },
      { Nama: 'Ibu. Nama Contoh 2', Jabatan: 'Kepala Dinas Pendidikan', Tempat: 'Tempat' },
      { Nama: 'H. Nama Contoh 3', Jabatan: 'Pimpinan Perusahaan X', Tempat: 'Jakarta' },
    ]
    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Penerima Undangan")
    XLSX.writeFile(wb, "Template_Penerima_Undangan.xlsx")
    toast.info('Template Excel berhasil diunduh')
  }

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const rawData = XLSX.utils.sheet_to_json(ws) as any[]
        
        const recipients = rawData.map((row) => ({
          nama: row['Nama'] || row['nama'] || '',
          jabatan: row['Jabatan'] || row['Komisi'] || row['jabatan'] || row['komisi'] || '',
          tempat: row['Tempat'] || row['Alamat'] || row['tempat'] || row['alamat'] || ''
        })).filter(r => r.nama)

        if (recipients.length > 0) {
          setBulkRecipients(recipients)
          setCurrentRecipientIndex(0)
          toast.success(`Berhasil memuat ${recipients.length} penerima`)
        } else {
          toast.error('Gagal memuat data: format kolom "Nama", "Jabatan", atau "Tempat" tidak ditemukan')
        }
      }
      reader.readAsBinaryString(file)
    }
  }

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

  useEffect(() => {
    if (bulkRecipients.length > 0 && bulkRecipients[currentRecipientIndex]) {
      const recipient = bulkRecipients[currentRecipientIndex]
      setData(prev => ({
        ...prev,
        penerima: {
          ...prev.penerima,
          nama: recipient.nama,
          jabatan: recipient.jabatan,
          tempat: recipient.tempat
        }
      }))
    }
  }, [currentRecipientIndex, bulkRecipients])

  const handleBulkGenerate = async () => {
    if (bulkRecipients.length === 0) return
    const originalPenerima = { ...data.penerima }
    
    setIsBulkProcessing(true)
    const zip = new JSZip()
    const folder = zip.folder(`Undangan_${data.perihal.replace(/\s+/g, '_')}_Bulk`)

    try {
      toast.info('Memulai proses generate massal. Mohon tunggu...')
      await document.fonts.ready

      for (let i = 0; i < bulkRecipients.length; i++) {
        const recipient = bulkRecipients[i]
        
        // Update data for current recipient to reflect in preview
        setData(prev => ({
          ...prev,
          penerima: {
            ...prev.penerima,
            nama: recipient.nama,
            jabatan: recipient.jabatan,
            tempat: recipient.tempat
          }
        }))

        // Wait for React to re-render
        await new Promise(r => setTimeout(r, 600))

        if (!previewRef.current) continue
        const targetSelector = showEnvelope ? '.amplop-page' : '.undangan-page'
        const page = previewRef.current.querySelector(targetSelector) as HTMLElement
        if (!page) continue

        const canvas = await html2canvas(page, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: showEnvelope ? 870 : 794,
          windowHeight: showEnvelope ? 416 : 1123,
          onclone: (clonedDoc) => {
            const existingStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
            existingStyles.forEach(s => s.remove())
            const style = clonedDoc.createElement('style')
            
            if (showEnvelope) {
               style.innerHTML = `
                 @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
                 * { font-family: 'Crimson Pro', serif !important; color: #000 !important; }
                 .amplop-page { 
                   width: 230mm !important; 
                   height: 110mm !important; 
                   padding: 10mm !important; 
                   background: white !important;
                   position: relative !important;
                   margin: 0 !important;
                   transform: none !important;
                 }
                 /* Bulk Envelope Styles - Matches Single Generate */
                 .kop-wrapper { 
                     position: relative !important; 
                     margin-bottom: 2mm !important; 
                     width: 100% !important; 
                     min-height: 22mm !important; 
                     display: flex !important;
                     align-items: center !important;
                     justify-content: center !important;
                 }
                 .kop-logo-kiri { 
                     position: absolute !important; 
                     left: 5mm !important; 
                     top: 0 !important; 
                     width: 20mm !important; 
                     height: 20mm !important; 
                     object-fit: contain !important; 
                 }
                 .kop-logo-kanan { 
                     position: absolute !important; 
                     right: 5mm !important; 
                     top: 0 !important; 
                     width: 20mm !important; 
                     height: 20mm !important; 
                     object-fit: contain !important; 
                 }
                 
                 .kop-text { 
                     text-align: center !important; 
                     padding: 0 28mm !important;
                     width: 100% !important;
                 }
                 .kop-text-org { font-size: 14pt !important; font-weight: bold !important; text-transform: uppercase !important; margin-bottom: 2px !important; line-height: 1.1 !important; }
                 .kop-text-addr { font-size: 9pt !important; line-height: 1.2 !important; }
                 .kop-text-contact { font-size: 8pt !important; font-style: italic !important; margin-top: 2px !important; }
                 
                 .divider-line-container { width: 100% !important; margin: 4mm 0 8mm 0 !important; }
                 .line-thick { border-top: 3px solid black !important; margin-bottom: 1px !important; }
                 .line-thin { border-top: 1px solid black !important; }
    
                 .amplop-recipient-box {
                    margin-left: 110mm !important;
                    margin-top: 2mm !important;
                    padding: 4mm !important;
                    font-size: 13pt !important;
                 }
                 .amplop-number {
                    position: absolute !important;
                    bottom: 12mm !important;
                    left: 12mm !important;
                    font-size: 10pt !important;
                 }
               `
            } else {
               style.innerHTML = `
                 @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
                 * { font-family: 'Crimson Pro', serif !important; color: #000 !important; }
                 .undangan-page { 
                   width: 210mm !important; 
                   min-height: 297mm !important; 
                   padding: 20mm 25mm !important; 
                   background: white !important;
                   line-height: 1.5 !important;
                   font-size: 12pt !important;
                   transform: none !important;
                   margin: 0 !important;
                 }
                 .kop-wrapper { position: relative !important; margin-bottom: 2mm !important; width: 100% !important; min-height: 20mm !important; }
                 .kop-logo-kiri { position: absolute !important; left: 0 !important; top: 0 !important; bottom: 0 !important; margin: auto !important; width: 20mm !important; height: 20mm !important; object-fit: contain !important; }
                 .kop-logo-kanan { position: absolute !important; right: 0 !important; top: 0 !important; bottom: 0 !important; margin: auto !important; width: 20mm !important; height: 20mm !important; object-fit: contain !important; }
                 .kop-text { padding: 0 20mm !important; text-align: center !important; }
                 .kop-text-org { font-size: 13pt !important; font-weight: bold !important; white-space: nowrap !important; margin-bottom: 2px !important; text-transform: uppercase !important; }
                 .kop-text-addr { font-size: 11pt !important; line-height: 1.2 !important; }
                 .kop-text-contact { font-size: 8pt !important; font-style: italic !important; margin-top: 2px !important; }
                 .divider-line-container { width: 100% !important; margin-bottom: 8mm !important; margin-top: 2mm !important; }
                 .line-thick { border-top: 3px solid black !important; margin-bottom: 1px !important; }
                 .line-thin { border-top: 1px solid black !important; }
                 
                 /* Content Specifics */
                 .surat-header-info { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; margin-bottom: 8mm !important; font-size: 12pt !important; }
                 .surat-to { margin-bottom: 8mm !important; font-size: 12pt !important; }
                 .surat-body { margin-bottom: 6mm !important; font-size: 12pt !important; text-align: justify !important; line-height: 1.5 !important; }
                 .surat-closing { margin-bottom: 10mm !important; font-size: 12pt !important; text-align: justify !important; line-height: 1.5 !important; }
                 .surat-signature { margin-top: 15mm !important; font-size: 12pt !important; }
               `
            }
            clonedDoc.head.appendChild(style)
          }
        })

        const doc = showEnvelope ? new jsPDF('l', 'mm', 'dl') : new jsPDF('p', 'mm', 'a4')
        const imgData = canvas.toDataURL('image/jpeg', 0.9)
        doc.addImage(imgData, 'JPEG', 0, 0, showEnvelope ? 220 : 210, showEnvelope ? 110 : 297, undefined, 'FAST')
        
        const blob = doc.output('blob')
        // Rename file if envelope
        const prefix = showEnvelope ? 'Amplop' : 'Undangan'
        folder?.file(`${prefix}_${i + 1}_${recipient.nama.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob)
      }

      const zipContent = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipContent)
      link.download = `Undangan_Massal_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Berhasil mengunduh bulk undangan!')
    } catch (e) {
      console.error(e)
      toast.error('Gagal generate bulk')
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
      await document.fonts.ready
      const doc = new jsPDF('p', 'mm', 'a4')
      const pages = previewRef.current.querySelectorAll('.undangan-page')
      
      await new Promise(r => setTimeout(r, 700))

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        const canvas = await html2canvas(page, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDoc) => {
            const existingStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
            existingStyles.forEach(s => s.remove())

            const style = clonedDoc.createElement('style')
            style.innerHTML = `
              @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
              
              * {
                font-family: 'Crimson Pro', 'Times New Roman', serif !important;
                -webkit-font-smoothing: antialiased !important;
                color: #000000 !important;
              }

              .undangan-page {
                width: 210mm !important;
                min-height: 297mm !important;
                padding: 20mm 25mm !important;
                background: white !important;
                line-height: 1.5 !important;
                font-size: 12pt !important;
                transform: none !important;
                margin: 0 !important;
              }

              .kop-wrapper {
                position: relative !important;
                margin-bottom: 2mm !important;
                width: 100% !important;
                min-height: 20mm !important;
              }

              .kop-logo-kiri {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                bottom: 0 !important;
                margin: auto !important;
                width: 20mm !important;
                height: 20mm !important;
                object-fit: contain !important;
              }

              .kop-logo-kanan {
                position: absolute !important;
                right: 0 !important;
                top: 0 !important;
                bottom: 0 !important;
                margin: auto !important;
                width: 20mm !important;
                height: 20mm !important;
                object-fit: contain !important;
              }

              .kop-text {
                text-align: center !important;
                padding: 0 20mm !important;
              }
              .kop-text-org { font-size: 13pt !important; font-weight: bold !important; white-space: nowrap !important; margin-bottom: 2px !important; text-transform: uppercase !important; }
              .kop-text-addr { font-size: 11pt !important; line-height: 1.2 !important; }
              .kop-text-contact { font-size: 8pt !important; font-style: italic !important; margin-top: 2px !important; }

              .divider-line-container { width: 100% !important; margin-bottom: 8mm !important; margin-top: 2mm !important; }
              .line-thick { border-top: 3px solid black !important; margin-bottom: 1px !important; }
              .line-thin { border-top: 1px solid black !important; }
              
              .surat-header-info { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; margin-bottom: 8mm !important; font-size: 12pt !important; }
              .surat-to { margin-bottom: 8mm !important; font-size: 12pt !important; }
              .surat-body { margin-bottom: 6mm !important; font-size: 12pt !important; text-align: justify !important; line-height: 1.5 !important; }
              .surat-closing { margin-bottom: 10mm !important; font-size: 12pt !important; text-align: justify !important; line-height: 1.5 !important; }
              .surat-signature { margin-top: 15mm !important; font-size: 12pt !important; }
            `
            clonedDoc.head.appendChild(style)

            const allElements = clonedDoc.getElementsByTagName('*');
            for (let k = 0; k < allElements.length; k++) {
                const el = allElements[k] as HTMLElement;
                if (el.getAttribute('style')?.includes('oklch')) {
                    el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#000000');
                }
            }
          }
        })
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        if (i > 0) doc.addPage()
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
      }

      doc.save(`Undangan_${data.perihal.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`)
      toast.success('PDF berhasil diunduh!')
    } catch (e) {
      console.error(e)
      toast.error('Gagal generate PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const generateEnvelopePDF = async () => {
    if (!previewRef.current) return
    setIsGeneratingPDF(true)
    toast.info('Menyiapkan PDF Amplop...')

    try {
      await document.fonts.ready
      // Use custom size: 230mm x 110mm
      const doc = new jsPDF('l', 'mm', [230, 110]) 
      const envelopeElement = previewRef.current.querySelector('.amplop-page') as HTMLElement
      
      if (!envelopeElement) {
        throw new Error('Envelope element not found')
      }

      await new Promise(r => setTimeout(r, 500))

      const canvas = await html2canvas(envelopeElement, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 870, // approx 230mm in pixels
        windowHeight: 416, 
        onclone: (clonedDoc) => {
           const existingStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
           existingStyles.forEach(s => s.remove())
           
           const style = clonedDoc.createElement('style')
           style.innerHTML = `
             @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
             * { font-family: 'Crimson Pro', serif !important; color: #000 !important; }
             .amplop-page { 
               width: 230mm !important; 
               height: 110mm !important; 
               padding: 10mm !important; 
               background: white !important;
               position: relative !important;
               margin: 0 !important;
               transform: none !important;
             }
             /* Kop Surat Amplop - Adjusted for size and nice fit */
             .kop-wrapper { 
                 position: relative !important; 
                 margin-bottom: 2mm !important; 
                 width: 100% !important; 
                 min-height: 22mm !important; /* Increased height */
                 display: flex !important;
                 align-items: center !important;
                 justify-content: center !important;
             }
             .kop-logo-kiri { 
                 position: absolute !important; 
                 left: 5mm !important; /* Adjusted margin */
                 top: 0 !important; 
                 width: 20mm !important; /* Enlarged */
                 height: 20mm !important; 
                 object-fit: contain !important; 
             }
             .kop-logo-kanan { 
                 position: absolute !important; 
                 right: 5mm !important; /* Adjusted margin */
                 top: 0 !important; 
                 width: 20mm !important; /* Enlarged */
                 height: 20mm !important; 
                 object-fit: contain !important; 
             }
             
             .kop-text { 
                 text-align: center !important; 
                 padding: 0 28mm !important; /* Increased padding to clear larger logos */
                 width: 100% !important;
             }
             .kop-text-org { 
                 font-size: 14pt !important; /* Enlarged */
                 font-weight: bold !important; 
                 text-transform: uppercase !important; 
                 margin-bottom: 2px !important; 
                 line-height: 1.1 !important;
             }
             .kop-text-addr { 
                 font-size: 9pt !important; /* Enlarged */
                 line-height: 1.2 !important; 
             }
             .kop-text-contact { 
                 font-size: 8pt !important; /* Enlarged */
                 font-style: italic !important; 
                 margin-top: 2px !important; 
             }
             
             .divider-line-container { width: 100% !important; margin: 4mm 0 8mm 0 !important; }
             .line-thick { border-top: 3px solid black !important; margin-bottom: 1px !important; }
             .line-thin { border-top: 1px solid black !important; }

             .amplop-recipient-box {
                margin-left: 110mm !important; /* Adjusted for wider envelope */
                margin-top: 2mm !important;
                padding: 4mm !important;
                font-size: 13pt !important; /* Slightly larger text */
             }
             .amplop-number {
                position: absolute !important;
                bottom: 12mm !important;
                left: 12mm !important;
                font-size: 10pt !important;
             }
           `
           clonedDoc.head.appendChild(style)
        }
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      doc.addImage(imgData, 'JPEG', 0, 0, 230, 110, undefined, 'FAST')
      doc.save(`Amplop_${data.perihal.replace(/\s+/g, '_')}.pdf`)
      toast.success('PDF Amplop berhasil diunduh')

    } catch (e) {
      console.error(e)
      toast.error('Gagal generate Amplop. Pastikan mode "Cetak Amplop" aktif.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleStatusChange = async (newStatus: 'VALIDASI' | 'DITOLAK', catatan?: string) => {
    setIsSaving(true)
    try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/surat/keluar/${undanganId}`, {
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
            setUndanganStatus(newStatus)
            if (catatan) setRejectionReason(catatan)
            toast.success(newStatus === 'VALIDASI' ? 'Undangan berhasil disetujui' : 'Undangan berhasil ditolak')
            setIsRejectDialogOpen(false)
            router.refresh()
        } else {
            const err = await response.json()
            toast.error(err.error || 'Gagal mengubah status undangan')
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
      return undanganStatus === 'VALIDASI'
  }

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data undangan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-2.5 sm:p-6">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between px-4 sm:px-0 pt-4 sm:pt-0">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/surat')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {undanganId ? 'Edit Surat Undangan' : 'Buat Surat Undangan Baru'}
              </h1>
              <p className="text-gray-600 mt-1">
                Buat surat undangan resmi untuk acara Padepokan
              </p>
            </div>
          </div>
        </div>

        <div className={isViewMode ? "" : "flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 pb-20"}>
          {/* Form Section */}
          {!isViewMode && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-700">
            {/* Kop Surat */}
            <Card className="shadow-xs border-emerald-100/50 hover:shadow-md transition-shadow duration-300 rounded-xl border">
              <CardHeader className="bg-linear-to-r from-emerald-50 to-white border-b border-emerald-100/50 pb-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Kop Surat</CardTitle>
                    <p className="text-xs text-emerald-600 font-normal mt-0.5">Identitas organisasi pengirim undangan</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Nama Organisasi</Label>
                      <Input
                        value={data.namaKopSurat}
                        onChange={(e) => setData(prev => ({ ...prev, namaKopSurat: e.target.value }))}
                        disabled={isViewMode}
                        className="mt-1.5 border-emerald-100 focus:ring-emerald-200"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Kontak</Label>
                      <Input
                        value={data.kontakKopSurat}
                        onChange={(e) => setData(prev => ({ ...prev, kontakKopSurat: e.target.value }))}
                        disabled={isViewMode}
                        className="mt-1.5 border-emerald-100 focus:ring-emerald-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Alamat Lengkap</Label>
                    <Textarea
                      value={data.alamatKopSurat}
                      onChange={(e) => setData(prev => ({ ...prev, alamatKopSurat: e.target.value }))}
                      rows={5}
                      disabled={isViewMode}
                      className="mt-1.5 border-emerald-100 focus:ring-emerald-200 resize-none"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5 pt-2">
                  <div className="p-4 rounded-xl border-2 border-dashed border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-center group">
                    <Label className="block mb-2 text-gray-500 cursor-pointer group-hover:text-emerald-600">Logo Kiri</Label>
                    <div className="flex justify-center">
                    {data.logoKiri ? (
                       <img src={data.logoKiri} className="h-12 w-12 object-contain mb-2" alt="Logo Kiri"/>
                    ) : (
                      <Upload className="h-8 w-8 text-emerald-200 mb-2 group-hover:text-emerald-400" />
                    )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'logoKiri')}
                      disabled={isViewMode}
                      className="text-xs file:bg-emerald-100 file:text-emerald-700 file:border-0 file:rounded-full file:px-2 file:py-0.5 file:mr-2 hover:file:bg-emerald-200"
                    />
                  </div>
                  <div className="p-4 rounded-xl border-2 border-dashed border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-center group">
                    <Label className="block mb-2 text-gray-500 cursor-pointer group-hover:text-emerald-600">Logo Kanan</Label>
                    <div className="flex justify-center">
                    {data.logoKanan ? (
                       <img src={data.logoKanan} className="h-12 w-12 object-contain mb-2" alt="Logo Kanan"/>
                    ) : (
                      <Upload className="h-8 w-8 text-emerald-200 mb-2 group-hover:text-emerald-400" />
                    )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'logoKanan')}
                      disabled={isViewMode}
                      className="text-xs file:bg-emerald-100 file:text-emerald-700 file:border-0 file:rounded-full file:px-2 file:py-0.5 file:mr-2 hover:file:bg-emerald-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informasi Surat */}
            <Card className="shadow-xs border-blue-100/50 hover:shadow-md transition-shadow duration-300 rounded-xl border">
              <CardHeader className="bg-linear-to-r from-blue-50 to-white border-b border-blue-100/50 pb-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Informasi Surat</CardTitle>
                    <p className="text-xs text-blue-600 font-normal mt-0.5">Detail nomor dan perihal undangan</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Nomor Surat</Label>
                    <Input
                      value={data.nomor}
                      onChange={(e) => setData(prev => ({ ...prev, nomor: e.target.value }))}
                      placeholder="001/PSPRG-52/26"
                      disabled={isViewMode}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Perihal</Label>
                    <Input
                      value={data.perihal}
                      onChange={(e) => setData(prev => ({ ...prev, perihal: e.target.value }))}
                      placeholder="Undangan Rapat Koordinasi"
                      disabled={isViewMode}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Tempat Pembuatan</Label>
                    <Input
                      value={data.tempat}
                      onChange={(e) => setData(prev => ({ ...prev, tempat: e.target.value }))}
                      placeholder="Argawana"
                      disabled={isViewMode}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Tanggal Surat</Label>
                    <Input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      placeholder="05 Januari 2026"
                      disabled={isViewMode}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Penerima */}
            <Card className="shadow-xs border-purple-100/50 hover:shadow-md transition-shadow duration-300 rounded-xl border">
              <CardHeader className="bg-linear-to-r from-purple-50 to-white border-b border-purple-100/50 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 sm:space-y-0">
                <div className="flex items-center gap-2 text-purple-800">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Penerima</CardTitle>
                    <p className="text-xs text-purple-600 font-normal mt-0.5">Tujuan surat undangan</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    id="excel-upload"
                    onChange={handleExcelUpload}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-slate-500 hover:text-slate-900"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => document.getElementById('excel-upload')?.click()}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Upload Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                {/* Bulk Recipients Content Skipped for brevity, contained inside */}
                {bulkRecipients.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full -translate-y-12 translate-x-12 opacity-50 blur-xl"></div>
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Penerima Massal ({currentRecipientIndex + 1} / {bulkRecipients.length})
                      </span>
                      <div className="flex gap-1 bg-white rounded-lg shadow-xs p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md hover:bg-purple-100"
                          onClick={handlePreviousRecipient}
                          disabled={currentRecipientIndex === 0}
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md hover:bg-purple-100"
                          onClick={handleNextRecipient}
                          disabled={currentRecipientIndex === bulkRecipients.length - 1}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-purple-900 truncate relative z-10">
                      {bulkRecipients[currentRecipientIndex].nama}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Kepada Yth.</Label>
                    <Input
                      value={data.penerima.nama}
                      onChange={(e) => setData(prev => ({ 
                        ...prev, 
                        penerima: { ...prev.penerima, nama: e.target.value }
                      }))}
                      placeholder="Contoh: Bpk. H. Fulan"
                      disabled={isViewMode}
                      className="mt-1.5 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Jabatan / Komisi</Label>
                      <Input
                        value={data.penerima.jabatan}
                        onChange={(e) => setData(prev => ({ 
                          ...prev, 
                          penerima: { ...prev.penerima, jabatan: e.target.value }
                        }))}
                        placeholder="Jabatan (Opsional)"
                        disabled={isViewMode}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Di (Tempat)</Label>
                      <Input
                        value={data.penerima.tempat}
                        onChange={(e) => setData(prev => ({ 
                          ...prev, 
                          penerima: { ...prev.penerima, tempat: e.target.value }
                        }))}
                        placeholder="Tempat"
                        disabled={isViewMode}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Isi Undangan */}
            <Card className="shadow-xs border-orange-100/50 hover:shadow-md transition-shadow duration-300 rounded-xl border">
              <CardHeader className="bg-linear-to-r from-orange-50 to-white border-b border-orange-100/50 pb-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Feather className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Konten</CardTitle>
                    <p className="text-xs text-orange-600 font-normal mt-0.5">Isi utama surat dan detail acara</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Pembuka</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => handleAIGenerate('pembuka')}
                      disabled={!!generatingField || isViewMode}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {generatingField === 'pembuka' ? 'Generating...' : 'Generate AI'}
                    </Button>
                  </div>
                  <Textarea
                    value={data.textPembuka}
                    onChange={(e) => setData(prev => ({ ...prev, textPembuka: e.target.value }))}
                    rows={4}
                    disabled={isViewMode}
                    className="border-orange-100 focus:ring-orange-200 resize-none font-serif text-sm leading-relaxed"
                  />
                </div>

                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                  <h4 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Detail Acara
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-xs">Hari</Label>
                      <Input
                        value={data.acara.hari}
                        onChange={(e) => setData(prev => ({ 
                          ...prev, 
                          acara: { ...prev.acara, hari: e.target.value }
                        }))}
                        placeholder="Senin"
                        disabled={isViewMode}
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Tanggal</Label>
                      <Input
                        value={data.acara.tanggal}
                        onChange={(e) => setData(prev => ({ 
                          ...prev, 
                          acara: { ...prev.acara, tanggal: e.target.value }
                        }))}
                        placeholder="10 Januari 2026"
                        disabled={isViewMode}
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-gray-500 text-xs">Tempat</Label>
                      <Input
                        value={data.acara.tempat}
                        onChange={(e) => setData(prev => ({ 
                          ...prev, 
                          acara: { ...prev.acara, tempat: e.target.value }
                        }))}
                        placeholder="Lokasi Acara"
                        disabled={isViewMode}
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Penutup</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => handleAIGenerate('penutup')}
                      disabled={!!generatingField || isViewMode}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {generatingField === 'penutup' ? 'Generating...' : 'Generate AI'}
                    </Button>
                  </div>
                  <Textarea
                    value={data.textPenutup}
                    onChange={(e) => setData(prev => ({ ...prev, textPenutup: e.target.value }))}
                    rows={4}
                    disabled={isViewMode}
                    className="border-orange-100 focus:ring-orange-200 resize-none font-serif text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Penandatangan */}
            <Card className="shadow-xs border-teal-100/50 hover:shadow-md transition-shadow duration-300 rounded-xl border">
              <CardHeader className="bg-linear-to-r from-teal-50 to-white border-b border-teal-100/50 pb-4">
                <div className="flex items-center gap-2 text-teal-800">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Tanda Tangan</CardTitle>
                    <p className="text-xs text-teal-600 font-normal mt-0.5">Pejabat yang bertanggung jawab</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Ketua Padepokan</Label>
                    <Input
                      value={data.namaKetua}
                      onChange={(e) => setData(prev => ({ ...prev, namaKetua: e.target.value }))}
                      placeholder="Nama Ketua Padepokan"
                      disabled={isViewMode}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Sekretaris</Label>
                    <Input
                      value={data.namaSekretaris}
                      onChange={(e) => setData(prev => ({ ...prev, namaSekretaris: e.target.value }))}
                      placeholder="Nama Sekretaris"
                      disabled={isViewMode}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Guru Besar (Mengetahui)</Label>
                    <Input
                      value={data.namaGuruBesar}
                      onChange={(e) => setData(prev => ({ ...prev, namaGuruBesar: e.target.value }))}
                      placeholder="Nama Guru Besar"
                      disabled={isViewMode}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button moved to bottom */}
            {!isViewMode && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSaving ? (
                   <span className="flex items-center justify-center">
                       <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                       Memproses...
                   </span>
                ) : (
                   <span className="flex items-center justify-center">
                       <Save className="w-5 h-5 mr-3" />
                       {undanganStatus === 'DITOLAK' ? 'Ajukan Ulang' : (undanganId ? 'Simpan Perubahan' : 'Simpan & Ajukan')}
                   </span>
                )}
              </Button>
            )}
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
                        undanganStatus === 'VALIDASI' ? 'bg-emerald-500 text-white' : 
                        undanganStatus === 'DITOLAK' ? 'bg-rose-500 text-white' : 
                        'bg-amber-100 text-amber-700'
                    }`}>
                        {undanganStatus === 'VALIDASI' ? 'DISETUJUI' : 
                         undanganStatus === 'DITOLAK' ? 'DITOLAK' : 
                         'MENUNGGU REVIEW'}
                    </Badge>
                </div>
              </div>
              
              <Card className={isViewMode ? 'shadow-2xl border-none overflow-hidden rounded-[2.5rem]' : 'border-none shadow-none bg-transparent'}>
                <CardContent className={isViewMode ? 'p-6' : 'p-0'}>
                  
                  {/* Action Bar */}
                  <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                     <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button 
                            onClick={showEnvelope ? generateEnvelopePDF : generatePDF} 
                            disabled={!isDownloadActive()}
                            className={`flex-1 md:flex-none rounded-xl font-bold ${!isDownloadActive() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            variant={isDownloadActive() ? "default" : "secondary"}
                        >
                            <Download className="mr-2 h-4 w-4" /> {showEnvelope ? "Unduh Amplop" : "Unduh PDF"}
                        </Button>
                        
                        {bulkRecipients.length > 0 && (
                            <Button 
                                onClick={handleBulkGenerate} 
                                disabled={!isDownloadActive() || isBulkProcessing}
                                className={`flex-1 md:flex-none rounded-xl font-bold bg-[#5E17EB] text-white hover:bg-[#4a11c0] ${!isDownloadActive() ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                     <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Button
                            onClick={() => setShowEnvelope(!showEnvelope)}
                            variant="secondary"
                            className="flex-1 md:flex-none rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                            <Printer className="mr-2 h-4 w-4" /> {showEnvelope ? "Lihat Surat" : "Cetak Amplop"}
                        </Button>

                        {/* Admin / Ketua Actions */}
                        {(currentUserRole === 'MASTER_ADMIN' || currentUserRole === 'KETUA') && undanganId && (
                             <div className="flex items-center gap-2">
                            {undanganStatus !== 'VALIDASI' && (
                                <Button 
                                    onClick={() => handleStatusChange('VALIDASI')}
                                    className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold"
                                    disabled={isSaving}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Terima Undangan
                                </Button>
                            )}
                            
                            {undanganStatus !== 'DITOLAK' && (
                                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                    <Button 
                                        variant="destructive"
                                        className="flex-1 md:flex-none rounded-xl font-bold bg-rose-500 hover:bg-rose-600"
                                        disabled={isSaving}
                                        onClick={() => setIsRejectDialogOpen(true)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Tolak
                                    </Button>
                                    <DialogContent className="rounded-3xl z-[9999]">
                                        <DialogHeader>
                                            <DialogTitle>Tolak Undangan?</DialogTitle>
                                            <DialogDescription>
                                                Berikan alasan penolakan atau catatan revisi.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                             <div className="space-y-2">
                                                <Label>Catatan Revisi</Label>
                                                <Textarea 
                                                    value={tempRejectionReason}
                                                    onChange={(e) => setTempRejectionReason(e.target.value)}
                                                    placeholder="Contoh: Perbaiki tanggal acara..."
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
                  </div>

                  {/* Rejection Notice */}
                  {undanganStatus === 'DITOLAK' && rejectionReason && !['MASTER_ADMIN', 'KETUA'].includes(currentUserRole || '') && (
                      <div className="mb-6 bg-rose-50 border border-rose-100 rounded-3xl p-6 animate-in slide-in-from-top-2">
                          <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                  <AlertCircle className="h-5 w-5 text-rose-600" />
                              </div>
                              <div className="space-y-1">
                                  <h4 className="font-bold text-rose-700 text-lg">Perlu Revisi</h4>
                                  <p className="text-rose-600/80 leading-relaxed">
                                      {rejectionReason}
                                  </p>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="bg-[#DFE3ED] p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-[3.5rem] shadow-2xl h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] overflow-y-auto space-y-8 sm:space-y-12 flex flex-col items-center custom-scrollbar">
                    <div 
                      ref={previewRef}
                      className="undangan-content flex flex-col gap-6 sm:gap-8 scale-[0.45] origin-top sm:scale-[0.6] md:scale-[0.65] lg:scale-[0.68] xl:scale-[0.75]"
                    >
                      {showEnvelope ? (
                        <div className="amplop-page bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm shrink-0 mx-auto" style={{
                            width: '230mm',
                            height: '110mm',
                            padding: '10mm',
                            fontFamily: "'Crimson Pro', 'Times New Roman', serif",
                            color: '#000',
                            backgroundColor: 'white',
                            position: 'relative'
                        }}>
                             {/* Kop Surat Amplop - Adjusted for size and nice fit */}
                             <div className="kop-wrapper" style={{ 
                                 position: 'relative', 
                                 marginBottom: '2mm', 
                                 width: '100%', 
                                 minHeight: '22mm', 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center' 
                            }}>
                              {data.logoKiri && (
                                <img src={data.logoKiri} alt="Logo Kiri" className="kop-logo-kiri" style={{ 
                                    position: 'absolute', 
                                    left: '5mm', 
                                    top: 0, 
                                    width: '25mm', 
                                    height: '25mm', 
                                    objectFit: 'contain' 
                                }} />
                              )}
                              <div className="kop-text" style={{ 
                                  textAlign: 'center', 
                                  padding: '0 28mm',
                                  width: '100%' 
                              }}>
                                <div className="kop-text-org" style={{ 
                                    fontSize: '14pt', 
                                    fontWeight: 'bold', 
                                    whiteSpace: 'nowrap', 
                                    marginBottom: '2px', 
                                    textTransform: 'uppercase',
                                    lineHeight: '1.1' 
                                }}>
                                  {data.namaKopSurat}
                                </div>
                                <div className="kop-text-addr" style={{ fontSize: '12pt', whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                                  {data.alamatKopSurat}
                                </div>
                                <div className="kop-text-contact" style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '2px' }}>
                                  {data.kontakKopSurat}
                                </div>
                              </div>
                              {data.logoKanan && (
                                <img src={data.logoKanan} alt="Logo Kanan" className="kop-logo-kanan" style={{ 
                                    position: 'absolute', 
                                       right: '5mm', 
                                    top: 0, 
                                    width: '20mm', 
                                    height: '20mm', 
                                    objectFit: 'contain' 
                                }} />
                              )}
                            </div>

                            {/* Divider */}
                            <div className="divider-line-container" style={{ width: '100%', marginBottom: '4mm', marginTop: '4mm' }}>
                              <div className="line-thick" style={{ borderTop: '3px solid black', marginBottom: '1px' }}></div>
                              <div className="line-thin" style={{ borderTop: '1px solid black' }}></div>
                            </div>
                            
                            {/* Recipient Box */}
                            <div className="amplop-recipient-box" style={{ 
                                marginLeft: '110mm', 
                                marginTop: '2mm', 
                                padding: '4mm',
                                fontSize: '13pt'
                            }}>
                                <div>Kepada Yth.</div>
                                <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '2px' }}>{data.penerima.nama}</div>
                                {data.penerima.jabatan && <div style={{ fontWeight: 'bold' }}>{data.penerima.jabatan}</div>}
                                <div style={{ marginTop: '2px' }}>di_</div>
                                <div style={{ marginLeft: '10px', fontWeight: 'bold' }}>{data.penerima.tempat}</div>
                            </div>

                            {/* Number (Optional) */}
                            <div className="amplop-number" style={{ position: 'absolute', bottom: '12mm', left: '12mm', fontSize: '10pt', color: '#333' }}>
                                No: {data.nomor}
                            </div>
                        </div>
                      ) : (
                        <div className="undangan-page bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm shrink-0 mx-auto" style={{
                          width: '794px',
                          minHeight: '1123px',
                          padding: '50px 80px',
                          fontFamily: "'Crimson Pro', 'Times New Roman', serif",
                          color: '#000',
                          lineHeight: '1.5',
                          fontSize: '12pt',
                          boxSizing: 'border-box',
                        }}>
                          {/* Kop Surat */}
                          <div className="kop-wrapper" style={{ position: 'relative', width: '100%', marginBottom: '2mm', minHeight: '20mm' }}>
                            {data.logoKiri && (
                              <img src={data.logoKiri} alt="Logo Kiri" className="kop-logo-kiri" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, margin: 'auto', width: '20mm', height: '20mm', objectFit: 'contain' }} />
                            )}
                            <div className="kop-text" style={{ textAlign: 'center', padding: '0 20mm' }}>
                              <div className="kop-text-org" style={{ fontSize: '13pt', fontWeight: 'bold', whiteSpace: 'nowrap', marginBottom: '2px', textTransform: 'uppercase' }}>
                                {data.namaKopSurat}
                              </div>
                              <div className="kop-text-addr" style={{ fontSize: '11pt', whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                                {data.alamatKopSurat}
                              </div>
                              <div className="kop-text-contact" style={{ fontSize: '8pt', fontStyle: 'italic', marginTop: '2px' }}>
                                {data.kontakKopSurat}
                              </div>
                            </div>
                            {data.logoKanan && (
                              <img src={data.logoKanan} alt="Logo Kanan" className="kop-logo-kanan" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, margin: 'auto', width: '20mm', height: '20mm', objectFit: 'contain' }} />
                            )}
                          </div>

                          {/* Divider */}
                          <div className="divider-line-container" style={{ width: '100%', marginBottom: '8mm', marginTop: '2mm' }}>
                            <div className="line-thick" style={{ borderTop: '3px solid black', marginBottom: '1px' }}></div>
                            <div className="line-thin" style={{ borderTop: '1px solid black' }}></div>
                          </div>

                          {/* Header Info - Two Column Layout */}
                          <div className="surat-header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm' }}>
                            {/* Left: Nomor & Perihal */}
                            <table style={{ width: 'auto' }}>
                              <tbody>
                                <tr>
                                  <td style={{ paddingRight: '10px', verticalAlign: 'top' }}>No</td>
                                  <td style={{ verticalAlign: 'top' }}>:</td>
                                  <td style={{ paddingLeft: '10px', verticalAlign: 'top' }}>{data.nomor}</td>
                                </tr>
                                <tr>
                                  <td style={{ paddingRight: '10px', verticalAlign: 'top' }}>Perihal</td>
                                  <td style={{ verticalAlign: 'top' }}>:</td>
                                  <td style={{ paddingLeft: '10px', verticalAlign: 'top', fontWeight: 'bold' }}>{data.perihal}</td>
                                </tr>
                              </tbody>
                            </table>
                            
                            {/* Right: Tanggal */}
                            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {data.tempat}, {data.tanggal}
                            </div>
                          </div>

                          {/* Penerima */}
                          <div className="surat-to" style={{ marginBottom: '8mm' }}>
                            <div>Kepada Yth.</div>
                            <div style={{ fontWeight: 'bold' }}>{data.penerima.nama}</div>
                            {data.penerima.jabatan && (
                              <div style={{ fontWeight: 'bold' }}>{data.penerima.jabatan}</div>
                            )}
                            <div>di_</div>
                            <div style={{ marginLeft: '20px' }}>{data.penerima.tempat}</div>
                          </div>

                          {/* Text Pembuka */}
                          <div className="surat-body" style={{ marginBottom: '6mm', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                            {data.textPembuka}
                          </div>

                          {/* Detail Acara */}
                          <div className="surat-body" style={{ marginBottom: '6mm', marginLeft: '20mm' }}>
                            <table style={{ width: 'auto' }}>
                              <tbody>
                                <tr>
                                  <td style={{ paddingRight: '20px', verticalAlign: 'top' }}>Hari</td>
                                  <td style={{ verticalAlign: 'top' }}>:</td>
                                  <td style={{ paddingLeft: '10px', verticalAlign: 'top' }}>{data.acara.hari}</td>
                                </tr>
                                <tr>
                                  <td style={{ paddingRight: '20px', verticalAlign: 'top' }}>Tanggal</td>
                                  <td style={{ verticalAlign: 'top' }}>:</td>
                                  <td style={{ paddingLeft: '10px', verticalAlign: 'top' }}>{data.acara.tanggal}</td>
                                </tr>
                                <tr>
                                  <td style={{ paddingRight: '20px', verticalAlign: 'top' }}>Tempat</td>
                                  <td style={{ verticalAlign: 'top' }}>:</td>
                                  <td style={{ paddingLeft: '10px', verticalAlign: 'top' }}>{data.acara.tempat}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Text Penutup */}
                          <div className="surat-closing" style={{ marginBottom: '10mm', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                            {data.textPenutup}
                          </div>

                          {/* Signature Section */}
                          <div className="surat-signature" style={{ marginTop: '15mm' }}>
                            {/* <div style={{ textAlign: 'right', marginBottom: '50px' }}>
                              {data.tempat}, {data.tanggal}
                            </div> */}
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                              <div style={{ textAlign: 'center', width: '45%' }}>
                                <div style={{ marginBottom: '25mm' }}>Ketua Padepokan</div>
                                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{data.namaKetua}</div>
                              </div>
                              <div style={{ textAlign: 'center', width: '45%' }}>
                                <div style={{ marginBottom: '25mm' }}>Sekretaris</div>
                                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{data.namaSekretaris}</div>
                              </div>
                            </div>
                            
                            <div style={{ textAlign: 'center', marginTop: '10mm', width: '100%'}}>
                              <div>Mengetahui,</div>
                              <div style={{ marginBottom: '25mm' }}>Guru Besar Padepokan</div>
                              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{data.namaGuruBesar}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
