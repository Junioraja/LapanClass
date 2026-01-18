'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRole } from '@/lib/types'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: (UserRole | 'siswa')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login')
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.push('/unauthorized')
            }
        }
    }, [user, loading, router, allowedRoles])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null
    }

    return <>{children}</>
}
