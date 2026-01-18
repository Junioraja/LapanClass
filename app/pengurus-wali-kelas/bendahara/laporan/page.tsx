'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FileText, Download, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react'

interface Transaction {
    id: string
    tanggal: string
    jenis: 'pemasukan' | 'pengeluaran'
    kategori: string
    nominal: number
    keterangan: string
    sumber: 'kas' | 'tabungan' | 'iuran' | 'pengeluaran'
}

interface Summary {
    totalPemasukan: number
    totalPengeluaran: number
    saldoAkhir: number
    jumlahTransaksi: number
}

export default function LaporanPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [periode, setPeriode] = useState('bulan_ini')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [summary, setSummary] = useState<Summary>({
        totalPemasukan: 0,
        totalPengeluaran: 0,
        saldoAkhir: 0,
        jumlahTransaksi: 0,
    })

    useEffect(() => {
        if (user?.class_id) {
            fetchLaporan(user.class_id, periode)
        }
    }, [user, periode])

    async function fetchLaporan(classId: string, periodFilter: string) {
        setLoading(true)
        try {
            const dateRange = getDateRange(periodFilter)
            const allTransactions: Transaction[] = []

            // Fetch kas payments (pemasukan)
            const { data: kasData } = await supabase
                .from('kas_payments')
                .select('*, student:students_master(nama)')
                .eq('class_id', classId)
                .gte('tanggal', dateRange.start)
                .lte('tanggal', dateRange.end)
                .order('tanggal', { ascending: false })

            if (kasData) {
                kasData.forEach((k: any) => {
                    allTransactions.push({
                        id: k.id,
                        tanggal: k.tanggal,
                        jenis: 'pemasukan',
                        kategori: 'Kas Kelas',
                        nominal: k.nominal,
                        keterangan: `Kas - ${k.student?.nama || 'Unknown'}`,
                        sumber: 'kas',
                    })
                })
            }

            // Fetch savings payments (pemasukan)
            const { data: savingsData } = await supabase
                .from('savings_payments')
                .select(`
          *,
          student:students_master(nama),
          savings:class_savings(nama, jenis)
        `)
                .gte('tanggal', dateRange.start)
                .lte('tanggal', dateRange.end)
                .order('tanggal', { ascending: false })

            if (savingsData) {
                savingsData.forEach((s: any) => {
                    if (s.savings && s.savings.class_id === classId) {
                        // Filter by class_id from savings
                        allTransactions.push({
                            id: s.id,
                            tanggal: s.tanggal,
                            jenis: 'pemasukan',
                            kategori: s.savings.jenis === 'tabungan' ? 'Tabungan' : 'Iuran',
                            nominal: s.nominal,
                            keterangan: `${s.savings.nama} - ${s.student?.nama || 'Unknown'}`,
                            sumber: s.savings.jenis,
                        })
                    }
                })
            }

            // Fetch expenses (pengeluaran)
            const { data: expensesData } = await supabase
                .from('kas_expenses')
                .select('*')
                .eq('class_id', classId)
                .gte('tanggal', dateRange.start)
                .lte('tanggal', dateRange.end)
                .order('tanggal', { ascending: false })

            if (expensesData) {
                expensesData.forEach(e => {
                    allTransactions.push({
                        id: e.id,
                        tanggal: e.tanggal,
                        jenis: 'pengeluaran',
                        kategori: e.kategori,
                        nominal: e.nominal,
                        keterangan: e.keterangan,
                        sumber: 'pengeluaran',
                    })
                })
            }

            // Sort by date
            allTransactions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

            setTransactions(allTransactions)

            // Calculate summary
            const pemasukan = allTransactions
                .filter(t => t.jenis === 'pemasukan')
                .reduce((sum, t) => sum + t.nominal, 0)
            const pengeluaran = allTransactions
                .filter(t => t.jenis === 'pengeluaran')
                .reduce((sum, t) => sum + t.nominal, 0)

            setSummary({
                totalPemasukan: pemasukan,
                totalPengeluaran: pengeluaran,
                saldoAkhir: pemasukan - pengeluaran,
                jumlahTransaksi: allTransactions.length,
            })
        } catch (error) {
            console.error('Error fetching laporan:', error)
            toast.error('Gagal memuat laporan')
        } finally {
            setLoading(false)
        }
    }

    function getDateRange(period: string) {
        const now = new Date()
        const start = new Date()
        const end = new Date()

        switch (period) {
            case 'hari_ini':
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                break
            case 'minggu_ini':
                const dayOfWeek = now.getDay()
                start.setDate(now.getDate() - dayOfWeek)
                start.setHours(0, 0, 0, 0)
                break
            case 'bulan_ini':
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                break
            case '3_bulan':
                start.setMonth(now.getMonth() - 3)
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                break
            case 'semester':
                start.setMonth(now.getMonth() - 6)
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                break
            case 'tahun_ini':
                start.setMonth(0)
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
                break
            default:
                start.setDate(1)
                start.setHours(0, 0, 0, 0)
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        }
    }

    function handleExportExcel() {
        if (transactions.length === 0) {
            toast.error('Tidak ada data untuk diexport')
            return
        }

        // Create CSV content
        const headers = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal']
        const rows = transactions.map(t => [
            new Date(t.tanggal).toLocaleDateString('id-ID'),
            t.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
            t.kategori,
            t.keterangan,
            t.nominal.toString(),
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
            '',
            `Total Pemasukan,,,${summary.totalPemasukan}`,
            `Total Pengeluaran,,,${summary.totalPengeluaran}`,
            `Saldo Akhir,,,${summary.saldoAkhir}`,
        ].join('\n')

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `Laporan_Keuangan_${periode}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success('Laporan berhasil diexport!')
    }

    function handlePrint() {
        window.print()
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
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between print:block">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Ringkasan dan detail transaksi keuangan kelas
                    </p>
                </div>
                <div className="flex gap-3 print:hidden">
                    <Button onClick={handlePrint} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700">
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Filter */}
            <Card className="mb-6 print:hidden">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Periode Laporan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <Label>Pilih Periode</Label>
                        <Select value={periode} onValueChange={setPeriode}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hari_ini">Hari Ini</SelectItem>
                                <SelectItem value="minggu_ini">Minggu Ini</SelectItem>
                                <SelectItem value="bulan_ini">Bulan Ini</SelectItem>
                                <SelectItem value="3_bulan">3 Bulan Terakhir</SelectItem>
                                <SelectItem value="semester">Semester (6 Bulan)</SelectItem>
                                <SelectItem value="tahun_ini">Tahun Ini</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="border-l-4 border-l-emerald-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-600">Total Pemasukan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(summary.totalPemasukan)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-600">Total Pengeluaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(summary.totalPengeluaran)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-600">Saldo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-blue-600" />
                            <p className={`text-2xl font-bold ${summary.saldoAkhir >= 0 ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                {formatCurrency(summary.saldoAkhir)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-600">Jumlah Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <p className="text-2xl font-bold text-purple-600">
                                {summary.jumlahTransaksi}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6 print:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Breakdown Pemasukan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {['Kas Kelas', 'Tabungan', 'Iuran'].map(kategori => {
                            const total = transactions
                                .filter(t => t.jenis === 'pemasukan' && t.kategori === kategori)
                                .reduce((sum, t) => sum + t.nominal, 0)
                            const percentage = summary.totalPemasukan > 0
                                ? (total / summary.totalPemasukan) * 100
                                : 0

                            return (
                                <div key={kategori} className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">{kategori}</span>
                                        <span className="font-semibold">{formatCurrency(total)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-emerald-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Breakdown Pengeluaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Array.from(new Set(transactions.filter(t => t.jenis === 'pengeluaran').map(t => t.kategori))).map(kategori => {
                            const total = transactions
                                .filter(t => t.jenis === 'pengeluaran' && t.kategori === kategori)
                                .reduce((sum, t) => sum + t.nominal, 0)
                            const percentage = summary.totalPengeluaran > 0
                                ? (total / summary.totalPengeluaran) * 100
                                : 0

                            return (
                                <div key={kategori} className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">{kategori}</span>
                                        <span className="font-semibold">{formatCurrency(total)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Transaksi</CardTitle>
                    <CardDescription>Daftar semua transaksi dalam periode yang dipilih</CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">Tidak ada transaksi dalam periode ini</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="text-right">Nominal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={`${transaction.sumber}-${transaction.id}`}>
                                            <TableCell>
                                                {new Date(transaction.tanggal).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${transaction.jenis === 'pemasukan'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {transaction.jenis === 'pemasukan' ? 'Masuk' : 'Keluar'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                    {transaction.kategori}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {transaction.keterangan}
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${transaction.jenis === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                {transaction.jenis === 'pemasukan' ? '+' : '-'}
                                                {formatCurrency(transaction.nominal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
