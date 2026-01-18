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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { ClassSavings, SavingsPayment, PeriodeType, MetodePembayaran } from '@/lib/types'
import { toast } from 'sonner'
import { PiggyBank, Plus, Edit, Trash2, DollarSign, TrendingUp, Users } from 'lucide-react'

interface Student {
    id: string
    nama: string
    nis: string
}

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function TabunganPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [savings, setSavings] = useState<ClassSavings[]>([])
    const [filteredSavings, setFilteredSavings] = useState<ClassSavings[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [editingSaving, setEditingSaving] = useState<ClassSavings | null>(null)
    const [selectedSaving, setSelectedSaving] = useState<ClassSavings | null>(null)
    const [savingProgress, setSavingProgress] = useState<{ [key: string]: number }>({})
    const [filterJenis, setFilterJenis] = useState<'all' | 'tabungan' | 'iuran'>('all')

    // Form states untuk CRUD tabungan/iuran
    const [formData, setFormData] = useState({
        nama: '',
        jenis: 'tabungan' as 'tabungan' | 'iuran',
        target_amount: 0,
        target_date: '',
        periode_type: 'mingguan' as PeriodeType,
        periode_value: undefined as number | undefined,
        periode_day: [] as string[],
        nominal_per_periode: 0,
        metode_default: 'cash' as MetodePembayaran,
    })

    // Form states untuk payment
    const [paymentData, setPaymentData] = useState({
        student_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        nominal: 0,
        metode: 'cash' as MetodePembayaran,
        keterangan: '',
    })

    // Periode configuration states
    const [harianMode, setHarianMode] = useState<'setiap_hari' | 'setiap_x_hari'>('setiap_hari')

    useEffect(() => {
        if (user?.class_id) {
            fetchData(user.class_id)
        }
    }, [user])

    useEffect(() => {
        applyFilter()
    }, [filterJenis, savings])

    async function fetchData(classId: string) {
        setLoading(true)
        try {
            await Promise.all([
                fetchSavings(classId),
                fetchStudents(classId),
            ])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchSavings(classId: string) {
        const { data, error } = await supabase
            .from('class_savings')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching savings:', error)
            return
        }

        if (data) {
            setSavings(data)
            // Fetch progress for each tabungan
            for (const saving of data) {
                if (saving.jenis === 'tabungan') {
                    await fetchSavingProgress(saving.id!)
                }
            }
        }
    }

    async function fetchSavingProgress(savingId: string) {
        const { data } = await supabase
            .from('savings_payments')
            .select('nominal')
            .eq('savings_id', savingId)

        const total = data?.reduce((sum, p) => sum + p.nominal, 0) || 0
        setSavingProgress(prev => ({ ...prev, [savingId]: total }))
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

    function applyFilter() {
        if (filterJenis === 'all') {
            setFilteredSavings(savings)
        } else {
            setFilteredSavings(savings.filter(s => s.jenis === filterJenis))
        }
    }

    function openAddModal() {
        setEditingSaving(null)
        setFormData({
            nama: '',
            jenis: 'tabungan',
            target_amount: 0,
            target_date: '',
            periode_type: 'mingguan',
            periode_value: undefined,
            periode_day: [],
            nominal_per_periode: 0,
            metode_default: 'cash',
        })
        setModalOpen(true)
    }

    function openEditModal(saving: ClassSavings) {
        setEditingSaving(saving)
        setFormData({
            nama: saving.nama,
            jenis: saving.jenis,
            target_amount: saving.target_amount || 0,
            target_date: saving.target_date || '',
            periode_type: saving.periode_type,
            periode_value: saving.periode_value,
            periode_day: saving.periode_day || [],
            nominal_per_periode: saving.nominal_per_periode,
            metode_default: saving.metode_default,
        })
        if (saving.periode_type === 'harian') {
            setHarianMode(saving.periode_value ? 'setiap_x_hari' : 'setiap_hari')
        }
        setModalOpen(true)
    }

    function openPaymentModal(saving: ClassSavings) {
        setSelectedSaving(saving)
        setPaymentData({
            student_id: '',
            tanggal: new Date().toISOString().split('T')[0],
            nominal: saving.nominal_per_periode,
            metode: saving.metode_default,
            keterangan: '',
        })
        setPaymentModalOpen(true)
    }

    async function handleSaveSaving() {
        if (!user?.class_id) return

        // Validation
        if (!formData.nama.trim()) {
            toast.error('Nama harus diisi')
            return
        }
        if (formData.nominal_per_periode <= 0) {
            toast.error('Nominal per periode harus lebih dari 0')
            return
        }
        if (formData.jenis === 'tabungan' && formData.target_amount <= 0) {
            toast.error('Target nominal harus lebih dari 0')
            return
        }

        try {
            const dataToSave = {
                class_id: user.class_id,
                nama: formData.nama,
                jenis: formData.jenis,
                target_amount: formData.jenis === 'tabungan' ? formData.target_amount : null,
                target_date: formData.jenis === 'tabungan' ? formData.target_date : null,
                periode_type: formData.periode_type,
                periode_value: formData.periode_type === 'harian' && harianMode === 'setiap_x_hari'
                    ? formData.periode_value
                    : null,
                periode_day: formData.periode_type === 'mingguan' || formData.periode_type === 'bulanan'
                    ? formData.periode_day
                    : null,
                nominal_per_periode: formData.nominal_per_periode,
                metode_default: formData.metode_default,
                is_active: true,
                updated_at: new Date().toISOString(),
            }

            if (editingSaving) {
                const { error } = await supabase
                    .from('class_savings')
                    .update(dataToSave)
                    .eq('id', editingSaving.id)

                if (error) throw error
                toast.success(`${formData.jenis === 'tabungan' ? 'Tabungan' : 'Iuran'} berhasil diupdate!`)
            } else {
                const { error } = await supabase
                    .from('class_savings')
                    .insert(dataToSave)

                if (error) throw error
                toast.success(`${formData.jenis === 'tabungan' ? 'Tabungan' : 'Iuran'} berhasil ditambahkan!`)
            }

            setModalOpen(false)
            fetchSavings(user.class_id)
        } catch (error) {
            console.error('Error saving saving:', error)
            toast.error('Gagal menyimpan data')
        }
    }

    async function handleSavePayment() {
        if (!user?.class_id || !selectedSaving) return

        if (!paymentData.student_id) {
            toast.error('Pilih siswa')
            return
        }
        if (paymentData.nominal <= 0) {
            toast.error('Nominal harus lebih dari 0')
            return
        }

        try {
            const { error } = await supabase
                .from('savings_payments')
                .insert({
                    savings_id: selectedSaving.id,
                    student_id: paymentData.student_id,
                    tanggal: paymentData.tanggal,
                    nominal: paymentData.nominal,
                    metode: paymentData.metode,
                    keterangan: paymentData.keterangan,
                    created_by: user.id,
                })

            if (error) throw error

            toast.success('Pembayaran berhasil dicatat!')
            setPaymentModalOpen(false)
            fetchSavingProgress(selectedSaving.id!)
        } catch (error) {
            console.error('Error saving payment:', error)
            toast.error('Gagal menyimpan pembayaran')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Yakin ingin menghapus? Semua data pembayaran akan ikut terhapus.')) return

        try {
            const { error } = await supabase
                .from('class_savings')
                .delete()
                .eq('id', id)

            if (error) throw error

            toast.success('Berhasil dihapus!')
            if (user?.class_id) {
                fetchSavings(user.class_id)
            }
        } catch (error) {
            console.error('Error deleting:', error)
            toast.error('Gagal menghapus')
        }
    }

    const handleHariChange = (hari: string, checked: boolean) => {
        if (checked) {
            setFormData({
                ...formData,
                periode_day: [...(formData.periode_day || []), hari.toLowerCase()]
            })
        } else {
            setFormData({
                ...formData,
                periode_day: (formData.periode_day || []).filter(d => d !== hari.toLowerCase())
            })
        }
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
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
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
                    <h1 className="text-3xl font-bold text-gray-900">Tabungan & Iuran</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Kelola tabungan kelas dan iuran rutin
                    </p>
                </div>
                <Button onClick={openAddModal} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Baru
                </Button>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filterJenis} onValueChange={(v: any) => setFilterJenis(v)} className="mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="all">Semua</TabsTrigger>
                    <TabsTrigger value="tabungan">Tabungan</TabsTrigger>
                    <TabsTrigger value="iuran">Iuran</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Card Grid */}
            {filteredSavings.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <PiggyBank className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">
                                {savings.length === 0 ? 'Belum ada tabungan atau iuran' : 'Tidak ada data sesuai filter'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSavings.map((saving) => {
                        const progress = savingProgress[saving.id!] || 0
                        const percentage = saving.jenis === 'tabungan' && saving.target_amount
                            ? Math.min((progress / saving.target_amount) * 100, 100)
                            : 0

                        return (
                            <Card key={saving.id} className="hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${saving.jenis === 'tabungan' ? 'bg-purple-100' : 'bg-blue-100'
                                                }`}>
                                                {saving.jenis === 'tabungan' ? (
                                                    <PiggyBank className="h-5 w-5 text-purple-600" />
                                                ) : (
                                                    <DollarSign className="h-5 w-5 text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{saving.nama}</CardTitle>
                                                <p className="text-xs text-gray-500 capitalize">{saving.jenis}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Tabungan Progress */}
                                    {saving.jenis === 'tabungan' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Progress:</span>
                                                <span className="font-semibold">{percentage.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatCurrency(progress)}</span>
                                                <span>{formatCurrency(saving.target_amount!)}</span>
                                            </div>
                                            {saving.target_date && (
                                                <p className="text-xs text-gray-500">
                                                    Target: {new Date(saving.target_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Iuran Total */}
                                    {saving.jenis === 'iuran' && (
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-700">Total Terkumpul:</p>
                                            <p className="text-xl font-bold text-blue-900">{formatCurrency(progress)}</p>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Per Periode:</span>
                                            <span className="font-medium">{formatCurrency(saving.nominal_per_periode)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Periode:</span>
                                            <span className="font-medium capitalize">{saving.periode_type}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            onClick={() => openPaymentModal(saving)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                            size="sm"
                                        >
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                            Input Bayar
                                        </Button>
                                        <Button
                                            onClick={() => openEditModal(saving)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(saving.id!)}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSaving ? 'Edit' : 'Tambah'} {formData.jenis === 'tabungan' ? 'Tabungan' : 'Iuran'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSaving ? 'Ubah data' : 'Buat'} {formData.jenis === 'tabungan' ? 'tabungan kelas' : 'iuran rutin'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Jenis */}
                        <div className="space-y-2">
                            <Label>Jenis</Label>
                            <RadioGroup
                                value={formData.jenis}
                                onValueChange={(v: any) => setFormData({ ...formData, jenis: v })}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="tabungan" id="tabungan" />
                                    <Label htmlFor="tabungan" className="cursor-pointer">Tabungan (dengan target)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="iuran" id="iuran" />
                                    <Label htmlFor="iuran" className="cursor-pointer">Iuran (rutin tanpa target)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Nama */}
                        <div className="space-y-2">
                            <Label>Nama *</Label>
                            <Input
                                placeholder={formData.jenis === 'tabungan' ? 'Tabungan Study Tour' : 'Iuran Jumat Amal'}
                                value={formData.nama}
                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            />
                        </div>

                        {/* Target (khusus tabungan) */}
                        {formData.jenis === 'tabungan' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Target Nominal *</Label>
                                    <div className="flex items-center gap-2">
                                        <span>Rp</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.target_amount || ''}
                                            onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={formData.target_date}
                                        onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {/* Periode Configuration - sama seperti kas settings */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Periode Pembayaran</Label>
                            <RadioGroup
                                value={formData.periode_type}
                                onValueChange={(value: PeriodeType) => {
                                    setFormData({ ...formData, periode_type: value, periode_day: [], periode_value: undefined })
                                }}
                            >
                                <div className="flex items-center space-x-2 p-2 border rounded">
                                    <RadioGroupItem value="harian" id="per-harian" />
                                    <Label htmlFor="per-harian" className="cursor-pointer">Harian</Label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 border rounded">
                                    <RadioGroupItem value="mingguan" id="per-mingguan" />
                                    <Label htmlFor="per-mingguan" className="cursor-pointer">Mingguan</Label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 border rounded">
                                    <RadioGroupItem value="bulanan" id="per-bulanan" />
                                    <Label htmlFor="per-bulanan" className="cursor-pointer">Bulanan</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Detail Periode - Mingguan */}
                        {formData.periode_type === 'mingguan' && (
                            <div className="p-3 bg-purple-50 rounded-lg space-y-3">
                                <Label className="text-sm font-semibold">Pilih Hari</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {HARI_OPTIONS.map((hari) => (
                                        <div key={hari} className="flex items-center space-x-2 p-2 border rounded hover:bg-white">
                                            <Checkbox
                                                id={`hari-${hari}`}
                                                checked={(formData.periode_day || []).includes(hari.toLowerCase())}
                                                onCheckedChange={(checked) => handleHariChange(hari, checked as boolean)}
                                            />
                                            <Label htmlFor={`hari-${hari}`} className="cursor-pointer text-sm">{hari}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nominal per Periode */}
                        <div className="space-y-2">
                            <Label>Nominal per Periode *</Label>
                            <div className="flex items-center gap-2">
                                <span>Rp</span>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.nominal_per_periode || ''}
                                    onChange={(e) => setFormData({ ...formData, nominal_per_periode: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* Metode Default */}
                        <div className="space-y-2">
                            <Label>Metode Pembayaran Default</Label>
                            <Select
                                value={formData.metode_default}
                                onValueChange={(v: MetodePembayaran) => setFormData({ ...formData, metode_default: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="qris">QRIS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSaveSaving}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                            Simpan
                        </Button>
                        <Button onClick={() => setModalOpen(false)} variant="outline">
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Input Pembayaran</DialogTitle>
                        <DialogDescription>
                            Catat pembayaran {selectedSaving?.jenis} - {selectedSaving?.nama}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Pilih Siswa *</Label>
                            <Select value={paymentData.student_id} onValueChange={(v) => setPaymentData({ ...paymentData, student_id: v })}>
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
                            <Label>Nominal *</Label>
                            <div className="flex items-center gap-2">
                                <span>Rp</span>
                                <Input
                                    type="number"
                                    min="0"
                                    value={paymentData.nominal || ''}
                                    onChange={(e) => setPaymentData({ ...paymentData, nominal: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Default: {formatCurrency(selectedSaving?.nominal_per_periode || 0)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Tanggal</Label>
                            <Input
                                type="date"
                                value={paymentData.tanggal}
                                onChange={(e) => setPaymentData({ ...paymentData, tanggal: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Metode Pembayaran</Label>
                            <Select value={paymentData.metode} onValueChange={(v: any) => setPaymentData({ ...paymentData, metode: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="qris">QRIS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSavePayment}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            Simpan
                        </Button>
                        <Button onClick={() => setPaymentModalOpen(false)} variant="outline">
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
