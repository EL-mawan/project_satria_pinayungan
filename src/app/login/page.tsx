'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        switch (data.user.role) {
          case 'MASTER_ADMIN':
          case 'KETUA':
          case 'SEKRETARIS':
          case 'BENDAHARA':
            router.push('/admin/dashboard')
            break
          default:
            router.push('/')
        }
      } else {
        setError(data.error || 'Login gagal. Periksa kembali email dan password Anda.')
      }
    } catch (error) {
      setError('Terjadi kesalahan sistem. Silakan coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex overflow-hidden">
      {/* Decorative Left Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#5E17EB] relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#4a11c0] rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl mb-8 transform hover:rotate-12 transition-transform duration-500 p-3">
            <img src="/padepokan-logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
            Selamat Datang di Portal Admin Satria Pinayungan
          </h2>
          <p className="text-white/70 text-lg font-medium leading-relaxed">
            Kelola administrasi, keuangan, dan anggota padepokan dalam satu platform terpusat yang aman dan modern.
          </p>
        </div>

        {/* Floating Badges Decoration */}
        <div className="absolute top-[20%] right-[10%] bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 animate-bounce transition-all duration-3000">
           <div className="w-10 h-2 bg-emerald-400 rounded-full mb-2"></div>
           <div className="w-16 h-2 bg-white/20 rounded-full"></div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 p-2.5 border border-slate-100">
              <img src="/padepokan-logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Satria Pinayungan</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Login Admin</h2>
            <p className="text-slate-500 mt-2 font-medium">Silakan masuk menggunakan kredensial Anda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl p-4">
                <AlertDescription className="font-bold flex items-center">
                   <Lock className="h-4 w-4 mr-2" />
                   {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-[#5E17EB]/20 transition-all text-base"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-[#5E17EB]/20 transition-all text-base"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#5E17EB] hover:bg-[#4a11c0] h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-[#5E17EB]/20 transition-all group" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-3"></div>
                  Sedang masuk...
                </div>
              ) : (
                <div className="flex items-center">
                  Masuk Sekarang
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>
          
          <div className="mt-12 text-center">
            <Link 
              href="/" 
              className="text-slate-400 hover:text-[#5E17EB] text-sm font-bold flex items-center justify-center transition-colors group"
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}