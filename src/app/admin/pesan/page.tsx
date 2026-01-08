'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, Mail, MailOpen, Trash2, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function PesanPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/pesan')
      if (res.ok) {
        setMessages(await res.json())
      }
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat pesan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleOpenMessage = async (msg: Message) => {
    setSelectedMessage(msg)
    if (!msg.isRead) {
      // Mark as read
      try {
        await fetch('/api/admin/pesan', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: msg.id, isRead: true })
        })
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))
        // Trigger generic refresh if needed for layout badge (layout polls)
      } catch (e) {
        console.error('Failed to mark as read', e)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pesan ini?')) return
    try {
      const res = await fetch(`/api/admin/pesan?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id))
        setSelectedMessage(null)
        toast.success('Pesan dihapus')
      }
    } catch (e) {
      toast.error('Gagal menghapus pesan')
    }
  }

  const filteredMessages = messages.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-extrabold text-slate-900">Pesan Masuk</h1>
           <p className="text-slate-500 text-sm font-medium">Kelola pesan dari form kontak website.</p>
        </div>
        <div className="relative w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input 
             placeholder="Cari pesan..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-10 h-10 rounded-xl"
           />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
           {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4">
           {filteredMessages.length === 0 ? (
             <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <Mail className="h-10 w-10 text-slate-300 mx-auto mb-3" />
               <p className="text-slate-500 font-bold">Belum ada pesan masuk</p>
             </div>
           ) : (
             filteredMessages.map(msg => (
               <Card 
                  key={msg.id} 
                  className={`border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden group ${!msg.isRead ? 'bg-white ring-1 ring-[#5E17EB]/20' : 'bg-slate-50/50'}`}
                  onClick={() => handleOpenMessage(msg)}
               >
                 <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!msg.isRead ? 'bg-[#5E17EB]/10 text-[#5E17EB]' : 'bg-slate-200 text-slate-500'}`}>
                       {msg.isRead ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm ${!msg.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                             {msg.name} <span className="text-slate-400 font-normal ml-1">&lt;{msg.email}&gt;</span>
                          </h4>
                          <span className="text-xs text-slate-400 font-medium">
                             {new Date(msg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       <p className={`text-sm mb-1 ${!msg.isRead ? 'text-slate-800 font-bold' : 'text-slate-600'}`}>
                          {msg.subject || 'Tanpa Subjek'}
                       </p>
                       <p className="text-xs text-slate-500 line-clamp-1">
                          {msg.message}
                       </p>
                    </div>
                 </CardContent>
               </Card>
             ))
           )}
        </div>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
         <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden bg-white">
            {selectedMessage && (
               <>
                 <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                       <Badge variant={selectedMessage.isRead ? 'secondary' : 'default'} className="rounded-lg">
                          {selectedMessage.isRead ? 'Sudah Dibaca' : 'Baru'}
                       </Badge>
                       <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(selectedMessage.createdAt).toLocaleString('id-ID')}
                       </span>
                    </div>
                    <DialogTitle className="text-xl font-extrabold text-slate-900">
                       {selectedMessage.subject || 'Tanpa Subjek'}
                    </DialogTitle>
                    <DialogDescription className="font-medium text-slate-600 mt-1">
                       Dari: <span className="text-slate-900 font-bold">{selectedMessage.name}</span> ({selectedMessage.email})
                       {selectedMessage.phone && <span className="block mt-1">Telp: {selectedMessage.phone}</span>}
                    </DialogDescription>
                 </DialogHeader>
                 
                 <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">
                       {selectedMessage.message}
                    </p>
                 </div>

                 <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between sm:justify-between items-center">
                    <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(selectedMessage.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Hapus Pesan
                    </Button>
                    <Button onClick={() => setSelectedMessage(null)} className="bg-slate-900 text-white rounded-xl">
                        Tutup
                    </Button>
                 </DialogFooter>
               </>
            )}
         </DialogContent>
      </Dialog>
    </div>
  )
}
