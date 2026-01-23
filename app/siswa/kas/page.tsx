'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
    Wallet,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Clock,
    Calendar,
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Loader2,
    Receipt,
    Tag
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface KasSummary {
    total_pemasukan: number
    total_pengeluaran: number
    saldo: number
}

interface Pengeluaran {
    id: string
    tanggal: string
    nominal: number
    kategori: string
    keterangan: string
    created_at: string
}

interface PembayaranBulan {
    bulan: string
    sudah_bayar: boolean
    jumlah: number
    tanggal_bayar: string | null
}

export default function KasKelasPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [kasSummary, setKasSummary] = useState<KasSummary>({
        total_pemasukan: 0,
        total_pengeluaran: 0,
        saldo: 0
    })
    const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([])
    const [pembayaranList, setPembayaranList] = useState<PembayaranBulan[]>([])
    const [totalTunggakan, setTotalTunggakan] = useState(0)
    const [nominalPerPeriode, setNominalPerPeriode] = useState(10000)

    useEffect(() => {
        if (user?.class_id && user?.id) {
            fetchKasData()
        }
    }, [user])

    const fetchKasData = async () => {
        if (!user?.class_id || !user?.id) return

        setLoading(true)
        try {
            // 1. Fetch kas settings
            const { data: settings } = await supabase
                .from('kas_settings')
                .select('nominal_per_periode')
                .eq('class_id', user.class_id)
                .eq('is_active', true)
                .single()

            if (settings) {
                setNominalPerPeriode(settings.nominal_per_periode)
            }

            // 2. Fetch summary kas
            const { data: pemasukan } = await supabase
                .from('kas_payments')
                .select('nominal')
                .eq('class_id', user.class_id)

            const { data: pengeluaran } = await supabase
                .from('kas_expenses')
                .select('nominal')
                .eq('class_id', user.class_id)

            const totalPemasukan = pemasukan?.reduce((sum, item) => sum + item.nominal, 0) || 0
            const totalPengeluaran = pengeluaran?.reduce((sum, item) => sum + item.nominal, 0) || 0

            setKasSummary({
                total_pemasukan: totalPemasukan,
                total_pengeluaran: totalPengeluaran,
                saldo: totalPemasukan - totalPengeluaran
            })

            // 3. Fetch pengeluaran details (10 terakhir)
            const { data: pengeluaranData } = await supabase
                .from('kas_expenses')
                .select('id, tanggal, nominal, kategori, keterangan, created_at')
                .eq('class_id', user.class_id)
                .order('tanggal', { ascending: false })
                .limit(10)

            if (pengeluaranData) {
                setPengeluaranList(pengeluaranData)
            }

            // 4. Determine semester months
            const currentDate = new Date()
            const currentMonth = currentDate.getMonth() + 1
            const currentYear = currentDate.getFullYear()

            let startMonth, endMonth, year
            if (currentMonth >= 7) {
                startMonth = 7
                endMonth = 12
                year = currentYear
            } else {
                startMonth = 1
                endMonth = 6
                year = currentYear
            }

            // 5. Build month list
            const bulanList: PembayaranBulan[] = []
            const monthNames = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ]

            for (let m = startMonth; m <= Math.min(endMonth, currentMonth); m++) {
                const bulanStr = `${monthNames[m - 1]} ${year}`

                const { data: payment } = await supabase
                    .from('kas_payments')
                    .select('tanggal, nominal')
                    .eq('class_id', user.class_id)
                    .eq('student_id', user.id)
                    .eq('periode_bulan', bulanStr)
                    .single()

                bulanList.push({
                    bulan: bulanStr,
                    sudah_bayar: !!payment,
                    jumlah: payment?.nominal || nominalPerPeriode,
                    tanggal_bayar: payment?.tanggal || null
                })
            }

            setPembayaranList(bulanList)

            // 6. Calculate tunggakan
            const tunggakan = bulanList
                .filter(item => !item.sudah_bayar)
                .reduce((sum, item) => sum + item.jumlah, 0)

            setTotalTunggakan(tunggakan)

        } catch (error: any) {
            console.error('Error fetching data:', error)
            toast.error('Gagal memuat data kas kelas')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-600" />
                    <p className="mt-2 text-sm text-gray-600">Memuat data kas kelas...</p>
                </motion.div>
            </div>
        )
    }

    const bulanBelumBayar = pembayaranList.filter(item => !item.sudah_bayar)
    const bulanSudahBayar = pembayaranList.filter(item => item.sudah_bayar)

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kas Kelas</h1>
                        <p className="text-sm text-gray-600">Informasi keuangan kelas Anda</p>
                    </div>
                </div>
            </motion.div>

            {/* Saldo & Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Saldo */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-br from-emerald-500 to-green-600 border-0 shadow-xl shadow-emerald-500/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <CardContent className="pt-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-emerald-100">Total Saldo Kas</p>
                                <Wallet className="h-5 w-5 text-white/80" />
                            </div>
                            <motion.p
                                className="text-3xl font-bold text-white mb-1"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            >
                                {formatCurrency(kasSummary.saldo)}
                            </motion.p>
                            <p className="text-xs text-emerald-100">Saldo saat ini</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Total Pemasukan */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0 shadow-xl shadow-blue-500/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <CardContent className="pt-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-blue-100">Total Pemasukan</p>
                                <ArrowDownCircle className="h-5 w-5 text-white/80" />
                            </div>
                            <p className="text-3xl font-bold text-white mb-1">
                                {formatCurrency(kasSummary.total_pemasukan)}
                            </p>
                            <p className="text-xs text-blue-100">Dari iuran siswa</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Total Pengeluaran */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 shadow-xl shadow-orange-500/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <CardContent className="pt-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-orange-100">Total Pengeluaran</p>
                                <ArrowUpCircle className="h-5 w-5 text-white/80" />
                            </div>
                            <p className="text-3xl font-bold text-white mb-1">
                                {formatCurrency(kasSummary.total_pengeluaran)}
                            </p>
                            <p className="text-xs text-orange-100">Untuk keperluan kelas</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Tunggakan Alert */}
            {totalTunggakan > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 p-3 bg-red-100 rounded-xl">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-900 text-lg mb-1">⚠️ Tunggakan Iuran</h3>
                                    <p className="text-sm text-red-700">
                                        Anda memiliki tunggakan iuran sebesar{' '}
                                        <span className="font-bold text-lg">{formatCurrency(totalTunggakan)}</span>
                                        {' '}untuk <span className="font-semibold">{bulanBelumBayar.length} bulan</span>
                                    </p>
                                    <p className="text-xs text-red-600 mt-2">
                                        Segera lakukan pembayaran ke bendahara kelas
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Status Pembayaran */}
            <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-2 border-purple-100">
                    <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b-2 border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="h-5 w-5 text-purple-600" />
                                    Status Iuran Anda
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Semester ini • {pembayaranList.length} bulan
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Progress</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {pembayaranList.length > 0 ? Math.round((bulanSudahBayar.length / pembayaranList.length) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {pembayaranList.length === 0 ? (
                            <div className="text-center py-12">
                                <DollarSign className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">Belum ada data pembayaran semester ini</p>
                                <p className="text-sm text-gray-400 mt-1">Hubungi bendahara untuk informasi lebih lanjut</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 mb-6">
                                    {pembayaranList.map((item, index) => (
                                        <motion.div
                                            key={item.bulan}
                                            className={`p-4 rounded-xl border-2 transition-all ${item.sudah_bayar
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm'
                                                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-sm'
                                                }`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.01, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl ${item.sudah_bayar ? 'bg-green-100' : 'bg-red-100'}`}>
                                                        {item.sudah_bayar ? (
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <Clock className="h-5 w-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">
                                                            {item.bulan}
                                                        </p>
                                                        {item.sudah_bayar && item.tanggal_bayar && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <Calendar className="h-3 w-3" />
                                                                Dibayar: {format(new Date(item.tanggal_bayar), 'dd MMM yyyy', { locale: id })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${item.sudah_bayar ? 'text-green-700' : 'text-red-700'}`}>
                                                        {formatCurrency(item.jumlah)}
                                                    </p>
                                                    <Badge
                                                        variant={item.sudah_bayar ? "default" : "destructive"}
                                                        className="text-xs mt-1"
                                                    >
                                                        {item.sudah_bayar ? '✓ Lunas' : '✗ Belum Bayar'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Summary */}
                                <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-2">
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">Sudah Dibayar</p>
                                            <p className="text-2xl font-bold text-green-600">{bulanSudahBayar.length}</p>
                                            <p className="text-xs text-gray-500">bulan</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-2">
                                                <Clock className="h-6 w-6 text-red-600" />
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">Belum Dibayar</p>
                                            <p className="text-2xl font-bold text-red-600">{bulanBelumBayar.length}</p>
                                            <p className="text-xs text-gray-500">bulan</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Riwayat Pengeluaran */}
            <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-2 border-orange-100">
                    <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b-2 border-orange-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Receipt className="h-5 w-5 text-orange-600" />
                            Riwayat Pengeluaran Kas
                        </CardTitle>
                        <CardDescription>10 pengeluaran terakhir kelas</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {pengeluaranList.length === 0 ? (
                            <div className="text-center py-12">
                                <TrendingDown className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">Belum ada riwayat pengeluaran</p>
                                <p className="text-sm text-gray-400 mt-1">Pengeluaran kelas akan muncul di sini</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pengeluaranList.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        className="p-4 bg-gradient-to-r from-white to-orange-50 rounded-xl border-2 border-orange-100 hover:shadow-md transition-all"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-orange-100 rounded-lg mt-0.5">
                                                        <Receipt className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900">{item.keterangan}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                {format(new Date(item.tanggal), 'dd MMM yyyy', { locale: id })}
                                                            </div>
                                                            {item.kategori && (
                                                                <Badge variant="outline" className="text-xs gap-1">
                                                                    <Tag className="h-3 w-3" />
                                                                    {item.kategori}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-red-600">
                                                    -{formatCurrency(item.nominal)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
