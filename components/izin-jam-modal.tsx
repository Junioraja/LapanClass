'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { formatDateForDB } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface IzinJamModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function IzinJamModal({ open, onOpenChange, onSuccess }: IzinJamModalProps) {
    const { user } = useAuth()
    const [date, setDate] = useState<Date>(new Date())
    const [jamMulai, setJamMulai] = useState<number>(1)
    const [jamSelesai, setJamSelesai] = useState<number>(2)
    const [keterangan, setKeterangan] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!user?.id || !user?.class_id) {
            toast.error('Data user tidak lengkap')
            return
        }

        if (!keterangan.trim()) {
            toast.error('Keterangan wajib diisi!')
            return
        }

        if (jamMulai > jamSelesai) {
            toast.error('Jam mulai tidak boleh lebih besar dari jam selesai!')
            return
        }

        setLoading(true)

        try {
            // Upsert to attendance table
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .upsert({
                    student_id: user.id,
                    class_id: user.class_id,
                    tanggal: formatDateForDB(date),
                    status: 'Izin',
                    keterangan: `Izin jam pelajaran ${jamMulai}-${jamSelesai}: ${keterangan}`,
                    is_approved: false,
                }, {
                    onConflict: 'student_id,tanggal'
                })
                .select()
                .single()

            if (attendanceError) throw attendanceError

            // Delete old periods for this attendance
            await supabase
                .from('attendance_periods')
                .delete()
                .eq('attendance_id', attendanceData.id)

            // Insert new periods to attendance_periods
            const periods = []
            for (let i = jamMulai; i <= jamSelesai; i++) {
                periods.push({
                    attendance_id: attendanceData.id,
                    jam_ke: i,
                })
            }

            if (periods.length > 0) {
                const { error: periodsError } = await supabase
                    .from('attendance_periods')
                    .insert(periods)

                if (periodsError) throw periodsError
            }

            toast.success('Izin jam pelajaran berhasil diajukan!')

            // Reset form
            setDate(new Date())
            setJamMulai(1)
            setJamSelesai(2)
            setKeterangan('')

            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error submitting izin jam:', error)
            toast.error(error.message || 'Gagal mengajukan izin')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Izin Jam Pelajaran Tertentu</DialogTitle>
                    <DialogDescription>
                        Ajukan izin untuk tidak mengikuti jam pelajaran tertentu
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
                    </div>

                    {/* Jam Pelajaran */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="jam-mulai">Jam Ke (Mulai)</Label>
                            <Input
                                id="jam-mulai"
                                type="number"
                                min={1}
                                max={10}
                                value={jamMulai}
                                onChange={(e) => setJamMulai(Number(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="jam-selesai">Jam Ke (Selesai)</Label>
                            <Input
                                id="jam-selesai"
                                type="number"
                                min={1}
                                max={10}
                                value={jamSelesai}
                                onChange={(e) => setJamSelesai(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Preview Jam */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <p className="text-sm text-blue-900">
                            Izin untuk jam ke-{jamMulai} sampai jam ke-{jamSelesai}
                            {jamSelesai > jamMulai && ` (${jamSelesai - jamMulai + 1} jam pelajaran)`}
                        </p>
                    </div>

                    {/* Keterangan */}
                    <div className="grid gap-2">
                        <Label htmlFor="keterangan">
                            Izin untuk apa? <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="keterangan"
                            placeholder="Contoh: Ke puskesmas, keperluan keluarga, dll..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !keterangan.trim()}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            'Ajukan'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
