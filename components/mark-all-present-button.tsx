'use client'

import { useState } from 'react'
import { UserCheck, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { formatDateForDB } from '@/lib/date-utils'

interface MarkAllPresentButtonProps {
    date: Date
    onSuccess?: () => void
    disabled?: boolean
}

export function MarkAllPresentButton({ date, onSuccess, disabled }: MarkAllPresentButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [studentCount, setStudentCount] = useState(0)
    const [selectedDate, setSelectedDate] = useState('')

    const handleOpenDialog = async () => {
        // Set default date to today
        const todayString = formatDateForDB(new Date())
        setSelectedDate(todayString)

        // Get total students count
        const { count } = await supabase
            .from('students_master')
            .select('*', { count: 'exact', head: true })

        setStudentCount(count || 0)
        setShowConfirm(true)
    }

    const handleConfirm = async () => {
        if (!selectedDate) {
            alert('Pilih tanggal terlebih dahulu')
            return
        }

        setLoading(true)

        try {
            // Get all students with their IDs and class_id
            const { data: students, error: fetchError } = await supabase
                .from('students_master')
                .select('id, nis, nama, class_id')

            if (fetchError) throw fetchError

            if (!students || students.length === 0) {
                alert('Tidak ada data siswa')
                return
            }

            // Prepare attendance records for all students using student_id
            const attendanceRecords = students.map((student) => ({
                student_id: student.id,      // Use student UUID from students_master
                class_id: student.class_id,  // Get class_id from student
                status: 'Hadir',
                tanggal: selectedDate,
                keterangan: null,
                is_approved: true,           // Auto-approved by pengurus kelas
            }))

            // Batch upsert all records
            const { error: upsertError } = await supabase
                .from('attendance')
                .upsert(attendanceRecords, {
                    onConflict: 'student_id,tanggal',  // Unique constraint
                })

            if (upsertError) throw upsertError

            setShowConfirm(false)
            onSuccess?.()
        } catch (error) {
            console.error('Error marking all present:', error)
            alert('Gagal menandai kehadiran semua siswa. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <>
            <Button
                onClick={handleOpenDialog}
                disabled={disabled}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
            >
                <UserCheck className="mr-2 h-5 w-5" />
                Hadirkan Semua Siswa
            </Button>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Hadirkan Semua Siswa</DialogTitle>
                        <DialogDescription>
                            Pilih tanggal untuk menandai semua siswa sebagai hadir
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Date Picker */}
                        <div className="space-y-2">
                            <Label htmlFor="attendance-date" className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                                Tanggal Kehadiran
                            </Label>
                            <Input
                                id="attendance-date"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full"
                            />
                            {selectedDate && (
                                <p className="text-sm text-gray-600">
                                    {formatDisplayDate(selectedDate)}
                                </p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                            <p className="text-sm text-emerald-900">
                                ✅ <strong>{studentCount} siswa</strong> akan ditandai sebagai{' '}
                                <strong>"Hadir"</strong>
                            </p>
                            <p className="text-xs text-emerald-700 mt-2">
                                Catatan: Jika ada yang tidak hadir, Anda masih bisa mengedit absensi mereka secara
                                manual setelahnya.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading || !selectedDate}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ya, Hadirkan Semua
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
