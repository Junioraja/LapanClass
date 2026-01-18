'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { KasExpense } from '@/lib/types'
import { toast } from 'sonner'
import { TrendingDown, Plus, Filter, Edit, Trash2, Calendar } from 'lucide-react'

const KATEGORI_OPTIONS = [
    'Alat Tulis',
    'Perawatan',
    'Acara',
    'Konsumsi',
    'Kebersihan',
    'Perlengkapan',
    'Lainnya',
]

export default function PengeluaranPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [expenses, setExpenses] = useState<KasExpense[]>([])
    const [filteredExpenses, setFilteredExpenses] = useState<KasExpense[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<KasExpense | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Filter states
    const [filterKategori, setFilterKategori] = useState('all')
    const [filterMonth, setFilterMonth] = useState('all')

    // Form states
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        nominal: 0,
        kategori: 'Alat Tulis',
        keterangan: '',
    })

    useEffect(() => {
        if (user?.class_id) {
            fetchExpenses(user.class_id)
        }
    }, [user])

    useEffect(() => {
        applyFilters()
    }, [filterKategori, filterMonth, expenses])

    async function fetchExpenses(classId: string) {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('kas_expenses')
                .select('*')
                .eq('class_id', classId)
                .order('tanggal', { ascending: false })

            if (error) throw error
            setExpenses(data || [])
        } catch (error) {
            console.error('Error fetching expenses:', error)
            toast.error('Gagal memuat data pengeluaran')
        } finally {
            setLoading(false)
        }
    }

    function applyFilters() {
        let filtered = [...expenses]

        if (filterKategori && filterKategori !== 'all') {
            filtered = filtered.filter(e => e.kategori === filterKategori)
        }

        if (filterMonth && filterMonth !== 'all') {
            filtered = filtered.filter(e => {
                const expenseMonth = new Date(e.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                return expenseMonth === filterMonth
            })
        }

        setFilteredExpenses(filtered)
    }

    function openAddModal() {
        setEditingExpense(null)
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            nominal: 0,
            kategori: 'Alat Tulis',
            keterangan: '',
        })
        setModalOpen(true)
    }

    function openEditModal(expense: KasExpense) {
        setEditingExpense(expense)
        setFormData({
            tanggal: expense.tanggal,
            nominal: expense.nominal,
            kategori: expense.kategori,
            keterangan: expense.keterangan,
        })
        setModalOpen(true)
    }

    function openDeleteDialog(id: string) {
        setDeletingId(id)
        setDeleteDialogOpen(true)
    }

    async function handleSave() {
        if (!user?.class_id) return

        // Validation
        if (!formData.tanggal) {
            toast.error('Tanggal harus diisi')
            return
        }
        if (formData.nominal <= 0) {
            toast.error('Nominal harus lebih dari 0')
            return
        }
        if (!formData.keterangan.trim()) {
            toast.error('Keterangan harus diisi')
            return
        }

        setSaving(true)
        try {
            if (editingExpense) {
                // Update
                const { error } = await supabase
                    .from('kas_expenses')
                    .update({
                        tanggal: formData.tanggal,
                        nominal: formData.nominal,
                        kategori: formData.kategori,
                        keterangan: formData.keterangan,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingExpense.id)

                if (error) throw error
                toast.success('Pengeluaran berhasil diupdate!')
            } else {
                // Create
                const { error } = await supabase
                    .from('kas_expenses')
                    .insert({
                        class_id: user.class_id,
                        tanggal: formData.tanggal,
                        nominal: formData.nominal,
                        kategori: formData.kategori,
                        keterangan: formData.keterangan,
                        created_by: user.id,
                    })

                if (error) throw error
                toast.success('Pengeluaran berhasil ditambahkan!')
            }

            setModalOpen(false)
            fetchExpenses(user.class_id)
        } catch (error) {
            console.error('Error saving expense:', error)
            toast.error('Gagal menyimpan pengeluaran')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!user?.class_id || !deletingId) return

        try {
            const { error } = await supabase
                .from('kas_expenses')
                .delete()
                .eq('id', deletingId)

            if (error) throw error

            toast.success('Pengeluaran berhasil dihapus!')
            setDeleteDialogOpen(false)
            setDeletingId(null)
            fetchExpenses(user.class_id)
        } catch (error) {
            console.error('Error deleting expense:', error)
            toast.error('Gagal menghapus pengeluaran')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const totalPengeluaran = filteredExpenses.reduce((sum, e) => sum + e.nominal, 0)

    // Get unique months from expenses
    const uniqueMonths = Array.from(
        new Set(expenses.map(e => new Date(e.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })))
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
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
                    <h1 className="text-3xl font-bold text-gray-900">Pengeluaran Kas</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Catat dan kelola pengeluaran kas kelas
                    </p>
                </div>
                <Button onClick={openAddModal} className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pengeluaran
                </Button>
            </div>

            {/* Summary Card */}
            <Card className="mb-6 bg-red-50 border-red-200">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <TrendingDown className="h-8 w-8 text-red-600" />
                            <div>
                                <p className="text-sm text-red-700">Total Pengeluaran (Filtered)</p>
                                <p className="text-2xl font-bold text-red-900">
                                    {formatCurrency(totalPengeluaran)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-red-700">{filteredExpenses.length} Transaksi</p>
                            <p className="text-xs text-red-600">dari {expenses.length} total</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                            <Label>Kategori</Label>
                            <Select value={filterKategori} onValueChange={setFilterKategori}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {KATEGORI_OPTIONS.map(kategori => (
                                        <SelectItem key={kategori} value={kategori}>{kategori}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Bulan</Label>
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Bulan</SelectItem>
                                    {uniqueMonths.map(month => (
                                        <SelectItem key={month} value={month}>{month}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {(filterKategori !== 'all' || filterMonth !== 'all') && (
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setFilterKategori('all')
                                    setFilterMonth('all')
                                }}
                            >
                                Reset Filter
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengeluaran</CardTitle>
                    <CardDescription>Riwayat semua pengeluaran kas kelas</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredExpenses.length === 0 ? (
                        <div className="text-center py-12">
                            <TrendingDown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">
                                {expenses.length === 0 ? 'Belum ada pengeluaran' : 'Tidak ada data sesuai filter'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="text-right">Nominal</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {new Date(expense.tanggal).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                    {expense.kategori}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {expense.keterangan}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-red-600">
                                                {formatCurrency(expense.nominal)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditModal(expense)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => openDeleteDialog(expense.id!)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingExpense ? 'Ubah data pengeluaran kas' : 'Catat pengeluaran kas kelas'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="tanggal">Tanggal *</Label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={formData.tanggal}
                                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="kategori">Kategori *</Label>
                            <Select value={formData.kategori} onValueChange={(v) => setFormData({ ...formData, kategori: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {KATEGORI_OPTIONS.map(kategori => (
                                        <SelectItem key={kategori} value={kategori}>{kategori}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nominal">Nominal *</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Rp</span>
                                <Input
                                    id="nominal"
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
                            <Label htmlFor="keterangan">Keterangan *</Label>
                            <Textarea
                                id="keterangan"
                                placeholder="Untuk apa pengeluaran ini..."
                                value={formData.keterangan}
                                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button onClick={() => setModalOpen(false)} variant="outline">
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
