'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/dashboard-layout'
import { SemesterModal } from '@/components/semester-modal'
import { supabase } from '@/lib/supabase'
import { SemesterConfig } from '@/lib/types'
import { toast } from 'sonner'

export default function SettingsPage() {
    const [namaKelas, setNamaKelas] = useState('')
    const [semesters, setSemesters] = useState<SemesterConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Load class name from localStorage on mount
    useEffect(() => {
        const savedNamaKelas = localStorage.getItem('namaKelas')
        if (savedNamaKelas) {
            setNamaKelas(savedNamaKelas)
        }
    }, [])

    // Fetch semesters from database
    const fetchSemesters = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('semester_config')
            .select('*')
            .order('tanggal_mulai', { ascending: false })

        if (!error && data) {
            setSemesters(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSemesters()
    }, [])

    // Handle class name save
    const handleSaveNamaKelas = () => {
        localStorage.setItem('namaKelas', namaKelas)
        toast.success('Nama kelas berhasil disimpan!')
    }

    // Handle semester deletion
    const handleDeleteSemester = async (id: string) => {
        setDeletingId(id)

        const { error } = await supabase
            .from('semester_config')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting semester:', error)
            toast.error('Gagal menghapus semester. Silakan coba lagi.')
        } else {
            toast.success('Semester berhasil dihapus!')
            fetchSemesters()
        }

        setDeletingId(null)
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    return (
        <DashboardLayout>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Pengaturan</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Kelola konfigurasi kelas dan semester
                    </p>
                </div>

                {/* Section 1: General Info */}
                <Card className="mb-6 shadow-lg">
                    <CardHeader>
                        <CardTitle>Informasi Umum</CardTitle>
                        <CardDescription>Konfigurasi dasar kelas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nama-kelas">Nama Kelas</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="nama-kelas"
                                        placeholder="Contoh: XI RPL"
                                        value={namaKelas}
                                        onChange={(e) => setNamaKelas(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSaveNamaKelas}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        Simpan
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Nama kelas akan disimpan di browser Anda
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Semester Management */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Manajemen Semester</CardTitle>
                                <CardDescription>
                                    Kelola semester dan rentang tanggal
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => setModalOpen(true)}
                                className="gap-2 bg-sky-600 hover:bg-sky-700 shadow-md"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Semester
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                            </div>
                        ) : semesters.length === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed">
                                <div className="text-center">
                                    <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada semester. Klik "Tambah Semester" untuk mulai.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {semesters.map((semester) => (
                                    <Card key={semester.id} className="border-2 hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        Kelas {semester.kelas}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Semester {semester.semester}
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => semester.id && handleDeleteSemester(semester.id)}
                                                    disabled={deletingId === semester.id}
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    {deletingId === semester.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Periode</span>
                                                </div>
                                                <div className="pl-6">
                                                    <p className="font-medium">
                                                        {formatDate(semester.tanggal_mulai)}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">s/d</p>
                                                    <p className="font-medium">
                                                        {formatDate(semester.tanggal_selesai)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Semester Modal */}
            <SemesterModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={fetchSemesters}
            />
        </DashboardLayout>
    )
}
