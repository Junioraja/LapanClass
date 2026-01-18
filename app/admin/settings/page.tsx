'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Settings as SettingsIcon, Save } from 'lucide-react'

interface FeatureSetting {
    key: string
    label: string
    description: string
    enabled: boolean
}

export default function FeatureSettingsPage() {
    const [features, setFeatures] = useState<FeatureSetting[]>([
        {
            key: 'absensi_enabled',
            label: 'Fitur Absensi',
            description: 'Aktifkan atau nonaktifkan modul absensi untuk semua user',
            enabled: true,
        },
        {
            key: 'jurnal_enabled',
            label: 'Fitur Jurnal',
            description: 'Aktifkan atau nonaktifkan modul jurnal pembelajaran',
            enabled: true,
        },
        {
            key: 'kas_enabled',
            label: 'Fitur Kas Kelas',
            description: 'Aktifkan atau nonaktifkan modul kas kelas',
            enabled: true,
        },
        {
            key: 'bendahara_menu_enabled',
            label: 'Menu Bendahara',
            description: 'Tampilkan atau sembunyikan menu untuk role bendahara',
            enabled: false,
        },
        {
            key: 'wali_kelas_menu_enabled',
            label: 'Menu Wali Kelas',
            description: 'Tampilkan atau sembunyikan menu untuk role wali kelas',
            enabled: false,
        },
        {
            key: 'siswa_dashboard_enabled',
            label: 'Dashboard Siswa',
            description: 'Aktifkan atau nonaktifkan dashboard untuk siswa',
            enabled: false,
        },
    ])

    const [loading, setLoading] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('*')

            if (data) {
                // Update feature states based on database
                setFeatures((prev) =>
                    prev.map((feature) => {
                        const dbSetting = data.find((s) => s.setting_key === feature.key)
                        return {
                            ...feature,
                            enabled: dbSetting ? dbSetting.setting_value : feature.enabled,
                        }
                    })
                )
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        }
    }

    function toggleFeature(key: string) {
        setFeatures((prev) =>
            prev.map((feature) =>
                feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
            )
        )
        setHasChanges(true)
    }

    async function handleSave() {
        setLoading(true)

        try {
            // Save each setting to database
            for (const feature of features) {
                // Check if setting exists
                const { data: existing } = await supabase
                    .from('app_settings')
                    .select('id')
                    .eq('setting_key', feature.key)
                    .limit(1)
                    .single()

                if (existing) {
                    // Update
                    await supabase
                        .from('app_settings')
                        .update({
                            setting_value: feature.enabled,
                            description: feature.description,
                        })
                        .eq('setting_key', feature.key)
                } else {
                    // Insert
                    await supabase.from('app_settings').insert({
                        setting_key: feature.key,
                        setting_value: feature.enabled,
                        description: feature.description,
                    })
                }
            }

            toast.success('Pengaturan berhasil disimpan')
            setHasChanges(false)
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Terjadi kesalahan saat menyimpan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Pengaturan Fitur</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Aktifkan atau nonaktifkan fitur dan menu
                </p>
            </div>

            <div className="space-y-6">
                {features.map((feature) => (
                    <Card key={feature.key}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <SettingsIcon className="h-5 w-5 text-emerald-600" />
                                        {feature.label}
                                    </CardTitle>
                                    <CardDescription className="mt-2">{feature.description}</CardDescription>
                                </div>
                                <button
                                    onClick={() => toggleFeature(feature.key)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feature.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feature.enabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${feature.enabled
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {feature.enabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Card className="shadow-lg">
                        <CardContent className="flex items-center gap-4 p-4">
                            <p className="text-sm font-medium text-gray-900">Ada perubahan yang belum disimpan</p>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
