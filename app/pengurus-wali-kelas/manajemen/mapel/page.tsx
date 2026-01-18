'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { Subject } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'

export default function MapelPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        nama_mapel: '',
        nama_guru_default: '',
    })

    useEffect(() => {
        if (user?.class_id) {
            fetchSubjects(user.class_id)
        }
    }, [user])

    async function fetchSubjects(classId: string) {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('class_id', classId)
                .order('nama_mapel')

            if (error) throw error
            setSubjects(data || [])
        } catch (error) {
            console.error('Error fetching subjects:', error)
            toast.error('Gagal memuat data mata pelajaran')
        } finally {
            setLoading(false)
        }
    }

    function openAddModal() {
        setEditingSubject(null)
        setFormData({
            nama_mapel: '',
            nama_guru_default: '',
        })
        setModalOpen(true)
    }

    function openEditModal(subject: Subject) {
        setEditingSubject(subject)
        setFormData({
            nama_mapel: subject.nama_mapel,
            nama_guru_default: subject.nama_guru_default,
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
        if (!formData.nama_mapel.trim()) {
            toast.error('Nama mata pelajaran harus diisi')
            return
        }
        if (!formData.nama_guru_default.trim()) {
            toast.error('Nama guru harus diisi')
            return
        }

        setSaving(true)
        try {
            if (editingSubject) {
                // Update
                const { error } = await supabase
                    .from('subjects')
                    .update({
                        nama_mapel: formData.nama_mapel,
                        nama_guru_default: formData.nama_guru_default,
                    })
                    .eq('id', editingSubject.id)

                if (error) throw error
                toast.success('Mata pelajaran berhasil diupdate!')
            } else {
                // Create
                const { error } = await supabase
                    .from('subjects')
                    .insert({
                        class_id: user.class_id,
                        nama_mapel: formData.nama_mapel,
                        nama_guru_default: formData.nama_guru_default,
                    })

                if (error) throw error
                toast.success('Mata pelajaran berhasil ditambahkan!')
            }

            setModalOpen(false)
            fetchSubjects(user.class_id)
        } catch (error) {
            console.error('Error saving subject:', error)
            toast.error('Gagal menyimpan data')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!user?.class_id || !deletingId) return

        try {
            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', deletingId)

            if (error) throw error

            toast.success('Mata pelajaran berhasil dihapus!')
            setDeleteDialogOpen(false)
            setDeletingId(null)
            fetchSubjects(user.class_id)
        } catch (error) {
            console.error('Error deleting subject:', error)
            toast.error('Gagal menghapus mata pelajaran')
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Mata Pelajaran</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Kelola mata pelajaran dan guru pengampu
                    </p>
                </div>
                <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Mapel
                </Button>
            </div>

            {/* Summary */}
            <Card className="mb-6 bg-emerald-50 border-emerald-200">
                <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                        <BookOpen className="h-8 w-8 text-emerald-600" />
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{subjects.length}</p>
                            <p className="text-sm text-emerald-700">Total Mata Pelajaran</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Mata Pelajaran</CardTitle>
                    <CardDescription>Data mata pelajaran yang diajarkan</CardDescription>
                </CardHeader>
                <CardContent>
                    {subjects.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">Belum ada mata pelajaran</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Nama Mata Pelajaran</TableHead>
                                        <TableHead>Guru Pengampu</TableHead>
                                        <TableHead className="text-center w-32">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subjects.map((subject, index) => (
                                        <TableRow key={subject.id}>
                                            <TableCell className="font-semibold">{index + 1}</TableCell>
                                            <TableCell className="font-medium">{subject.nama_mapel}</TableCell>
                                            <TableCell>{subject.nama_guru_default}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditModal(subject)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => openDeleteDialog(subject.id!)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSubject ? 'Ubah informasi mata pelajaran' : 'Masukkan data mata pelajaran baru'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nama_mapel">Nama Mata Pelajaran *</Label>
                            <Input
                                id="nama_mapel"
                                placeholder="Contoh: Matematika"
                                value={formData.nama_mapel}
                                onChange={(e) => setFormData({ ...formData, nama_mapel: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nama_guru">Guru Pengampu *</Label>
                            <Input
                                id="nama_guru"
                                placeholder="Contoh: Bapak/Ibu ..."
                                value={formData.nama_guru_default}
                                onChange={(e) => setFormData({ ...formData, nama_guru_default: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus mata pelajaran ini? Ini akan menghapus semua jadwal terkait.
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
