'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { comparePassword } from '@/lib/auth-utils'
import { toast } from 'sonner'

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()
    const [activeTab, setActiveTab] = useState<'pengurus' | 'siswa'>('pengurus')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Form state for Pengurus
    const [customId, setCustomId] = useState('')
    const [pengurusPassword, setPengurusPassword] = useState('')

    // Form state for Siswa
    const [nis, setNis] = useState('')
    const [siswaPassword, setSiswaPassword] = useState('')

    const handlePengurusLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Query profiles table - case insensitive untuk custom_id
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('custom_id', customId) // Case insensitive match
                .eq('is_approved', true)

            // Debug log
            console.log('Query result:', { data, error, customId })

            if (error) {
                console.error('Supabase error:', error)
                toast.error('Terjadi kesalahan koneksi')
                setLoading(false)
                return
            }

            if (!data || data.length === 0) {
                toast.error('ID Pengguna tidak ditemukan atau belum disetujui Admin')
                setLoading(false)
                return
            }

            const user = data[0] // Get first matching user

            // Compare password
            const isPasswordValid = await comparePassword(pengurusPassword, user.password)

            if (!isPasswordValid) {
                toast.error('Password salah')
                setLoading(false)
                return
            }

            // Check if user is blocked
            if (user.is_blocked) {
                toast.error('Akun Anda telah diblokir. Hubungi Admin.')
                setLoading(false)
                return
            }

            // Login success
            login({
                id: user.id,
                nama: user.nama,
                role: user.role,
                class_id: user.class_id,
                custom_id: user.custom_id || undefined,
            })

            toast.success(`Selamat datang, ${user.nama}!`)

            // Redirect based on role
            if (user.role === 'admin') {
                router.push('/admin/dashboard')
            } else if (['wali_kelas', 'ketua_kelas', 'sekretaris', 'bendahara'].includes(user.role)) {
                // All pengurus roles go to main dashboard
                router.push('/pengurus-wali-kelas')
            } else if (user.role === 'siswa') {
                router.push('/siswa')
            } else {
                router.push('/')
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    const handleSiswaLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Query students_master table
            const { data, error } = await supabase
                .from('students_master')
                .select('*')
                .eq('nis', nis)
                .single()

            if (error || !data) {
                toast.error('NIS tidak ditemukan')
                setLoading(false)
                return
            }

            // Debug logging
            console.log('🔍 Debug Siswa Login:')
            console.log('NIS:', data.nis)
            console.log('Nama:', data.nama)
            console.log('Password from DB:', data.password)
            console.log('Password length:', data.password?.length)
            console.log('Password starts with:', data.password?.substring(0, 10))
            console.log('Input password:', siswaPassword)

            // Compare password
            const isPasswordValid = await comparePassword(siswaPassword, data.password || '')

            console.log('Password valid?', isPasswordValid)

            if (!isPasswordValid) {
                toast.error('Password salah')
                setLoading(false)
                return
            }

            // Login success
            login({
                id: data.id,
                nama: data.nama,
                role: 'siswa',
                class_id: data.class_id,
                nis: data.nis,
                nomor_absen: data.nomor_absen,
            })

            toast.success(`Selamat datang, ${data.nama}!`)
            router.push('/siswa')
        } catch (error) {
            console.error('Login error:', error)
            toast.error('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md">
            <Card className="shadow-2xl border-emerald-100">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                            <BookOpen className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Masuk ke LapanClass</CardTitle>
                        <CardDescription>
                            Pilih tab sesuai dengan jenis akun Anda
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('pengurus')}
                            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'pengurus'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Pengurus & Admin
                        </button>
                        <button
                            onClick={() => setActiveTab('siswa')}
                            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'siswa'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Siswa
                        </button>
                    </div>

                    {/* Pengurus Login Form */}
                    {activeTab === 'pengurus' && (
                        <form onSubmit={handlePengurusLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom_id">ID Pengguna</Label>
                                <Input
                                    id="custom_id"
                                    type="text"
                                    placeholder="Contoh: SEK-RPL1-01"
                                    value={customId}
                                    onChange={(e) => setCustomId(e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                                <p className="text-xs text-gray-500">
                                    ID yang diberikan oleh Admin setelah approval
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pengurus_password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="pengurus_password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan password"
                                        value={pengurusPassword}
                                        onChange={(e) => setPengurusPassword(e.target.value)}
                                        required
                                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={loading}
                            >
                                {loading ? 'Memproses...' : 'Masuk'}
                            </Button>
                        </form>
                    )}

                    {/* Siswa Login Form */}
                    {activeTab === 'siswa' && (
                        <form onSubmit={handleSiswaLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nis">NIS (Nomor Induk Siswa)</Label>
                                <Input
                                    id="nis"
                                    type="text"
                                    placeholder="Masukkan NIS"
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="siswa_password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="siswa_password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan password"
                                        value={siswaPassword}
                                        onChange={(e) => setSiswaPassword(e.target.value)}
                                        required
                                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={loading}
                            >
                                {loading ? 'Memproses...' : 'Masuk'}
                            </Button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">atau</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Belum punya akun pengurus?{' '}
                            <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-700">
                                Daftar di sini
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                            ← Kembali ke Beranda
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
