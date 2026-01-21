'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { formatDateForDB } from '@/lib/date-utils'
import { uploadBuktiFile, validateImageFile, getFilePreviewUrl } from '@/lib/upload-utils'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface IzinModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function IzinModal({ open, onOpenChange, onSuccess }: IzinModalProps) {
    const { user } = useAuth()
    const [date, setDate] = useState<Date>(new Date())
    const [status, setStatus] = useState<'Sakit' | 'Izin'>('Sakit')
    const [keterangan, setKeterangan] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        try {
            // Validate file
            validateImageFile(selectedFile, 5)

            // Set file and preview
            setFile(selectedFile)
            const preview = await getFilePreviewUrl(selectedFile)
            setPreviewUrl(preview)
        } catch (error: any) {
            toast.error(error.message || 'File tidak valid')
            e.target.value = '' // Reset input
        }
    }

    const handleRemoveFile = () => {
        setFile(null)
        setPreviewUrl('')
    }

    const handleSubmit = async () => {
        if (!user?.id || !user?.class_id) {
            toast.error('Data user tidak lengkap')
            return
        }

        if (!file) {
            toast.error('Foto bukti wajib diupload!')
            return
        }

        setLoading(true)
        setUploading(true)

        try {
            // Upload file to storage
            const fotoBuktiUrl = await uploadBuktiFile(
                file,
                user.id,
                status === 'Sakit' ? 'sakit' : 'izin'
            )

            setUploading(false)

            // Upsert to attendance table (update if exists, insert if not)
            const { error } = await supabase
                .from('attendance')
                .upsert({
                    student_id: user.id,
                    class_id: user.class_id,
                    tanggal: formatDateForDB(date),
                    status,
                    keterangan: keterangan || null,
                    foto_bukti: fotoBuktiUrl,
                    is_approved: false,
                }, {
                    onConflict: 'student_id,tanggal'
                })

            if (error) throw error

            toast.success(`${status} berhasil diajukan!`)

            // Reset form
            setDate(new Date())
            setStatus('Sakit')
            setKeterangan('')
            setFile(null)
            setPreviewUrl('')

            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error submitting izin:', error)
            toast.error(error.message || 'Gagal mengajukan izin')
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Ajukan Izin / Sakit</DialogTitle>
                    <DialogDescription>
                        Isi form di bawah untuk mengajukan izin atau sakit. Foto bukti wajib dilampirkan.
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

                    {/* Status Selection */}
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(v: 'Sakit' | 'Izin') => setStatus(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sakit">Sakit</SelectItem>
                                <SelectItem value="Izin">Izin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File Upload */}
                    <div className="grid gap-2">
                        <Label>
                            Foto Bukti / Surat <span className="text-red-500">*</span>
                        </Label>
                        {!file ? (
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-sky-500 transition-colors">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                        Klik untuk upload foto
                                    </p>
                                    <p className="text-xs text-gray-500">JPG, PNG, WebP (Maks. 5MB)</p>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="relative border rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleRemoveFile}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keterangan */}
                    <div className="grid gap-2">
                        <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                        <Textarea
                            id="keterangan"
                            placeholder="Contoh: Demam tinggi, sakit kepala..."
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
                        disabled={loading || !file}
                        className="bg-sky-500 hover:bg-sky-600"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : loading ? (
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
