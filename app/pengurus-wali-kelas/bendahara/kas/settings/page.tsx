'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { KasSettings, PeriodeType, MetodePembayaran } from '@/lib/types'
import { toast } from 'sonner'
import { Settings as SettingsIcon, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function KasSettingsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<KasSettings>({
        class_id: user?.class_id || '',
        periode_type: 'mingguan',
        periode_value: undefined,
        periode_day: [],
        nominal_per_periode: 0,
        metode_default: 'cash',
        is_active: true,
    })

    // Sub-options untuk harian
    const [harianMode, setHarianMode] = useState<'setiap_hari' | 'setiap_x_hari'>('setiap_hari')

    useEffect(() => {
        if (user?.class_id) {
            fetchSettings(user.class_id)
        }
    }, [user])

    async function fetchSettings(classId: string) {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('kas_settings')
                .select('*')
                .eq('class_id', classId)
                .eq('is_active', true)
                .single()

            if (data) {
                setSettings(data)
                // Set harian mode based on periode_value
                if (data.periode_type === 'harian') {
                    setHarianMode(data.periode_value ? 'setiap_x_hari' : 'setiap_hari')
                }
            } else if (!error || error.code === 'PGRST116') {
                // No settings yet, use defaults
                setSettings({
                    class_id: classId,
                    periode_type: 'mingguan',
                    periode_value: undefined,
                    periode_day: [],
                    nominal_per_periode: 0,
                    metode_default: 'cash',
                    is_active: true,
                })
            }
        } catch (err) {
            console.error('Error fetching settings:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!user?.class_id) return

        // Validation
        if (settings.nominal_per_periode <= 0) {
            toast.error('Nominal per periode harus lebih dari 0')
            return
        }

        if (settings.periode_type === 'harian' && harianMode === 'setiap_x_hari') {
            if (!settings.periode_value || settings.periode_value < 1) {
                toast.error('Periode harian harus diisi (minimal 1 hari)')
                return
            }
        }

        if (settings.periode_type === 'mingguan' && (!settings.periode_day || settings.periode_day.length === 0)) {
            toast.error('Pilih minimal 1 hari untuk periode mingguan')
            return
        }

        setSaving(true)
        try {
            // Check if exists
            const { data: existing } = await supabase
                .from('kas_settings')
                .select('id')
                .eq('class_id', user.class_id)
                .eq('is_active', true)
                .single()

            const dataToSave = {
                class_id: user.class_id,
                periode_type: settings.periode_type,
                periode_value: settings.periode_type === 'harian' && harianMode === 'setiap_x_hari'
                    ? settings.periode_value
                    : null,
                periode_day: settings.periode_type === 'mingguan' || settings.periode_type === 'bulanan'
                    ? settings.periode_day
                    : null,
                nominal_per_periode: settings.nominal_per_periode,
                metode_default: settings.metode_default,
                is_active: true,
                updated_at: new Date().toISOString(),
            }

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('kas_settings')
                    .update(dataToSave)
                    .eq('id', existing.id)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('kas_settings')
                    .insert(dataToSave)

                if (error) throw error
            }

            toast.success('Pengaturan kas berhasil disimpan!')
            router.push('/pengurus-wali-kelas/bendahara/kas')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Gagal menyimpan pengaturan')
        } finally {
            setSaving(false)
        }
    }

    const handleHariChange = (hari: string, checked: boolean) => {
        if (checked) {
            setSettings({
                ...settings,
                periode_day: [...(settings.periode_day || []), hari.toLowerCase()]
            })
        } else {
            setSettings({
                ...settings,
                periode_day: (settings.periode_day || []).filter(d => d !== hari.toLowerCase())
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <Link href="/pengurus-wali-kelas/bendahara/kas">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pengaturan Kas Kelas</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Konfigurasi periode pembayaran dan nominal kas
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <SettingsIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle>Konfigurasi Kas</CardTitle>
                            <CardDescription>Atur periode dan nominal pembayaran kas kelas</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Periode Type */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Jenis Periode Pembayaran</Label>
                        <RadioGroup
                            value={settings.periode_type}
                            onValueChange={(value: PeriodeType) => {
                                setSettings({ ...settings, periode_type: value, periode_day: [], periode_value: undefined })
                            }}
                        >
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="harian" id="harian" />
                                <Label htmlFor="harian" className="flex-1 cursor-pointer">Harian</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="mingguan" id="mingguan" />
                                <Label htmlFor="mingguan" className="flex-1 cursor-pointer">Mingguan</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="bulanan" id="bulanan" />
                                <Label htmlFor="bulanan" className="flex-1 cursor-pointer">Bulanan</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Periode Detail - HARIAN */}
                    {settings.periode_type === 'harian' && (
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Label className="text-sm font-semibold text-blue-900">Detail Periode Harian</Label>

                            <RadioGroup value={harianMode} onValueChange={(v: any) => setHarianMode(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="setiap_hari" id="setiap_hari" />
                                    <Label htmlFor="setiap_hari" className="cursor-pointer">Setiap hari</Label>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="setiap_x_hari" id="setiap_x_hari" />
                                        <Label htmlFor="setiap_x_hari" className="cursor-pointer">Setiap X hari sekali</Label>
                                    </div>

                                    {harianMode === 'setiap_x_hari' && (
                                        <div className="ml-6 flex items-center gap-2">
                                            <Label className="text-sm">Setiap</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="30"
                                                className="w-20"
                                                value={settings.periode_value || ''}
                                                onChange={(e) => setSettings({ ...settings, periode_value: parseInt(e.target.value) || undefined })}
                                            />
                                            <Label className="text-sm">hari sekali</Label>
                                        </div>
                                    )}
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {/* Periode Detail - MINGGUAN */}
                    {settings.periode_type === 'mingguan' && (
                        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <Label className="text-sm font-semibold text-purple-900">Pilih Hari Pembayaran</Label>
                            <p className="text-xs text-gray-600">Pilih minimal 1 hari dalam seminggu</p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {HARI_OPTIONS.map((hari) => (
                                    <div key={hari} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-white">
                                        <Checkbox
                                            id={`hari-${hari}`}
                                            checked={(settings.periode_day || []).includes(hari.toLowerCase())}
                                            onCheckedChange={(checked) => handleHariChange(hari, checked as boolean)}
                                        />
                                        <Label htmlFor={`hari-${hari}`} className="cursor-pointer text-sm">{hari}</Label>
                                    </div>
                                ))}
                            </div>

                            {settings.periode_day && settings.periode_day.length > 0 && (
                                <p className="text-sm text-purple-700">
                                    Terpilih: {settings.periode_day.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Periode Detail - BULANAN */}
                    {settings.periode_type === 'bulanan' && (
                        <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <Label className="text-sm font-semibold text-emerald-900">Tanggal Pembayaran (Opsional)</Label>
                            <p className="text-xs text-gray-600">Kosongkan jika bayar kapan saja dalam bulan tersebut</p>

                            <Input
                                type="text"
                                placeholder="Contoh: 1,15,30 (pisahkan dengan koma)"
                                value={(settings.periode_day || []).join(',')}
                                onChange={(e) => {
                                    const tanggal = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                                    setSettings({ ...settings, periode_day: tanggal })
                                }}
                            />

                            {settings.periode_day && settings.periode_day.length > 0 && (
                                <p className="text-sm text-emerald-700">
                                    Tanggal: {settings.periode_day.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Nominal */}
                    <div className="space-y-3">
                        <Label htmlFor="nominal" className="text-base font-semibold">
                            Nominal per Periode
                        </Label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Rp</span>
                            <Input
                                id="nominal"
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="5000"
                                value={settings.nominal_per_periode || ''}
                                onChange={(e) => setSettings({ ...settings, nominal_per_periode: parseFloat(e.target.value) || 0 })}
                                className="flex-1"
                            />
                        </div>
                        <p className="text-sm text-gray-500">
                            Nominal yang harus dibayar setiap periode
                        </p>
                    </div>

                    {/* Metode Default */}
                    <div className="space-y-3">
                        <Label htmlFor="metode" className="text-base font-semibold">
                            Metode Pembayaran Default
                        </Label>
                        <Select
                            value={settings.metode_default}
                            onValueChange={(value: MetodePembayaran) => setSettings({ ...settings, metode_default: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="qris">QRIS</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500">
                            Metode pembayaran yang akan dipilih secara otomatis
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {saving ? (
                                <>
                                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Simpan Pengaturan
                                </>
                            )}
                        </Button>
                        <Link href="/pengurus-wali-kelas/bendahara/kas">
                            <Button variant="outline">Batal</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Preview */}
            <Card className="mt-6 bg-gray-50">
                <CardHeader>
                    <CardTitle className="text-lg">Preview Konfigurasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Periode:</span>
                        <span className="font-semibold capitalize">{settings.periode_type}</span>
                    </div>
                    {settings.periode_type === 'harian' && harianMode === 'setiap_x_hari' && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Interval:</span>
                            <span className="font-semibold">Setiap {settings.periode_value || 1} hari</span>
                        </div>
                    )}
                    {settings.periode_type === 'mingguan' && settings.periode_day && settings.periode_day.length > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Hari:</span>
                            <span className="font-semibold">{settings.periode_day.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</span>
                        </div>
                    )}
                    {settings.periode_type === 'bulanan' && settings.periode_day && settings.periode_day.length > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tanggal:</span>
                            <span className="font-semibold">{settings.periode_day.join(', ')}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-600">Nominal:</span>
                        <span className="font-semibold">Rp {settings.nominal_per_periode.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Metode Default:</span>
                        <span className="font-semibold uppercase">{settings.metode_default}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
