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
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react'

interface Student {
    id: string
    class_id: string
    nis: string
    nama: string
    nomor_absen: number
    created_at?: string
}

export default function SiswaPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<Student[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const [formData, setFormData] = useState({
        nis: '',
        nama: '',
        nomor_absen: 0,
    })

    useEffect(() => {
        if (user?.class_id) {
            fetchStudents(user.class_id)
        }
    }, [user])

    useEffect(() => {
        if (searchQuery) {
            const filtered = students.filter(s =>
                s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.nis.includes(searchQuery) ||
                s.nomor_absen.toString().includes(searchQuery)
            )
            setFilteredStudents(filtered)
        } else {
            setFilteredStudents(students)
        }
    }, [searchQuery, students])

    async function fetchStudents(classId: string) {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('students_master')
                .select('*')
                .eq('class_id', classId)
                .order('nomor_absen')

            if (error) throw error
            setStudents(data || [])
        } catch (error) {
            console.error('Error fetching students:', error)
            toast.error('Gagal memuat data siswa')
        } finally {
            setLoading(false)
        }
    }

    function openAddModal() {
        setEditingStudent(null)
        setFormData({
            nis: '',
            nama: '',
            nomor_absen: students.length + 1,
        })
        setModalOpen(true)
    }

    function openEditModal(student: Student) {
        setEditingStudent(student)
        setFormData({
            nis: student.nis,
            nama: student.nama,
            nomor_absen: student.nomor_absen,
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
        if (!formData.nis.trim()) {
            toast.error('NIS harus diisi')
            return
        }
        if (!formData.nama.trim()) {
            toast.error('Nama harus diisi')
            return
        }
        if (formData.nomor_absen <= 0) {
            toast.error('Nomor absen harus lebih dari 0')
            return
        }

        setSaving(true)
        try {
            if (editingStudent) {
                // Update
                const { error } = await supabase
                    .from('students_master')
                    .update({
                        nis: formData.nis,
                        nama: formData.nama,
                        nomor_absen: formData.nomor_absen,
                    })
                    .eq('id', editingStudent.id)

                if (error) throw error
                toast.success('Data siswa berhasil diupdate!')
            } else {
                // Create
                const { error } = await supabase
                    .from('students_master')
                    .insert({
                        class_id: user.class_id,
                        nis: formData.nis,
                        nama: formData.nama,
                        nomor_absen: formData.nomor_absen,
                    })

                if (error) throw error
                toast.success('Siswa berhasil ditambahkan!')
            }

            setModalOpen(false)
            fetchStudents(user.class_id)
        } catch (error) {
            console.error('Error saving student:', error)
            toast.error('Gagal menyimpan data siswa')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!user?.class_id || !deletingId) return

        try {
            const { error } = await supabase
                .from('students_master')
                .delete()
                .eq('id', deletingId)

            if (error) throw error

            toast.success('Siswa berhasil dihapus!')
            setDeleteDialogOpen(false)
            setDeletingId(null)
            fetchStudents(user.class_id)
        } catch (error) {
            console.error('Error deleting student:', error)
            toast.error('Gagal menghapus siswa')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
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
                    <h1 className="text-3xl font-bold text-gray-900">Data Siswa</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Kelola data siswa di kelas Anda
                    </p>
                </div>
                <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Siswa
                </Button>
            </div>

            {/* Search & Summary */}
            <Card className="mb-6">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                                <p className="text-sm text-gray-500">Total Siswa</p>
                            </div>
                        </div>
                        <div className="w-full max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari NIS, nama, atau nomor absen..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Siswa</CardTitle>
                    <CardDescription>Data seluruh siswa dalam kelas</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">
                                {students.length === 0 ? 'Belum ada data siswa' : 'Tidak ada data sesuai pencarian'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">No. Absen</TableHead>
                                        <TableHead>NIS</TableHead>
                                        <TableHead>Nama Lengkap</TableHead>
                                        <TableHead className="text-center w-32">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-semibold">{student.nomor_absen}</TableCell>
                                            <TableCell className="font-mono text-sm">{student.nis}</TableCell>
                                            <TableCell className="font-medium">{student.nama}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditModal(student)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => openDeleteDialog(student.id)}
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
                            {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingStudent ? 'Ubah informasi siswa' : 'Masukkan data siswa baru'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nomor_absen">Nomor Absen *</Label>
                            <Input
                                id="nomor_absen"
                                type="number"
                                min="1"
                                value={formData.nomor_absen || ''}
                                onChange={(e) => setFormData({ ...formData, nomor_absen: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nis">NIS *</Label>
                            <Input
                                id="nis"
                                placeholder="Contoh: 12345"
                                value={formData.nis}
                                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Lengkap *</Label>
                            <Input
                                id="nama"
                                placeholder="Contoh: Ahmad Fauzi"
                                value={formData.nama}
                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                            Apakah Anda yakin ingin menghapus siswa ini? Tindakan ini tidak dapat dibatalkan.
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
