'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Users,
    UserCheck,
    GraduationCap,
    Settings,
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

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Approval User',
        href: '/admin/approval',
        icon: UserCheck,
    },
    {
        title: 'Manajemen User',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Manajemen Kelas',
        href: '/admin/classes',
        icon: GraduationCap,
    },
    {
        title: 'Pengaturan Fitur',
        href: '/admin/settings',
        icon: Settings,
    },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { user, logout, loading } = useAuth()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Protect admin routes
    useEffect(() => {
        // Don't redirect while loading
        if (loading) return

        if (!user || user.role !== 'admin') {
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

    if (!user || user.role !== 'admin') {
        return null
    }

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-gray-200 bg-white">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6">
                    {/* Logo */}
                    <div className="flex h-20 shrink-0 items-center border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                                <LayoutDashboard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                                <p className="text-xs text-gray-500">LapanClass</p>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="px-3 py-2 bg-emerald-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{user.nama}</p>
                        <p className="text-xs text-emerald-600">Administrator</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-2">
                            {adminNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = typeof window !== 'undefined' && window.location.pathname === item.href

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
            <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm lg:hidden">
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-700"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
                </div>
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
                                        <LayoutDashboard className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
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
                                <p className="text-xs text-emerald-600">Administrator</p>
                            </div>

                            {/* Mobile Navigation */}
                            <nav className="flex flex-1 flex-col">
                                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                                    {adminNavItems.map((item) => {
                                        const Icon = item.icon
                                        const isActive = typeof window !== 'undefined' && window.location.pathname === item.href

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
