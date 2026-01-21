import { supabase } from './supabase'

/**
 * Upload file bukti to Supabase storage bucket: bukti-surat-izin
 * @param file - File to upload
 * @param studentId - Student ID for organizing files
 * @param type - Type of proof: 'izin' | 'sakit' | 'telat'
 * @returns Public URL of uploaded file
 */
export async function uploadBuktiFile(
    file: File,
    studentId: string,
    type: 'izin' | 'sakit' | 'telat' = 'izin'
): Promise<string> {
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${studentId}/${type}_${Date.now()}.${fileExt}`

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
            .from('bukti-surat-izin')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (error) {
            console.error('Upload error:', error)
            throw new Error(`Gagal upload file: ${error.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('bukti-surat-izin')
            .getPublicUrl(data.path)

        return urlData.publicUrl
    } catch (error) {
        console.error('Error in uploadBuktiFile:', error)
        throw error
    }
}

/**
 * Delete file from Supabase storage
 * @param url - Public URL of file to delete
 */
export async function deleteBuktiFile(url: string): Promise<void> {
    try {
        // Extract file path from URL
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/bukti-surat-izin/')
        if (pathParts.length < 2) {
            throw new Error('Invalid file URL')
        }
        const filePath = pathParts[1]

        // Delete from storage
        const { error } = await supabase.storage
            .from('bukti-surat-izin')
            .remove([filePath])

        if (error) {
            console.error('Delete error:', error)
            throw new Error(`Gagal hapus file: ${error.message}`)
        }
    } catch (error) {
        console.error('Error in deleteBuktiFile:', error)
        throw error
    }
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5MB)
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): boolean {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
        throw new Error('Format file tidak valid. Gunakan JPG, PNG, atau WebP.')
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
        throw new Error(`Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.`)
    }

    return true
}

/**
 * Get preview URL from file
 * @param file - File object
 * @returns Data URL for preview
 */
export function getFilePreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            resolve(reader.result as string)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
