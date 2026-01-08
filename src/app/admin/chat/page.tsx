'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Search, MessageSquare, ArrowLeft, Paperclip, X, File, Image as ImageIcon, Video, Music, FileText, Download, Users, Clock, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  messageType: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentSize?: number
  createdAt: string
  sender: User
  receiver: User
}

interface Conversation {
  user: User
  unreadCount: number
  lastMessage: {
    content: string
    createdAt: string
    isSentByMe: boolean
  } | null
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('recent')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      fetchConversations(user.id)
      fetchAllUsers()
    }
  }, [])

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(currentUser.id, selectedUser.id)
      const interval = setInterval(() => {
        fetchMessages(currentUser.id, selectedUser.id)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedUser, currentUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async (userId: string) => {
    try {
      const res = await fetch(`/api/chat?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/chat/users')
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMessages = async (userId: string, withUserId: string) => {
    try {
      const res = await fetch(`/api/chat?userId=${userId}&withUserId=${withUserId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('Upload failed')
    return await res.json()
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentUser || !selectedUser) return

    setUploading(true)
    try {
      let attachmentData: { url: string; name: string; size: number; type: string } | null = null

      if (selectedFile) {
        attachmentData = await uploadFile(selectedFile)
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: newMessage || (attachmentData ? attachmentData.name : ''),
          messageType: attachmentData ? attachmentData.type : 'text',
          attachmentUrl: attachmentData?.url,
          attachmentName: attachmentData?.name,
          attachmentSize: attachmentData?.size
        })
      })

      if (res.ok) {
        setNewMessage('')
        clearFile()
        fetchMessages(currentUser.id, selectedUser.id)
        fetchConversations(currentUser.id)
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan')
    } finally {
      setUploading(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
  }

  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser?.id && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || 
     u.email.toLowerCase().includes(search.toLowerCase()))
  )

  const recentUsers = conversations.map(c => c.user)
  const displayUsers = activeTab === 'recent' 
    ? (search ? filteredUsers : recentUsers)
    : filteredUsers

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Kemarin'
    } else if (days < 7) {
      return `${days} hari lalu`
    } else {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      case 'audio': return <Music className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MASTER_ADMIN': return 'from-violet-600 to-indigo-700'
      case 'KETUA': return 'from-red-600 to-rose-700'
      case 'SEKRETARIS': return 'from-blue-600 to-cyan-700'
      case 'BENDAHARA': return 'from-green-600 to-emerald-700'
      default: return 'from-gray-600 to-slate-700'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MASTER_ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'KETUA': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'SEKRETARIS': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      case 'BENDAHARA': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const renderMessage = (msg: Message) => {
    const isSent = msg.senderId === currentUser?.id

    if (msg.messageType === 'image' && msg.attachmentUrl) {
      return (
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden group">
            <img
              src={msg.attachmentUrl}
              alt={msg.attachmentName || 'Image'}
              className="w-full h-auto object-cover max-w-sm"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <a
                href={msg.attachmentUrl}
                download={msg.attachmentName}
                className="p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <Download className="h-5 w-5 text-slate-700" />
              </a>
            </div>
          </div>
          {msg.content && <p className="text-sm leading-relaxed mt-2">{msg.content}</p>}
        </div>
      )
    }

    if (msg.messageType !== 'text' && msg.attachmentUrl) {
      return (
        <div className="space-y-2">
          <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${isSent ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'}`}>
            <div className={`p-3 rounded-xl ${isSent ? 'bg-white/20' : 'bg-slate-100'}`}>
              {getFileIcon(msg.messageType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{msg.attachmentName}</p>
              <p className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-slate-500'}`}>
                {formatFileSize(msg.attachmentSize)}
              </p>
            </div>
            <a
              href={msg.attachmentUrl}
              download={msg.attachmentName}
              className={`p-2.5 rounded-xl ${isSent ? 'hover:bg-white/20' : 'hover:bg-slate-100'} transition-colors`}
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
          {msg.content && <p className="text-sm leading-relaxed mt-2">{msg.content}</p>}
        </div>
      )
    }

    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-[#5E17EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-lg">Memuat percakapan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-13rem)] md:h-[calc(100vh-12rem)] flex gap-4 md:gap-6 relative">
      {/* Sidebar - User List */}
      <Card className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-none shadow-2xl rounded-3xl flex-col overflow-hidden bg-white`}>
        <CardHeader className="pb-6 border-b border-slate-100 bg-white relative">
          <div className="relative z-10 text-center md:text-left">
            <CardTitle className="text-xl font-extrabold flex items-center justify-center md:justify-start gap-3 mb-6 text-slate-900">
              <div className="p-2 bg-[#4F46E5]/10 rounded-xl">
                <MessageSquare className="h-6 w-6 text-[#4F46E5]" />
              </div>
              Pesan
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Cari pengguna..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#5E17EB]/20 focus-visible:bg-white transition-all font-medium"
              />
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-2xl p-1.5 h-12">
              <TabsTrigger value="recent" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold text-sm">
                <Clock className="h-4 w-4 mr-2" />
                Terkini
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold text-sm">
                <Users className="h-4 w-4 mr-2" />
                Semua
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="flex-1 mt-0 h-0 min-h-0 flex flex-col">
            <ScrollArea className="flex-1 w-full overscroll-contain">
              <div className="p-4 space-y-2">
                {(search ? filteredUsers : recentUsers).length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-base font-bold text-slate-700 mb-1">Belum ada percakapan</p>
                    <p className="text-sm text-slate-500">Mulai chat dengan pengguna lain</p>
                  </div>
                ) : (
                  (search ? filteredUsers : recentUsers).map((user) => {
                    const conv = conversations.find(c => c.user.id === user.id)
                    const isSelected = selectedUser?.id === user.id
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#4338CA]/10 border-2 border-[#4338CA]/30 shadow-lg shadow-[#4338CA]/10' 
                            : 'hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-slate-100 shadow-sm relative">
                              <AvatarFallback className={`bg-gradient-to-br ${getRoleColor(user.role)} text-white font-bold text-lg`}>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {conv && conv.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] md:min-w-[22px] md:h-[22px] px-1.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center border-2 md:border-3 border-white shadow-lg">
                                {conv.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate mb-1">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate mb-2 font-medium">
                              {conv?.lastMessage ? (
                                <span className="flex items-center gap-1">
                                  {conv.lastMessage.isSentByMe && <CheckCheck className="h-3 w-3" />}
                                  {conv.lastMessage.content}
                                </span>
                              ) : 'Mulai percakapan...'}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge className={`${getRoleBadgeColor(user.role)} text-[10px] px-2 py-0.5 font-bold border`}>
                                {user.role}
                              </Badge>
                              {conv?.lastMessage && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="flex-1 mt-0 h-0 min-h-0 flex flex-col">
            <ScrollArea className="flex-1 w-full overscroll-contain">
              <div className="p-4 space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-base font-bold text-slate-700 mb-1">Pengguna tidak ditemukan</p>
                    <p className="text-sm text-slate-500">Coba cari dengan nama atau peran lain</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const conv = conversations.find(c => c.user.id === user.id)
                    const isSelected = selectedUser?.id === user.id
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#4338CA]/10 border-2 border-[#4338CA]/30 shadow-lg shadow-[#4338CA]/10' 
                            : 'hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-slate-100 shadow-sm relative">
                            <AvatarFallback className={`bg-gradient-to-br ${getRoleColor(user.role)} text-white font-bold text-lg`}>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate mb-1">{user.name}</p>
                            <Badge className={`${getRoleBadgeColor(user.role)} text-[10px] px-2 py-0.5 font-bold border`}>
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Chat Area */}
      <Card className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 border-none shadow-2xl rounded-3xl flex-col overflow-hidden bg-white`}>
        {selectedUser ? (
          <>
            <CardHeader className="border-b border-slate-100 py-3 md:pb-4 bg-white relative overflow-hidden">
              <div className="flex items-center gap-3 md:gap-4 relative z-10 px-2 md:px-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-xl hover:bg-slate-100"
                  onClick={() => setSelectedUser(null)}
                >
                  <ArrowLeft className="h-6 w-6 text-slate-600" />
                </Button>
                <div className="relative">
                  <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 border-slate-100 shadow-sm relative">
                    <AvatarFallback className={`bg-gradient-to-br ${getRoleColor(selectedUser.role)} text-white font-bold text-base md:text-lg`}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm md:text-lg truncate">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 md:mt-1.5">
                    <Badge className={`${getRoleBadgeColor(selectedUser.role)} text-[9px] md:text-[10px] px-2 py-0 md:py-0.5 font-bold border`}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 h-0 min-h-0 p-4 md:p-6 bg-gradient-to-b from-slate-50/50 to-white overscroll-contain">
              <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-16 md:py-24 text-slate-500">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#4338CA]/10 to-[#3730A3]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-[#4338CA]" />
                    </div>
                    <p className="font-bold text-lg md:text-xl text-slate-900 mb-2">Belum ada pesan</p>
                    <p className="text-xs md:text-sm text-slate-500">Mulai percakapan dengan mengirim pesan pertama</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isSent = msg.senderId === currentUser?.id
                    const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId
                    return (
                      <div key={msg.id} className={`flex gap-2 md:gap-3 ${isSent ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                        {!isSent && (
                          <div className="hidden sm:flex flex-col items-center gap-1">
                            {showAvatar ? (
                              <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white shadow-md">
                                <AvatarFallback className={`bg-gradient-to-br ${getRoleColor(msg.sender.role)} text-white font-bold text-xs md:text-sm`}>
                                  {msg.sender.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-8 w-8 md:h-10 md:w-10" />
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isSent ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl md:rounded-3xl px-3 md:px-5 py-2 md:py-3 shadow-md ${
                              isSent
                                ? 'bg-[#4338CA] text-white rounded-br-md'
                                : 'bg-white text-slate-900 border-2 border-slate-100 rounded-bl-md'
                            }`}
                          >
                            {renderMessage(msg)}
                          </div>
                          <div className={`flex items-center gap-2 px-2 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                            <p className="text-[9px] md:text-[10px] font-semibold text-slate-400">
                              {formatTime(msg.createdAt)}
                            </p>
                            {isSent && <CheckCheck className="h-3 w-3 text-slate-400" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 md:p-5 border-t border-slate-100 bg-white">
              {selectedFile && (
                <div className="mb-3 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 border-2 border-slate-200">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <File className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-bold text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-1">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile} className="shrink-0 hover:bg-rose-100 hover:text-rose-600 rounded-xl h-10 w-10">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2 md:gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 text-slate-500 hover:text-[#4338CA] hover:bg-[#4338CA]/10 rounded-xl h-12 w-12 md:h-14 md:w-14"
                  disabled={uploading}
                >
                  <Paperclip className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <Input
                  placeholder="Ketik pesan..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 h-12 md:h-14 rounded-xl border-2 border-slate-100 focus-visible:ring-[#4338CA]/20 focus-visible:border-[#4338CA] bg-slate-50 text-sm md:text-base font-medium px-4 md:px-5"
                  disabled={uploading}
                />
                <Button
                  onClick={sendMessage}
                  className="bg-[#4338CA] hover:bg-[#3730A3] h-12 w-12 md:h-14 md:px-8 rounded-xl md:rounded-2xl shadow-lg transition-all font-bold text-white shrink-0"
                  disabled={uploading || (!newMessage.trim() && !selectedFile)}
                >
                  {uploading ? (
                    <div className="h-5 w-5 md:h-6 md:w-6 border-2 md:border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
            <div className="text-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8">
                <div className="absolute inset-0 bg-[#4F46E5]/20 rounded-full blur-2xl" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-[#4F46E5]/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-[#4F46E5]" />
                </div>
              </div>
              <p className="font-extrabold text-xl md:text-2xl text-slate-900 mb-2 md:mb-3">Pilih Percakapan</p>
              <p className="text-sm md:text-base text-slate-500 font-medium px-4">Pilih pengguna dari daftar untuk memulai chat</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
