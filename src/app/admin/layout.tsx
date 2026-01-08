'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Mail, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  Package,
  Camera,
  Search,
  Bell,
  MessageSquare,
  ChevronRight,
  Home,
  Check,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }

  }, [router])

  // Notifications State
  const [counts, setCounts] = useState({ unreadMessages: 0, pendingSurat: 0, pendingLPJ: 0, unreadChatMessages: 0, totalNotifications: 0 })
  const [notifications, setNotifications] = useState<any[]>([])

  const fetchNotifications = async () => {
    try {
        const res = await fetch('/api/admin/notifications')
        if (res.ok) {
            const data = await res.json()
            if (data.counts) setCounts(data.counts)
            if (data.notifications) setNotifications(data.notifications)
        }
    } catch (e) {
        console.error(e)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
      try {
          const res = await fetch('/api/admin/notifications', { method: 'POST' })
          if (res.ok) {
              // Optimistic update: clear message notifications
              setNotifications(prev => prev.filter(n => n.type !== 'PESAN'))
              setCounts(prev => ({ 
                  ...prev, 
                  unreadMessages: 0,
                  totalNotifications: prev.unreadChatMessages
              }))
              // Refresh actual data
              fetchNotifications()
          }
      } catch (e) {
          console.error(e)
      }
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          // Placeholder for search functionality
          alert(`Searching for: ${(e.target as HTMLInputElement).value}`)
      }
  }

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS', 'BENDAHARA']
    },
    {
      title: 'Anggota',
      icon: Users,
      href: '/admin/anggota',
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS']
    },
    {
      title: 'Kegiatan',
      icon: Calendar,
      href: '/admin/kegiatan',
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS']
    },
    {
      title: 'Surat Menyurat',
      icon: Mail,
      href: '/admin/surat',
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS']
    },
    {
      title: 'Keuangan',
      icon: DollarSign,
      href: '/admin/keuangan',
      roles: ['MASTER_ADMIN', 'KETUA', 'BENDAHARA']
    },
    {
      title: 'Pesan Masuk',
        icon: MessageSquare,
        href: '/admin/pesan',
        roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS']
    },
    {
      title: 'LPJ',
      icon: FileText,
      href: '/admin/lpj',
      roles: ['MASTER_ADMIN', 'KETUA', 'BENDAHARA']
    },
    {
      title: 'Seksi',
      icon: Shield,
      href: '/admin/seksi',
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS']
    },
    {
      title: 'Peralatan',
      icon: Package,
      href: '/admin/peralatan',
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS']
    },
    {
      title: 'Kelola Konten',
      icon: Home,
      href: '/admin/home-content',
      roles: ['MASTER_ADMIN']
    },
    {
      title: 'Pengaturan',
      icon: Settings,
      href: '/admin/users',
      roles: ['MASTER_ADMIN', 'KETUA']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MASTER_ADMIN': return 'bg-purple-500/20 text-purple-200'
      case 'KETUA': return 'bg-rose-500/20 text-rose-200'
      case 'SEKRETARIS': return 'bg-cyan-500/20 text-cyan-200'
      case 'BENDAHARA': return 'bg-emerald-500/20 text-emerald-200'
      default: return 'bg-slate-500/20 text-slate-200'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E17EB] mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#F8F9FC] flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#5E17EB] shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Logo */}
        <div className="flex items-center justify-between h-24 px-8">
          <Link href="/admin/dashboard" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform overflow-hidden p-1">
              <img src="/padepokan-logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">Satria</h1>
              <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-semibold">Admin Portal</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <nav className="space-y-1.5">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center group px-4 py-3.5 rounded-2xl transition-all duration-200 relative
                    ${isActive 
                      ? 'bg-white text-[#5E17EB] shadow-lg scale-[1.02]' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 mr-3.5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-semibold text-[15px]">{item.title}</span>
                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#5E17EB]" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6">
          <div className="bg-white/10 rounded-3xl p-5 backdrop-blur-md border border-white/10">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-white font-bold text-sm truncate">{user.name}</p>
                <div className={`mt-1 px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full ${getRoleColor(user.role)}`}>
                  {user.role}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full bg-white text-[#5E17EB] hover:bg-white/90 font-bold rounded-xl h-11 shadow-md group"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Top bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center flex-1 mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-600 mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari sesuatu..." 
                className="pl-10 h-11 bg-slate-100 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-[#5E17EB]/20 text-sm"
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-500 hover:bg-slate-100 rounded-xl relative"
                >
                  <Bell className="h-5 w-5" />
                  {counts.totalNotifications > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96 p-0 rounded-3xl border-slate-100 shadow-xl" align="end">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
                      <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900">Notifikasi</h4>
                          {counts.totalNotifications > 0 && (
                              <Badge className="bg-rose-500 hover:bg-rose-600 border-none text-white rounded-lg px-2 py-0.5 text-xs">
                                  {counts.totalNotifications} Baru
                              </Badge>
                          )}
                      </div>
                  </div>
                  <ScrollArea className="max-h-[60vh]">
                      {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500">
                             <CheckCircle className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                             <p className="font-medium text-sm">Tidak ada notifikasi baru</p>
                             <p className="text-xs mt-1">Semua sistem aman terkendali</p>
                          </div>
                      ) : (
                          <div className="divide-y divide-slate-100">
                              {notifications.map((item) => (
                                  <div 
                                      key={`${item.type}-${item.id}`} 
                                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                      onClick={() => router.push(item.link)}
                                  >
                                      <div className="flex items-start gap-3">
                                          <div className={`
                                              w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                              ${item.type === 'SURAT' ? 'bg-amber-100 text-amber-600' : 
                                                item.type === 'LPJ' ? 'bg-purple-100 text-purple-600' : 
                                                'bg-blue-100 text-blue-600'}
                                          `}>
                                              {item.type === 'SURAT' && <Mail className="h-5 w-5" />}
                                              {item.type === 'LPJ' && <FileText className="h-5 w-5" />}
                                              {item.type === 'PESAN' && <MessageSquare className="h-5 w-5" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <p className="text-sm font-bold text-slate-800 group-hover:text-[#5E17EB] transition-colors">{item.title}</p>
                                              <p className="text-xs text-slate-500 font-medium mb-1 line-clamp-2">{item.description}</p>
                                              <p className="text-[10px] text-slate-400 font-bold">
                                                  {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                              </p>
                                          </div>
                                          <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 animate-pulse" />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </ScrollArea>
                  {notifications.length > 0 && (
                      <div className="p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs font-bold text-slate-500 hover:text-[#5E17EB] h-8"
                            onClick={handleMarkAllRead}
                          >
                              Tandai Semua Dibaca
                          </Button>
                      </div>
                  )}
              </PopoverContent>
            </Popover>

            <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-500 hover:bg-slate-100 rounded-xl relative"
                onClick={() => router.push('/admin/chat')}
            >
              <MessageSquare className="h-5 w-5" />
              {counts.unreadChatMessages > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </Button>
            
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
            
            <div className="flex items-center space-x-3 pl-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 group-hover:text-[#5E17EB] transition-colors">{user.name}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.role}</p>
              </div>
              <Avatar className="h-10 w-10 ring-2 ring-slate-100 group-hover:ring-[#5E17EB]/20 transition-all">
                <AvatarFallback className="bg-slate-100 text-[#5E17EB] font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}