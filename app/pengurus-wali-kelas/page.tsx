'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ClassEquipment, ClassFinance } from '@/lib/types'
import { toast } from 'sonner'
import {
    BookOpen,
    Wallet,
    Users,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    Package,
    ArrowRight,
    Plus,
    Edit,
    Trash2
} from 'lucide-react'

interface DashboardStats {
    todayAttendance: { present: number; total: number }
    monthlyAttendance: number
    balance: number
    monthlyIncome: number
    equipmentTotal: number
    equipmentNeedRepair: number
}

export default function PengurusWaliKelasPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats>({
        todayAttendance: { present: 0, total: 0 },
        monthlyAttendance: 0,
        balance: 0,
        monthlyIncome: 0,
        equipmentTotal: 0,
        equipmentNeedRepair: 0,
    })
    const [weeklyAttendance, setWeeklyAttendance] = useState<{ day: string; percentage: number }[]>([])
    const [monthlyFinance, setMonthlyFinance] = useState<{ month: string; amount: number }[]>([])
    const [equipment, setEquipment] = useState<ClassEquipment[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [editingEquipment, setEditingEquipment] = useState<ClassEquipment | null>(null)
    const [formData, setFormData] = useState({
        nama_barang: '',
        jumlah: 1,
        kondisi: 'baik' as 'baik' | 'perlu_ganti' | 'rusak',
        keterangan: '',
    })

    useEffect(() => {
        if (loading) return

        if (!user || (user.role !== 'sekretaris' && user.role !== 'bendahara' && user.role !== 'wali_kelas' && user.role !== 'ketua_kelas')) {
            router.push('/login')
            return
        }

        if (user.class_id) {
            fetchDashboardData(user.class_id)
        }
    }, [user, loading, router])

    async function fetchDashboardData(classId: string) {
        await Promise.all([
            fetchStats(classId),
            fetchWeeklyAttendance(classId),
            fetchMonthlyFinance(classId),
            fetchEquipment(classId),
        ])
    }

    async function fetchStats(classId: string) {
        try {
            // Get total students
            const { count: totalStudents } = await supabase
                .from('students_master')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId)

            // Get today attendance
            const today = new Date().toISOString().split('T')[0]
            const { count: presentToday } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId)
                .eq('tanggal', today)
                .eq('status', 'Hadir')

            // Get monthly attendance percentage
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            const { data: monthlyAtt } = await supabase
                .from('attendance')
                .select('status')
                .eq('class_id', classId)
                .gte('tanggal', startOfMonth.toISOString().split('T')[0])

            const monthlyPercentage = monthlyAtt && monthlyAtt.length > 0
                ? Math.round((monthlyAtt.filter(a => a.status === 'Hadir').length / monthlyAtt.length) * 100)
                : 0

            // Get finance balance from kas_payments
            const { data: kasPayments } = await supabase
                .from('kas_payments')
                .select('nominal')
                .eq('class_id', classId)

            // Get expenses
            const { data: expenses } = await supabase
                .from('kas_expenses')
                .select('nominal')
                .eq('class_id', classId)

            const totalIncome = kasPayments?.reduce((acc, p) => acc + (p.nominal || 0), 0) || 0
            const totalExpenses = expenses?.reduce((acc, e) => acc + (e.nominal || 0), 0) || 0
            const balance = totalIncome - totalExpenses

            // Get monthly income from kas
            const { data: monthlyKas } = await supabase
                .from('kas_payments')
                .select('nominal')
                .eq('class_id', classId)
                .gte('tanggal', startOfMonth.toISOString().split('T')[0])

            const monthlyIncome = monthlyKas?.reduce((acc, p) => acc + (p.nominal || 0), 0) || 0

            // Equipment stats - set to 0 for now (can be implemented later)
            const equipmentTotal = 0
            const equipmentNeedRepair = 0

            setStats({
                todayAttendance: { present: presentToday || 0, total: totalStudents || 0 },
                monthlyAttendance: monthlyPercentage,
                balance,
                monthlyIncome,
                equipmentTotal,
                equipmentNeedRepair,
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    async function fetchWeeklyAttendance(classId: string) {
        try {
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
            const weekData = []

            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                const dayName = days[date.getDay()]

                const { data } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('class_id', classId)
                    .eq('tanggal', dateStr)

                const percentage = data && data.length > 0
                    ? Math.round((data.filter(a => a.status === 'Hadir').length / data.length) * 100)
                    : 0

                weekData.push({ day: dayName, percentage })
            }

            setWeeklyAttendance(weekData)
        } catch (error) {
            console.error('Error fetching weekly attendance:', error)
        }
    }

    async function fetchMonthlyFinance(classId: string) {
        try {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun']
            const monthData = []

            for (let i = 5; i >= 0; i--) {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]

                // Get kas income for this month
                const { data: kasData } = await supabase
                    .from('kas_payments')
                    .select('nominal')
                    .eq('class_id', classId)
                    .gte('tanggal', monthStart)
                    .lte('tanggal', monthEnd)

                // Get expenses for this month
                const { data: expenseData } = await supabase
                    .from('kas_expenses')
                    .select('nominal')
                    .eq('class_id', classId)
                    .gte('tanggal', monthStart)
                    .lte('tanggal', monthEnd)

                const income = kasData?.reduce((acc, k) => acc + (k.nominal || 0), 0) || 0
                const expense = expenseData?.reduce((acc, e) => acc + (e.nominal || 0), 0) || 0
                const balance = income - expense

                monthData.push({ month: months[date.getMonth()], amount: balance })
            }

            setMonthlyFinance(monthData)
        } catch (error) {
            console.error('Error fetching monthly finance:', error)
        }
    }

    async function fetchEquipment(classId: string) {
        try {
            const { data, error } = await supabase
                .from('class_equipment')
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setEquipment(data || [])
        } catch (error) {
            console.error('Error fetching equipment:', error)
        }
    }

    async function handleSaveEquipment() {
        if (!user?.class_id) return

        try {
            if (editingEquipment) {
                // Update
                const { error } = await supabase
                    .from('class_equipment')
                    .update({
                        nama_barang: formData.nama_barang,
                        jumlah: formData.jumlah,
                        kondisi: formData.kondisi,
                        keterangan: formData.keterangan,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingEquipment.id)

                if (error) throw error
                toast.success('Barang berhasil diupdate')
            } else {
                // Create
                const { error } = await supabase
                    .from('class_equipment')
                    .insert({
                        class_id: user.class_id,
                        nama_barang: formData.nama_barang,
                        jumlah: formData.jumlah,
                        kondisi: formData.kondisi,
                        keterangan: formData.keterangan,
                    })

                if (error) throw error
                toast.success('Barang berhasil ditambahkan')
            }

            setModalOpen(false)
            setEditingEquipment(null)
            setFormData({ nama_barang: '', jumlah: 1, kondisi: 'baik', keterangan: '' })
            fetchEquipment(user.class_id)
            fetchStats(user.class_id)
        } catch (error) {
            console.error('Error saving equipment:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    async function handleDeleteEquipment(id: string) {
        if (!user?.class_id) return
        if (!confirm('Yakin ingin menghapus barang ini?')) return

        try {
            const { error } = await supabase
                .from('class_equipment')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Barang berhasil dihapus')
            fetchEquipment(user.class_id)
            fetchStats(user.class_id)
        } catch (error) {
            console.error('Error deleting equipment:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    function openAddModal() {
        setEditingEquipment(null)
        setFormData({ nama_barang: '', jumlah: 1, kondisi: 'baik', keterangan: '' })
        setModalOpen(true)
    }

    function openEditModal(item: ClassEquipment) {
        setEditingEquipment(item)
        setFormData({
            nama_barang: item.nama_barang,
            jumlah: item.jumlah,
            kondisi: item.kondisi,
            keterangan: item.keterangan || '',
        })
        setModalOpen(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard Pengurus Kelas</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Selamat datang, <span className="font-semibold text-emerald-600">{user.nama}</span> ({user.role.replace('_', ' ').toUpperCase()})
                            </p>
                        </div>
                        <Link href="/">
                            <Button variant="outline">Logout</Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation Gates */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-emerald-500">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                                    <BookOpen className="h-6 w-6 text-blue-600 group-hover:text-white" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl">Menu Sekretaris</CardTitle>
                                    <CardDescription>Absensi, Jurnal, Laporan</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/pengurus-wali-kelas/sekretaris">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                    Buka Menu Sekretaris
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-emerald-500">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-500 transition-colors">
                                    <Wallet className="h-6 w-6 text-emerald-600 group-hover:text-white" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl">Menu Bendahara</CardTitle>
                                    <CardDescription>Kas, Keuangan, Laporan</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/pengurus-wali-kelas/bendahara">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    Buka Menu Bendahara
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-emerald-500">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-500 transition-colors">
                                    <Users className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl">Manajemen Kelas</CardTitle>
                                    <CardDescription>Siswa, Mapel, Jadwal</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/pengurus-wali-kelas/manajemen">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    Buka Manajemen Kelas
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview Stats */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview Kelas</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Kehadiran Hari Ini</CardTitle>
                            <Users className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.todayAttendance.present}/{stats.todayAttendance.total}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Siswa hadir</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Kehadiran Bulan Ini</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{stats.monthlyAttendance}%</div>
                            <p className="text-xs text-gray-500 mt-1">Rata-rata kehadiran</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Saldo Kas Kelas</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.balance)}</div>
                            <p className="text-xs text-emerald-600 flex items-center mt-1">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{formatCurrency(stats.monthlyIncome)} bulan ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Kelengkapan Kelas</CardTitle>
                            <Package className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{stats.equipmentTotal} Item</div>
                            {stats.equipmentNeedRepair > 0 && (
                                <p className="text-xs text-red-600 flex items-center mt-1">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    {stats.equipmentNeedRepair} perlu diperbaiki
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Grafik Kehadiran Mingguan</CardTitle>
                            <CardDescription>7 hari terakhir</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {weeklyAttendance.map((item) => (
                                    <div key={item.day}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-gray-600">{item.day}</span>
                                            <span className="font-semibold text-gray-900">{item.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-emerald-600 h-2 rounded-full transition-all"
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Grafik Saldo Bulanan</CardTitle>
                            <CardDescription>6 bulan terakhir</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {monthlyFinance.map((item, index) => {
                                    const maxAmount = Math.max(...monthlyFinance.map(m => m.amount), 1)
                                    const percentage = (item.amount / maxAmount) * 100
                                    return (
                                        <div key={`${item.month}-${index}`}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-gray-600">{item.month}</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Kelengkapan Kelas Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Kelengkapan Kelas</CardTitle>
                            <CardDescription>Daftar inventaris dan barang yang dibutuhkan kelas</CardDescription>
                        </div>
                        <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Barang
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {equipment.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>Belum ada data kelengkapan kelas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {equipment.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Package className={`h-5 w-5 ${item.kondisi === 'baik' ? 'text-emerald-600' :
                                                item.kondisi === 'perlu_ganti' ? 'text-amber-600' : 'text-red-600'
                                                }`} />
                                            <div>
                                                <p className="font-medium text-gray-900">{item.nama_barang}</p>
                                                <p className="text-sm text-gray-500">
                                                    Qty: {item.jumlah} | {item.kondisi.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteEquipment(item.id!)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Equipment Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEquipment ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
                        <DialogDescription>
                            {editingEquipment ? 'Ubah data barang' : 'Tambahkan barang kelengkapan kelas'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nama_barang">Nama Barang</Label>
                            <Input
                                id="nama_barang"
                                placeholder="Contoh: Papan Tulis"
                                value={formData.nama_barang}
                                onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jumlah">Jumlah</Label>
                            <Input
                                id="jumlah"
                                type="number"
                                min="1"
                                value={formData.jumlah}
                                onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 1 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="kondisi">Kondisi</Label>
                            <Select
                                value={formData.kondisi}
                                onValueChange={(value: any) => setFormData({ ...formData, kondisi: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="baik">Baik</SelectItem>
                                    <SelectItem value="perlu_ganti">Perlu Ganti</SelectItem>
                                    <SelectItem value="rusak">Rusak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                            <Textarea
                                id="keterangan"
                                placeholder="Catatan tambahan..."
                                value={formData.keterangan}
                                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSaveEquipment}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            Simpan
                        </Button>
                        <Button onClick={() => setModalOpen(false)} variant="outline">
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
