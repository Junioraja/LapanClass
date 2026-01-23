'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Settings,
    Menu,
    X,
    CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavItem {
    title: string
    href: string
    icon: any
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/pengurus-wali-kelas/sekretaris/absensi',
        icon: LayoutDashboard,
    },
    {
        title: 'Approval',
        href: '/pengurus-wali-kelas/sekretaris/absensi/approval',
        icon: CheckCircle,
    },
    {
        title: 'Detail Bulanan',
        href: '/pengurus-wali-kelas/sekretaris/absensi/monthly',
        icon: Calendar,
    },
    {
        title: 'Rekap Semester',
        href: '/pengurus-wali-kelas/sekretaris/absensi/recap',
        icon: FileText,
    },
    {
        title: 'Pengaturan',
        href: '/pengurus-wali-kelas/sekretaris/absensi/settings',
        icon: Settings,
    },
]

interface DashboardLayoutProps {
    children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 shadow-lg">
                    {/* Logo */}
                    <div className="flex h-20 shrink-0 items-center border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500">
                                <LayoutDashboard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Absensi Kelas</h1>
                                <p className="text-xs text-gray-500">Sistem Kehadiran</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-all',
                                                isActive
                                                    ? 'bg-gradient-to-r from-sky-50 to-emerald-50 text-sky-700 shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-sky-600'
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-5 w-5 shrink-0',
                                                    isActive ? 'text-sky-600' : 'text-gray-400 group-hover:text-sky-600'
                                                )}
                                            />
                                            {item.title}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Footer Info */}
                    <div className="border-t border-gray-100 py-4">
                        <p className="text-xs text-gray-500">© 2026 Sistem Absensi</p>
                        <p className="text-xs text-gray-400">Made with ❤️</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm lg:hidden">
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Absensi Kelas</span>
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
                        <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6 pb-4">
                            {/* Mobile Logo with Close */}
                            <div className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500">
                                        <LayoutDashboard className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-gray-900">Absensi Kelas</h1>
                                        <p className="text-xs text-gray-500">Sistem Kehadiran</p>
                                    </div>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Mobile Navigation */}
                            <nav className="flex flex-1 flex-col">
                                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href
                                        const Icon = item.icon

                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={cn(
                                                        'group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-all',
                                                        isActive
                                                            ? 'bg-gradient-to-r from-sky-50 to-emerald-50 text-sky-700 shadow-sm'
                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-sky-600'
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            'h-5 w-5 shrink-0',
                                                            isActive ? 'text-sky-600' : 'text-gray-400 group-hover:text-sky-600'
                                                        )}
                                                    />
                                                    {item.title}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content */}
            <main className="lg:pl-72">
                <div className="pb-20 lg:pb-0">{children}</div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
                <nav className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-all',
                                    isActive
                                        ? 'text-sky-600'
                                        : 'text-gray-500 hover:text-sky-600'
                                )}
                            >
                                <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                                <span className="text-[10px] font-medium">{item.title.split(' ')[0]}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
