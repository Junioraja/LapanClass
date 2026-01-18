'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Users, BookOpen, Calendar, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { SemesterModal } from '@/components/semester-modal'
import { SemesterConfig } from '@/lib/types'
import { toast } from 'sonner'

export default function ManajemenDashboard() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalSiswa: 0,
        totalMapel: 0,
        totalJadwal: 0,
    })
    const [semesterModalOpen, setSemesterModalOpen] = useState(false)
    const [currentSemester, setCurrentSemester] = useState<SemesterConfig | null>(null)

    useEffect(() => {
        if (user?.class_id) {
            fetchStats(user.class_id)
            fetchCurrentSemester()
        }
    }, [user])

    async function fetchStats(classId: string) {
        setLoading(true)
        try {
            const [siswaRes, mapelRes, jadwalRes] = await Promise.all([
                supabase.from('students_master').select('id', { count: 'exact', head: true }).eq('class_id', classId),
                supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('class_id', classId),
                supabase.from('schedules').select('id', { count: 'exact', head: true }).eq('class_id', classId),
            ])

            setStats({
                totalSiswa: siswaRes.count || 0,
                totalMapel: mapelRes.count || 0,
                totalJadwal: jadwalRes.count || 0,
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchCurrentSemester() {
        const { data } = await supabase
            .from('semester_config')
            .select('*')
            .order('tanggal_mulai', { ascending: false })
            .limit(1)
            .single()

        if (data) {
            setCurrentSemester(data)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Manajemen</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Kelola data siswa, mata pelajaran, dan jadwal kelas
                </p>
            </div>

            {/* Semester Info */}
            <Card className="mb-6 bg-indigo-50 border-indigo-200">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        {currentSemester ? (
                            <div className="flex items-center gap-4">
                                <SettingsIcon className="h-5 w-5 text-indigo-600" />
                                <div>
                                    <p className="text-sm font-semibold text-indigo-900">
                                        Semester {currentSemester.semester} - Kelas {currentSemester.kelas}
                                    </p>
                                    <p className="text-xs text-indigo-700">
                                        {new Date(currentSemester.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(currentSemester.tanggal_selesai).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-semibold text-amber-900">Semester belum dikonfigurasi</p>
                                <p className="text-xs text-amber-700">Klik tombol untuk mengatur semester</p>
                            </div>
                        )}
                        <Button
                            onClick={() => setSemesterModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <SettingsIcon className="h-4 w-4 mr-2" />
                            Atur Semester
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Link href="/pengurus-wali-kelas/manajemen/siswa">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-600">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-gray-700">Data Siswa</CardTitle>
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-600">{stats.totalSiswa}</p>
                            <p className="text-sm text-gray-500 mt-1">Siswa terdaftar</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/pengurus-wali-kelas/manajemen/mapel">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-emerald-600">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-gray-700">Mata Pelajaran</CardTitle>
                                <BookOpen className="h-8 w-8 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-emerald-600">{stats.totalMapel}</p>
                            <p className="text-sm text-gray-500 mt-1">Mapel terdaftar</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/pengurus-wali-kelas/manajemen/jadwal">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-600">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-gray-700">Jadwal Pelajaran</CardTitle>
                                <Calendar className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-purple-600">{stats.totalJadwal}</p>
                            <p className="text-sm text-gray-500 mt-1">Jadwal tersusun</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Aksi cepat untuk manajemen kelas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/pengurus-wali-kelas/manajemen/siswa">
                            <Button variant="outline" className="w-full justify-start h-auto py-4">
                                <Users className="h-5 w-5 mr-3 text-blue-600" />
                                <div className="text-left">
                                    <p className="font-semibold">Data Siswa</p>
                                    <p className="text-xs text-gray-500">Kelola siswa</p>
                                </div>
                            </Button>
                        </Link>

                        <Link href="/pengurus-wali-kelas/manajemen/mapel">
                            <Button variant="outline" className="w-full justify-start h-auto py-4">
                                <BookOpen className="h-5 w-5 mr-3 text-emerald-600" />
                                <div className="text-left">
                                    <p className="font-semibold">Mata Pelajaran</p>
                                    <p className="text-xs text-gray-500">Kelola mapel</p>
                                </div>
                            </Button>
                        </Link>

                        <Link href="/pengurus-wali-kelas/manajemen/jadwal">
                            <Button variant="outline" className="w-full justify-start h-auto py-4">
                                <Calendar className="h-5 w-5 mr-3 text-purple-600" />
                                <div className="text-left">
                                    <p className="font-semibold">Jadwal</p>
                                    <p className="text-xs text-gray-500">Atur jadwal</p>
                                </div>
                            </Button>
                        </Link>

                        <Button
                            onClick={() => setSemesterModalOpen(true)}
                            variant="outline"
                            className="w-full justify-start h-auto py-4"
                        >
                            <SettingsIcon className="h-5 w-5 mr-3 text-indigo-600" />
                            <div className="text-left">
                                <p className="font-semibold">Semester</p>
                                <p className="text-xs text-gray-500">Atur semester</p>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Semester Modal */}
            <SemesterModal
                open={semesterModalOpen}
                onOpenChange={setSemesterModalOpen}
                onSuccess={fetchCurrentSemester}
            />
        </div>
    )
}
