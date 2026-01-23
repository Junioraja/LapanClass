'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Calendar, Wallet, Settings, User, LogOut, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [hasTunggakan, setHasTunggakan] = useState(false)

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

        // Check tunggakan
        if (user.class_id && user.id) {
            checkTunggakan()
        }
    }, [user, router])

    const checkTunggakan = async () => {
        if (!user?.class_id || !user?.id) return

        console.log('=== CHECK TUNGGAKAN (Layout) ===')
        console.log('User:', user.nama, '| ID:', user.id)
        console.log('Class ID:', user.class_id)

        try {
            const currentDate = new Date()
            const currentMonth = currentDate.getMonth() + 1
            const currentYear = currentDate.getFullYear()

            let startMonth, endMonth, year
            if (currentMonth >= 7) {
                startMonth = 7
                endMonth = 12
                year = currentYear
            } else {
                startMonth = 1
                endMonth = 6
                year = currentYear
            }

            const monthNames = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ]

            console.log('Semester:', monthNames[startMonth - 1], '-', monthNames[endMonth - 1], year)
            console.log('Will check months:', startMonth, 'to', Math.min(endMonth, currentMonth))

            let hasUnpaid = false
            for (let m = startMonth; m <= Math.min(endMonth, currentMonth); m++) {
                const bulanStr = `${monthNames[m - 1]} ${year}`

                const { data: payment, error } = await supabase
                    .from('kas_payments')
                    .select('id')
                    .eq('class_id', user.class_id)
                    .eq('student_id', user.id)
                    .eq('periode_bulan', bulanStr)
                    .single()

                console.log(`- ${bulanStr}:`, payment ? '✅ Paid' : '❌ Unpaid', error?.code)

                if (!payment) {
                    hasUnpaid = true
                    break
                }
            }

            setHasTunggakan(hasUnpaid)
            console.log('Final result - Has tunggakan?', hasUnpaid)
        } catch (error) {
            console.error('Error checking tunggakan:', error)
        }
    }

    const navItems = [
        { href: '/siswa', icon: Home, label: 'Beranda', hasBadge: false },
        { href: '/siswa/riwayat', icon: Calendar, label: 'Riwayat', hasBadge: false },
        { href: '/siswa/kas', icon: Wallet, label: 'Kas Kelas', hasBadge: hasTunggakan },
        { href: '/siswa/settings', icon: Settings, label: 'Pengaturan', hasBadge: false },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="inline-block h-12 w-12 rounded-full border-4 border-solid border-sky-600 border-r-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="mt-4 text-sm font-medium text-gray-600">Loading...</p>
                </motion.div>
            </div>
        )
    }

    if (!user || user.role !== 'siswa') {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 pb-20">
            {/* Top Header - Minimal */}
            <motion.header
                className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-sky-100 shadow-sm"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
                                <IdCard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                    Portal Siswa
                                </h1>
                                <p className="text-xs text-gray-500">LapanClass</p>
                            </div>
                        </motion.div>

                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-semibold text-gray-900">{user.nama}</p>
                                <p className="text-xs text-gray-500">NIS: {user.nis || '-'}</p>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="gap-2 hover:bg-red-50 hover:text-red-600"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Keluar</span>
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Navigation Bar */}
            <motion.nav
                className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                <div className="max-w-7xl mx-auto px-2 sm:px-4">
                    <div className="flex items-center justify-around h-16">
                        {navItems.map((item, index) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex-1 flex flex-col items-center justify-center h-full relative"
                                >
                                    <motion.div
                                        className="flex flex-col items-center gap-1"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="relative">
                                            <motion.div
                                                animate={{
                                                    scale: isActive ? [1, 1.2, 1] : 1,
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                }}
                                            >
                                                <Icon
                                                    className={`h-6 w-6 transition-colors ${isActive
                                                        ? 'text-sky-600'
                                                        : 'text-gray-400'
                                                        }`}
                                                />
                                            </motion.div>

                                            {/* Active Indicator */}
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-600 rounded-full"
                                                        layoutId="activeTab"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Badge Notification - Tunggakan */}
                                            <AnimatePresence>
                                                {item.hasBadge && (
                                                    <motion.div
                                                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"
                                                        initial={{ scale: 0 }}
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                        }}
                                                        exit={{ scale: 0 }}
                                                        transition={{
                                                            duration: 0.5,
                                                            repeat: Infinity,
                                                            repeatDelay: 2
                                                        }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <motion.span
                                            className={`text-xs font-medium transition-colors ${isActive
                                                ? 'text-sky-600'
                                                : 'text-gray-500'
                                                }`}
                                            animate={{
                                                fontWeight: isActive ? 600 : 500,
                                            }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    </motion.div>

                                    {/* Ripple Effect on Active */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 bg-sky-50 rounded-lg"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </motion.nav>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                        />
                        <motion.div
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm z-50"
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <LogOut className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Keluar dari Aplikasi?
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Anda yakin ingin keluar dari portal siswa?
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="flex-1"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setShowLogoutConfirm(false)
                                            logout()
                                        }}
                                        className="flex-1 gap-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
