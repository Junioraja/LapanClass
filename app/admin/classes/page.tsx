'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { Class } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Users } from 'lucide-react'

export default function ClassManagementPage() {
    const [classes, setClasses] = useState<any[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedClass, setSelectedClass] = useState<any | null>(null)
    const [className, setClassName] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchClasses()
    }, [])

    async function fetchClasses() {
        const { data } = await supabase
            .from('classes')
            .select('*')
            .order('nama_kelas')

        if (data) {
            // Get student count for each class
            const classesWithCount = await Promise.all(
                data.map(async (cls) => {
                    const { count } = await supabase
                        .from('students_master')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', cls.id)

                    return { ...cls, student_count: count || 0 }
                })
            )
            setClasses(classesWithCount)
        }
    }

    function handleAddClick() {
        setEditMode(false)
        setSelectedClass(null)
        setClassName('')
        setModalOpen(true)
    }

    function handleEditClick(cls: any) {
        setEditMode(true)
        setSelectedClass(cls)
        setClassName(cls.nama_kelas)
        setModalOpen(true)
    }

    async function handleSave() {
        if (!className.trim()) {
            toast.error('Nama kelas tidak boleh kosong')
            return
        }

        setLoading(true)

        try {
            if (editMode && selectedClass) {
                // Update
                const { error } = await supabase
                    .from('classes')
                    .update({ nama_kelas: className })
                    .eq('id', selectedClass.id)

                if (error) throw error
                toast.success('Kelas berhasil diupdate')
            } else {
                // Create
                const { error } = await supabase
                    .from('classes')
                    .insert({ nama_kelas: className })

                if (error) throw error
                toast.success('Kelas berhasil ditambahkan')
            }

            setModalOpen(false)
            fetchClasses()
        } catch (error) {
            console.error('Error saving class:', error)
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!selectedClass) return

        setLoading(true)

        try {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', selectedClass.id)

            if (error) throw error

            toast.success('Kelas berhasil dihapus')
            setDeleteConfirmModal(false)
            fetchClasses()
        } catch (error: any) {
            console.error('Error deleting class:', error)
            if (error.code === '23503') {
                toast.error('Kelas tidak dapat dihapus karena masih memiliki siswa atau data terkait')
            } else {
                toast.error('Terjadi kesalahan')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manajemen Kelas</h1>
                    <p className="mt-2 text-sm text-gray-600">Kelola data kelas</p>
                </div>
                <Button onClick={handleAddClick} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kelas
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Kelas</TableHead>
                            <TableHead>Jumlah Siswa</TableHead>
                            <TableHead>Tanggal Dibuat</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    Belum ada kelas
                                </TableCell>
                            </TableRow>
                        ) : (
                            classes.map((cls) => (
                                <TableRow key={cls.id}>
                                    <TableCell className="font-medium">{cls.nama_kelas}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            {cls.student_count} siswa
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(cls.created_at).toLocaleDateString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditClick(cls)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setSelectedClass(cls)
                                                    setDeleteConfirmModal(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Add/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editMode ? 'Edit Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
                        <DialogDescription>
                            {editMode ? 'Ubah nama kelas' : 'Masukkan nama kelas baru'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="class_name">Nama Kelas</Label>
                            <Input
                                id="class_name"
                                placeholder="Contoh: XI RPL 1, XII TKJ 2"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button
                            onClick={() => setModalOpen(false)}
                            variant="outline"
                            disabled={loading}
                        >
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteConfirmModal} onOpenChange={setDeleteConfirmModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kelas</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kelas {selectedClass?.nama_kelas}?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                        <p className="text-sm text-red-900">
                            ⚠️ <strong>Peringatan:</strong> Kelas tidak dapat dihapus jika masih memiliki siswa atau data terkait.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {loading ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                        <Button
                            onClick={() => setDeleteConfirmModal(false)}
                            variant="outline"
                            disabled={loading}
                        >
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
