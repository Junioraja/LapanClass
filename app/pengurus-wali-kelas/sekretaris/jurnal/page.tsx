'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    FileText,
    AlertCircle,
    Construction,
    Calendar,
    BookOpen,
    User,
    Clock
} from 'lucide-react'

export default function JurnalPage() {
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        jamKe: '',
        mataPelajaran: '',
        guruPengajar: '',
        materiPembelajaran: '',
        keterangan: '',
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Warning Banner */}
                <Card className="mb-6 bg-amber-50 border-amber-200">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <Construction className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Fitur Dalam Pengembangan
                                </h3>
                                <p className="text-sm text-amber-800">
                                    Halaman Jurnal Kelas sedang dalam tahap pengembangan dan belum berfungsi sempurna.
                                    Beberapa fitur mungkin belum tersedia atau tidak berfungsi sepenuhnya.
                                    Terima kasih atas pengertiannya! 🚧
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-8 w-8 text-emerald-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Jurnal Kelas</h1>
                    </div>
                    <p className="text-sm text-gray-600">
                        Dokumentasi kegiatan dan materi pembelajaran harian
                    </p>
                </div>

                {/* Form Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Input Jurnal Pembelajaran</CardTitle>
                        <CardDescription>
                            Catat materi dan kegiatan pembelajaran yang telah dilaksanakan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        Tanggal
                                    </Label>
                                    <Input
                                        id="tanggal"
                                        type="date"
                                        value={formData.tanggal}
                                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                        disabled
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jamKe" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        Jam Ke
                                    </Label>
                                    <Input
                                        id="jamKe"
                                        type="number"
                                        placeholder="Contoh: 1"
                                        value={formData.jamKe}
                                        onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mataPelajaran" className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-gray-500" />
                                    Mata Pelajaran
                                </Label>
                                <Input
                                    id="mataPelajaran"
                                    placeholder="Contoh: Matematika"
                                    value={formData.mataPelajaran}
                                    onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guruPengajar" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Guru Pengajar
                                </Label>
                                <Input
                                    id="guruPengajar"
                                    placeholder="Contoh: Bapak/Ibu Guru"
                                    value={formData.guruPengajar}
                                    onChange={(e) => setFormData({ ...formData, guruPengajar: e.target.value })}
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="materiPembelajaran">
                                    Materi Pembelajaran
                                </Label>
                                <Textarea
                                    id="materiPembelajaran"
                                    placeholder="Jelaskan materi yang telah diajarkan pada hari ini..."
                                    rows={5}
                                    value={formData.materiPembelajaran}
                                    onChange={(e) => setFormData({ ...formData, materiPembelajaran: e.target.value })}
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="keterangan">
                                    Keterangan (Opsional)
                                </Label>
                                <Textarea
                                    id="keterangan"
                                    placeholder="Catatan tambahan, kegiatan khusus, dll..."
                                    rows={3}
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                    disabled
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    disabled
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Simpan Jurnal
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled
                                >
                                    Batal
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* History Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Jurnal</CardTitle>
                        <CardDescription>
                            Daftar jurnal pembelajaran yang telah dicatat
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Construction className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 mb-2">Belum ada data jurnal</p>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                Fitur dalam pengembangan
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Footer */}
                <Card className="mt-6 bg-emerald-50 border-emerald-200">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-emerald-900 mb-1">Tentang Jurnal Kelas</h4>
                                <p className="text-sm text-emerald-800">
                                    Jurnal kelas adalah catatan harian yang berisi dokumentasi kegiatan pembelajaran,
                                    materi yang diajarkan, dan informasi penting lainnya. Fitur ini akan membantu
                                    Anda melacak progress pembelajaran dan memudahkan pelaporan.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
