'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser } from '@/lib/types'
import { getAuthSession, setAuthSession, clearAuthSession } from '@/lib/auth-utils'

interface AuthContextType {
    user: AuthUser | null
    loading: boolean
    login: (user: AuthUser) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load session on mount
        const session = getAuthSession()
        setUser(session)
        setLoading(false)
    }, [])

    const login = (authUser: AuthUser) => {
        setAuthSession(authUser)
        setUser(authUser)
    }

    const logout = () => {
        clearAuthSession()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
