'use client'

import { useState } from 'react'
import { UserCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

    const handleOpenDialog = async () => {
        // Get total students count
        const { count } = await supabase
            .from('students_master')
            .select('*', { count: 'exact', head: true })

        setStudentCount(count || 0)
        setShowConfirm(true)
    }

    const handleConfirm = async () => {
        setLoading(true)

        try {
            const dateStr = formatDateForDB(date)

            // Get all students
            const { data: students, error: fetchError } = await supabase
                .from('students_master')
                .select('nomor_absen')

            if (fetchError) throw fetchError

            if (!students || students.length === 0) {
                alert('Tidak ada data siswa')
                return
            }

            // Prepare attendance records for all students
            const attendanceRecords = students.map((student) => ({
                nomor_absen: student.nomor_absen,
                status: 'Hadir',
                tanggal: dateStr,
                keterangan: null,
            }))

            // Batch upsert all records
            const { error: upsertError } = await supabase
                .from('attendance')
                .upsert(attendanceRecords, {
                    onConflict: 'nomor_absen,tanggal',
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Kehadiran Semua Siswa</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menandai semua siswa hadir untuk tanggal{' '}
                            <strong>{formatDateForDB(date)}</strong>?
                        </DialogDescription>
                    </DialogHeader>

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

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading}
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
