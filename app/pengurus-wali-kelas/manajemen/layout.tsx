'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Users,
    Calendar,
    BookOpen,
    Menu,
    X,
    ArrowLeft,
    LogOut,
    Settings as SettingsIcon,
} from 'lucide-react'

interface NavItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

const managementNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/pengurus-wali-kelas/manajemen',
        icon: LayoutDashboard,
    },
    {
        title: 'Data Siswa',
        href: '/pengurus-wali-kelas/manajemen/siswa',
        icon: Users,
    },
    {
        title: 'Mata Pelajaran',
        href: '/pengurus-wali-kelas/manajemen/mapel',
        icon: BookOpen,
    },
    {
        title: 'Jadwal Pelajaran',
        href: '/pengurus-wali-kelas/manajemen/jadwal',
        icon: Calendar,
    },
]

export default function ManajemenLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Route protection - move to useEffect to avoid render during render
    useEffect(() => {
        // Only redirect if user is defined (meaning auth state has loaded)
        // and the user is not authorized for this section.
        if (user !== undefined && (!user || !['wali_kelas', 'ketua_kelas', 'bendahara'].includes(user.role))) {
            router.push('/pengurus-wali-kelas')
        }
    }, [user, router])

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    // Don't render if not authorized or user is still loading (user === undefined)
    if (user === undefined || !user || !['wali_kelas', 'ketua_kelas', 'bendahara'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-gray-200 bg-white">
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-indigo-600">Manajemen Kelas</h2>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {managementNavItems.map((item) => {
                            const Icon = item.icon
                            const isActive = typeof window !== 'undefined' && window.location.pathname === item.href

                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.title}
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Info & Actions */}
                    <div className="p-4 border-t border-gray-200 space-y-3">
                        <div className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
                                <span className="text-sm font-semibold text-white">
                                    {user.nama?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.nama}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <Link href="/pengurus-wali-kelas">
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Dashboard Utama
                            </Button>
                        </Link>

                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            size="sm"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Keluar
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm">
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-700"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
                    Manajemen Kelas
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden">
                    <div className="fixed inset-0 z-50 bg-gray-900/80" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-indigo-600">Manajemen Kelas</h2>
                            <button
                                type="button"
                                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <nav className="space-y-1">
                            {managementNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = typeof window !== 'undefined' && window.location.pathname === item.href

                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                                        <div
                                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${isActive
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {item.title}
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                            <div className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
                                    <span className="text-sm font-semibold text-white">
                                        {user.nama?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{user.nama}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <Link href="/pengurus-wali-kelas">
                                <Button variant="outline" className="w-full justify-start" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Dashboard Utama
                                </Button>
                            </Link>

                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="w-full justify-start text-red-600"
                                size="sm"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Keluar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="lg:pl-72">
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
