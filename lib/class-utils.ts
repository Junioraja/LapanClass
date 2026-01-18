import { supabase } from './supabase'
import { Class, StudentNew } from './types'

/**
 * Get all classes
 */
export async function getAllClasses() {
    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('nama_kelas')

    return { data, error }
}

/**
 * Get class by ID
 */
export async function getClassById(classId: string) {
    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

    return { data, error }
}

/**
 * Get students by class
 */
export async function getStudentsByClass(classId: string) {
    const { data, error } = await supabase
        .from('students_master')
        .select('*')
        .eq('class_id', classId)
        .order('nomor_absen')

    return { data, error }
}

/**
 * Get student count by class
 */
export async function getStudentCountByClass(classId: string): Promise<number> {
    const { count, error } = await supabase
        .from('students_master')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)

    return count || 0
}
