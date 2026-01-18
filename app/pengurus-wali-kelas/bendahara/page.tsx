'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    Wallet,
    AlertCircle,
    ArrowRight,
    Plus,
    FileText
} from 'lucide-react'

interface DashboardStats {
    saldoKas: number
    pemasukanBulanIni: number
    pengeluaranBulanIni: number
    siswaBayarBulanIni: { count: number; total: number; percentage: number }
    siswaBayarSemester: { count: number; total: number; percentage: number }
}

interface SiswaUnpaid {
    id: string
    nama: string
    nis: string
    last_payment?: string
    months_unpaid: number
}

interface MonthlyData {
    month: string
    pemasukan: number
    pengeluaran: number
}

export default function BendaharaDashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({
        saldoKas: 0,
        pemasukanBulanIni: 0,
        pengeluaranBulanIni: 0,
        siswaBayarBulanIni: { count: 0, total: 0, percentage: 0 },
        siswaBayarSemester: { count: 0, total: 0, percentage: 0 },
    })
    const [siswaUnpaid, setSiswaUnpaid] = useState<SiswaUnpaid[]>([])
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user?.class_id) {
            fetchDashboardData(user.class_id)
        }
    }, [user])

    async function fetchDashboardData(classId: string) {
        setLoading(true)
        try {
            await Promise.all([
                fetchStats(classId),
                fetchSiswaUnpaid(classId),
                fetchMonthlyData(classId),
            ])
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchStats(classId: string) {
        // Get total students
        const { count: totalStudents } = await supabase
            .from('students_master')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId)

        // Get total pemasukan kas
        const { data: kasMasuk } = await supabase
            .from('kas_payments')
            .select('nominal')
            .eq('class_id', classId)

        const totalPemasukan = kasMasuk?.reduce((sum, item) => sum + item.nominal, 0) || 0

        // Get total pengeluaran
        const { data: kasKeluar } = await supabase
            .from('kas_expenses')
            .select('nominal')
            .eq('class_id', classId)

        const totalPengeluaran = kasKeluar?.reduce((sum, item) => sum + item.nominal, 0) || 0

        // Saldo = pemasukan - pengeluaran
        const saldoKas = totalPemasukan - totalPengeluaran

        // Pemasukan bulan ini
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        const { data: pemasukanMonth } = await supabase
            .from('kas_payments')
            .select('nominal')
            .eq('class_id', classId)
            .gte('tanggal', startOfMonth.toISOString().split('T')[0])

        const pemasukanBulanIni = pemasukanMonth?.reduce((sum, item) => sum + item.nominal, 0) || 0

        // Pengeluaran bulan ini
        const { data: pengeluaranMonth } = await supabase
            .from('kas_expenses')
            .select('nominal')
            .eq('class_id', classId)
            .gte('tanggal', startOfMonth.toISOString().split('T')[0])

        const pengeluaranBulanIni = pengeluaranMonth?.reduce((sum, item) => sum + item.nominal, 0) || 0

        // Siswa bayar bulan ini
        const { data: paymentMonth } = await supabase
            .from('kas_payments')
            .select('student_id')
            .eq('class_id', classId)
            .gte('tanggal', startOfMonth.toISOString().split('T')[0])

        const uniqueStudentsMonth = new Set(paymentMonth?.map(p => p.student_id) || [])
        const siswaBayarBulanIni = {
            count: uniqueStudentsMonth.size,
            total: totalStudents || 0,
            percentage: totalStudents ? Math.round((uniqueStudentsMonth.size / totalStudents) * 100) : 0,
        }

        // Siswa bayar semester ini (6 bulan terakhir)
        const startOfSemester = new Date()
        startOfSemester.setMonth(startOfSemester.getMonth() - 6)
        const { data: paymentSemester } = await supabase
            .from('kas_payments')
            .select('student_id')
            .eq('class_id', classId)
            .gte('tanggal', startOfSemester.toISOString().split('T')[0])

        const uniqueStudentsSemester = new Set(paymentSemester?.map(p => p.student_id) || [])
        const siswaBayarSemester = {
            count: uniqueStudentsSemester.size,
            total: totalStudents || 0,
            percentage: totalStudents ? Math.round((uniqueStudentsSemester.size / totalStudents) * 100) : 0,
        }

        setStats({
            saldoKas,
            pemasukanBulanIni,
            pengeluaranBulanIni,
            siswaBayarBulanIni,
            siswaBayarSemester,
        })
    }

    async function fetchSiswaUnpaid(classId: string) {
        // Get all students
        const { data: students } = await supabase
            .from('students_master')
            .select('id, nama, nis')
            .eq('class_id', classId)

        if (!students) return

        const unpaidList: SiswaUnpaid[] = []

        for (const student of students) {
            // Get last payment
            const { data: lastPayment } = await supabase
                .from('kas_payments')
                .select('tanggal')
                .eq('student_id', student.id)
                .order('tanggal', { ascending: false })
                .limit(1)

            const lastPaymentDate = lastPayment?.[0]?.tanggal

            // Calculate months unpaid
            let monthsUnpaid = 0
            if (lastPaymentDate) {
                const last = new Date(lastPaymentDate)
                const now = new Date()
                const diffMonths = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth())
                monthsUnpaid = Math.max(0, diffMonths - 1) // -1 karena bulan pembayaran terakhir dihitung
            } else {
                // Belum pernah bayar, hitung dari awal tahun
                const now = new Date()
                monthsUnpaid = now.getMonth() + 1
            }

            if (monthsUnpaid > 0) {
                unpaidList.push({
                    id: student.id,
                    nama: student.nama,
                    nis: student.nis,
                    last_payment: lastPaymentDate,
                    months_unpaid: monthsUnpaid,
                })
            }
        }

        // Sort by months unpaid (descending)
        unpaidList.sort((a, b) => b.months_unpaid - a.months_unpaid)

        setSiswaUnpaid(unpaidList.slice(0, 10)) // Top 10
    }

    async function fetchMonthlyData(classId: string) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const data: MonthlyData[] = []

        for (let i = 5; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]

            // Pemasukan
            const { data: masuk } = await supabase
                .from('kas_payments')
                .select('nominal')
                .eq('class_id', classId)
                .gte('tanggal', monthStart)
                .lte('tanggal', monthEnd)

            const pemasukan = masuk?.reduce((sum, item) => sum + item.nominal, 0) || 0

            // Pengeluaran
            const { data: keluar } = await supabase
                .from('kas_expenses')
                .select('nominal')
                .eq('class_id', classId)
                .gte('tanggal', monthStart)
                .lte('tanggal', monthEnd)

            const pengeluaran = keluar?.reduce((sum, item) => sum + item.nominal, 0) || 0

            data.push({
                month: months[date.getMonth()],
                pemasukan,
                pengeluaran,
            })
        }

        setMonthlyData(data)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Bendahara</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Overview keuangan kelas dan manajemen kas
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-l-emerald-600">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Saldo Kas</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.saldoKas)}</div>
                        <p className="text-xs text-gray-500 mt-1">Total saldo saat ini</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-600">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Pemasukan Bulan Ini</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pemasukanBulanIni)}</div>
                        <p className="text-xs text-blue-600 mt-1">
                            {stats.siswaBayarBulanIni.count} dari {stats.siswaBayarBulanIni.total} siswa bayar
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-600">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Pengeluaran Bulan Ini</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pengeluaranBulanIni)}</div>
                        <p className="text-xs text-red-600 mt-1">Total pengeluaran</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Pembayaran Semester</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats.siswaBayarSemester.percentage}%</div>
                        <p className="text-xs text-purple-600 mt-1">
                            {stats.siswaBayarSemester.count}/{stats.siswaBayarSemester.total} siswa
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Grafik & Siswa Belum Bayar */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Grafik Keuangan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Grafik Keuangan 6 Bulan Terakhir</CardTitle>
                        <CardDescription>Perbandingan pemasukan vs pengeluaran</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {monthlyData.map((item, idx) => {
                                const maxAmount = Math.max(...monthlyData.flatMap(d => [d.pemasukan, d.pengeluaran]), 1)
                                const pemasukanPercentage = (item.pemasukan / maxAmount) * 100
                                const pengeluaranPercentage = (item.pengeluaran / maxAmount) * 100

                                return (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="font-medium text-gray-700">{item.month}</span>
                                            <div className="flex gap-4 text-xs">
                                                <span className="text-blue-600">+{formatCurrency(item.pemasukan)}</span>
                                                <span className="text-red-600">-{formatCurrency(item.pengeluaran)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${pemasukanPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="bg-red-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${pengeluaranPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Siswa Belum Bayar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            Siswa Belum Bayar Kas
                        </CardTitle>
                        <CardDescription>Daftar siswa dengan tunggakan terbanyak</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {siswaUnpaid.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>Semua siswa sudah membayar! 🎉</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {siswaUnpaid.map((siswa) => (
                                    <div
                                        key={siswa.id}
                                        className={`p-3 rounded-lg border ${siswa.months_unpaid >= 3
                                                ? 'bg-red-50 border-red-200'
                                                : siswa.months_unpaid >= 2
                                                    ? 'bg-amber-50 border-amber-200'
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{siswa.nama}</p>
                                                <p className="text-xs text-gray-600">NIS: {siswa.nis}</p>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`text-sm font-bold ${siswa.months_unpaid >= 3
                                                            ? 'text-red-600'
                                                            : siswa.months_unpaid >= 2
                                                                ? 'text-amber-600'
                                                                : 'text-gray-600'
                                                        }`}
                                                >
                                                    {siswa.months_unpaid} bulan
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {siswa.last_payment
                                                        ? `Terakhir: ${new Date(siswa.last_payment).toLocaleDateString('id-ID', {
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}`
                                                        : 'Belum pernah bayar'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Akses cepat ke fitur utama</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/pengurus-wali-kelas/bendahara/kas">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-auto py-4">
                                <div className="flex flex-col items-center gap-2">
                                    <Wallet className="h-6 w-6" />
                                    <span>Input Kas</span>
                                </div>
                            </Button>
                        </Link>

                        <Link href="/pengurus-wali-kelas/bendahara/pengeluaran">
                            <Button className="w-full bg-red-600 hover:bg-red-700 h-auto py-4">
                                <div className="flex flex-col items-center gap-2">
                                    <TrendingDown className="h-6 w-6" />
                                    <span>Tambah Pengeluaran</span>
                                </div>
                            </Button>
                        </Link>

                        <Link href="/pengurus-wali-kelas/bendahara/tabungan">
                            <Button className="w-full bg-purple-600 hover:bg-purple-700 h-auto py-4">
                                <div className="flex flex-col items-center gap-2">
                                    <DollarSign className="h-6 w-6" />
                                    <span>Tabungan & Iuran</span>
                                </div>
                            </Button>
                        </Link>

                        <Link href="/pengurus-wali-kelas/bendahara/laporan">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-auto py-4">
                                <div className="flex flex-col items-center gap-2">
                                    <FileText className="h-6 w-6" />
                                    <span>Lihat Laporan</span>
                                </div>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
