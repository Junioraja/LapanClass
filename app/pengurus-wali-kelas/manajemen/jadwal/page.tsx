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
import { supabase } from '@/lib/supabase'
import { ClassSchedule, Subject } from '@/lib/types'
import { toast } from 'sonner'
import { Calendar, Plus, Edit, Trash2, User } from 'lucide-react'

interface Student {
    id: string
    nama: string
    nis: string
}

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'] as const
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const DAY_LABELS: Record<typeof DAYS[number], string> = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
}

export default function JadwalPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [schedules, setSchedules] = useState<ClassSchedule[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedCell, setSelectedCell] = useState<{ hari: string; jam: number } | null>(null)
    const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null)

    const [formData, setFormData] = useState({
        subject_id: '',
        jam_mulai: 1,
        jam_selesai: 1,
        pj_siswa_id: '',
        keterangan: '',
    })

    useEffect(() => {
        if (user?.class_id) {
            fetchData(user.class_id)
        }
    }, [user])

    async function fetchData(classId: string) {
        setLoading(true)
        try {
            await Promise.all([
                fetchSchedules(classId),
                fetchSubjects(classId),
                fetchStudents(classId),
            ])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchSchedules(classId: string) {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
        *,
        subject:subjects(id, nama_mapel, nama_guru_default),
        pj_siswa:students_master(nama)
      `)
            .eq('class_id', classId)

        if (!error && data) {
            setSchedules(data as any)
        }
    }

    async function fetchSubjects(classId: string) {
        const { data } = await supabase
            .from('subjects')
            .select('*')
            .eq('class_id', classId)
            .order('nama_mapel')

        if (data) {
            setSubjects(data)
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

    function handleCellClick(hari: string, jam: number) {
        const existingSchedule = schedules.find(
            s => s.hari === hari && s.jam_mulai <= jam && s.jam_selesai >= jam
        )

        if (existingSchedule) {
            // Edit existing
            setEditingSchedule(existingSchedule)
            setFormData({
                subject_id: existingSchedule.subject_id,
                jam_mulai: existingSchedule.jam_mulai,
                jam_selesai: existingSchedule.jam_selesai,
                pj_siswa_id: existingSchedule.pj_siswa_id || '',
                keterangan: '',
            })
            setEditModalOpen(true)
        } else {
            // Add new
            setSelectedCell({ hari, jam })
            setFormData({
                subject_id: '',
                jam_mulai: jam,
                jam_selesai: jam,
                pj_siswa_id: '',
                keterangan: '',
            })
            setModalOpen(true)
        }
    }

    async function handleSave() {
        if (!user?.class_id || !selectedCell) return

        if (!formData.subject_id) {
            toast.error('Pilih mata pelajaran')
            return
        }

        try {
            const { error } = await supabase
                .from('schedules')
                .insert({
                    class_id: user.class_id,
                    hari: selectedCell.hari,
                    subject_id: formData.subject_id,
                    jam_mulai: formData.jam_mulai,
                    jam_selesai: formData.jam_selesai,
                    pj_siswa_id: formData.pj_siswa_id || null,
                })

            if (error) throw error

            toast.success('Jadwal berhasil ditambahkan!')
            setModalOpen(false)
            fetchSchedules(user.class_id)
        } catch (error) {
            console.error('Error saving schedule:', error)
            toast.error('Gagal menyimpan jadwal')
        }
    }

    async function handleUpdate() {
        if (!user?.class_id || !editingSchedule) return

        if (!formData.subject_id) {
            toast.error('Pilih mata pelajaran')
            return
        }

        try {
            const { error } = await supabase
                .from('schedules')
                .update({
                    subject_id: formData.subject_id,
                    jam_mulai: formData.jam_mulai,
                    jam_selesai: formData.jam_selesai,
                    pj_siswa_id: formData.pj_siswa_id || null,
                })
                .eq('id', editingSchedule.id)

            if (error) throw error

            toast.success('Jadwal berhasil diupdate!')
            setEditModalOpen(false)
            fetchSchedules(user.class_id)
        } catch (error) {
            console.error('Error updating schedule:', error)
            toast.error('Gagal mengupdate jadwal')
        }
    }

    async function handleDelete() {
        if (!user?.class_id || !editingSchedule) return

        try {
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', editingSchedule.id)

            if (error) throw error

            toast.success('Jadwal berhasil dihapus!')
            setEditModalOpen(false)
            fetchSchedules(user.class_id)
        } catch (error) {
            console.error('Error deleting schedule:', error)
            toast.error('Gagal menghapus jadwal')
        }
    }

    function getCellSchedule(hari: string, jam: number) {
        return schedules.find(
            s => s.hari === hari && s.jam_mulai <= jam && s.jam_selesai >= jam
        )
    }

    function isCellStart(hari: string, jam: number) {
        const schedule = getCellSchedule(hari, jam)
        return schedule && schedule.jam_mulai === jam
    }

    function getCellRowSpan(hari: string, jam: number) {
        const schedule = getCellSchedule(hari, jam)
        if (schedule && schedule.jam_mulai === jam) {
            return schedule.jam_selesai - schedule.jam_mulai + 1
        }
        return 1
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Jadwal Pelajaran</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Klik pada sel untuk menambah atau mengedit jadwal
                </p>
            </div>

            {/* Summary */}
            <Card className="mb-6 bg-purple-50 border-purple-200">
                <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                        <Calendar className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-2xl font-bold text-purple-600">{schedules.length}</p>
                            <p className="text-sm text-purple-700">Total Jadwal Tersusun</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Tabel Jadwal</CardTitle>
                    <CardDescription>Klik sel untuk menambah/edit jadwal pelajaran</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-gray-300 bg-gray-100 p-3 text-center font-semibold">
                                        Jam
                                    </th>
                                    {DAYS.map(day => (
                                        <th key={day} className="border border-gray-300 bg-gray-100 p-3 text-center font-semibold min-w-[150px]">
                                            {DAY_LABELS[day]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {HOURS.map(hour => (
                                    <tr key={hour}>
                                        <td className="border border-gray-300 bg-gray-50 p-3 text-center font-semibold">
                                            {hour}
                                        </td>
                                        {DAYS.map(day => {
                                            const schedule = getCellSchedule(day, hour)
                                            const isStart = isCellStart(day, hour)
                                            const rowSpan = getCellRowSpan(day, hour)

                                            // Skip cells that are part of a merged cell
                                            if (schedule && !isStart) {
                                                return null
                                            }

                                            return (
                                                <td
                                                    key={`${day}-${hour}`}
                                                    rowSpan={isStart ? rowSpan : 1}
                                                    className={`border border-gray-300 p-2 cursor-pointer transition-colors ${schedule
                                                        ? 'bg-purple-100 hover:bg-purple-200'
                                                        : 'hover:bg-gray-100'
                                                        }`}
                                                    onClick={() => handleCellClick(day, hour)}
                                                >
                                                    {schedule && isStart && (
                                                        <div className="text-sm">
                                                            <p className="font-semibold text-purple-900">
                                                                {schedule.subject?.nama_mapel}
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                {schedule.subject?.nama_guru_default}
                                                            </p>
                                                            {schedule.pj_siswa && (
                                                                <p className="text-xs text-purple-700 flex items-center gap-1 mt-1">
                                                                    <User className="h-3 w-3" />
                                                                    PJ: {schedule.pj_siswa.nama}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Jam {schedule.jam_mulai}-{schedule.jam_selesai}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {!schedule && (
                                                        <div className="text-center text-gray-400 text-xs">
                                                            +
                                                        </div>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Jadwal</DialogTitle>
                        <DialogDescription>
                            {selectedCell && `${DAY_LABELS[selectedCell.hari as typeof DAYS[number]]} - Jam ${selectedCell.jam}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Mata Pelajaran *</Label>
                            <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih mata pelajaran..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject.id} value={subject.id!}>
                                            {subject.nama_mapel} ({subject.nama_guru_default})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Jam Mulai</Label>
                                <Select
                                    value={formData.jam_mulai.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, jam_mulai: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOURS.map(h => (
                                            <SelectItem key={h} value={h.toString()}>Jam {h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Jam Selesai</Label>
                                <Select
                                    value={formData.jam_selesai.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, jam_selesai: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOURS.filter(h => h >= formData.jam_mulai).map(h => (
                                            <SelectItem key={h} value={h.toString()}>Jam {h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>PJ Siswa (Opsional)</Label>
                            <Select value={formData.pj_siswa_id || 'none'} onValueChange={(v) => setFormData({ ...formData, pj_siswa_id: v === 'none' ? '' : v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih PJ..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tidak ada</SelectItem>
                                    {students.map(student => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.nama} ({student.nis})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700">
                            Simpan
                        </Button>
                        <Button onClick={() => setModalOpen(false)} variant="outline">
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit/Delete Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Jadwal</DialogTitle>
                        <DialogDescription>
                            {editingSchedule && `${DAY_LABELS[editingSchedule.hari]} - Jam ${editingSchedule.jam_mulai}-${editingSchedule.jam_selesai}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Mata Pelajaran *</Label>
                            <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject.id} value={subject.id!}>
                                            {subject.nama_mapel} ({subject.nama_guru_default})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Jam Mulai</Label>
                                <Select
                                    value={formData.jam_mulai.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, jam_mulai: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOURS.map(h => (
                                            <SelectItem key={h} value={h.toString()}>Jam {h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Jam Selesai</Label>
                                <Select
                                    value={formData.jam_selesai.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, jam_selesai: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOURS.filter(h => h >= formData.jam_mulai).map(h => (
                                            <SelectItem key={h} value={h.toString()}>Jam {h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>PJ Siswa (Opsional)</Label>
                            <Select value={formData.pj_siswa_id || 'none'} onValueChange={(v) => setFormData({ ...formData, pj_siswa_id: v === 'none' ? '' : v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tidak ada</SelectItem>
                                    {students.map(student => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.nama} ({student.nis})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleUpdate} className="flex-1 bg-purple-600 hover:bg-purple-700">
                            Update
                        </Button>
                        <Button onClick={handleDelete} variant="outline" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </Button>
                        <Button onClick={() => setEditModalOpen(false)} variant="outline">
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
