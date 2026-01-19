// TypeScript types for the database schema

export interface Student {
    id?: string          // UUID from students_master
    class_id?: string    // UUID - FK to classes
    nomor_absen: number
    nis: string
    nama: string
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'

export interface Attendance {
    id?: string
    nomor_absen: number
    status: AttendanceStatus
    keterangan?: string
    tanggal: string // DATE format: YYYY-MM-DD
}

export interface AttendancePeriod {
    attendance_id: string
    jam_ke: number // 1-10
}

export interface StudentRecap {
    nomor_absen: number
    nama: string
    nis: string
    total_sakit: number
    total_izin: number
    total_alpha: number
}

export interface AttendanceWithStudent extends Attendance {
    students_master?: Student
}

// Holiday/Event management
export interface Holiday {
    id?: string
    tanggal: string // DATE format: YYYY-MM-DD
    nama_libur: string // e.g., "Tahun Baru", "Classmeeting"
    tipe: 'libur' | 'acara' // libur = red date holiday, acara = school event
}

// Monthly grid cell data
export interface MonthlyAttendanceCell {
    date: string
    status?: AttendanceStatus
    keterangan?: string
    periods?: number[] // For partial leave (jam_ke)
    isWeekend?: boolean
    isHoliday?: boolean
    holidayName?: string
    attendanceId?: string // ID for editing
}

// Semester configuration
export interface SemesterConfig {
    id?: string
    kelas: string // e.g., "11" for XI, "12" for XII
    semester: 1 | 2
    tanggal_mulai: string // DATE format: YYYY-MM-DD
    tanggal_selesai: string // DATE format: YYYY-MM-DD
    created_at?: string
}

// ============================================
// MULTI-CLASS SYSTEM TYPES
// ============================================

// Classes table
export interface Class {
    id: string
    nama_kelas: string
    created_at?: string
}

// User roles
export type UserRole = 'admin' | 'sekretaris' | 'bendahara' | 'wali_kelas' | 'ketua_kelas'

// Profile for pengurus/admin
export interface Profile {
    id: string
    nis?: string
    nama: string // Database uses 'nama' not 'nama_lengkap'
    role: UserRole
    nomor_absen?: number
    class_id: string | null
    phone: string // Database uses 'phone' not 'nomor_telepon'
    password: string
    custom_id: string | null
    is_approved: boolean
    approved_by?: string | null
    jabatan?: string
    is_block?: boolean // Database uses 'is_blocked'
    created_at?: string
}

// Student (updated with UUID and class_id)
export interface StudentNew {
    id: string // UUID primary key
    nomor_absen: number
    nis: string
    nama: string
    class_id: string
    password?: string
    is_blocked?: boolean
    created_at?: string
}

// Auth user type for session
export interface AuthUser {
    id: string
    nama: string
    role: UserRole | 'siswa'
    class_id: string | null
    custom_id?: string
    nis?: string
}

// Schedule (jadwal pelajaran) with class_id
export interface Schedule {
    id: string
    hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'
    subject_id: string
    jam_mulai: number
    jam_selesai: number
    pj_siswa_id: string | null // UUID now
    semester_id: string | null
    class_id: string
    created_at?: string
    subject?: Subject
}

// Journal (jurnal kelas) with class_id
export interface Journal {
    id: string
    tanggal: string
    schedule_id: string | null
    materi_pembelajaran: string
    guru_pengajar: string
    catatan_khusus: string | null
    class_id: string
    created_by: string
    created_at?: string
    schedule?: Schedule
}

// Attendance (updated with class_id and approval)
export interface AttendanceNew {
    id?: string
    student_id: string // UUID now
    status: AttendanceStatus
    keterangan?: string
    tanggal: string
    class_id: string
    is_approved?: boolean
    approved_by?: string
}

// App Settings for feature toggle
export interface AppSettings {
    id?: string
    setting_key: string
    setting_value: boolean
    description?: string
    updated_at?: string
}

// Feature flags
export type FeatureKey =
    | 'absensi_enabled'
    | 'jurnal_enabled'
    | 'kas_enabled'
    | 'bendahara_menu_enabled'
    | 'wali_kelas_menu_enabled'
    | 'siswa_dashboard_enabled'

// Class Equipment (Kelengkapan Kelas)
export interface ClassEquipment {
    id?: string
    class_id: string
    nama_barang: string
    jumlah: number
    kondisi: 'baik' | 'perlu_ganti' | 'rusak'
    keterangan?: string
    created_at?: string
    updated_at?: string
}

// Class Finance (Kas Kelas)
export interface ClassFinance {
    id?: string
    class_id: string
    tanggal: string
    jenis: 'masuk' | 'keluar'
    jumlah: number
    kategori: string
    keterangan?: string
    created_by?: string
    created_at?: string
}

// ============================================
// MANAGEMENT SYSTEM TYPES
// ============================================

export interface Subject {
    id?: string
    class_id: string
    nama_mapel: string
    nama_guru_default: string
    created_at?: string
}

export interface ClassSchedule {
    id?: string
    class_id: string
    hari: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat'
    subject_id: string
    jam_mulai: number // 1-10
    jam_selesai: number // 1-10
    pj_siswa_id?: string
    semester_id?: string
    created_at?: string
    subject?: Subject
    pj_siswa?: {
        nama: string
    }
}


// ============================================
// BENDAHARA SYSTEM TYPES
// ============================================

export type PeriodeType = 'harian' | 'mingguan' | 'bulanan'
export type MetodePembayaran = 'cash' | 'qris'
export type JenisSavings = 'tabungan' | 'iuran'

// Kas Settings
export interface KasSettings {
    id?: string
    class_id: string
    periode_type: PeriodeType
    periode_value?: number
    periode_day?: string[]
    nominal_per_periode: number
    metode_default: MetodePembayaran
    is_active: boolean
    created_at?: string
    updated_at?: string
}

// Kas Payment
export interface KasPayment {
    id?: string
    class_id: string
    student_id: string
    tanggal: string
    periode_bulan: string
    jumlah_periode: number
    nominal: number
    metode: MetodePembayaran
    is_auto: boolean
    keterangan?: string
    created_by?: string
    created_at?: string
    // Joined fields
    student?: { nama: string; nis: string }
}

// Kas Expense
export interface KasExpense {
    id?: string
    class_id: string
    tanggal: string
    nominal: number
    kategori: string
    keterangan: string
    bukti_url?: string
    created_by?: string
    created_at?: string
    updated_at?: string
}

// Class Savings (Tabungan/Iuran)
export interface ClassSavings {
    id?: string
    class_id: string
    nama: string
    jenis: JenisSavings
    target_amount?: number
    target_date?: string
    periode_type: PeriodeType
    periode_value?: number
    periode_day?: string[]
    nominal_per_periode: number
    metode_default: MetodePembayaran
    is_active: boolean
    created_at?: string
    updated_at?: string
}

// Savings Payment
export interface SavingsPayment {
    id?: string
    savings_id: string
    student_id: string
    tanggal: string
    nominal: number
    metode: MetodePembayaran
    keterangan?: string
    created_by?: string
    created_at?: string
    // Joined fields
    student?: { nama: string; nis: string }
    savings?: { nama: string; jenis: JenisSavings }
}
