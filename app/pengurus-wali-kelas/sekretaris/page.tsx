'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, ArrowRight, ArrowLeft } from 'lucide-react'

export default function SekretarisPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Menu Sekretaris</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Pilih menu untuk mengelola absensi dan jurnal kelas
                        </p>
                    </div>
                    <Link href="/pengurus-wali-kelas">
                        <Button variant="outline" size="lg" className="gap-2">
                            <ArrowLeft className="h-5 w-5" />
                            Kembali ke Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Absensi Card */}
                    <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                                    <BookOpen className="h-8 w-8 text-blue-600 group-hover:text-white" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">Absensi Kelas</CardTitle>
                                    <CardDescription className="mt-1">
                                        Kelola kehadiran siswa harian
                                    </CardDescription>
                                </div>
                                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Fitur absensi memungkinkan Anda untuk:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Input kehadiran harian siswa</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Lihat rekap absensi bulanan</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Export data absensi</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Kelola libur dan acara sekolah</span>
                                </li>
                            </ul>
                            <Link href="/pengurus-wali-kelas/sekretaris/absensi">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Buka Absensi
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Jurnal Card */}
                    <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-emerald-500">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-500 transition-colors">
                                    <FileText className="h-8 w-8 text-emerald-600 group-hover:text-white" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">Jurnal Kelas</CardTitle>
                                    <CardDescription className="mt-1">
                                        Catat kegiatan pembelajaran
                                    </CardDescription>
                                </div>
                                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Fitur jurnal memungkinkan Anda untuk:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-600">•</span>
                                    <span>Catat materi pembelajaran harian</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-600">•</span>
                                    <span>Dokumentasi kegiatan kelas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-600">•</span>
                                    <span>Lihat riwayat jurnal</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-600">•</span>
                                    <span>Export laporan jurnal</span>
                                </li>
                            </ul>
                            <Link href="/pengurus-wali-kelas/sekretaris/jurnal">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Buka Jurnal
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Section */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardContent className="py-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Tips Penggunaan</h3>
                                <p className="text-sm text-gray-600">
                                    Pastikan data absensi diinput setiap hari untuk rekap yang akurat.
                                    Jurnal kelas sebaiknya diisi setiap selesai pembelajaran untuk dokumentasi yang lengkap.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
