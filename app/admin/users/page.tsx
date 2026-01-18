'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Profile, StudentNew } from '@/lib/types'
import { toast } from 'sonner'
import { Search, Lock, LockOpen, KeyRound, Trash2, Edit } from 'lucide-react'
import { hashPassword, generateDefaultPassword } from '@/lib/auth-utils'

export default function UserManagementPage() {
    const [activeTab, setActiveTab] = useState<'pengurus' | 'siswa'>('pengurus')
    const [users, setUsers] = useState<any[]>([])
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [loading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any | null>(null)
    const [resetPasswordModal, setResetPasswordModal] = useState(false)
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [activeTab])

    useEffect(() => {
        filterUsers()
    }, [users, searchQuery, filterRole, filterStatus])

    async function fetchUsers() {
        if (activeTab === 'pengurus') {
            const { data } = await supabase
                .from('profiles')
                .select('*') // Remove classes join
                .order('created_at', { ascending: false })

            setUsers(data || [])
        } else {
            const { data } = await supabase
                .from('students_master')
                .select('*') // Remove classes join
                .order('created_at', { ascending: false })

            setUsers(data || [])
        }
    }

    function filterUsers() {
        let filtered = [...users]

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter((user) =>
                user.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.custom_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.nis?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Role filter (pengurus only)
        if (filterRole !== 'all' && activeTab === 'pengurus') {
            filtered = filtered.filter((user) => user.role === filterRole)
        }

        // Status filter
        if (filterStatus !== 'all') {
            if (filterStatus === 'active') {
                filtered = filtered.filter((user) => !user.is_blocked)
            } else if (filterStatus === 'blocked') {
                filtered = filtered.filter((user) => user.is_blocked)
            }
        }

        setFilteredUsers(filtered)
    }

    async function handleToggleBlock(user: any) {
        try {
            const table = activeTab === 'pengurus' ? 'profiles' : 'students_master'
            const newBlockedStatus = !user.is_blocked

            const { error } = await supabase
                .from(table)
                .update({ is_blocked: newBlockedStatus })
                .eq('id', user.id)

            if (error) throw error

            toast.success(`User ${newBlockedStatus ? 'diblokir' : 'diaktifkan'}`)
            fetchUsers()
        } catch (error) {
            console.error('Error toggling block:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    async function handleResetPassword() {
        if (!selectedUser) return

        setLoading(true)
        try {
            const defaultPassword = generateDefaultPassword()
            const hashedPwd = await hashPassword(defaultPassword)
            const table = activeTab === 'pengurus' ? 'profiles' : 'students_master'

            const { error } = await supabase
                .from(table)
                .update({ password: hashedPwd })
                .eq('id', selectedUser.id)

            if (error) throw error

            toast.success(`Password direset ke: ${defaultPassword}`)
            setResetPasswordModal(false)
        } catch (error) {
            console.error('Error resetting password:', error)
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!selectedUser) return

        setLoading(true)
        try {
            const table = activeTab === 'pengurus' ? 'profiles' : 'students_master'

            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', selectedUser.id)

            if (error) throw error

            toast.success('User berhasil dihapus')
            setDeleteConfirmModal(false)
            fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Kelola pengurus, admin, dan siswa
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pengurus')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'pengurus'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Pengurus & Admin
                </button>
                <button
                    onClick={() => setActiveTab('siswa')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'siswa'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Siswa
                </button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari nama, ID, atau NIS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {activeTab === 'pengurus' && (
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Role</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="sekretaris">Sekretaris</SelectItem>
                                    <SelectItem value="bendahara">Bendahara</SelectItem>
                                    <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                                    <SelectItem value="ketua_kelas">Ketua Kelas</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="blocked">Diblokir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>{activeTab === 'pengurus' ? 'Role / ID' : 'NIS'}</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    Tidak ada data
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user: any) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.nama_lengkap || user.nama}
                                    </TableCell>
                                    <TableCell>
                                        {activeTab === 'pengurus' ? (
                                            <div>
                                                <p className="text-sm capitalize">{user.role?.replace('_', ' ')}</p>
                                                <p className="text-xs text-gray-500">{user.custom_id || '-'}</p>
                                            </div>
                                        ) : (
                                            user.nis
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.is_blocked
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                        >
                                            {user.is_blocked ? 'Diblokir' : 'Aktif'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleToggleBlock(user)}
                                                title={user.is_blocked ? 'Aktifkan' : 'Blokir'}
                                            >
                                                {user.is_blocked ? (
                                                    <LockOpen className="h-4 w-4" />
                                                ) : (
                                                    <Lock className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setResetPasswordModal(true)
                                                }}
                                                title="Reset Password"
                                            >
                                                <KeyRound className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setDeleteConfirmModal(true)
                                                }}
                                                title="Hapus"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Reset Password Modal */}
            <Dialog open={resetPasswordModal} onOpenChange={setResetPasswordModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Password akan direset ke default untuk {selectedUser?.nama_lengkap || selectedUser?.nama}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
                        <p className="text-sm text-amber-900">
                            ⚠️ Password akan direset ke: <strong>{generateDefaultPassword()}</strong>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading ? 'Memproses...' : 'Reset Password'}
                        </Button>
                        <Button onClick={() => setResetPasswordModal(false)} variant="outline" disabled={loading}>
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteConfirmModal} onOpenChange={setDeleteConfirmModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus User</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus {selectedUser?.nama_lengkap || selectedUser?.nama}?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                        <p className="text-sm text-red-900">
                            ⚠️ <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {loading ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                        <Button onClick={() => setDeleteConfirmModal(false)} variant="outline" disabled={loading}>
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
