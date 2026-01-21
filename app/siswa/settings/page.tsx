'use client'

import { useState } from 'react'
import { Loader2, User, Lock, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth-utils'

export default function SettingsPage() {
    const { user, login } = useAuth()
    const [loading, setLoading] = useState(false)

    // Form states
    const [nama, setNama] = useState(user?.nama || '')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleUpdateNama = async () => {
        if (!user?.id) return

        if (!nama.trim()) {
            toast.error('Nama tidak boleh kosong!')
            return
        }

        setLoading(true)

        try {
            // Update nama di students_master
            const { error } = await supabase
                .from('students_master')
                .update({ nama: nama.trim() })
                .eq('id', user.id)

            if (error) throw error

            // Update local auth state
            login({
                ...user,
                nama: nama.trim(),
            })

            toast.success('Nama berhasil diperbarui!')
        } catch (error: any) {
            console.error('Error updating nama:', error)
            toast.error(error.message || 'Gagal memperbarui nama')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (!user?.id) return

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Semua field password harus diisi!')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('Password baru dan konfirmasi tidak cocok!')
            return
        }

        if (newPassword.length < 6) {
            toast.error('Password baru minimal 6 karakter!')
            return
        }

        setLoading(true)

        try {
            // Get current password from DB to verify
            const { data: studentData, error: fetchError } = await supabase
                .from('students_master')
                .select('password')
                .eq('id', user.id)
                .single()

            if (fetchError || !studentData) {
                throw new Error('Gagal memverifikasi password lama')
            }

            // Verify current password
            const bcrypt = require('bcryptjs')
            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword,
                studentData.password
            )

            if (!isCurrentPasswordValid) {
                toast.error('Password lama salah!')
                setLoading(false)
                return
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword)

            // Update password
            const { error: updateError } = await supabase
                .from('students_master')
                .update({ password: hashedPassword })
                .eq('id', user.id)

            if (updateError) throw updateError

            toast.success('Password berhasil diperbarui!')

            // Clear password fields
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            console.error('Error updating password:', error)
            toast.error(error.message || 'Gagal memperbarui password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Kelola informasi akun dan keamanan Anda
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Update Nama Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Ubah Nama
                        </CardTitle>
                        <CardDescription>
                            Perbarui nama lengkap Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input
                                id="nama"
                                type="text"
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                                placeholder="Masukkan nama lengkap"
                            />
                        </div>

                        <Button
                            onClick={handleUpdateNama}
                            disabled={loading || !nama.trim() || nama === user?.nama}
                            className="w-full bg-sky-500 hover:bg-sky-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Nama
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Update Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Ubah Password
                        </CardTitle>
                        <CardDescription>
                            Perbarui password untuk keamanan akun Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Password Lama</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Masukkan password lama"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">Password Baru</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password baru"
                            />
                        </div>

                        <Button
                            onClick={handleUpdatePassword}
                            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                            className="w-full bg-emerald-500 hover:bg-emerald-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Ubah Password
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Info Card */}
            <Card className="mt-6 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-lg">ℹ️</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-900">Informasi Penting</h3>
                            <ul className="mt-2 space-y-1 text-sm text-blue-800">
                                <li>• NIS tidak dapat diubah</li>
                                <li>• Password minimal 6 karakter</li>
                                <li>• Pastikan mengingat password baru Anda</li>
                                <li>• Perubahan akan tersimpan secara permanen</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
