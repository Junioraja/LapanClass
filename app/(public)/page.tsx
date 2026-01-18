'use client'

import Link from 'next/link'
import { BookOpen, Users, Calendar, Wallet, CheckCircle, ArrowRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
            {/* Header/Navbar */}
            <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">LapanClass</span>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="#fitur" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
                                Fitur
                            </Link>
                            <Link href="#tentang" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
                                Tentang
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                                    Masuk
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Daftar Pengurus
                                </Button>
                            </Link>
                        </nav>

                        {/* Mobile menu button */}
                        <button className="md:hidden p-2">
                            <Menu className="h-6 w-6 text-gray-700" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
                        <CheckCircle className="h-4 w-4" />
                        Sistem Manajemen Kelas Terpadu
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Kelola Kelas Anda dengan{' '}
                        <span className="text-emerald-600">LapanClass</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Platform lengkap untuk mengelola absensi, jurnal pembelajaran, dan keuangan kelas.
                        Mendukung multi-kelas dengan sistem approval yang aman.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login">
                            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                                Mulai Sekarang
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto">
                                Daftar Sebagai Pengurus
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="fitur" className="bg-white py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Fitur Unggulan
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Semua yang Anda butuhkan untuk mengelola kelas dengan efisien
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Feature 1: Multi-Class */}
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-lg transition-all border border-emerald-100">
                            <div className="h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Class Support</h3>
                            <p className="text-gray-600">
                                Kelola banyak kelas sekaligus dengan sistem isolasi data yang aman untuk setiap kelas
                            </p>
                        </div>

                        {/* Feature 2: Absensi */}
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 hover:shadow-lg transition-all border border-blue-100">
                            <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Absensi Digital</h3>
                            <p className="text-gray-600">
                                Catat kehadiran siswa dengan mudah, lengkap dengan rekap bulanan dan semester
                            </p>
                        </div>

                        {/* Feature 3: Jurnal */}
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-lg transition-all border border-purple-100">
                            <div className="h-12 w-12 rounded-lg bg-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Jurnal Pembelajaran</h3>
                            <p className="text-gray-600">
                                Catat materi dan kegiatan pembelajaran harian dengan sistem jadwal terintegrasi
                            </p>
                        </div>

                        {/* Feature 4: Kas */}
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 hover:shadow-lg transition-all border border-amber-100">
                            <div className="h-12 w-12 rounded-lg bg-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kas Kelas</h3>
                            <p className="text-gray-600">
                                Kelola keuangan kelas dengan transparan dan terorganisir
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="tentang" className="py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            Tentang LapanClass
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                            LapanClass adalah platform manajemen kelas yang dirancang khusus untuk memudahkan
                            pengurus kelas, wali kelas, dan siswa dalam mengelola berbagai aspek kegiatan kelas.
                        </p>
                        <p className="text-lg text-gray-600">
                            Dengan sistem multi-class dan approval workflow yang aman, LapanClass memberikan
                            kontrol penuh kepada admin sekolah sambil memberikan akses yang tepat untuk setiap role.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-emerald-600 to-green-600 py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Siap Memulai?
                    </h2>
                    <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
                        Daftar sekarang sebagai pengurus kelas atau masuk jika Anda sudah memiliki akun
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-100 shadow-lg w-full sm:w-auto">
                                Daftar Sekarang
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 w-full sm:w-auto">
                                Masuk ke Akun
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                                <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">LapanClass</span>
                        </div>
                        <p className="text-sm">© 2026 LapanClass. Sistem Manajemen Kelas Terpadu.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
