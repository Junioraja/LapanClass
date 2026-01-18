'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, GraduationCap, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        pendingApproval: 0,
        totalUsers: 0,
        totalClasses: 0,
        totalStudents: 0,
    })

    useEffect(() => {
        async function fetchStats() {
            // Pending approval count
            const { count: pendingCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_approved', false)

            // Total users (profiles)
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            // Total classes
            const { count: classesCount } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })

            // Total students
            const { count: studentsCount } = await supabase
                .from('students_master')
                .select('*', { count: 'exact', head: true })

            setStats({
                pendingApproval: pendingCount || 0,
                totalUsers: usersCount || 0,
                totalClasses: classesCount || 0,
                totalStudents: studentsCount || 0,
            })
        }

        fetchStats()
    }, [])

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                <p className="mt-2 text-sm text-gray-600">Kelola sistem LapanClass</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User Pending</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingApproval}</div>
                        <p className="text-xs text-muted-foreground">Menunggu approval</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total User</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Pengurus & Admin</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClasses}</div>
                        <p className="text-xs text-muted-foreground">Kelas terdaftar</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Siswa terdaftar</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            Approval User
                        </CardTitle>
                        <CardDescription>
                            {stats.pendingApproval} user menunggu persetujuan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/approval">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                Lihat Pending Approval
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-600" />
                            Manajemen User
                        </CardTitle>
                        <CardDescription>
                            Kelola pengurus, admin, dan siswa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/users">
                            <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                                Kelola User
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                            Manajemen Kelas
                        </CardTitle>
                        <CardDescription>
                            CRUD kelas dan lihat detail
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/classes">
                            <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                                Kelola Kelas
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
