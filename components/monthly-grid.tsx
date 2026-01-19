'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Student, Holiday, MonthlyAttendanceCell } from '@/lib/types'
import {
    getMonthDays,
    formatDateForDB,
    isWeekend,
    isHoliday,
    getDayName,
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { EditAttendanceModal } from '@/components/edit-attendance-modal'
import { eachDayOfInterval } from 'date-fns'

interface MonthlyGridProps {
    startDate: Date
    endDate: Date
}

interface EditModalData {
    studentId: number
    studentName: string
    date: string
    currentStatus?: any
    currentKeterangan?: string
    attendanceId?: string
}

export function MonthlyGrid({ startDate, endDate }: MonthlyGridProps) {
    const [students, setStudents] = useState<Student[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [attendanceData, setAttendanceData] = useState<
        Record<number, Record<string, MonthlyAttendanceCell>>
    >({})
    const [loading, setLoading] = useState(true)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editModalData, setEditModalData] = useState<EditModalData | null>(null)

    // Get days in the date range
    const rangeDays = eachDayOfInterval({ start: startDate, end: endDate })

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            // Fetch students
            const { data: studentsData } = await supabase
                .from('students_master')
                .select('*')
                .order('nomor_absen')

            // Fetch holidays
            const { data: holidaysData } = await supabase.from('holidays').select('*')

            // Fetch attendance for the date range - JOIN with students_master to get nomor_absen
            const { data: attendanceRecords } = await supabase
                .from('attendance')
                .select(`
          *,
          attendance_periods (jam_ke),
          student:students_master!student_id (nomor_absen, nis, nama)
        `)
                .gte('tanggal', formatDateForDB(startDate))
                .lte('tanggal', formatDateForDB(endDate))

            // Organize data by student and date
            const organized: Record<number, Record<string, MonthlyAttendanceCell>> = {}

            if (studentsData) {
                studentsData.forEach((student) => {
                    organized[student.nomor_absen] = {}

                    rangeDays.forEach((day) => {
                        const dateStr = formatDateForDB(day)
                        const record = (attendanceRecords as any)?.find(
                            (r: any) => r.student?.nomor_absen === student.nomor_absen && r.tanggal === dateStr
                        )

                        const holiday = isHoliday(dateStr, holidaysData || [])

                        organized[student.nomor_absen][dateStr] = {
                            date: dateStr,
                            status: record?.status,
                            keterangan: record?.keterangan,
                            periods: record?.attendance_periods?.map((p: any) => p.jam_ke) || [],
                            isWeekend: isWeekend(day),
                            isHoliday: !!holiday,
                            holidayName: holiday?.nama_libur,
                        }

                        // Store attendance ID for editing
                        if (record?.id) {
                            organized[student.nomor_absen][dateStr].attendanceId = record.id
                        }
                    })
                })
            }

            setStudents(studentsData || [])
            setHolidays(holidaysData || [])
            setAttendanceData(organized)
            setLoading(false)
        }

        fetchData()
    }, [startDate, endDate])

    const getStatusSymbol = (cell: MonthlyAttendanceCell): string => {
        if (cell.isWeekend || cell.isHoliday) return '-'
        if (!cell.status) return ''

        switch (cell.status) {
            case 'Hadir':
                return 'H'
            case 'Sakit':
                return 'S'
            case 'Izin':
                return cell.periods && cell.periods.length > 0 ? `I(${cell.periods.join(',')})` : 'I'
            case 'Alpha':
                return 'A'
            default:
                return ''
        }
    }

    const getCellColor = (cell: MonthlyAttendanceCell): string => {
        if (cell.isWeekend) return 'bg-gray-100'
        if (cell.isHoliday) return 'bg-red-50'
        if (!cell.status) return ''

        switch (cell.status) {
            case 'Hadir':
                return 'bg-emerald-50 text-emerald-900'
            case 'Sakit':
                return 'bg-yellow-50 text-yellow-900'
            case 'Izin':
                return 'bg-blue-50 text-blue-900'
            case 'Alpha':
                return 'bg-red-100 text-red-900'
            default:
                return ''
        }
    }

    const getMonthlyStats = (nomorAbsen: number) => {
        const cells = attendanceData[nomorAbsen] || {}
        const stats = { S: 0, I: 0, A: 0 }

        Object.values(cells).forEach((cell) => {
            if (cell.status === 'Sakit') stats.S++
            if (cell.status === 'Izin') stats.I++
            if (cell.status === 'Alpha') stats.A++
        })

        return stats
    }

    const handleEditClick = (student: Student, cell: MonthlyAttendanceCell) => {
        // Don't allow editing weekends or holidays
        if (cell.isWeekend || cell.isHoliday) return

        setEditModalData({
            studentId: student.nomor_absen,
            studentName: student.nama,
            date: cell.date,
            currentStatus: cell.status,
            currentKeterangan: cell.keterangan,
            attendanceId: cell.attendanceId,
        })
        setEditModalOpen(true)
    }

    const handleEditSuccess = () => {
        // Refresh data
        const fetchData = async () => {
            const { data: attendanceRecords } = await supabase
                .from('attendance')
                .select(`
          *,
          attendance_periods (jam_ke),
          student:students_master!student_id (nomor_absen, nis, nama)
        `)
                .gte('tanggal', formatDateForDB(startDate))
                .lte('tanggal', formatDateForDB(endDate))

            const organized: Record<number, Record<string, MonthlyAttendanceCell>> = {}

            students.forEach((student) => {
                organized[student.nomor_absen] = {}

                rangeDays.forEach((day) => {
                    const dateStr = formatDateForDB(day)
                    const record = (attendanceRecords as any)?.find(
                        (r: any) => r.student?.nomor_absen === student.nomor_absen && r.tanggal === dateStr
                    )

                    const holiday = isHoliday(dateStr, holidays)

                    organized[student.nomor_absen][dateStr] = {
                        date: dateStr,
                        status: record?.status,
                        keterangan: record?.keterangan,
                        periods: record?.attendance_periods?.map((p: any) => p.jam_ke) || [],
                        isWeekend: isWeekend(day),
                        isHoliday: !!holiday,
                        holidayName: holiday?.nama_libur,
                        attendanceId: record?.id,
                    }
                })
            })

            setAttendanceData(organized)
        }

        fetchData()
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
        )
    }

    return (
        <>
            <div className="overflow-x-auto rounded-lg border-2 shadow-md">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-sky-100">
                            <TableHead className="sticky left-0 z-20 border-r-2 bg-sky-100 font-bold w-16">
                                No
                            </TableHead>
                            <TableHead className="sticky left-16 z-20 border-r-2 bg-sky-100 font-bold min-w-[200px]">
                                Nama Siswa
                            </TableHead>
                            <TableHead className="sticky left-[272px] z-20 border-r-2 bg-sky-100 font-bold min-w-[120px]">NIS</TableHead>
                            {rangeDays.map((day, index) => {
                                const dateStr = formatDateForDB(day)
                                const weekend = isWeekend(day)
                                const holiday = isHoliday(dateStr, holidays)

                                return (
                                    <TableHead
                                        key={dateStr}
                                        className={cn(
                                            'text-center text-xs p-1 min-w-[40px]',
                                            weekend && 'bg-gray-200',
                                            holiday && 'bg-red-100'
                                        )}
                                        title={
                                            holiday
                                                ? holiday.nama_libur
                                                : `${getDayName(day)}, ${format(day, 'd MMM')}`
                                        }
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold">{index + 1}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {getDayName(day).substring(0, 3)}
                                            </span>
                                        </div>
                                    </TableHead>
                                )
                            })}
                            <TableHead className="border-l-2 bg-yellow-100 text-center font-bold">S</TableHead>
                            <TableHead className="bg-blue-100 text-center font-bold">I</TableHead>
                            <TableHead className="bg-red-100 text-center font-bold">A</TableHead>
                            <TableHead className="border-l-2 bg-gray-100 text-center font-bold">Tot</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => {
                            const stats = getMonthlyStats(student.nomor_absen)
                            const total = stats.S + stats.I + stats.A

                            return (
                                <TableRow key={student.nomor_absen} className="hover:bg-sky-50/50">
                                    <TableCell className="sticky left-0 z-10 border-r-2 bg-white font-medium text-center">
                                        {student.nomor_absen}
                                    </TableCell>
                                    <TableCell className="sticky left-16 z-10 border-r-2 bg-white font-medium">
                                        {student.nama}
                                    </TableCell>
                                    <TableCell className="sticky left-[272px] z-10 border-r-2 bg-white text-xs text-muted-foreground">
                                        {student.nis}
                                    </TableCell>
                                    {rangeDays.map((day) => {
                                        const dateStr = formatDateForDB(day)
                                        const cell = attendanceData[student.nomor_absen]?.[dateStr]

                                        if (!cell) return <TableCell key={dateStr} className="p-1 text-center">-</TableCell>

                                        const symbol = getStatusSymbol(cell)
                                        const canEdit = !cell.isWeekend && !cell.isHoliday

                                        return (
                                            <TableCell
                                                key={dateStr}
                                                className={cn(
                                                    'p-1 text-center relative group',
                                                    getCellColor(cell)
                                                )}
                                                title={
                                                    cell.keterangan
                                                        ? `${cell.status}: ${cell.keterangan}`
                                                        : cell.holidayName || ''
                                                }
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="text-xs font-semibold">{symbol}</span>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEditClick(student, cell)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/50 rounded"
                                                            title="Edit kehadiran"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )
                                    })}
                                    <TableCell className="border-l-2 bg-yellow-50 text-center font-bold">
                                        {stats.S}
                                    </TableCell>
                                    <TableCell className="bg-blue-50 text-center font-bold">{stats.I}</TableCell>
                                    <TableCell className="bg-red-50 text-center font-bold">{stats.A}</TableCell>
                                    <TableCell className="border-l-2 bg-gray-50 text-center font-bold">
                                        {total}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Modal */}
            {editModalData && (
                <EditAttendanceModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    studentId={editModalData.studentId}
                    studentName={editModalData.studentName}
                    date={editModalData.date}
                    currentStatus={editModalData.currentStatus}
                    currentKeterangan={editModalData.currentKeterangan}
                    attendanceId={editModalData.attendanceId}
                    onSuccess={handleEditSuccess}
                />
            )}
        </>
    )
}
