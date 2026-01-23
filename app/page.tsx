'use client'

import Link from 'next/link'
import {
    BookOpen,
    Users,
    Calendar,
    Wallet,
    CheckCircle,
    ArrowRight,
    Menu,
    Sparkles,
    Star,
    TrendingUp,
    Shield,
    Zap,
    Clock,
    BarChart3,
    Award,
    ChevronDown,
    X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)
    const { scrollY } = useScroll()
    const containerRef = useRef<HTMLDivElement>(null)

    // Scroll progress
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const scrollPercent = (scrollTop / docHeight) * 100
            setScrollProgress(scrollPercent)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Floating animation
    const floatAnimation = {
        animate: {
            y: [-8, 8, -8],
            rotate: [-2, 2, -2],
        },
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut" as const,
        },
    }

    const floatAnimationSlow = {
        animate: {
            y: [-5, 5, -5],
        },
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut" as const,
        },
    }

    // Pulse glow animation
    const pulseGlow = {
        animate: {
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
        },
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const,
        },
    }

    // Shimmer animation
    const shimmerAnimation = {
        animate: {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        },
        transition: {
            duration: 20,
            repeat: Infinity,
            ease: "linear" as const,
        },
    }

    // Slide in variants
    const slideUp = {
        hidden: { opacity: 0, y: 80 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                delay: i * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94] as any,
            },
        }),
    }

    const slideInLeft = {
        hidden: { opacity: 0, x: -100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94] as any,
            },
        },
    }

    const slideInRight = {
        hidden: { opacity: 0, x: 100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94] as any,
            },
        },
    }

    const scaleIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94] as any,
            },
        },
    }

    // Animated counter
    const AnimatedCounter = ({ value, suffix = '', duration = 2 }: { value: number, suffix?: string, duration?: number }) => {
        const [count, setCount] = useState(0)

        useEffect(() => {
            let startTime: number | null = null
            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime
                const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
                setCount(Math.floor(progress * value))
                if (progress < 1) {
                    requestAnimationFrame(animate)
                }
            }
            requestAnimationFrame(animate)
        }, [value, duration])

        return <>{count}{suffix}</>
    }

    // Glass card component for light theme
    const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
        <motion.div
            className={`backdrop-blur-xl bg-white/80 border border-gray-200/60 ${className}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-50px', amount: 0.3 }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -4, scale: 1.02 }}
        >
            {children}
        </motion.div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden relative">
            {/* Scroll progress bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 z-[100] origin-left"
                style={{ scaleX: useSpring(scrollProgress / 100) }}
            />

            {/* Animated background */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Gradient mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]" />

                {/* Animated gradients */}
                <motion.div
                    className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl"
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 5,
                    }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/3 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.05, 0.1, 0.05],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Floating particles */}
                {[
                    { x: 20, y: 30, delay: 0 },
                    { x: 60, y: 70, delay: 0.5 },
                    { x: 80, y: 20, delay: 1 },
                    { x: 30, y: 80, delay: 1.5 },
                    { x: 90, y: 50, delay: 2 },
                    { x: 50, y: 40, delay: 2.5 },
                ].map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-emerald-400/20 rounded-full"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: particle.delay,
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <motion.header className="border-b border-emerald-100/60 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 md:h-20 items-center justify-between">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div
                                className="relative"
                                {...floatAnimation}
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
                                    <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <motion.div
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                                    {...pulseGlow}
                                />
                            </motion.div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-gray-900">LapanClass</span>
                                <span className="text-xs text-emerald-600">Smart Class Management</span>
                            </div>
                        </motion.div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            {[
                                { href: '#fitur', label: 'Fitur' },
                                { href: '#stats', label: 'Statistik' },
                                { href: '#tentang', label: 'Tentang' },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 * index }}
                                >
                                    <Link
                                        href={item.href}
                                        className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors relative group"
                                    >
                                        {item.label}
                                        <motion.span
                                            className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"
                                            initial={false}
                                            whileHover={{ width: '100%' }}
                                        />
                                    </Link>
                                </motion.div>
                            ))}
                        </nav>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Link href="/login">
                                    <Button
                                        variant="ghost"
                                        className="text-gray-600 hover:text-gray-900 hover:bg-emerald-50"
                                    >
                                        Masuk
                                    </Button>
                                </Link>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <Link href="/register">
                                    <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 border-0">
                                        Daftar
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Mobile menu button */}
                        <motion.button
                            className="md:hidden p-2 text-gray-600"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </motion.button>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-emerald-100"
                        >
                            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                                {[
                                    { href: '#fitur', label: 'Fitur' },
                                    { href: '#stats', label: 'Statistik' },
                                    { href: '#tentang', label: 'Tentang' },
                                ].map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="text-gray-600 hover:text-emerald-600 transition-colors py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <div className="flex flex-col gap-3 pt-4 border-t border-emerald-100">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full border-emerald-500/50 text-emerald-600 hover:bg-emerald-50">
                                            Masuk
                                        </Button>
                                    </Link>
                                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
                                            Daftar
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative">
                <div className="relative">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <motion.div
                                        animate={{
                                            rotate: [0, 360],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    >
                                        <Sparkles className="h-4 w-4 text-emerald-600" />
                                    </motion.div>
                                    <span className="text-sm font-medium text-emerald-600">Platform Manajemen Kelas Modern</span>
                                </div>
                            </motion.div>

                            {/* Heading */}
                            <motion.h1
                                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 leading-tight"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                            >
                                Kelola Kelas dengan
                                <span className="block mt-2 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                    Lebih Cerdas
                                </span>
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                className="text-lg text-gray-600 leading-relaxed max-w-xl"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                Platform lengkap untuk mengelola absensi, jurnal pembelajaran, dan keuangan kelas.
                                Mendukung multi-kelas dengan sistem approval yang aman dan terpercaya.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div
                                className="flex flex-col sm:flex-row gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <Link href="/login">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            size="lg"
                                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 text-lg px-8 h-14"
                                        >
                                            Mulai Sekarang
                                            <motion.div
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </motion.div>
                                        </Button>
                                    </motion.div>
                                </Link>
                                <Link href="/register">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 text-lg px-8 h-14"
                                        >
                                            Daftar Pengurus
                                        </Button>
                                    </motion.div>
                                </Link>
                            </motion.div>

                            {/* Trust badges */}
                            <motion.div
                                className="flex items-center gap-6 pt-8 border-t border-gray-200"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                {[
                                    { icon: Shield, label: '100% Aman' },
                                    { icon: Zap, label: 'Cepat & Ringan' },
                                    { icon: Award, label: 'Terpercaya' },
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center gap-2 text-gray-600"
                                        whileHover={{ color: '#059669' }}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="text-sm">{item.label}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Right - Visual Element */}
                        <motion.div
                            className="relative hidden lg:block"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {/* Main card */}
                            <motion.div
                                className="relative"
                                {...floatAnimation}
                            >
                                <GlassCard className="rounded-3xl p-8 space-y-6 shadow-xl shadow-gray-200/50">
                                    {/* Stats preview */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Siswa', value: 45, color: 'text-emerald-600' },
                                            { label: 'Hadir', value: 42, color: 'text-green-600' },
                                            { label: 'Kas', value: '2.5M', color: 'text-blue-600' },
                                        ].map((stat, index) => (
                                            <motion.div
                                                key={index}
                                                className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100"
                                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(16,185,129,0.1)' }}
                                            >
                                                <div className={`text-2xl font-bold ${stat.color}`}>
                                                    {typeof stat.value === 'number' ? <AnimatedCounter value={stat.value} /> : stat.value}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Recent activity */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Aktivitas Terbaru</span>
                                            <motion.div whileHover={{ scale: 1.1 }}>
                                                <ChevronDown className="h-4 w-4 text-emerald-600" />
                                            </motion.div>
                                        </div>
                                        {[
                                            { action: 'Absensi', time: 'Baru saja', icon: CheckCircle },
                                            { action: 'Jurnal', time: '5 menit lalu', icon: Calendar },
                                            { action: 'Kas', time: '1 jam lalu', icon: Wallet },
                                        ].map((item, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-emerald-200 transition-colors"
                                                whileHover={{ x: 4, backgroundColor: 'rgba(16,185,129,0.05)' }}
                                            >
                                                <motion.div
                                                    className="p-2 rounded-lg bg-emerald-100"
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                >
                                                    <item.icon className="h-4 w-4 text-emerald-600" />
                                                </motion.div>
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-900">{item.action}</div>
                                                    <div className="text-xs text-gray-500">{item.time}</div>
                                                </div>
                                                <motion.div
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                </motion.div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </GlassCard>

                                {/* Floating badges */}
                                <motion.div
                                    className="absolute -top-4 -right-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30"
                                    {...floatAnimationSlow}
                                >
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-white fill-white" />
                                        <span className="text-white text-sm font-medium">4.9 Rating</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-20 relative">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/50 to-transparent"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { value: 500, suffix: '+', label: 'Kelas Terdaftar', icon: Users, color: 'from-emerald-500 to-green-600' },
                            { value: 15, suffix: 'K+', label: 'Siswa Aktif', icon: Star, color: 'from-blue-500 to-cyan-600' },
                            { value: 50, suffix: 'K+', label: 'Jurnal Pembelajaran', icon: Calendar, color: 'from-purple-500 to-violet-600' },
                            { value: 98, suffix: '%', label: 'Kepuasan Pengguna', icon: Award, color: 'from-amber-500 to-orange-600' },
                        ].map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <motion.div
                                    key={index}
                                    custom={index}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: '-100px' }}
                                    variants={scaleIn}
                                >
                                    <GlassCard className="rounded-3xl p-8 text-center space-y-4 hover:border-emerald-300/50 transition-colors">
                                        <motion.div
                                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <Icon className="h-8 w-8 text-emerald-600" />
                                        </motion.div>
                                        <div>
                                            <div className="text-4xl font-bold text-gray-900">
                                                <AnimatedCounter value={stat.value} duration={2} />
                                                {stat.suffix}
                                            </div>
                                            <div className="text-gray-600 mt-1">{stat.label}</div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Features Section - Bento Grid */}
            <section id="fitur" className="py-20 relative">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section header */}
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.div
                            className="inline-flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-600">Fitur Unggulan</span>
                        </motion.div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Semua yang Anda Butuhkan
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Kelola kelas dengan lebih efisien menggunakan fitur-fitur modern yang dirancang untuk kemudahan
                        </p>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Large feature - Multi-Class */}
                        <motion.div
                            className="lg:col-span-2"
                            custom={0}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            variants={slideUp}
                        >
                            <GlassCard className="rounded-3xl p-8 h-full space-y-6 group shadow-xl shadow-gray-200/50">
                                <div className="flex items-start justify-between">
                                    <motion.div
                                        className="p-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                        <Users className="h-8 w-8 text-emerald-600" />
                                    </motion.div>
                                    <motion.div
                                        className="p-2 rounded-xl bg-emerald-100"
                                        whileHover={{ scale: 1.2 }}
                                    >
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    </motion.div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Multi-Class Support</h3>
                                    <p className="text-gray-600">
                                        Kelola banyak kelas sekaligus dengan sistem isolasi data yang aman untuk setiap kelas.
                                        Switch antar kelas dengan mudah dalam satu dashboard.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                    <div className="flex -space-x-2">
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 border-2 border-white"
                                            />
                                        ))}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="text-gray-900 font-medium">500+</span> kelas aktif
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Absensi */}
                        <motion.div
                            custom={1}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            variants={slideUp}
                        >
                            <GlassCard className="rounded-3xl p-8 h-full space-y-6 group shadow-xl shadow-gray-200/50">
                                <motion.div
                                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                    <CheckCircle className="h-8 w-8 text-blue-600" />
                                </motion.div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Absensi Digital</h3>
                                    <p className="text-gray-600">
                                        Catat kehadiran siswa dengan mudah, lengkap dengan rekap bulanan dan semester.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                                        <div className="text-2xl font-bold text-emerald-600">98%</div>
                                        <div className="text-xs text-gray-500">Kehadiran</div>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                                        <div className="text-2xl font-bold text-blue-600">Auto</div>
                                        <div className="text-xs text-gray-500">Rekap</div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Jurnal */}
                        <motion.div
                            custom={2}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            variants={slideUp}
                        >
                            <GlassCard className="rounded-3xl p-8 h-full space-y-6 group shadow-xl shadow-gray-200/50">
                                <motion.div
                                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                    <Calendar className="h-8 w-8 text-purple-600" />
                                </motion.div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Jurnal Pembelajaran</h3>
                                    <p className="text-gray-600">
                                        Catat materi dan kegiatan pembelajaran harian dengan sistem jadwal terintegrasi.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {['Materi', 'Aktivitas', 'Catatan'].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-center gap-2 text-sm text-gray-600"
                                            whileHover={{ x: 4, color: '#9333ea' }}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                            {item}
                                        </motion.div>
                                    ))}
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Large feature - Finance */}
                        <motion.div
                            className="lg:col-span-2"
                            custom={3}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            variants={slideUp}
                        >
                            <GlassCard className="rounded-3xl p-8 h-full space-y-6 group overflow-hidden shadow-xl shadow-gray-200/50">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-3xl opacity-50" />
                                <div className="relative">
                                    <div className="flex items-start justify-between mb-6">
                                        <motion.div
                                            className="p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <Wallet className="h-8 w-8 text-amber-600" />
                                        </motion.div>
                                        <motion.div
                                            className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <span className="text-sm text-emerald-600">Transparan</span>
                                        </motion.div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Kas Kelas</h3>
                                    <p className="text-gray-600 mb-6">
                                        Kelola keuangan kelas dengan transparan dan terorganisir.
                                        Catat pemasukan, pengeluaran, dan pantau saldo secara real-time.
                                    </p>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                                            <div className="text-sm text-gray-500 mb-1">Pemasukan</div>
                                            <div className="text-xl font-bold text-emerald-600">+2.5M</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                                            <div className="text-sm text-gray-500 mb-1">Pengeluaran</div>
                                            <div className="text-xl font-bold text-red-600">-500K</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                                            <div className="text-sm text-gray-500 mb-1">Saldo</div>
                                            <div className="text-xl font-bold text-blue-600">2.0M</div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="tentang" className="py-20 relative">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/50 to-transparent"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                Tentang <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">LapanClass</span>
                            </h2>
                        </motion.div>
                        <motion.p
                            className="text-lg text-gray-600 leading-relaxed"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            LapanClass adalah platform manajemen kelas yang dirancang khusus untuk memudahkan
                            pengurus kelas, wali kelas, dan siswa dalam mengelola berbagai aspek kegiatan kelas.
                        </motion.p>
                        <motion.p
                            className="text-lg text-gray-600 leading-relaxed"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            Dengan sistem multi-class dan approval workflow yang aman, LapanClass memberikan
                            kontrol penuh kepada admin sekolah sambil memberikan akses yang tepat untuk setiap role.
                        </motion.p>

                        {/* Trust indicators */}
                        <motion.div
                            className="grid sm:grid-cols-3 gap-6 pt-8 border-t border-gray-200"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            {[
                                { icon: Shield, title: 'Keamanan Terjamin', desc: 'Data terenkripsi dan terlindungi' },
                                { icon: Zap, title: 'Performa Cepat', desc: 'Akses instan kapan saja' },
                                { icon: Clock, title: 'Update Berkala', desc: 'Fitur baru setiap bulan' },
                            ].map((item, index) => {
                                const Icon = item.icon
                                return (
                                    <div key={index} className="space-y-2">
                                        <Icon className="h-8 w-8 text-emerald-600 mx-auto" />
                                        <h3 className="text-gray-900 font-medium">{item.title}</h3>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                )
                            })}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 bg-[length:200%_100%]"
                    {...shimmerAnimation}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-emerald-50/90" />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm text-white font-medium">Bergabung dengan 500+ kelas</span>
                        </motion.div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                            Siap Memulai Perjalanan Anda?
                        </h2>
                        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                            Daftar sekarang sebagai pengurus kelas atau masuk jika Anda sudah memiliki akun.
                            Mulai kelola kelas Anda dengan lebih efisien hari ini.
                        </p>
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <Link href="/register">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        size="lg"
                                        className="bg-white text-emerald-600 hover:bg-gray-50 shadow-xl px-8 h-14 text-lg"
                                    >
                                        Daftar Sekarang
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </motion.div>
                            </Link>
                            <Link href="/login">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-2 border-gray-900 text-gray-900 hover:bg-gray-50 px-8 h-14 text-lg"
                                    >
                                        Masuk ke Akun
                                    </Button>
                                </motion.div>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Decorative elements */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-20 h-20 bg-emerald-200/30 rounded-full blur-2xl"
                            animate={{
                                y: [0, -30, 0],
                                x: [0, (i - 1) * 20, 0],
                                opacity: [0.2, 0.4, 0.2],
                            }}
                            transition={{
                                duration: 4 + i,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: i * 0.5,
                            }}
                            style={{
                                left: `${20 + i * 30}%`,
                                top: `${20 + (i % 2) * 40}%`,
                            }}
                        />
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.6 }}
                        >
                            <motion.div
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                            >
                                <BookOpen className="h-5 w-5 text-white" />
                            </motion.div>
                            <div>
                                <span className="text-lg font-bold text-gray-900">LapanClass</span>
                                <p className="text-xs text-gray-500">Smart Class Management</p>
                            </div>
                        </motion.div>
                        <motion.p
                            className="text-sm text-gray-500"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            © 2026 LapanClass. Sistem Manajemen Kelas Terpadu.
                        </motion.p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
