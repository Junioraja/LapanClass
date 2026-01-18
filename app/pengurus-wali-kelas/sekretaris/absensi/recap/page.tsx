'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/dashboard-layout'
import { supabase } from '@/lib/supabase'
import { StudentRecap, SemesterConfig } from '@/lib/types'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function RecapPage() {
    const [data, setData] = useState<StudentRecap[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [semesters, setSemesters] = useState<SemesterConfig[]>([])
    const [selectedSemester, setSelectedSemester] = useState<string>('')

    // Fetch semesters
    useEffect(() => {
        async function fetchSemesters() {
            const { data: semesterData, error } = await supabase
                .from('semester_config')
                .select('*')
                .order('tanggal_mulai', { ascending: false })

            if (!error && semesterData && semesterData.length > 0) {
                setSemesters(semesterData)
                // Auto-select the most recent semester
                setSelectedSemester(semesterData[0].id || '')
            }
        }

        fetchSemesters()
    }, [])

    useEffect(() => {
        async function fetchRecap() {
            if (!selectedSemester || semesters.length === 0) {
                setData([])
                setLoading(false)
                return
            }

            setLoading(true)

            // Find selected semester
            const semester = semesters.find(s => s.id === selectedSemester)

            if (!semester) {
                setData([])
                setLoading(false)
                return
            }

            try {
                console.log('Fetching data for semester:', semester)
                console.log('Date range:', semester.tanggal_mulai, 'to', semester.tanggal_selesai)

                // Fetch all students
                const { data: students, error: studentsError } = await supabase
                    .from('students_master')
                    .select('*')
                    .order('nomor_absen')

                if (studentsError) {
                    console.error('Error fetching students:', studentsError)
                    toast.error('Gagal memuat data siswa')
                    setLoading(false)
                    return
                }

                console.log('Students fetched:', students?.length)

                // Fetch attendance within semester date range
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('attendance')
                    .select('*')
                    .gte('tanggal', semester.tanggal_mulai)
                    .lte('tanggal', semester.tanggal_selesai)

                if (attendanceError) {
                    console.error('Error fetching attendance:', attendanceError)
                    toast.error('Gagal memuat data kehadiran')
                    setLoading(false)
                    return
                }

                console.log('Attendance records fetched:', attendanceData?.length)

                // Calculate totals for each student
                const recapData: StudentRecap[] = (students || []).map(student => {
                    const studentAttendance = (attendanceData || []).filter(
                        a => a.nomor_absen === student.nomor_absen
                    )

                    const total_sakit = studentAttendance.filter(a => a.status === 'Sakit').length
                    const total_izin = studentAttendance.filter(a => a.status === 'Izin').length
                    const total_alpha = studentAttendance.filter(a => a.status === 'Alpha').length

                    return {
                        nomor_absen: student.nomor_absen,
                        nama: student.nama,
                        nis: student.nis,
                        total_sakit,
                        total_izin,
                        total_alpha,
                    }
                })

                console.log('Recap data calculated:', recapData.length, 'students')
                setData(recapData)
            } catch (error) {
                console.error('Error in fetchRecap:', error)
                toast.error('Gagal memuat data rekap')
            }

            setLoading(false)
        }

        fetchRecap()
    }, [selectedSemester]) // Removed semesters from dependency to prevent infinite loop

    const handleExport = () => {
        setExporting(true)

        try {
            // Find selected semester for filename
            const semester = semesters.find(s => s.id === selectedSemester)
            const semesterLabel = semester
                ? `Kelas_${semester.kelas}_Semester_${semester.semester}`
                : 'Semester'

            // Prepare data for Excel
            const exportData = data.map((student) => ({
                'No. Absen': student.nomor_absen,
                NIS: student.nis,
                Nama: student.nama,
                Sakit: student.total_sakit || 0,
                Izin: student.total_izin || 0,
                Alpha: student.total_alpha || 0,
                Total: (student.total_sakit || 0) + (student.total_izin || 0) + (student.total_alpha || 0),
            }))

            // Create workbook and worksheet
            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi Semester')

            // Set column widths
            ws['!cols'] = [
                { wch: 10 }, // No. Absen
                { wch: 15 }, // NIS
                { wch: 30 }, // Nama
                { wch: 8 },  // Sakit
                { wch: 8 },  // Izin
                { wch: 8 },  // Alpha
                { wch: 8 },  // Total
            ]

            // Generate file
            const fileName = `Rekap_Absensi_${semesterLabel}_${new Date().toISOString().split('T')[0]}.xlsx`
            XLSX.writeFile(wb, fileName)

            toast.success('File Excel berhasil didownload!')
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            toast.error('Gagal mengekspor ke Excel. Silakan coba lagi.')
        } finally {
            setExporting(false)
        }
    }

    // Get selected semester info for display
    const selectedSemesterInfo = semesters.find(s => s.id === selectedSemester)

    return (
        <DashboardLayout>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Rekap Semester</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {selectedSemesterInfo
                                    ? `Kelas ${selectedSemesterInfo.kelas} - Semester ${selectedSemesterInfo.semester}`
                                    : 'Pilih semester untuk melihat rekap'
                                }
                            </p>
                        </div>
                        <Button
                            onClick={handleExport}
                            disabled={exporting || data.length === 0 || !selectedSemester}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md"
                        >
                            {exporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Export ke Excel
                        </Button>
                    </div>

                    {/* Semester Filter */}
                    <Card className="shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="semester-select">Filter Semester</Label>
                                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                        <SelectTrigger id="semester-select">
                                            <SelectValue placeholder="Pilih semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {semesters.map((semester) => (
                                                <SelectItem key={semester.id} value={semester.id || ''}>
                                                    Kelas {semester.kelas} - Semester {semester.semester}
                                                    ({new Date(semester.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    {' - '}
                                                    {new Date(semester.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Ringkasan Kehadiran Siswa</CardTitle>
                        <CardDescription>
                            Total kumulatif Sakit (S), Izin (I), dan Alpha (A) untuk setiap siswa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                            </div>
                        ) : !selectedSemester ? (
                            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                                <p className="text-sm text-muted-foreground">Pilih semester untuk melihat rekap kehadiran</p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                                <p className="text-sm text-muted-foreground">Tidak ada data kehadiran tersedia untuk semester ini</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border-2 shadow-sm overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-sky-100">
                                            <TableHead className="w-24 font-bold">No. Absen</TableHead>
                                            <TableHead className="w-32 font-bold">NIS</TableHead>
                                            <TableHead className="font-bold">Nama</TableHead>
                                            <TableHead className="w-20 text-center font-bold">Sakit</TableHead>
                                            <TableHead className="w-20 text-center font-bold">Izin</TableHead>
                                            <TableHead className="w-20 text-center font-bold">Alpha</TableHead>
                                            <TableHead className="w-20 text-center font-bold">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((student) => {
                                            const total =
                                                (student.total_sakit || 0) +
                                                (student.total_izin || 0) +
                                                (student.total_alpha || 0)

                                            return (
                                                <TableRow key={student.nomor_absen} className="hover:bg-sky-50">
                                                    <TableCell className="font-medium">{student.nomor_absen}</TableCell>
                                                    <TableCell className="text-muted-foreground">{student.nis}</TableCell>
                                                    <TableCell className="font-medium">{student.nama}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-800">
                                                            {student.total_sakit || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
                                                            {student.total_izin || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-800">
                                                            {student.total_alpha || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-bold text-lg">{total}</span>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
