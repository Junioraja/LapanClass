'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { KasPayment, KasSettings } from '@/lib/types'
import { toast } from 'sonner'
import { Wallet, Plus, Settings as SettingsIcon, Filter } from 'lucide-react'
import Link from 'next/link'

interface Student {
    id: string
    nama: string
    nis: string
}

export default function KasKelasPage() {
    const { user } = useAuth()
    const [modalOpen, setModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<KasSettings | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [payments, setPayments] = useState<KasPayment[]>([])
    const [filteredPayments, setFilteredPayments] = useState<KasPayment[]>([])

    // Filter states
    const [filterMonth, setFilterMonth] = useState('all')
    const [filterStudent, setFilterStudent] = useState('all')

    // Form states
    const [inputMode, setInputMode] = useState<'otomatis' | 'custom'>('otomatis')
    const [formData, setFormData] = useState({
        student_id: '',
        jumlah_periode: 1,
        periode_bulan: '',
        nominal: 0,
        metode: 'cash' as 'cash' | 'qris',
        keterangan: '',
    })

    useEffect(() => {
        if (user?.class_id) {
            fetchData(user.class_id)
        }
    }, [user])

    useEffect(() => {
        applyFilters()
    }, [filterMonth, filterStudent, payments])

    async function fetchData(classId: string) {
        setLoading(true)
        try {
            await Promise.all([
                fetchSettings(classId),
                fetchStudents(classId),
                fetchPayments(classId),
            ])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchSettings(classId: string) {
        const { data } = await supabase
            .from('kas_settings')
            .select('*')
            .eq('class_id', classId)
            .eq('is_active', true)
            .single()

        if (data) {
            setSettings(data)
            setFormData(prev => ({ ...prev, metode: data.metode_default }))
        }
    }

    async function fetchStudents(classId: string) {
        const { data } = await supabase
            .from('students_master')
            .select('id, nama, nis')
            .eq('class_id', classId)
            .order('nama')

        if (data) {
            setStudents(data)
        }
    }

    async function fetchPayments(classId: string) {
        const { data } = await supabase
            .from('kas_payments')
            .select(`
        *,
        student:students_master(nama, nis)
      `)
            .eq('class_id', classId)
            .order('tanggal', { ascending: false })

        if (data) {
            setPayments(data as any)
        }
    }

    function applyFilters() {
        let filtered = [...payments]

        if (filterMonth && filterMonth !== 'all') {
            filtered = filtered.filter(p => p.periode_bulan === filterMonth)
        }

        if (filterStudent && filterStudent !== 'all') {
            filtered = filtered.filter(p => p.student_id === filterStudent)
        }

        setFilteredPayments(filtered)
    }

    function openModal() {
        if (!settings) {
            toast.error('Harap atur settings kas terlebih dahulu')
            return
        }

        // Set default bulan ke bulan ini
        const now = new Date()
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        const currentMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`

        setFormData({
            student_id: '',
            jumlah_periode: 1,
            periode_bulan: currentMonth,
            nominal: settings.nominal_per_periode,
            metode: settings.metode_default,
            keterangan: '',
        })
        setInputMode('otomatis')
        setModalOpen(true)
    }

    async function handleSave() {
        if (!user?.class_id || !settings) return

        // Validation
        if (!formData.student_id) {
            toast.error('Pilih siswa')
            return
        }
        if (!formData.periode_bulan) {
            toast.error('Pilih periode bulan')
            return
        }
        if (formData.nominal <= 0) {
            toast.error('Nominal harus lebih dari 0')
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase
                .from('kas_payments')
                .insert({
                    class_id: user.class_id,
                    student_id: formData.student_id,
                    tanggal: new Date().toISOString().split('T')[0],
                    periode_bulan: formData.periode_bulan,
                    jumlah_periode: formData.jumlah_periode,
                    nominal: formData.nominal,
                    metode: formData.metode,
                    is_auto: inputMode === 'otomatis',
                    keterangan: formData.keterangan,
                    created_by: user.id,
                })

            if (error) throw error

            toast.success('Pembayaran kas berhasil dicatat!')
            setModalOpen(false)
            fetchPayments(user.class_id)
        } catch (error) {
            console.error('Error saving payment:', error)
            toast.error('Gagal menyimpan pembayaran')
        } finally {
            setSaving(false)
        }
    }

    const calculateNominal = () => {
        if (inputMode === 'otomatis' && settings) {
            return formData.jumlah_periode * settings.nominal_per_periode
        }
        return formData.nominal
    }

    // Generate bulan options (6 bulan ke belakang, bulan ini, 6 bulan ke depan)
    const generateBulanOptions = () => {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        const options: string[] = []
        const now = new Date()

        for (let i = -6; i <= 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
            options.push(`${monthNames[date.getMonth()]} ${date.getFullYear()}`)
        }

        return options
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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Kas Kelas</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Input dan kelola pembayaran kas kelas
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/pengurus-wali-kelas/bendahara/kas/settings">
                        <Button variant="outline">
                            <SettingsIcon className="h-4 w-4 mr-2" />
                            Settings
                        </Button>
                    </Link>
                    <Button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Input Kas
                    </Button>
                </div>
            </div>

            {/* Settings Info */}
            {settings && (
                <Card className="mb-6 bg-emerald-50 border-emerald-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Wallet className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-900">
                                        Periode: <span className="capitalize">{settings.periode_type}</span>
                                    </p>
                                    <p className="text-xs text-emerald-700">
                                        Nominal: {formatCurrency(settings.nominal_per_periode)} per periode
                                    </p>
                                </div>
                            </div>
                            <Link href="/pengurus-wali-kelas/bendahara/kas/settings">
                                <Button variant="ghost" size="sm">Ubah</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!settings && (
                <Card className="mb-6 border-amber-300 bg-amber-50">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-amber-900">Pengaturan kas belum dikonfigurasi</p>
                                <p className="text-sm text-amber-700">Harap atur periode dan nominal terlebih dahulu</p>
                            </div>
                            <Link href="/pengurus-wali-kelas/bendahara/kas/settings">
                                <Button className="bg-amber-600 hover:bg-amber-700">
                                    <SettingsIcon className="h-4 w-4 mr-2" />
                                    Atur Settings
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filter */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter Data
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bulan/Periode</Label>
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua bulan</SelectItem>
                                    {Array.from(new Set(payments.map(p => p.periode_bulan))).map(month => (
                                        <SelectItem key={month} value={month}>{month}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Siswa</Label>
                            <Select value={filterStudent} onValueChange={setFilterStudent}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua siswa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua siswa</SelectItem>
                                    {students.map(student => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.nama} ({student.nis})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {(filterMonth && filterMonth !== 'all') || (filterStudent && filterStudent !== 'all') ? (
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setFilterMonth('all')
                                    setFilterStudent('all')
                                }}
                            >
                                Reset Filter
                            </Button>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>History Pembayaran Kas</CardTitle>
                    <CardDescription>Daftar semua pembayaran kas kelas</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredPayments.length === 0 ? (
                        <div className="text-center py-12">
                            <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">Belum ada pembayaran kas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Nama Siswa</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Nominal</TableHead>
                                        <TableHead>Metode</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                {new Date(payment.tanggal).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{payment.student?.nama}</p>
                                                    <p className="text-xs text-gray-500">NIS: {payment.student?.nis}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p>{payment.periode_bulan}</p>
                                                    {payment.jumlah_periode > 1 && (
                                                        <p className="text-xs text-gray-500">{payment.jumlah_periode}x periode</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(payment.nominal)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${payment.metode === 'cash'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {payment.metode.toUpperCase()}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Input Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Input Pembayaran Kas</DialogTitle>
                        <DialogDescription>Catat pembayaran kas siswa</DialogDescription>
                    </DialogHeader>

                    <Tabs value={inputMode} onValueChange={(v: any) => {
                        setInputMode(v)
                        if (v === 'otomatis' && settings) {
                            setFormData(prev => ({ ...prev, nominal: settings.nominal_per_periode }))
                        }
                    }}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="otomatis">Otomatis</TabsTrigger>
                            <TabsTrigger value="custom">Custom</TabsTrigger>
                        </TabsList>

                        <TabsContent value="otomatis" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Pilih Siswa *</Label>
                                <Select value={formData.student_id} onValueChange={(v) => setFormData({ ...formData, student_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih siswa..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(student => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.nama} ({student.nis})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Periode *</Label>
                                <Select
                                    value={formData.jumlah_periode.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, jumlah_periode: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <SelectItem key={n} value={n.toString()}>
                                                {n} {settings?.periode_type} ({formatCurrency((settings?.nominal_per_periode || 0) * n)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Bulan/Periode *</Label>
                                <Select value={formData.periode_bulan} onValueChange={(v) => setFormData({ ...formData, periode_bulan: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {generateBulanOptions().map(month => (
                                            <SelectItem key={month} value={month}>{month}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Nominal</Label>
                                <div className="p-3 bg-gray-100 rounded-lg">
                                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(calculateNominal())}</p>
                                    <p className="text-xs text-gray-600">
                                        {formData.jumlah_periode}x {formatCurrency(settings?.nominal_per_periode || 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Metode Pembayaran</Label>
                                <Select value={formData.metode} onValueChange={(v: any) => setFormData({ ...formData, metode: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="qris">QRIS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Keterangan (Opsional)</Label>
                                <Textarea
                                    placeholder="Catatan tambahan..."
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="custom" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Pilih Siswa *</Label>
                                <Select value={formData.student_id} onValueChange={(v) => setFormData({ ...formData, student_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih siswa..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(student => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.nama} ({student.nis})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Periode *</Label>
                                <Select
                                    value={formData.jumlah_periode.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, jumlah_periode: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <SelectItem key={n} value={n.toString()}>
                                                {n} {settings?.periode_type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Bulan/Periode *</Label>
                                <Select value={formData.periode_bulan} onValueChange={(v) => setFormData({ ...formData, periode_bulan: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {generateBulanOptions().map(month => (
                                            <SelectItem key={month} value={month}>{month}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Nominal Custom *</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Rp</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={formData.nominal || ''}
                                        onChange={(e) => setFormData({ ...formData, nominal: parseFloat(e.target.value) || 0 })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Metode Pembayaran</Label>
                                <Select value={formData.metode} onValueChange={(v: any) => setFormData({ ...formData, metode: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="qris">QRIS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Keterangan (Opsional)</Label>
                                <Textarea
                                    placeholder="Catatan tambahan..."
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button onClick={() => setModalOpen(false)} variant="outline">
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
