'use client'

import { useEffect, useState } from 'react'
import { FileText, Clock, AlertCircle, Calendar, TrendingUp, Hash, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IzinModal } from '@/components/izin-modal'
import { IzinJamModal } from '@/components/izin-jam-modal'
import { IzinTelatModal } from '@/components/izin-telat-modal'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Stats {
    totalHadir: number
    totalSakit: number
    totalIzin: number
    totalAlpha: number
    totalTelat: number
}

interface RecentSubmission {
    id: string
    tanggal: string
    status: string
    keterangan: string | null
    is_approved: boolean
    type: 'attendance' | 'izin_telat'
}

export default function SiswaDashboardPage() {
    const { user } = useAuth()
    const [izinModalOpen, setIzinModalOpen] = useState(false)
    const [izinJamModalOpen, setIzinJamModalOpen] = useState(false)
    const [izinTelatModalOpen, setIzinTelatModalOpen] = useState(false)
    const [stats, setStats] = useState<Stats>({
        totalHadir: 0,
        totalSakit: 0,
        totalIzin: 0,
        totalAlpha: 0,
        totalTelat: 0,
    })
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user?.id) {
            fetchData()
        }
    }, [user])

    async function fetchData() {
        if (!user?.id) return

        setLoading(true)

        try {
            // Get current month date range
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

            // Fetch attendance stats for current month
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', user.id)
                .gte('tanggal', startOfMonth.toISOString().split('T')[0])
                .lte('tanggal', endOfMonth.toISOString().split('T')[0])

            // Fetch late permissions for current month
            const { data: lateData } = await supabase
                .from('izin_telat')
                .select('*')
                .eq('student_id', user.id)
                .gte('tanggal', startOfMonth.toISOString().split('T')[0])
                .lte('tanggal', endOfMonth.toISOString().split('T')[0])

            // Calculate stats
            const totalHadir = attendanceData?.filter(a => a.status === 'Hadir').length || 0
            const totalSakit = attendanceData?.filter(a => a.status === 'Sakit').length || 0
            const totalIzin = attendanceData?.filter(a => a.status === 'Izin').length || 0
            const totalAlpha = attendanceData?.filter(a => a.status === 'Alpha').length || 0
            const totalTelat = lateData?.length || 0

            setStats({
                totalHadir,
                totalSakit,
                totalIzin,
                totalAlpha,
                totalTelat,
            })

            // Fetch recent submissions (last 5)
            const { data: recentAttendance } = await supabase
                .from('attendance')
                .select('id, tanggal, status, keterangan, is_approved')
                .eq('student_id', user.id)
                .neq('status', 'Hadir')
                .order('tanggal', { ascending: false })
                .limit(5)

            const { data: recentLate } = await supabase
                .from('izin_telat')
                .select('id, tanggal, keterangan, is_approved')
                .eq('student_id', user.id)
                .order('tanggal', { ascending: false })
                .limit(5)

            // Combine and sort
            const combined: RecentSubmission[] = [
                ...(recentAttendance?.map(a => ({ ...a, type: 'attendance' as const })) || []),
                ...(recentLate?.map(l => ({ ...l, status: 'Terlambat', type: 'izin_telat' as const })) || []),
            ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 5)

            setRecentSubmissions(combined)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = () => {
        fetchData()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Selamat Datang, {user?.nama}!</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Dashboard kehadiran dan pengajuan izin Anda
                </p>
            </div>

            {/* Student Info Card */}
            <Card className="mb-8 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50">
                <CardHeader>
                    <CardTitle className="text-sky-900">Informasi Siswa</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100">
                                <IdCard className="h-6 w-6 text-sky-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">NIS</p>
                                <p className="text-lg font-bold text-gray-900">{user?.nis || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                <Hash className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">Nomor Absen</p>
                                <p className="text-lg font-bold text-gray-900">{user?.nomor_absen || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">Kehadiran Bulan Ini</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {stats.totalHadir}/{stats.totalHadir + stats.totalSakit + stats.totalIzin + stats.totalAlpha}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-sky-500">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-sky-100 rounded-lg group-hover:bg-sky-500 transition-colors">
                                <FileText className="h-8 w-8 text-sky-600 group-hover:text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Ajukan Izin/Sakit</CardTitle>
                                <CardDescription className="text-xs">Dengan foto bukti</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setIzinModalOpen(true)}
                            className="w-full bg-sky-500 hover:bg-sky-600"
                        >
                            Buka Form
                        </Button>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <Clock className="h-8 w-8 text-blue-600 group-hover:text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Izin Jam Pelajaran</CardTitle>
                                <CardDescription className="text-xs">Jam tertentu saja</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setIzinJamModalOpen(true)}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                        >
                            Buka Form
                        </Button>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-amber-500">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-500 transition-colors">
                                <AlertCircle className="h-8 w-8 text-amber-600 group-hover:text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Izin Terlambat</CardTitle>
                                <CardDescription className="text-xs">Dengan foto bukti</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setIzinTelatModalOpen(true)}
                            className="w-full bg-amber-500 hover:bg-amber-600"
                        >
                            Buka Form
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Stats This Month */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Statistik Bulan Ini</CardTitle>
                    <CardDescription>Ringkasan kehadiran Anda bulan {format(new Date(), 'MMMM yyyy', { locale: id })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="text-center p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                            <p className="text-3xl font-bold text-emerald-600">{stats.totalHadir}</p>
                            <p className="text-xs text-emerald-700 mt-1">Hadir</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <p className="text-3xl font-bold text-yellow-600">{stats.totalSakit}</p>
                            <p className="text-xs text-yellow-700 mt-1">Sakit</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="text-3xl font-bold text-blue-600">{stats.totalIzin}</p>
                            <p className="text-xs text-blue-700 mt-1">Izin</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-3xl font-bold text-red-600">{stats.totalAlpha}</p>
                            <p className="text-xs text-red-700 mt-1">Alpha</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-3xl font-bold text-amber-600">{stats.totalTelat}</p>
                            <p className="text-xs text-amber-700 mt-1">Terlambat</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card>
                <CardHeader>
                    <CardTitle>Pengajuan Terakhir</CardTitle>
                    <CardDescription>5 pengajuan izin/sakit terakhir Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentSubmissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Belum ada pengajuan</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentSubmissions.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">
                                                {format(new Date(item.tanggal), 'dd MMM yyyy', { locale: id })}
                                            </p>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === 'Sakit'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : item.status === 'Izin'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}
                                            >
                                                {item.status}
                                            </span>
                                        </div>
                                        {item.keterangan && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{item.keterangan}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${item.is_approved
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {item.is_approved ? '✓ Disetujui' : 'Menunggu'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <IzinModal
                open={izinModalOpen}
                onOpenChange={setIzinModalOpen}
                onSuccess={handleSuccess}
            />
            <IzinJamModal
                open={izinJamModalOpen}
                onOpenChange={setIzinJamModalOpen}
                onSuccess={handleSuccess}
            />
            <IzinTelatModal
                open={izinTelatModalOpen}
                onOpenChange={setIzinTelatModalOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
