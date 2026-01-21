'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { FileText, Clock, AlertCircle, Calendar, User, Hash, IdCard, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is student
        if (!user) {
            setLoading(false)
            return
        }

        if (user.role !== 'siswa') {
            router.push('/')
            return
        }

        setLoading(false)
    }, [user, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user || user.role !== 'siswa') {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
                                <IdCard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Portal Siswa</h1>
                                <p className="text-xs text-gray-500">LapanClass</p>
                            </div>
                        </div>

                        {/* User Info & Logout */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-gray-900">{user.nama}</p>
                                <p className="text-xs text-gray-500">NIS: {user.nis || '-'}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Keluar</span>
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex gap-4 -mb-px">
                        <Link
                            href="/siswa"
                            className="inline-flex items-center gap-2 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-sky-500 hover:text-sky-600 data-[active=true]:border-sky-500 data-[active=true]:text-sky-600"
                            data-active={pathname === '/siswa'}
                        >
                            <User className="h-4 w-4" />
                            Beranda
                        </Link>
                        <Link
                            href="/siswa/riwayat"
                            className="inline-flex items-center gap-2 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-sky-500 hover:text-sky-600 data-[active=true]:border-sky-500 data-[active=true]:text-sky-600"
                            data-active={pathname === '/siswa/riwayat'}
                        >
                            <Calendar className="h-4 w-4" />
                            Riwayat Absensi
                        </Link>
                        <Link
                            href="/siswa/settings"
                            className="inline-flex items-center gap-2 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-sky-500 hover:text-sky-600 data-[active=true]:border-sky-500 data-[active=true]:text-sky-600"
                            data-active={pathname === '/siswa/settings'}
                        >
                            <Settings className="h-4 w-4" />
                            Pengaturan
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
