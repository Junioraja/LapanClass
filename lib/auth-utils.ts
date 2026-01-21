import bcrypt from 'bcryptjs'
import { AuthUser } from './types'

/**
 * Hash password dengan bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

/**
 * Compare password dengan hash
 * Supports both hashed and plain text passwords (for backward compatibility)
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    try {
        // Try bcrypt comparison first (for hashed passwords)
        const isMatch = await bcrypt.compare(password, hash)
        return isMatch
    } catch (error) {
        // Fallback: If bcrypt fails, try plain text comparison
        // This is for backward compatibility with existing plain text passwords
        console.warn('Bcrypt comparison failed, trying plain text comparison')
        return password === hash
    }
}

/**
 * Generate default password untuk user baru
 */
export function generateDefaultPassword(): string {
    return 'LapanClass2026'
}

/**
 * Session management - set auth session
 */
export function setAuthSession(user: AuthUser) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('lapan_auth', JSON.stringify(user))
    }
}

/**
 * Get current auth session
 */
export function getAuthSession(): AuthUser | null {
    if (typeof window !== 'undefined') {
        const session = localStorage.getItem('lapan_auth')
        return session ? JSON.parse(session) : null
    }
    return null
}

/**
 * Clear auth session
 */
export function clearAuthSession() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('lapan_auth')
    }
}
