'use client'

import { useState } from 'react'
import { Download, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MonthlyGrid } from '@/components/monthly-grid'
import { DashboardLayout } from '@/components/dashboard-layout'
import { supabase } from '@/lib/supabase'
import {
    getYearOptions,
    getMonthOptions,
    getMonthName,
    formatDateForDB,
    getDateRangeByMode
} from '@/lib/date-utils'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function MonthlyPage() {
    const now = new Date()

    // Filter states
    const [filterMode, setFilterMode] = useState<'day' | 'week' | 'month'>('month')
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth()) // 0-indexed
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const [exporting, setExporting] = useState(false)

    // Calculate date range based on filter mode
    const getDateRange = () => {
        if (filterMode === 'month' && !customStartDate && !customEndDate) {
            const { start, end } = getDateRangeByMode('month', now, selectedYear, selectedMonth)
            return { start, end }
        } else if (customStartDate && customEndDate) {
            // Custom range
            const start = new Date(customStartDate + 'T00:00:00')
            const end = new Date(customEndDate + 'T23:59:59')

            // Validate
            if (end < start) {
                toast.error('Tanggal selesai harus setelah tanggal mulai')
                return null
            }

            // Check max 31 days
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays > 31) {
                toast.error('Rentang tanggal maksimal 31 hari')
                return null
            }

            return { start, end }
        } else {
            // Default to current month
            const { start, end } = getDateRangeByMode('month', now, selectedYear, selectedMonth)
            return { start, end }
        }
    }

    const dateRange = getDateRange()

    const handleExport = async () => {
        if (!dateRange) return

        setExporting(true)

        try {
            const { start, end } = dateRange

            // Fetch all data for export
            const { data: students } = await supabase
                .from('students_master')
                .select('*')
                .order('nomor_absen')

            const { data: attendanceRecords } = await supabase
                .from('attendance')
                .select('*')
                .gte('tanggal', formatDateForDB(start))
                .lte('tanggal', formatDateForDB(end))

            if (!students) {
                toast.error('Tidak ada data siswa')
                return
            }

            // Get all days in range
            const days: Date[] = []
            const current = new Date(start)
            while (current <= end) {
                days.push(new Date(current))
                current.setDate(current.getDate() + 1)
            }

            // Prepare export data
            const exportData = students.map((student) => {
                const row: any = {
                    'No. Absen': student.nomor_absen,
                    NIS: student.nis,
                    Nama: student.nama,
                }

                // Add daily attendance columns
                days.forEach((day, index) => {
                    const dateStr = formatDateForDB(day)
                    const record = attendanceRecords?.find(
                        (r) => r.nomor_absen === student.nomor_absen && r.tanggal === dateStr
                    )

                    let symbol = ''
                    if (record) {
                        symbol = record.status === 'Hadir' ? 'H' : record.status.charAt(0)
                    }

                    row[index + 1] = symbol
                })

                // Add totals
                const s = attendanceRecords?.filter(
                    (r) => r.nomor_absen === student.nomor_absen && r.status === 'Sakit'
                ).length || 0
                const i = attendanceRecords?.filter(
                    (r) => r.nomor_absen === student.nomor_absen && r.status === 'Izin'
                ).length || 0
                const a = attendanceRecords?.filter(
                    (r) => r.nomor_absen === student.nomor_absen && r.status === 'Alpha'
                ).length || 0

                row['S'] = s
                row['I'] = i
                row['A'] = a
                row['Total'] = s + i + a

                return row
            })

            // Create workbook
            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()

            const sheetName = filterMode === 'month'
                ? `Absensi ${getMonthName(selectedMonth)}`
                : 'Absensi'
            XLSX.utils.book_append_sheet(wb, ws, sheetName)

            // Generate file
            const fileName = filterMode === 'month'
                ? `Absensi_${getMonthName(selectedMonth)}_${selectedYear}.xlsx`
                : `Absensi_${formatDateForDB(start)}_${formatDateForDB(end)}.xlsx`
            XLSX.writeFile(wb, fileName)

            toast.success('File Excel berhasil didownload!')
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            toast.error('Gagal mengekspor ke Excel. Silakan coba lagi.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Detail Absen Bulanan</h1>
                        <p className="mt-1 text-sm text-gray-600">Tampilan jurnal absensi dengan filter</p>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={exporting || !dateRange}
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

                {/* Filter Card */}
                <Card className="mb-6 shadow-lg">
                    <CardHeader>
                        <CardTitle>Filter Rentang Tanggal</CardTitle>
                        <CardDescription>Pilih mode filter dan rentang tanggal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Mode Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="filter-mode">Mode Filter</Label>
                            <Select
                                value={filterMode}
                                onValueChange={(value) => {
                                    setFilterMode(value as 'day' | 'week' | 'month')
                                    // Reset custom dates when changing mode
                                    setCustomStartDate('')
                                    setCustomEndDate('')
                                }}
                            >
                                <SelectTrigger id="filter-mode" className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Pilih mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="month">📅 Bulan</SelectItem>
                                    <SelectItem value="week">📆 Minggu</SelectItem>
                                    <SelectItem value="day">📋 Hari</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Month Filter (Default) */}
                        {filterMode === 'month' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="year-select">Tahun</Label>
                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(value) => setSelectedYear(parseInt(value))}
                                    >
                                        <SelectTrigger id="year-select">
                                            <SelectValue placeholder="Pilih tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getYearOptions(2024, 2030).map((option) => (
                                                <SelectItem key={option.value} value={option.value.toString()}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="month-select">Bulan</Label>
                                    <Select
                                        value={selectedMonth.toString()}
                                        onValueChange={(value) => setSelectedMonth(parseInt(value))}
                                    >
                                        <SelectTrigger id="month-select">
                                            <SelectValue placeholder="Pilih bulan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getMonthOptions().map((option) => (
                                                <SelectItem key={option.value} value={option.value.toString()}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Custom Date Range */}
                        <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground mb-3">
                                Atau gunakan rentang tanggal custom:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Dari Tanggal</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">Sampai Tanggal</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                💡 Rentang maksimal 31 hari
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Grid Kehadiran Siswa</CardTitle>
                        <CardDescription>
                            Jurnal absensi harian - H (Hadir), S (Sakit), I (Izin), A (Alpha)
                            <br />
                            💡 Hover pada cell dan klik icon ✏️ untuk edit kehadiran
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 rounded-lg border-2 border-sky-200 bg-sky-50 p-3">
                            <p className="text-sm text-sky-900">
                                <strong>Legenda:</strong>
                                <span className="ml-2">H = Hadir</span>
                                <span className="ml-2">S = Sakit</span>
                                <span className="ml-2">I = Izin</span>
                                <span className="ml-2">A = Alpha</span>
                                <span className="ml-2">- = Libur/Weekend</span>
                            </p>
                            <p className="text-xs text-sky-700 mt-1">
                                💡 Kolom abu-abu = Weekend, Kolom merah muda = Hari Libur
                            </p>
                        </div>

                        {dateRange ? (
                            <MonthlyGrid startDate={dateRange.start} endDate={dateRange.end} />
                        ) : (
                            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                                <p className="text-sm text-muted-foreground">
                                    Pilih rentang tanggal yang valid
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
