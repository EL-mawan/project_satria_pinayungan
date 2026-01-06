'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Eye, EyeOff, User, Mail, Lock, UserCheck, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ANGGOTA'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || 'Registrasi gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
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

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex overflow-hidden">
      {/* Decorative Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#5E17EB] relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#4a11c0] rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl mb-8 transform hover:rotate-12 transition-transform duration-500 p-3">
            <img src="/padepokan-logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
            Gabung Menjadi Bagian dari Satria Pinayungan
          </h2>
          <p className="text-white/70 text-lg font-medium leading-relaxed">
            Daftarkan diri Anda untuk mendapatkan akses ke platform manajemen padepokan kami.
          </p>
        </div>
      </div>

      {/* Register Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 p-2.5 border border-slate-100">
              <img src="/padepokan-logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Satria Pinayungan</h1>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Buat Akun</h2>
            <p className="text-slate-500 mt-2 font-medium">Lengkapi data di bawah untuk mendaftar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl p-4">
                <AlertDescription className="font-bold flex items-center">
                   <Lock className="h-4 w-4 mr-2" /> {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-emerald-50 border-emerald-100 text-emerald-600 rounded-2xl p-4">
                <AlertDescription className="font-bold flex items-center">
                   <UserCheck className="h-4 w-4 mr-2" /> {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 ml-1">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  name="name"
                  placeholder="John Doe"
                  className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-[#5E17EB]/20 transition-all"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-[#5E17EB]/20 transition-all"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 ml-1">Role Jabatan</Label>
              <Select value={formData.role} onValueChange={handleRoleChange} disabled={loading}>
                <SelectTrigger className="h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-[#5E17EB]/20">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="ANGGOTA" className="focus:bg-[#5E17EB]/5 rounded-xl">Anggota</SelectItem>
                  <SelectItem value="SEKRETARIS" className="focus:bg-[#5E17EB]/5 rounded-xl">Sekretaris</SelectItem>
                  <SelectItem value="BENDAHARA" className="focus:bg-[#5E17EB]/5 rounded-xl">Bendahara</SelectItem>
                  <SelectItem value="KETUA" className="focus:bg-[#5E17EB]/5 rounded-xl">Ketua</SelectItem>
                  <SelectItem value="MASTER_ADMIN" className="focus:bg-[#5E17EB]/5 rounded-xl">Master Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Password</Label>
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-[#5E17EB]/20 transition-all"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Konfirmasi</Label>
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-[#5E17EB]/20 transition-all"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#5E17EB] hover:bg-[#4a11c0] h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-[#5E17EB]/20 transition-all group mt-4" 
              disabled={loading}
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="mt-8 text-center font-medium text-slate-500">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="text-[#5E17EB] font-extrabold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}