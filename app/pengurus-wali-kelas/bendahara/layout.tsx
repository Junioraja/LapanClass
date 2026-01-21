'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Wallet,
    TrendingDown,
    PiggyBank,
    FileText,
    Settings,
    ArrowLeft,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

interface NavItem {
    title: string
    href: string
    icon: any
}

const bendaharaNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/pengurus-wali-kelas/bendahara',
        icon: LayoutDashboard,
    },
    {
        title: 'Kas Kelas',
        href: '/pengurus-wali-kelas/bendahara/kas',
        icon: Wallet,
    },
    {
        title: 'Pengeluaran',
        href: '/pengurus-wali-kelas/bendahara/pengeluaran',
        icon: TrendingDown,
    },
    {
        title: 'Tabungan & Iuran',
        href: '/pengurus-wali-kelas/bendahara/tabungan',
        icon: PiggyBank,
    },
    {
        title: 'Laporan',
        href: '/pengurus-wali-kelas/bendahara/laporan',
        icon: FileText,
    },
]

export default function BendaharaLayout({ children }: { children: ReactNode }) {
    const { user, logout, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Protect bendahara routes
    useEffect(() => {
        if (loading) return

        if (!user || !['bendahara', 'wali_kelas', 'ketua_kelas', 'sekretaris'].includes(user.role)) {
            router.push('/login')
        }
    }, [user, loading, router])

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-gray-200 bg-white">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6">
                    {/* Logo & Back Button */}
                    <div className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Bendahara</h1>
                                <p className="text-xs text-gray-500">LapanClass</p>
                            </div>
                        </div>
                        <Link href="/pengurus-wali-kelas">
                            <Button variant="ghost" size="icon" title="Kembali">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* User Info */}
                    <div className="px-3 py-2 bg-emerald-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{user.nama}</p>
                        <p className="text-xs text-emerald-600 capitalize">{user.role.replace('_', ' ')}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-2">
                            {bendaharaNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-all ${isActive
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
                                                }`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'
                                                    }`}
                                            />
                                            {item.title}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Logout Button */}
                    <div className="border-t border-gray-100 py-4">
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="w-full justify-start gap-3 text-gray-700 hover:text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="sticky top-0 z-40 flex items-center justify-between gap-x-6 bg-white px-4 py-4 shadow-sm lg:hidden">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Bendahara</span>
                    </div>
                </div>
                <Link href="/pengurus-wali-kelas">
                    <Button variant="ghost" size="icon" title="Kembali">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden">
                        <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6">
                            {/* Mobile Logo with Close */}
                            <div className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                                        <Wallet className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-gray-900">Bendahara</h1>
                                        <p className="text-xs text-gray-500">LapanClass</p>
                                    </div>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* User Info Mobile */}
                            <div className="px-3 py-2 bg-emerald-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-900">{user.nama}</p>
                                <p className="text-xs text-emerald-600 capitalize">{user.role.replace('_', ' ')}</p>
                            </div>

                            {/* Mobile Navigation */}
                            <nav className="flex flex-1 flex-col">
                                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                                    {bendaharaNavItems.map((item) => {
                                        const Icon = item.icon
                                        const isActive = pathname === item.href

                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-all ${isActive
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
                                                        }`}
                                                >
                                                    <Icon
                                                        className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'
                                                            }`}
                                                    />
                                                    {item.title}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </nav>

                            {/* Logout Button Mobile */}
                            <div className="border-t border-gray-100 py-4">
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="w-full justify-start gap-3 text-gray-700 hover:text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
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
