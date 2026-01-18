'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth-utils'
import { getAllClasses } from '@/lib/class-utils'
import { Class, UserRole } from '@/lib/types'
import { toast } from 'sonner'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showRetypePassword, setShowRetypePassword] = useState(false)
    const [classes, setClasses] = useState<Class[]>([])
    const [success, setSuccess] = useState(false)

    // Form state
    const [namaLengkap, setNamaLengkap] = useState('')
    const [nomorTelepon, setNomorTelepon] = useState('')
    const [jabatan, setJabatan] = useState<UserRole>('sekretaris')
    const [classId, setClassId] = useState('')
    const [password, setPassword] = useState('')
    const [retypePassword, setRetypePassword] = useState('')

    // Fetch classes on mount
    useEffect(() => {
        async function fetchClasses() {
            const { data, error } = await getAllClasses()
            if (data) {
                setClasses(data)
            }
        }
        fetchClasses()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validation
        if (password.length < 8) {
            toast.error('Password minimal 8 karakter')
            setLoading(false)
            return
        }

        if (password !== retypePassword) {
            toast.error('Password dan Retype Password tidak sama')
            setLoading(false)
            return
        }

        if (!classId) {
            toast.error('Silakan pilih kelas')
            setLoading(false)
            return
        }

        try {
            // Hash password
            const hashedPassword = await hashPassword(password)

            // Generate UUID untuk id
            const userId = crypto.randomUUID()

            // Insert to profiles table
            const { error } = await supabase.from('profiles').insert({
                id: userId,
                nama: namaLengkap,
                phone: nomorTelepon,
                role: jabatan,
                class_id: classId,
                password: hashedPassword,
                is_approved: false,
                custom_id: null,
                is_blocked: false,
            })

            if (error) {
                console.error('Registration error:', error)
                toast.error('Terjadi kesalahan. Silakan coba lagi.')
                setLoading(false)
                return
            }

            // Success
            setSuccess(true)
            toast.success('Pendaftaran berhasil!')
        } catch (error) {
            console.error('Registration error:', error)
            toast.error('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="w-full max-w-md">
                <Card className="shadow-2xl border-emerald-100">
                    <CardHeader className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle className="h-8 w-8 text-emerald-600" />
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-emerald-700">
                                Pendaftaran Berhasil!
                            </CardTitle>
                            <CardDescription className="mt-4 text-base">
                                Terima kasih telah mendaftar sebagai pengurus kelas.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-900 font-medium mb-2">
                                📋 Langkah Selanjutnya:
                            </p>
                            <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
                                <li>Hubungi Admin Sekolah untuk verifikasi akun Anda</li>
                                <li>Admin akan memberikan <strong>ID Login</strong> khusus untuk Anda</li>
                                <li>Setelah mendapat ID, Anda dapat login menggunakan ID tersebut</li>
                            </ol>
                        </div>

                        <div className="space-y-3">
                            <Link href="/login">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    Ke Halaman Login
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                                    Kembali ke Beranda
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
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
                        <CardTitle className="text-2xl font-bold">Daftar Pengurus Kelas</CardTitle>
                        <CardDescription>
                            Isi formulir di bawah untuk mendaftar sebagai pengurus
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nama Lengkap */}
                        <div className="space-y-2">
                            <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                            <Input
                                id="nama_lengkap"
                                type="text"
                                placeholder="Masukkan nama lengkap"
                                value={namaLengkap}
                                onChange={(e) => setNamaLengkap(e.target.value)}
                                required
                                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Nomor Telepon */}
                        <div className="space-y-2">
                            <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                            <Input
                                id="nomor_telepon"
                                type="tel"
                                placeholder="08xx xxxx xxxx"
                                value={nomorTelepon}
                                onChange={(e) => setNomorTelepon(e.target.value)}
                                required
                                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Jabatan */}
                        <div className="space-y-2">
                            <Label htmlFor="jabatan">Jabatan</Label>
                            <Select value={jabatan} onValueChange={(value) => setJabatan(value as UserRole)}>
                                <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                                    <SelectValue placeholder="Pilih jabatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ketua_kelas">Ketua Kelas</SelectItem>
                                    <SelectItem value="sekretaris">Sekretaris</SelectItem>
                                    <SelectItem value="bendahara">Bendahara</SelectItem>
                                    <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pilih Kelas */}
                        <div className="space-y-2">
                            <Label htmlFor="kelas">Pilih Kelas</Label>
                            <Select value={classId} onValueChange={setClassId}>
                                <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                                    <SelectValue placeholder="Pilih kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.nama_kelas}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimal 8 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        {/* Retype Password */}
                        <div className="space-y-2">
                            <Label htmlFor="retype_password">Ulangi Password</Label>
                            <div className="relative">
                                <Input
                                    id="retype_password"
                                    type={showRetypePassword ? 'text' : 'password'}
                                    placeholder="Ketik ulang password"
                                    value={retypePassword}
                                    onChange={(e) => setRetypePassword(e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRetypePassword(!showRetypePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            disabled={loading}
                        >
                            {loading ? 'Memproses...' : 'Daftar Sekarang'}
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">atau</span>
                            </div>
                        </div>

                        {/* Login Link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Sudah punya akun?{' '}
                                <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                                    Login di sini
                                </Link>
                            </p>
                        </div>

                        {/* Back to Home */}
                        <div className="text-center">
                            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                                ← Kembali ke Beranda
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
