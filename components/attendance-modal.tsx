'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Loader2, Clock, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Student, AttendanceStatus, Holiday } from '@/lib/types'
import { timeToPeriods } from '@/lib/time-utils'
import { formatDateForDB, canInputAttendance, getHolidayStatusText } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface AttendanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function AttendanceModal({ open, onOpenChange, onSuccess }: AttendanceModalProps) {
    const [students, setStudents] = useState<Student[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [date, setDate] = useState<Date>(new Date())
    const [status, setStatus] = useState<AttendanceStatus>('Sakit')
    const [keterangan, setKeterangan] = useState('')
    const [isPartialLeave, setIsPartialLeave] = useState(false)
    const [startTime, setStartTime] = useState('07:00')
    const [endTime, setEndTime] = useState('09:00')
    const [loading, setLoading] = useState(false)

    // Array of selected students (multiple)
    const [selectedStudents, setSelectedStudents] = useState<(Student | null)[]>([null])
    const [searchOpenIndex, setSearchOpenIndex] = useState<number | null>(null)

    // Fetch students and holidays
    useEffect(() => {
        async function fetchData() {
            const { data: studentsData } = await supabase
                .from('students_master')
                .select('*')
                .order('nomor_absen')

            const { data: holidaysData } = await supabase.from('holidays').select('*')

            if (studentsData) setStudents(studentsData)
            if (holidaysData) setHolidays(holidaysData)
        }

        if (open) {
            fetchData()
        }
    }, [open])

    const holidayStatus = getHolidayStatusText(date, holidays)
    const canInput = canInputAttendance(date, holidays)

    const addStudentSlot = () => {
        setSelectedStudents([...selectedStudents, null])
    }

    const removeStudentSlot = (index: number) => {
        if (selectedStudents.length === 1) {
            toast.warning('Minimal harus ada 1 slot siswa')
            return
        }
        setSelectedStudents(selectedStudents.filter((_, i) => i !== index))
    }

    const updateSelectedStudent = (index: number, student: Student | null) => {
        const newSelected = [...selectedStudents]
        newSelected[index] = student
        setSelectedStudents(newSelected)
    }

    const handleSubmit = async () => {
        // Filter only selected students
        const validStudents = selectedStudents.filter((s) => s !== null) as Student[]

        if (validStudents.length === 0) {
            toast.error('Pilih minimal 1 siswa')
            return
        }

        if (!canInput) {
            toast.error('Tidak dapat menginput absensi pada hari libur atau weekend!')
            return
        }

        setLoading(true)

        try {
            const dateStr = formatDateForDB(date)
            let successCount = 0

            // Process each student with same status/keterangan/periods
            for (const student of validStudents) {
                // Upsert attendance record using student_id
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('attendance')
                    .upsert(
                        {
                            student_id: student.id,   // Use UUID from students_master
                            class_id: student.class_id,  // Required NOT NULL field
                            status,
                            tanggal: dateStr,
                            keterangan: keterangan || null,
                        },
                        {
                            onConflict: 'student_id,tanggal',
                        }
                    )
                    .select()
                    .single()

                if (attendanceError) {
                    console.error(`Error for student ${student.nama}:`, attendanceError)
                    continue
                }

                // Handle partial leave periods (same for all students)
                if (status === 'Izin' && isPartialLeave && startTime && endTime && attendanceData) {
                    const periods = timeToPeriods(startTime, endTime)

                    await supabase
                        .from('attendance_periods')
                        .delete()
                        .eq('attendance_id', attendanceData.id)

                    if (periods.length > 0) {
                        const periodsData = periods.map((jam_ke) => ({
                            attendance_id: attendanceData.id,
                            jam_ke,
                        }))

                        await supabase.from('attendance_periods').insert(periodsData)
                    }
                } else if (attendanceData) {
                    await supabase
                        .from('attendance_periods')
                        .delete()
                        .eq('attendance_id', attendanceData.id)
                }

                successCount++
            }

            // Reset form
            setSelectedStudents([null])
            setStatus('Sakit')
            setKeterangan('')
            setIsPartialLeave(false)
            setStartTime('07:00')
            setEndTime('09:00')
            setDate(new Date())

            toast.success(`Berhasil menyimpan absensi ${successCount} siswa!`)
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Error saving attendance:', error)
            toast.error('Gagal menyimpan absensi. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Catat Absensi</DialogTitle>
                    <DialogDescription>
                        Tandai siswa yang tidak hadir atau izin untuk jam pelajaran tertentu
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Holiday Warning */}
                    {holidayStatus && (
                        <div
                            className={cn(
                                'rounded-lg border p-3 text-sm',
                                !canInput
                                    ? 'border-red-200 bg-red-50 text-red-900'
                                    : 'border-amber-200 bg-amber-50 text-amber-900'
                            )}
                        >
                            <p className="font-medium">
                                {!canInput ? '🔴' : '⚠️'} {holidayStatus}
                            </p>
                            {!canInput && (
                                <p className="text-xs mt-1">Absensi tidak dapat diinput pada hari ini.</p>
                            )}
                        </div>
                    )}

                    {/* Date Picker */}
                    <div className="grid gap-2">
                        <Label>Tanggal</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'justify-start text-left font-normal',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Multiple Student Selectors */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Nama Siswa</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={addStudentSlot}
                                disabled={!canInput}
                                className="h-7 gap-1 text-xs"
                            >
                                <Plus className="h-3 w-3" />
                                Tambah Siswa
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {selectedStudents.map((selectedStudent, index) => (
                                <div key={index} className="flex gap-2">
                                    <Popover
                                        open={searchOpenIndex === index}
                                        onOpenChange={(open) => setSearchOpenIndex(open ? index : null)}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={searchOpenIndex === index}
                                                className="flex-1 justify-between"
                                                disabled={!canInput}
                                            >
                                                {selectedStudent
                                                    ? `${selectedStudent.nomor_absen}. ${selectedStudent.nama}`
                                                    : `Pilih siswa ${index + 1}...`}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[450px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Cari nama siswa..." />
                                                <CommandList>
                                                    <CommandEmpty>Siswa tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {students.map((student) => (
                                                            <CommandItem
                                                                key={student.nomor_absen}
                                                                value={`${student.nama} ${student.nis}`}
                                                                onSelect={() => {
                                                                    updateSelectedStudent(index, student)
                                                                    setSearchOpenIndex(null)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedStudent?.nomor_absen === student.nomor_absen
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                                {student.nomor_absen}. {student.nama} ({student.nis})
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {selectedStudents.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeStudentSlot(index)}
                                            className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-100"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            💡 Semua siswa akan punya status dan keterangan yang sama
                        </p>
                    </div>

                    {/* Status Selection */}
                    <div className="grid gap-2">
                        <Label>Status Kehadiran</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Sakit', 'Izin', 'Alpha'] as AttendanceStatus[]).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                        setStatus(s)
                                        if (s !== 'Izin') setIsPartialLeave(false)
                                    }}
                                    disabled={!canInput}
                                    className={cn(
                                        'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                                        status === s
                                            ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                                        !canInput && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Partial Leave Toggle (for Izin only) */}
                    {status === 'Izin' && canInput && (
                        <div className="grid gap-3 rounded-lg border-2 border-sky-200 bg-sky-50/50 p-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sky-900 font-semibold">Izin Jam Pelajaran?</Label>
                                <button
                                    type="button"
                                    onClick={() => setIsPartialLeave(!isPartialLeave)}
                                    className={cn(
                                        'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                                        isPartialLeave
                                            ? 'bg-sky-600 text-white'
                                            : 'bg-white text-sky-700 border border-sky-300 hover:bg-sky-100'
                                    )}
                                >
                                    {isPartialLeave ? 'Ya (Jam Tertentu)' : 'Tidak (Seharian)'}
                                </button>
                            </div>

                            {isPartialLeave && (
                                <>
                                    <p className="text-xs text-sky-700">
                                        <Clock className="inline h-3 w-3 mr-1" />
                                        Tentukan rentang waktu izin
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="startTime" className="text-xs text-sky-800">
                                                Waktu Mulai
                                            </Label>
                                            <Input
                                                id="startTime"
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="mt-1 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="endTime" className="text-xs text-sky-800">
                                                Waktu Selesai
                                            </Label>
                                            <Input
                                                id="endTime"
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="mt-1 bg-white"
                                            />
                                        </div>
                                    </div>
                                    {startTime && endTime && (
                                        <div className="rounded bg-white border border-sky-200 p-2">
                                            <p className="text-xs font-medium text-sky-900">
                                                Jam Pelajaran: {timeToPeriods(startTime, endTime).map((p) => `P${p}`).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Notes/Reason */}
                    <div className="grid gap-2">
                        <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                        <Input
                            id="keterangan"
                            placeholder="Contoh: Sakit demam, izin classmeeting, dll..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            disabled={!canInput}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !canInput || selectedStudents.filter(s => s).length === 0}
                        className="bg-sky-500 hover:bg-sky-600"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan ({selectedStudents.filter((s) => s).length} siswa)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
