'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/types'
import { toast } from 'sonner'
import { CheckCircle, X, UserCheck } from 'lucide-react'

export default function ApprovalPage() {
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [customId, setCustomId] = useState('')
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        fetchPendingUsers()
    }, [])

    async function fetchPendingUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*') // Remove classes join
            .eq('is_approved', false)
            .order('created_at', { ascending: false })

        console.log('Pending users:', { data, error, count: data?.length })

        if (data) {
            setPendingUsers(data as any)
        }
    }

    function handleApproveClick(user: Profile) {
        setSelectedUser(user)
        setCustomId('')
        setModalOpen(true)
    }

    async function handleApprove() {
        if (!selectedUser) return

        if (!customId.trim()) {
            toast.error('Custom ID tidak boleh kosong')
            return
        }

        setLoading(true)

        try {
            // Check if custom_id already exists
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('custom_id', customId)
                .limit(1)

            if (existing && existing.length > 0) {
                toast.error('Custom ID sudah digunakan')
                setLoading(false)
                return
            }

            // Update user
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_approved: true,
                    custom_id: customId,
                })
                .eq('id', selectedUser.id)

            if (error) throw error

            toast.success(`User ${selectedUser.nama} berhasil di-approve!`)
            setModalOpen(false)
            fetchPendingUsers()
        } catch (error) {
            console.error('Error approving user:', error)
            toast.error('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    async function handleReject(userId: string) {
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId)

            if (error) throw error

            toast.success('User ditolak dan dihapus')
            fetchPendingUsers()
        } catch (error) {
            console.error('Error rejecting user:', error)
            toast.error('Terjadi kesalahan. Silakan coba lagi.')
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Approval User</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Setujui atau tolak pendaftaran user baru
                </p>
            </div>

            {pendingUsers.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <UserCheck className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Tidak Ada User Pending
                        </h3>
                        <p className="text-sm text-gray-600 text-center max-w-md">
                            Semua user sudah di-approve atau belum ada pendaftaran baru
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {pendingUsers.map((user: any) => (
                        <Card key={user.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{user.nama}</span>
                                    <span className="text-sm font-normal px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                                        Pending
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Terdaftar pada {new Date(user.created_at).toLocaleDateString('id-ID')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Jabatan</p>
                                        <p className="text-sm text-gray-900 capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Nomor Telepon</p>
                                        <p className="text-sm text-gray-900">{user.phone}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleApproveClick(user)}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Beri ID
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(user.id)}
                                        variant="outline"
                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Tolak
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Approval Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve User</DialogTitle>
                        <DialogDescription>
                            Berikan Custom ID untuk {selectedUser?.nama}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="custom_id">Custom ID</Label>
                            <Input
                                id="custom_id"
                                placeholder="Contoh: SEK-RPL1-01"
                                value={customId}
                                onChange={(e) => setCustomId(e.target.value)}
                                className="uppercase"
                            />
                            <p className="text-xs text-gray-500">
                                Format: ROLE-KELAS-NOMOR (contoh: SEK-RPL1-01, WK-TKJ2-01)
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-900">
                                ⚠️ <strong>Penting:</strong> Kirimkan ID ini ke user melalui WhatsApp atau media lain.
                                User akan menggunakan ID ini untuk login.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleApprove}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading ? 'Memproses...' : 'Approve & Simpan'}
                        </Button>
                        <Button
                            onClick={() => setModalOpen(false)}
                            variant="outline"
                            disabled={loading}
                        >
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
