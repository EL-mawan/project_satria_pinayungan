'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Added useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  MoreVertical,
  ChevronRight,
  Shield,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const IDR = ({ className }: { className?: string }) => (
  <div className={`${className} font-bold text-[10px] flex items-center justify-center`}>Rp</div>
)

interface DashboardStats {
  totalAnggota: number
  anggotaAktif: number
  totalKegiatan: number
  kegiatanTerjadwal: number
  totalPemasukan: number
  totalPengeluaran: number
  suratMenunggu: number
  lpjMenunggu: number
  recentActivities: any[]
}

export default function DashboardPage() {
  const router = useRouter() // Initialize router
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalAnggota: 0,
    anggotaAktif: 0,
    totalKegiatan: 0,
    kegiatanTerjadwal: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    suratMenunggu: 0,
    lpjMenunggu: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }

    // Simulasi loading data
    const loadDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setStats({
            totalAnggota: data.totalAnggota,
            anggotaAktif: data.anggotaAktif,
            totalKegiatan: data.totalKegiatan,
            kegiatanTerjadwal: data.kegiatanTerjadwal,
            totalPemasukan: data.totalPemasukan,
            totalPengeluaran: data.totalPengeluaran,
            suratMenunggu: data.suratMenunggu,
            lpjMenunggu: data.lpjMenunggu,
            recentActivities: data.recentActivities || []
          })
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Anggota',
      value: stats.totalAnggota,
      description: 'Pertumbuhan 12% bulan ini',
      icon: Users,
      color: 'text-[#5E17EB]',
      bgColor: 'bg-[#5E17EB]/10',
      trend: { value: 12, isPositive: true },
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS', 'BENDAHARA']
    },
    {
      title: 'Kegiatan Aktif',
      value: stats.totalKegiatan,
      description: '8 sedang direncanakan',
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      trend: { value: 8, isPositive: true },
      roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS', 'BENDAHARA']
    },
    {
      title: 'Pemasukan Kas',
      value: formatCurrency(stats.totalPemasukan),
      description: 'Saldo meningkat secara stabil',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      trend: { value: 15, isPositive: true },
      roles: ['MASTER_ADMIN', 'BENDAHARA']
    },
    {
      title: 'Pengeluaran Kas',
      value: formatCurrency(stats.totalPengeluaran),
      description: 'Terkendali sesuai pagu',
      icon: TrendingDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      trend: { value: 5, isPositive: false },
      roles: ['MASTER_ADMIN', 'BENDAHARA']
    }
  ]

  const filteredStatCards = statCards.filter(card => 
    !user || (card.roles && card.roles.includes(user.role))
  )



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-emerald-100 text-emerald-700'
      case 'terjadwal': return 'bg-blue-100 text-blue-700'
      case 'menunggu': return 'bg-amber-100 text-amber-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  // Helper for Tinjau button
  const handleReviewClick = () => {
    if (stats.suratMenunggu > 0) {
      router.push('/admin/surat')
    } else if (stats.lpjMenunggu > 0) {
      router.push('/admin/lpj')
    } else {
      router.push('/admin/surat') // Default to surat if nothing specific
    }
  }

  // Mapping for Quick Actions
  const quickActionRoutes: {[key: string]: string} = {
    'Anggota': '/admin/anggota',
    'Keuangan': '/admin/keuangan',
    'Persuratan': '/admin/surat',
    'Laporan': '/admin/lpj'
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col space-y-2">
          <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl h-40 animate-pulse bg-white">
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Halo, {user?.name || 'Admin'} 👋</h1>
          <p className="text-slate-500 mt-1 font-medium">Ini adalah ringkasan performa Padepokan Satria Pinayungan hari ini.</p>
        </div>
        <div className="flex items-center space-x-3">
           {/* Quick actions handled in specific pages */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${filteredStatCards.length === 4 ? 'lg:grid-cols-4' : filteredStatCards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {filteredStatCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center space-x-1 text-xs font-bold ${stat.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stat.trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>{stat.trend.value}%</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</h3>
                  <p className="text-slate-400 text-[11px] font-medium mt-1">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area - Activity List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Aktivitas Terkini</h2>
            <Button 
                variant="ghost" 
                className="text-[#5E17EB] font-bold text-sm hover:bg-[#5E17EB]/5"
                onClick={() => router.push('/admin/kegiatan')}
            >
              Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid gap-4">
            {stats.recentActivities.map((activity) => (
              <Card 
                key={activity.id} 
                className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl sm:rounded-4xl hover:shadow-lg transition-all duration-300 bg-white group cursor-pointer"
                onClick={() => {
                    if (activity.type === 'kegiatan') router.push(`/admin/kegiatan?id=${activity.id}`)
                    else if (activity.type === 'surat') router.push(`/admin/surat?id=${activity.id}`)
                }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    {/* Activity Icon/Logo */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-[#5E17EB]/20 transition-colors">
                      {activity.type === 'kegiatan' ? (
                        <Shield className="h-8 w-8 text-[#5E17EB]" />
                      ) : (
                        <FileText className="h-8 w-8 text-amber-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 truncate group-hover:text-[#5E17EB] transition-colors">{activity.title}</h4>
                        <span className="text-emerald-600 font-extrabold text-sm">{activity.amount}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium mb-3">{activity.subtitle}</p>
                      
                      <div className="flex flex-wrap gap-2 items-center text-[11px] font-bold">
                        <Badge variant="secondary" className={`px-3 py-1 rounded-full uppercase tracking-wider border-none ${getStatusBadge(activity.status)}`}>
                          {activity.status}
                        </Badge>
                        <span className="text-slate-400 px-2">•</span>
                        <span className="text-slate-400 uppercase tracking-widest">{activity.location}</span>
                        <span className="text-slate-400 px-2">•</span>
                        <span className="text-slate-400">{activity.date}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="sm:pl-4 border-l border-slate-100 hidden sm:block">
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-[#5E17EB] hover:bg-[#5E17EB]/5">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Urgent Tasks & Quick Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Urgent Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Perlu Perhatian</h2>
            <Card className="border-none bg-[#5E17EB] rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-[#5E17EB]/30 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
              <div className="relative z-10">
                <AlertCircle className="h-10 w-10 text-white/80 mb-4" />
                <h3 className="text-xl font-bold mb-2">Persetujuan Pending</h3>
                <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">
                  Ada {stats.suratMenunggu} surat dan {stats.lpjMenunggu} LPJ yang menunggu validasi Anda segera.
                </p>
                <Button 
                    className="w-full bg-white text-[#5E17EB] hover:bg-slate-100 font-extrabold rounded-2xl h-12 shadow-lg"
                    onClick={handleReviewClick}
                >
                  Tinjau Sekarang
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Anggota', icon: Users, color: 'bg-indigo-50 text-indigo-600', roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'] },
                { label: 'Keuangan', icon: IDR, color: 'bg-emerald-50 text-emerald-600', roles: ['MASTER_ADMIN', 'BENDAHARA'] },
                { label: 'Persuratan', icon: FileText, color: 'bg-amber-50 text-amber-600', roles: ['MASTER_ADMIN', 'KETUA', 'SEKRETARIS'] },
                { label: 'Laporan', icon: TrendingUp, color: 'bg-rose-50 text-rose-600', roles: ['MASTER_ADMIN', 'KETUA', 'BENDAHARA'] },
              ].filter(action => !user || action.roles.includes(user.role))
               .map((action, i) => (
                <button 
                    key={i} 
                    className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-3xl sm:rounded-4xl hover:ring-2 hover:ring-[#5E17EB]/10 hover:shadow-md transition-all group border border-slate-100"
                    onClick={() => router.push(quickActionRoutes[action.label] || '#')}
                >
                  <div className={`p-3 rounded-2xl ${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 tracking-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}