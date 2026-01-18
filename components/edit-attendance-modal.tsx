'use client'

import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { AttendanceStatus } from '@/lib/types'
import { formatIndonesianDate } from '@/lib/date-utils'
import { toast } from 'sonner'

interface EditAttendanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: number
    studentName: string
    date: string // YYYY-MM-DD
    currentStatus?: AttendanceStatus
    currentKeterangan?: string
    attendanceId?: string
    onSuccess: () => void
}

export function EditAttendanceModal({
    open,
    onOpenChange,
    studentId,
    studentName,
    date,
    currentStatus,
    currentKeterangan,
    attendanceId,
    onSuccess,
}: EditAttendanceModalProps) {
    const [status, setStatus] = useState<AttendanceStatus>(currentStatus || 'Hadir')
    const [keterangan, setKeterangan] = useState(currentKeterangan || '')
    const [loading, setLoading] = useState(false)

    // Reset form when modal opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setStatus(currentStatus || 'Hadir')
            setKeterangan(currentKeterangan || '')
        }
        onOpenChange(newOpen)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (attendanceId) {
                // Update existing record
                const { error } = await supabase
                    .from('attendance')
                    .update({
                        status,
                        keterangan: keterangan || null,
                    })
                    .eq('id', attendanceId)

                if (error) {
                    console.error('Error updating attendance:', error)
                    toast.error('Gagal mengupdate kehadiran. Silakan coba lagi.')
                    return
                }

                toast.success('Kehadiran berhasil diupdate!')
            } else {
                // Create new record
                const { error } = await supabase
                    .from('attendance')
                    .insert([
                        {
                            nomor_absen: studentId,
                            tanggal: date,
                            status,
                            keterangan: keterangan || null,
                        },
                    ])

                if (error) {
                    console.error('Error creating attendance:', error)
                    toast.error('Gagal menyimpan kehadiran. Silakan coba lagi.')
                    return
                }

                toast.success('Kehadiran berhasil disimpan!')
            }

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error in handleSubmit:', error)
            toast.error('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    const dateObj = new Date(date + 'T12:00:00') // Add time to avoid timezone issues
    const formattedDate = formatIndonesianDate(dateObj)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Kehadiran Siswa</DialogTitle>
                    <DialogDescription>
                        {attendanceId ? 'Update data kehadiran siswa' : 'Tambah data kehadiran siswa'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Student Info */}
                    <div className="rounded-lg bg-sky-50 p-3 space-y-1">
                        <p className="text-sm font-medium text-sky-900">
                            <strong>Siswa:</strong> {studentName} (No. {studentId})
                        </p>
                        <p className="text-sm text-sky-700">
                            <strong>Tanggal:</strong> {formattedDate}
                        </p>
                    </div>

                    {/* Status Select */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Status Kehadiran *</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Hadir">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                                        Hadir
                                    </div>
                                </SelectItem>
                                <SelectItem value="Sakit">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                        Sakit
                                    </div>
                                </SelectItem>
                                <SelectItem value="Izin">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                        Izin
                                    </div>
                                </SelectItem>
                                <SelectItem value="Alpha">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                        Alpha
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Keterangan */}
                    <div className="space-y-2">
                        <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                        <Textarea
                            id="keterangan"
                            placeholder="Tambahkan keterangan jika diperlukan..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="bg-sky-600 hover:bg-sky-700"
                            disabled={loading}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
