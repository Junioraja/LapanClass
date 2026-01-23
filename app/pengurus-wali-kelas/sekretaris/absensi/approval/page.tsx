'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { CheckCircle, XCircle, Eye, Calendar, Filter, Loader2, FileText, User, Clock, Image as ImageIcon, Download, History, ClockIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/dashboard-layout'

interface PendingAttendance {
    id: string
    student_id: string
    tanggal: string
    status: string
    keterangan: string | null
    foto_bukti: string | null
    is_approved: boolean
    created_at: string
    student_name: string
    nis: string
    jam_datang?: string | null
    approved_by?: string | null
    approver_name?: string | null
    table_source?: 'attendance' | 'izin_telat'
}

export default function ApprovalAbsensiPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('pending')
    const [pendingList, setPendingList] = useState<PendingAttendance[]>([])
    const [telatList, setTelatList] = useState<PendingAttendance[]>([])
    const [approvedList, setApprovedList] = useState<PendingAttendance[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterDate, setFilterDate] = useState<string>('')

    // Export dialogs
    const [exportPeriodOpen, setExportPeriodOpen] = useState(false)
    const [exportPhotoOpen, setExportPhotoOpen] = useState(false)
    const [exportStartDate, setExportStartDate] = useState('')
    const [exportEndDate, setExportEndDate] = useState('')
    const [photoFilter, setPhotoFilter] = useState<'7days' | '30days' | 'all'>('7days')

    // Photo preview dialog
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

    // Reject dialog
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<PendingAttendance | null>(null)
    const [rejectReason, setRejectReason] = useState('')

    // Delete photos dialog
    const [deletePhotosDialogOpen, setDeletePhotosDialogOpen] = useState(false)
    const [deleteStartDate, setDeleteStartDate] = useState('')
    const [deleteEndDate, setDeleteEndDate] = useState('')
    const [deletingPhotos, setDeletingPhotos] = useState(false)

    // Fetch data on mount and when filters change
    useEffect(() => {
        if (user?.class_id) {
            fetchPendingAttendance()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.class_id, filterStatus, filterDate])

    useEffect(() => {
        if (user?.class_id) {
            fetchTelatAttendance()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.class_id, filterDate])

    useEffect(() => {
        if (user?.class_id) {
            fetchApprovedAttendance()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.class_id, filterStatus, filterDate])

    const fetchPendingAttendance = async () => {
        if (!user?.class_id) return

        setLoading(true)
        try {
            let query = supabase
                .from('attendance')
                .select(`
                    id,
                    student_id,
                    tanggal,
                    status,
                    keterangan,
                    foto_bukti,
                    is_approved,
                    created_at,
                    students_master (
                        nama,
                        nis
                    )
                `)
                .eq('class_id', user.class_id)
                .eq('is_approved', false)
                .in('status', ['Sakit', 'Izin', 'Alpha'])
                .order('created_at', { ascending: false })

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus)
            }

            if (filterDate) {
                query = query.eq('tanggal', filterDate)
            }

            const { data, error } = await query

            if (error) {
                console.error('Pending query error:', error)
                throw error
            }

            const formattedData = data?.map((item: any) => ({
                id: item.id,
                student_id: item.student_id,
                tanggal: item.tanggal,
                status: item.status,
                keterangan: item.keterangan,
                foto_bukti: item.foto_bukti,
                is_approved: item.is_approved,
                created_at: item.created_at,
                student_name: item.students_master?.nama || 'Unknown',
                nis: item.students_master?.nis || '-',
                table_source: 'attendance' as const
            })) || []

            setPendingList(formattedData)
        } catch (error: any) {
            console.error('Error fetching pending:', error.message || error)
        } finally {
            setLoading(false)
        }
    }

    const fetchTelatAttendance = async () => {
        if (!user?.class_id) return

        try {
            let query = supabase
                .from('izin_telat')
                .select(`
                    id,
                    student_id,
                    tanggal,
                    jam_datang,
                    keterangan,
                    foto_bukti,
                    is_approved,
                    approved_by,
                    created_at,
                    students_master (
                        nama,
                        nis
                    )
                `)
                .eq('class_id', user.class_id)
                .eq('is_approved', false)  // Only pending telat
                .order('created_at', { ascending: false })

            if (filterDate) {
                query = query.eq('tanggal', filterDate)
            }

            const { data, error } = await query

            if (error) {
                console.error('Telat query error:', error)
                throw error
            }

            const formattedData = data?.map((item: any) => ({
                id: item.id,
                student_id: item.student_id,
                tanggal: item.tanggal,
                status: 'Telat',
                keterangan: item.keterangan,
                foto_bukti: item.foto_bukti,
                jam_datang: item.jam_datang,
                is_approved: item.is_approved,
                approved_by: item.approved_by,
                created_at: item.created_at,
                student_name: item.students_master?.nama || 'Unknown',
                nis: item.students_master?.nis || '-',
                table_source: 'izin_telat' as const
            })) || []

            setTelatList(formattedData)
        } catch (error: any) {
            console.error('Error fetching telat:', error.message || error)
        }
    }

    const fetchApprovedAttendance = async () => {
        if (!user?.class_id) return

        try {
            // Fetch dari tabel attendance yang sudah disetujui
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select(`
                    id,
                    student_id,
                    tanggal,
                    status,
                    keterangan,
                    foto_bukti,
                    is_approved,
                    approved_by,
                    created_at,
                    students_master (
                        nama,
                        nis
                    )
                `)
                .eq('class_id', user.class_id)
                .eq('is_approved', true)
                .not('approved_by', 'is', null)
                .in('status', ['Sakit', 'Izin', 'Alpha'])
                .order('created_at', { ascending: false })
                .limit(10)

            if (attendanceError) {
                console.error('Attendance query error:', attendanceError)
                throw attendanceError
            }

            // Fetch dari tabel izin_telat yang sudah disetujui
            const { data: telatData, error: telatError } = await supabase
                .from('izin_telat')
                .select(`
                    id,
                    student_id,
                    tanggal,
                    jam_datang,
                    keterangan,
                    foto_bukti,
                    is_approved,
                    approved_by,
                    created_at,
                    students_master (
                        nama,
                        nis
                    )
                `)
                .eq('class_id', user.class_id)
                .eq('is_approved', true)
                .not('approved_by', 'is', null)
                .order('created_at', { ascending: false })
                .limit(10)

            if (telatError) {
                console.error('Telat query error:', telatError)
                throw telatError
            }

            // Gabungkan data dari kedua tabel
            const combinedData = [
                ...(attendanceData || []).map((item: any) => ({
                    ...item,
                    table_source: 'attendance'
                })),
                ...(telatData || []).map((item: any) => ({
                    ...item,
                    status: 'Telat',
                    table_source: 'izin_telat'
                }))
            ]

            // Urutkan berdasarkan created_at dan ambil 10 terakhir
            const sortedData = combinedData
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10)

            // Fetch approver names
            const approverIds = [...new Set(sortedData.map((item: any) => item.approved_by).filter(Boolean))]
            let approverMap: Record<string, string> = {}

            if (approverIds.length > 0) {
                const { data: approvers } = await supabase
                    .from('users')
                    .select('id, nama')
                    .in('id', approverIds)

                if (approvers) {
                    approverMap = approvers.reduce((acc: Record<string, string>, approver: any) => {
                        acc[approver.id] = approver.nama
                        return acc
                    }, {})
                }
            }

            const formattedData = sortedData.map((item: any) => ({
                id: item.id,
                student_id: item.student_id,
                tanggal: item.tanggal,
                status: item.status,
                keterangan: item.keterangan,
                foto_bukti: item.foto_bukti,
                is_approved: item.is_approved,
                approved_by: item.approved_by,
                approver_name: approverMap[item.approved_by] || 'Unknown',
                created_at: item.created_at,
                student_name: item.students_master?.nama || 'Unknown',
                nis: item.students_master?.nis || '-',
                jam_datang: item.jam_datang || null,
                table_source: item.table_source
            }))

            setApprovedList(formattedData)
        } catch (error: any) {
            console.error('Error fetching approved:', error.message || error)
        }
    }

    const handleApprove = async (item: PendingAttendance) => {
        setProcessing(item.id)
        try {
            // Determine which table to update based on status
            const tableName = item.status === 'Telat' ? 'izin_telat' : 'attendance'

            const { error } = await supabase
                .from(tableName)
                .update({
                    is_approved: true,
                    approved_by: user?.id || null
                })
                .eq('id', item.id)

            if (error) throw error

            toast.success(`Absensi ${item.student_name} disetujui`)
            // Refresh data
            if (item.status === 'Telat') {
                fetchTelatAttendance()
            } else {
                fetchPendingAttendance()
                fetchApprovedAttendance()
            }
        } catch (error: any) {
            console.error('Error approving:', error)
            toast.error('Gagal menyetujui absensi')
        } finally {
            setProcessing(null)
        }
    }

    const openRejectDialog = (item: PendingAttendance) => {
        setSelectedItem(item)
        setRejectReason('')
        setRejectDialogOpen(true)
    }

    const handleReject = async () => {
        if (!selectedItem) return

        if (!rejectReason.trim()) {
            toast.error('Alasan penolakan wajib diisi!')
            return
        }

        setProcessing(selectedItem.id)
        try {
            // Tentukan tabel mana yang akan diupdate
            const tableName = selectedItem.status === 'Telat' ? 'izin_telat' : 'attendance'

            if (tableName === 'izin_telat') {
                // Untuk izin_telat, hapus saja karena tidak ada status Alpha di tabel ini
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq('id', selectedItem.id)

                if (error) throw error
            } else {
                // Untuk attendance, ubah status menjadi Alpha dan simpan alasan penolakan
                const { error } = await supabase
                    .from(tableName)
                    .update({
                        status: 'Alpha',
                        is_approved: true, // Tetap tandai sebagai sudah diproses
                        approved_by: user?.id || null,
                        keterangan: `DITOLAK: ${rejectReason}${selectedItem.keterangan ? ` | Keterangan awal: ${selectedItem.keterangan}` : ''}`
                    })
                    .eq('id', selectedItem.id)

                if (error) throw error
            }

            toast.success(`Pengajuan ${selectedItem.student_name} ditolak dan diubah menjadi Alpha`)

            // Refresh data
            if (selectedItem.status === 'Telat') {
                fetchTelatAttendance()
            } else {
                fetchPendingAttendance()
                fetchApprovedAttendance()
            }

            setRejectDialogOpen(false)
            setSelectedItem(null)
            setRejectReason('')
        } catch (error: any) {
            console.error('Error rejecting:', error)
            toast.error('Gagal menolak pengajuan')
        } finally {
            setProcessing(null)
        }
    }

    const handleExportPeriod = async () => {
        if (!exportStartDate || !exportEndDate) {
            toast.error('Pilih tanggal mulai dan selesai')
            return
        }

        try {
            const { data, error } = await supabase
                .from('attendance')
                .select(`
                    id,
                    tanggal,
                    status,
                    keterangan,
                    is_approved,
                    created_at,
                    students_master (
                        nama,
                        nis
                    )
                `)
                .eq('class_id', user?.class_id)
                .eq('is_approved', true)
                .gte('tanggal', exportStartDate)
                .lte('tanggal', exportEndDate)
                .order('tanggal', { ascending: false })

            if (error) throw error

            if (!data || data.length === 0) {
                toast.error('Tidak ada data dalam periode ini')
                return
            }

            // Convert to CSV
            const csvData = data?.map((item: any) => ({
                Tanggal: item.tanggal,
                Nama: item.students_master?.nama || '-',
                NIS: item.students_master?.nis || '-',
                Status: item.status,
                Keterangan: item.keterangan || '-',
                'Waktu Submit': format(new Date(item.created_at), 'dd/MM/yyyy HH:mm'),
            }))

            const csv = [
                Object.keys(csvData![0]).join(','),
                ...csvData!.map(row => Object.values(row).join(','))
            ].join('\n')

            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `riwayat-${exportStartDate}-${exportEndDate}.csv`
            a.click()

            toast.success('Riwayat berhasil diexport')
            setExportPeriodOpen(false)
        } catch (error: any) {
            console.error('Error exporting:', error)
            toast.error('Gagal export data')
        }
    }

    const handleExportPhotos = async () => {
        try {
            let startDate = new Date()

            if (photoFilter === '7days') {
                startDate = subDays(new Date(), 7)
            } else if (photoFilter === '30days') {
                startDate = subDays(new Date(), 30)
            } else {
                startDate = new Date('2020-01-01')
            }

            const { data, error } = await supabase
                .from('attendance')
                .select(`
                    id,
                    tanggal,
                    foto_bukti,
                    status,
                    students_master (
                        nama,
                        nis
                    )
                `)
                .eq('class_id', user?.class_id)
                .not('foto_bukti', 'is', null)
                .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
                .order('tanggal', { ascending: false })

            if (error) throw error

            if (!data || data.length === 0) {
                toast.error('Tidak ada foto dalam periode ini')
                return
            }

            // Create HTML with all photos
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Foto Bukti - ${photoFilter}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .photo { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
                        img { max-width: 100%; height: auto; }
                        .info { margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Foto Bukti Absensi</h1>
                    <p>Total: ${data.length} foto</p>
                    ${data.map((item: any) => `
                        <div class="photo">
                            <div class="info">
                                <strong>Nama:</strong> ${item.students_master?.nama || '-'} (${item.students_master?.nis || '-'})<br>
                                <strong>Tanggal:</strong> ${format(new Date(item.tanggal), 'dd MMMM yyyy', { locale: id })}<br>
                                <strong>Status:</strong> ${item.status}
                            </div>
                            <img src="${item.foto_bukti}" alt="Bukti" />
                        </div>
                    `).join('')}
                </body>
                </html>
            `

            const blob = new Blob([html], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `foto-bukti-${photoFilter}.html`
            a.click()

            toast.success(`${data.length} foto berhasil diexport`)
            setExportPhotoOpen(false)
        } catch (error: any) {
            console.error('Error exporting photos:', error)
            toast.error('Gagal export foto')
        }
    }

    const handleDeletePhotos = async () => {
        if (!deleteStartDate || !deleteEndDate) {
            toast.error('Pilih tanggal mulai dan selesai')
            return
        }

        // Validasi tanggal
        if (new Date(deleteStartDate) > new Date(deleteEndDate)) {
            toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal selesai')
            return
        }

        setDeletingPhotos(true)
        try {
            // Fetch foto dari attendance
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('id, tanggal, foto_bukti, students_master(nama)')
                .eq('class_id', user?.class_id)
                .not('foto_bukti', 'is', null)
                .gte('tanggal', deleteStartDate)
                .lte('tanggal', deleteEndDate)

            if (attendanceError) throw attendanceError

            // Fetch foto dari izin_telat
            const { data: telatData, error: telatError } = await supabase
                .from('izin_telat')
                .select('id, tanggal, foto_bukti, students_master(nama)')
                .eq('class_id', user?.class_id)
                .not('foto_bukti', 'is', null)
                .gte('tanggal', deleteStartDate)
                .lte('tanggal', deleteEndDate)

            if (telatError) throw telatError

            const allPhotos = [...(attendanceData || []), ...(telatData || [])]

            if (allPhotos.length === 0) {
                toast.error('Tidak ada foto dalam periode ini')
                setDeletingPhotos(false)
                return
            }

            console.log(`Ditemukan ${allPhotos.length} foto untuk dihapus`)

            // Ekstrak path file dari URL dan hapus dari bucket
            let deletedCount = 0
            let failedCount = 0
            const filesToDelete: string[] = []

            for (const item of allPhotos) {
                if (item.foto_bukti) {
                    try {
                        let fileName = ''

                        // Method 1: Ekstrak dari URL lengkap
                        if (item.foto_bukti.includes('supabase.co/storage')) {
                            const url = new URL(item.foto_bukti)
                            const pathParts = url.pathname.split('/')
                            // Format: /storage/v1/object/public/bukti-surat-izin/filename.jpg
                            const bucketIndex = pathParts.indexOf('bukti-surat-izin')
                            if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
                                fileName = pathParts.slice(bucketIndex + 1).join('/')
                            }
                        }
                        // Method 2: Jika sudah berupa path relatif
                        else if (!item.foto_bukti.startsWith('http')) {
                            fileName = item.foto_bukti
                        }
                        // Method 3: Ekstrak nama file saja
                        else {
                            const parts = item.foto_bukti.split('/')
                            fileName = parts[parts.length - 1]
                        }

                        if (fileName) {
                            filesToDelete.push(fileName)
                            console.log(`File untuk dihapus: ${fileName}`)
                        }
                    } catch (err) {
                        console.error('Error processing photo URL:', item.foto_bukti, err)
                        failedCount++
                    }
                }
            }

            if (filesToDelete.length === 0) {
                toast.error('Tidak ada file yang valid untuk dihapus')
                setDeletingPhotos(false)
                return
            }

            console.log(`Total file yang akan dihapus: ${filesToDelete.length}`)
            console.log('Daftar file:', filesToDelete)

            // Hapus dari bucket
            const { data: deleteData, error: deleteError } = await supabase.storage
                .from('bukti-surat-izin')
                .remove(filesToDelete)

            if (deleteError) {
                console.error('Error menghapus dari bucket:', deleteError)
                throw deleteError
            }

            console.log('Hasil penghapusan dari storage:', deleteData)
            deletedCount = filesToDelete.length

            // Update database untuk menghapus referensi foto
            if (deletedCount > 0) {
                // Update attendance
                if (attendanceData && attendanceData.length > 0) {
                    const attendanceIds = attendanceData.map(item => item.id)
                    const { error: updateError } = await supabase
                        .from('attendance')
                        .update({ foto_bukti: null })
                        .in('id', attendanceIds)

                    if (updateError) {
                        console.error('Error update attendance:', updateError)
                    } else {
                        console.log(`Updated ${attendanceIds.length} attendance records`)
                    }
                }

                // Update izin_telat
                if (telatData && telatData.length > 0) {
                    const telatIds = telatData.map(item => item.id)
                    const { error: updateError } = await supabase
                        .from('izin_telat')
                        .update({ foto_bukti: null })
                        .in('id', telatIds)

                    if (updateError) {
                        console.error('Error update izin_telat:', updateError)
                    } else {
                        console.log(`Updated ${telatIds.length} izin_telat records`)
                    }
                }
            }

            // Tampilkan hasil
            toast.success(`Berhasil menghapus ${deletedCount} foto dari storage`)

            setDeletePhotosDialogOpen(false)
            setDeleteStartDate('')
            setDeleteEndDate('')

            // Refresh data
            fetchPendingAttendance()
            fetchTelatAttendance()
            fetchApprovedAttendance()
        } catch (error: any) {
            console.error('Error deleting photos:', error)
            toast.error('Gagal menghapus foto: ' + (error.message || 'Unknown error'))
        } finally {
            setDeletingPhotos(false)
        }
    }

    const openPhotoDialog = (photoUrl: string) => {
        setSelectedPhoto(photoUrl)
        setPhotoDialogOpen(true)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Sakit':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'Izin':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Alpha':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'Telat':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'Sakit':
                return 'from-yellow-50 to-amber-50'
            case 'Izin':
                return 'from-blue-50 to-cyan-50'
            case 'Alpha':
                return 'from-red-50 to-pink-50'
            case 'Telat':
                return 'from-orange-50 to-amber-50'
            default:
                return 'from-gray-50 to-slate-50'
        }
    }

    const renderAttendanceCard = (item: PendingAttendance, showActions: boolean = true, showApproved: boolean = false) => (
        <div
            key={item.id}
            className={`p-6 hover:bg-gradient-to-r ${getStatusBg(item.status)} transition-all group`}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Student Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-white font-bold">
                                {item.student_name.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{item.student_name}</h3>
                                {showApproved && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Disetujui oleh {item.approver_name}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <User className="h-3.5 w-3.5" />
                                NIS: {item.nis}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">
                                        {format(new Date(item.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}
                                    </span>
                                </div>
                                <Badge className={getStatusColor(item.status)}>
                                    {item.status}
                                    {item.jam_datang && ` (${item.jam_datang})`}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    {format(new Date(item.created_at), 'HH:mm', { locale: id })}
                                </div>
                            </div>
                            {item.keterangan && (
                                <div className="mt-3 p-3 bg-white/70 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <span className="font-medium text-gray-900">Keterangan:</span> {item.keterangan}
                                    </p>
                                </div>
                            )}
                            {item.foto_bukti && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-sky-600">
                                    <ImageIcon className="h-4 w-4" />
                                    <span className="font-medium">Foto bukti tersedia</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 md:flex-shrink-0">
                    {/* View Photo Button */}
                    {item.foto_bukti && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => openPhotoDialog(item.foto_bukti!)}
                            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm hover:shadow transition-all"
                        >
                            <Eye className="h-5 w-5" />
                            <span className="hidden sm:inline">Lihat Foto</span>
                        </Button>
                    )}

                    {/* Approve/Reject Buttons (only for pending) */}
                    {showActions && (
                        <>
                            <Button
                                size="lg"
                                onClick={() => handleApprove(item)}
                                disabled={processing === item.id}
                                className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                                {processing === item.id ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="hidden sm:inline">Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="hidden sm:inline">Setujui</span>
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => openRejectDialog(item)}
                                disabled={processing === item.id}
                                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 shadow-sm hover:shadow transition-all"
                            >
                                <XCircle className="h-5 w-5" />
                                <span className="hidden sm:inline">Tolak</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-600" />
                            <p className="mt-2 text-sm text-gray-600">Loading...</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Approval Absensi</h1>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Review dan kelola pengajuan absensi siswa
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExportPeriodOpen(true)}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export Riwayat
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExportPhotoOpen(true)}
                                className="gap-2"
                            >
                                <ImageIcon className="h-4 w-4" />
                                Export Foto
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletePhotosDialogOpen(true)}
                                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus Foto
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                                    <FileText className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{pendingList.length}</div>
                                <div className="text-sm text-gray-500 mt-1">Total Pending</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-3">
                                    <User className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="text-3xl font-bold text-yellow-700">
                                    {pendingList.filter(i => i.status === 'Sakit').length}
                                </div>
                                <div className="text-sm text-yellow-600 mt-1">Sakit</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-3xl font-bold text-blue-700">
                                    {pendingList.filter(i => i.status === 'Izin').length}
                                </div>
                                <div className="text-sm text-blue-600 mt-1">Izin</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="text-3xl font-bold text-red-700">
                                    {pendingList.filter(i => i.status === 'Alpha').length}
                                </div>
                                <div className="text-sm text-red-600 mt-1">Alpha</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                        <TabsTrigger value="pending" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Pending ({pendingList.length})
                        </TabsTrigger>
                        <TabsTrigger value="telat" className="gap-2">
                            <ClockIcon className="h-4 w-4" />
                            Izin Telat ({telatList.length})
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="gap-2">
                            <History className="h-4 w-4" />
                            Riwayat ({approvedList.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Filters (shown for all tabs) */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Filter className="h-5 w-5 text-gray-600" />
                                Filter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                {activeTab !== 'telat' && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Status</Label>
                                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="Sakit">🤒 Sakit</SelectItem>
                                                <SelectItem value="Izin">📋 Izin</SelectItem>
                                                <SelectItem value="Alpha">❌ Alpha</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Tab */}
                    <TabsContent value="pending" className="space-y-4">
                        <Card className="shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Pengajuan Pending</CardTitle>
                                        <CardDescription className="mt-1">
                                            {pendingList.length} pengajuan menunggu persetujuan
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {pendingList.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                            <FileText className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Tidak ada pengajuan pending</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {pendingList.map((item) => renderAttendanceCard(item, true, false))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Telat Tab */}
                    <TabsContent value="telat" className="space-y-4">
                        <Card className="shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ClockIcon className="h-5 w-5 text-orange-600" />
                                        Izin Telat
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {telatList.length} pengajuan izin telat menunggu persetujuan
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {telatList.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                                            <ClockIcon className="h-8 w-8 text-orange-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Tidak ada izin telat</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {telatList.map((item) => renderAttendanceCard(item, true, false))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Approved Tab */}
                    <TabsContent value="approved" className="space-y-4">
                        <Card className="shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <History className="h-5 w-5 text-green-600" />
                                        Riwayat Approved
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {approvedList.length} pengajuan yang sudah disetujui (10 terakhir)
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {approvedList.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                            <History className="h-8 w-8 text-green-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Belum ada riwayat</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {approvedList.map((item) => renderAttendanceCard(item, false, true))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Export Period Dialog */}
                <Dialog open={exportPeriodOpen} onOpenChange={setExportPeriodOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5 text-sky-600" />
                                Export Riwayat
                            </DialogTitle>
                            <DialogDescription>
                                Pilih periode untuk export riwayat approval
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tanggal Mulai</Label>
                                    <Input
                                        type="date"
                                        value={exportStartDate}
                                        onChange={(e) => setExportStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Selesai</Label>
                                    <Input
                                        type="date"
                                        value={exportEndDate}
                                        onChange={(e) => setExportEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setExportPeriodOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleExportPeriod} className="gap-2">
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Export Photo Dialog */}
                <Dialog open={exportPhotoOpen} onOpenChange={setExportPhotoOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-blue-600" />
                                Export Foto Bukti
                            </DialogTitle>
                            <DialogDescription>
                                Pilih periode untuk export foto bukti
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Periode</Label>
                                <Select value={photoFilter} onValueChange={(v: any) => setPhotoFilter(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                                        <SelectItem value="30days">30 Hari Terakhir</SelectItem>
                                        <SelectItem value="all">Semua Foto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setExportPhotoOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleExportPhotos} className="gap-2">
                                <Download className="h-4 w-4" />
                                Export HTML
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Photo Preview Dialog */}
                <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-blue-600" />
                                Foto Bukti
                            </DialogTitle>
                        </DialogHeader>
                        {selectedPhoto && (
                            <div className="relative bg-gray-50 rounded-lg p-4">
                                <img
                                    src={selectedPhoto}
                                    alt="Bukti"
                                    className="w-full h-auto rounded-lg shadow-lg"
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Reject Reason Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                Alasan Penolakan
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan alasan mengapa pengajuan ini ditolak
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {selectedItem && (
                                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <p className="text-sm font-semibold text-gray-900">{selectedItem.student_name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(selectedItem.tanggal), 'dd MMMM yyyy', { locale: id })}
                                    </div>
                                    <Badge className={getStatusColor(selectedItem.status)}>
                                        {selectedItem.status}
                                    </Badge>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-sm font-medium">
                                    Alasan Penolakan <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Contoh: Foto tidak jelas, surat dokter tidak valid, tanggal tidak sesuai, dll..."
                                    rows={4}
                                    className="resize-none"
                                />
                                <p className="text-xs text-gray-500">
                                    Alasan ini akan digunakan untuk dokumentasi
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setRejectDialogOpen(false)}
                                disabled={processing === selectedItem?.id}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={processing === selectedItem?.id || !rejectReason.trim()}
                                className="gap-2 shadow-md"
                            >
                                {processing === selectedItem?.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menolak...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4" />
                                        Tolak Pengajuan
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Photos Dialog */}
                <Dialog open={deletePhotosDialogOpen} onOpenChange={setDeletePhotosDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-red-600" />
                                Hapus Foto dari Bucket
                            </DialogTitle>
                            <DialogDescription>
                                Hapus foto bukti dari storage berdasarkan rentang tanggal. <span className="font-semibold text-red-600">Tindakan ini tidak dapat dibatalkan!</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex gap-2">
                                    <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-800">
                                        <p className="font-semibold mb-1">Peringatan!</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>Foto akan dihapus permanen dari storage</li>
                                            <li>Referensi foto di database akan dihapus</li>
                                            <li>Proses ini tidak dapat dibatalkan</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deleteStartDate">
                                        Tanggal Mulai <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="deleteStartDate"
                                        type="date"
                                        value={deleteStartDate}
                                        onChange={(e) => setDeleteStartDate(e.target.value)}
                                        disabled={deletingPhotos}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deleteEndDate">
                                        Tanggal Selesai <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="deleteEndDate"
                                        type="date"
                                        value={deleteEndDate}
                                        onChange={(e) => setDeleteEndDate(e.target.value)}
                                        disabled={deletingPhotos}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">
                                    <span className="font-semibold">Catatan:</span> Sistem akan mencari dan menghapus semua foto dari tabel <code className="bg-gray-200 px-1 rounded">attendance</code> dan <code className="bg-gray-200 px-1 rounded">izin_telat</code> dalam rentang tanggal yang dipilih.
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDeletePhotosDialogOpen(false)
                                    setDeleteStartDate('')
                                    setDeleteEndDate('')
                                }}
                                disabled={deletingPhotos}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeletePhotos}
                                disabled={deletingPhotos || !deleteStartDate || !deleteEndDate}
                                className="gap-2 shadow-md"
                            >
                                {deletingPhotos ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Hapus Foto
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}
