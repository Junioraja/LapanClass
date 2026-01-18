'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Plus, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Holiday } from '@/lib/types'
import { formatDateForDB, isWeekend } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface HolidayModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function HolidayModal({ open, onOpenChange, onSuccess }: HolidayModalProps) {
    const [date, setDate] = useState<Date>(new Date())
    const [namaLibur, setNamaLibur] = useState('')
    const [tipe, setTipe] = useState<'libur' | 'acara'>('libur')
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchHolidays()
        }
    }, [open])

    const fetchHolidays = async () => {
        const { data } = await supabase
            .from('holidays')
            .select('*')
            .order('tanggal', { ascending: true })

        if (data) {
            setHolidays(data)
        }
    }

    const handleSubmit = async () => {
        if (!namaLibur.trim()) {
            alert('Mohon masukkan nama libur atau acara')
            return
        }

        // Check if date is weekend
        if (isWeekend(date)) {
            alert('Hari weekend sudah otomatis menjadi libur. Pilih hari kerja untuk menambah libur khusus.')
            return
        }

        setLoading(true)

        try {
            const dateStr = formatDateForDB(date)

            const { error } = await supabase.from('holidays').upsert({
                tanggal: dateStr,
                nama_libur: namaLibur.trim(),
                tipe,
            })

            if (error) throw error

            // Reset form
            setNamaLibur('')
            setTipe('libur')
            setDate(new Date())

            await fetchHolidays()
            onSuccess?.()
        } catch (error) {
            console.error('Error saving holiday:', error)
            alert('Gagal menyimpan data libur. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus hari libur ini?')) return

        setDeleting(id)
        try {
            const { error } = await supabase.from('holidays').delete().eq('id', id)

            if (error) throw error

            await fetchHolidays()
            onSuccess?.()
        } catch (error) {
            console.error('Error deleting holiday:', error)
            alert('Gagal menghapus data libur.')
        } finally {
            setDeleting(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Tetapkan Hari Libur / Acara</DialogTitle>
                    <DialogDescription>
                        Tandai tanggal sebagai hari libur atau acara sekolah. Absensi tidak dapat diinput pada hari libur.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Date Picker */}
                    <div className="grid gap-2">
                        <Label>Tanggal</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'justify-start text-left font-normal',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                            </PopoverContent>
                        </Popover>
                        {isWeekend(date) && (
                            <p className="text-xs text-amber-600">
                                ⚠️ Weekend sudah otomatis libur. Pilih hari kerja untuk libur khusus.
                            </p>
                        )}
                    </div>

                    {/* Holiday Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="namaLibur">Nama Libur / Acara</Label>
                        <Input
                            id="namaLibur"
                            placeholder="Contoh: Tahun Baru, Classmeeting, HUT RI"
                            value={namaLibur}
                            onChange={(e) => setNamaLibur(e.target.value)}
                        />
                    </div>

                    {/* Type Selection */}
                    <div className="grid gap-2">
                        <Label>Jenis</Label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setTipe('libur')}
                                className={cn(
                                    'flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                                    tipe === 'libur'
                                        ? 'border-red-500 bg-red-50 text-red-900'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                )}
                            >
                                🔴 Libur (Tanggal Merah)
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipe('acara')}
                                className={cn(
                                    'flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                                    tipe === 'acara'
                                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                )}
                            >
                                📅 Acara Sekolah
                            </button>
                        </div>
                    </div>

                    {/* Add Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !namaLibur.trim()}
                        className="bg-sky-500 hover:bg-sky-600"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Libur / Acara
                    </Button>

                    {/* Existing Holidays List */}
                    {holidays.length > 0 && (
                        <div className="mt-4">
                            <Label className="mb-2 block">Daftar Libur & Acara</Label>
                            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                                {holidays.map((holiday) => (
                                    <div
                                        key={holiday.id}
                                        className="flex items-center justify-between rounded border bg-white p-2 shadow-sm"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{holiday.nama_libur}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(holiday.tanggal), 'dd MMMM yyyy')} •{' '}
                                                <span
                                                    className={
                                                        holiday.tipe === 'libur' ? 'text-red-600' : 'text-blue-600'
                                                    }
                                                >
                                                    {holiday.tipe === 'libur' ? 'Libur' : 'Acara'}
                                                </span>
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => holiday.id && handleDelete(holiday.id)}
                                            disabled={deleting === holiday.id}
                                        >
                                            {deleting === holiday.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
