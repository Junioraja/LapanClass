'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { SemesterConfig } from '@/lib/types'

interface SemesterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function SemesterModal({ open, onOpenChange, onSuccess }: SemesterModalProps) {
    const [kelas, setKelas] = useState('')
    const [semester, setSemester] = useState<'1' | '2' | ''>('')
    const [tanggalMulai, setTanggalMulai] = useState('')
    const [tanggalSelesai, setTanggalSelesai] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!kelas || !semester || !tanggalMulai || !tanggalSelesai) {
            toast.error('Semua field harus diisi!')
            return
        }

        // Validate date range
        const startDate = new Date(tanggalMulai)
        const endDate = new Date(tanggalSelesai)

        if (endDate <= startDate) {
            toast.error('Tanggal selesai harus setelah tanggal mulai!')
            return
        }

        setLoading(true)

        try {
            const newSemester: Omit<SemesterConfig, 'id' | 'created_at'> = {
                kelas,
                semester: parseInt(semester) as 1 | 2,
                tanggal_mulai: tanggalMulai,
                tanggal_selesai: tanggalSelesai,
            }

            const { error } = await supabase
                .from('semester_config')
                .insert([newSemester])

            if (error) {
                console.error('Error creating semester:', error)
                toast.error('Gagal menambahkan semester. Silakan coba lagi.')
                return
            }

            toast.success('Semester berhasil ditambahkan!')

            // Reset form
            setKelas('')
            setSemester('')
            setTanggalMulai('')
            setTanggalSelesai('')

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error creating semester:', error)
            toast.error('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tambah Semester</DialogTitle>
                    <DialogDescription>
                        Tambahkan konfigurasi semester baru dengan rentang tanggal
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Kelas Input */}
                    <div className="space-y-2">
                        <Label htmlFor="kelas">Kelas</Label>
                        <Input
                            id="kelas"
                            placeholder="Contoh: 11"
                            value={kelas}
                            onChange={(e) => setKelas(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Masukkan tingkat kelas (contoh: 11 untuk XI, 12 untuk XII)
                        </p>
                    </div>

                    {/* Semester Select */}
                    <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select value={semester} onValueChange={(value) => setSemester(value as '1' | '2')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Semester 1</SelectItem>
                                <SelectItem value="2">Semester 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tanggal-mulai">Tanggal Mulai</Label>
                            <Input
                                id="tanggal-mulai"
                                type="date"
                                value={tanggalMulai}
                                onChange={(e) => setTanggalMulai(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tanggal-selesai">Tanggal Selesai</Label>
                            <Input
                                id="tanggal-selesai"
                                type="date"
                                value={tanggalSelesai}
                                onChange={(e) => setTanggalSelesai(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="bg-sky-600 hover:bg-sky-700"
                            disabled={loading}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
