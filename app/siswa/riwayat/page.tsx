'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Calendar as CalendarIcon, Image as ImageIcon, Filter, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDateForDB } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
    id: string
    tanggal: string
    status: string
    keterangan: string | null
    foto_bukti: string | null
    is_approved: boolean
    type: 'attendance' | 'izin_telat'
    jam_datang?: string
    periods?: number[]
}

export default function RiwayatPage() {
    const { user } = useAuth()
    const [startDate, setStartDate] = useState<Date | undefined>(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    )
    const [endDate, setEndDate] = useState<Date | undefined>(new Date())
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false)

    useEffect(() => {
        if (user?.id && startDate && endDate) {
            fetchRecords()
        }
    }, [user, startDate, endDate])

    async function fetchRecords() {
        if (!user?.id || !startDate || !endDate) return

        setLoading(true)

        try {
            const startStr = formatDateForDB(startDate)
            const endStr = formatDateForDB(endDate)

            // Fetch attendance records
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select(`
          id,
          tanggal,
          status,
          keterangan,
          foto_bukti,
          is_approved,
          attendance_periods (jam_ke)
        `)
                .eq('student_id', user.id)
                .gte('tanggal', startStr)
                .lte('tanggal', endStr)
                .order('tanggal', { ascending: false })

            // Fetch late permissions
            const { data: lateData } = await supabase
                .from('izin_telat')
                .select('id, tanggal, jam_datang, foto_bukti, keterangan, is_approved')
                .eq('student_id', user.id)
                .gte('tanggal', startStr)
                .lte('tanggal', endStr)
                .order('tanggal', { ascending: false })

            // Combine and format
            const combined: AttendanceRecord[] = [
                ...(attendanceData?.map((a: any) => ({
                    id: a.id,
                    tanggal: a.tanggal,
                    status: a.status,
                    keterangan: a.keterangan,
                    foto_bukti: a.foto_bukti,
                    is_approved: a.is_approved,
                    type: 'attendance' as const,
                    periods: a.attendance_periods?.map((p: any) => p.jam_ke) || [],
                })) || []),
                ...(lateData?.map(l => ({
                    id: l.id,
                    tanggal: l.tanggal,
                    status: 'Terlambat',
                    keterangan: l.keterangan,
                    foto_bukti: l.foto_bukti,
                    is_approved: l.is_approved,
                    type: 'izin_telat' as const,
                    jam_datang: l.jam_datang,
                })) || []),
            ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

            setRecords(combined)
        } catch (error) {
            console.error('Error fetching records:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleViewPhoto = (photoUrl: string) => {
        setSelectedPhoto(photoUrl)
        setPhotoDialogOpen(true)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hadir':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'Sakit':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'Izin':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Alpha':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'Terlambat':
                return 'bg-amber-100 text-amber-800 border-amber-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Riwayat Absensi</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Lihat semua riwayat kehadiran dan pengajuan izin Anda
                </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter Tanggal
                    </CardTitle>
                    <CardDescription>Pilih rentang tanggal untuk melihat riwayat</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="grid gap-2">
                            <Label>Dari Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal',
                                            !startDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, 'PPP', { locale: id }) : <span>Pilih tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* End Date */}
                        <div className="grid gap-2">
                            <Label>Sampai Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal',
                                            !endDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, 'PPP', { locale: id }) : <span>Pilih tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Records List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Riwayat</CardTitle>
                    <CardDescription>
                        Menampilkan {records.length} record dari {startDate && format(startDate, 'dd MMM yyyy', { locale: id })} sampai {endDate && format(endDate, 'dd MMM yyyy', { locale: id })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-600 border-r-transparent"></div>
                                <p className="mt-2 text-sm text-gray-600">Loading...</p>
                            </div>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Tidak ada riwayat pada periode ini</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {records.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border-2 hover:shadow-md transition-shadow gap-3"
                                >
                                    {/* Left Section */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-gray-900">
                                                {format(new Date(record.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}
                                            </p>
                                            <span
                                                className={cn(
                                                    'text-xs px-3 py-1 rounded-full font-semibold border',
                                                    getStatusColor(record.status)
                                                )}
                                            >
                                                {record.status}
                                            </span>
                                            {record.is_approved && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                                    ✓ Disetujui
                                                </span>
                                            )}
                                        </div>

                                        {/* Additional Info */}
                                        <div className="mt-2 space-y-1">
                                            {record.type === 'izin_telat' && record.jam_datang && (
                                                <p className="text-sm text-gray-600">
                                                    🕐 Jam datang: {record.jam_datang}
                                                </p>
                                            )}
                                            {record.periods && record.periods.length > 0 && (
                                                <p className="text-sm text-gray-600">
                                                    🕐 Jam ke-{record.periods.join(', ')}
                                                </p>
                                            )}
                                            {record.keterangan && (
                                                <p className="text-sm text-gray-600">
                                                    📝 {record.keterangan}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Section - Photo */}
                                    {record.foto_bukti && (
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <img
                                                    src={record.foto_bukti}
                                                    alt="Bukti"
                                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-gray-200"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                                                    onClick={() => handleViewPhoto(record.foto_bukti!)}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Photo Preview Dialog */}
            <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Foto Bukti</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPhotoDialogOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedPhoto && (
                        <div className="mt-4">
                            <img
                                src={selectedPhoto}
                                alt="Foto Bukti"
                                className="w-full rounded-lg"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
