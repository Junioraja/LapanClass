// Date utilities for Indonesian localization and holiday management
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import { Holiday } from './types'

/**
 * Indonesian day names
 */
const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Indonesian month names
 */
const BULAN_INDONESIA = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
]

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
    const day = getDay(date)
    return day === 0 || day === 6 // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(dateStr: string, holidays: Holiday[]): Holiday | undefined {
    return holidays.find((h) => h.tanggal === dateStr)
}

/**
 * Get Indonesian day name
 */
export function getDayName(date: Date): string {
    return HARI_INDONESIA[getDay(date)]
}

/**
 * Get Indonesian month name
 */
export function getMonthName(monthIndex: number): string {
    return BULAN_INDONESIA[monthIndex]
}

/**
 * Format date in Indonesian format
 * e.g., "Senin, 6 Januari 2026"
 */
export function formatIndonesianDate(date: Date): string {
    const dayName = getDayName(date)
    const day = date.getDate()
    const month = getMonthName(date.getMonth())
    const year = date.getFullYear()
    return `${dayName}, ${day} ${month} ${year}`
}

/**
 * Format date in short Indonesian format
 * e.g., "6 Jan 2026"
 */
export function formatShortIndonesianDate(date: Date): string {
    const day = date.getDate()
    const month = BULAN_INDONESIA[date.getMonth()].substring(0, 3)
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
}

/**
 * Get all days in a month
 */
export function getMonthDays(year: number, month: number): Date[] {
    const start = startOfMonth(new Date(year, month, 1))
    const end = endOfMonth(new Date(year, month, 1))
    return eachDayOfInterval({ start, end })
}

/**
 * Format date for database (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date): string {
    return format(date, 'yyyy-MM-dd')
}

/**
 * Get holiday status text
 */
export function getHolidayStatusText(date: Date, holidays: Holiday[]): string | null {
    const dateStr = formatDateForDB(date)

    if (isWeekend(date)) {
        return 'Libur Akhir Pekan'
    }

    const holiday = isHoliday(dateStr, holidays)
    if (holiday) {
        return holiday.nama_libur
    }

    return null
}

/**
 * Check if date allows attendance input
 */
export function canInputAttendance(date: Date, holidays: Holiday[]): boolean {
    const dateStr = formatDateForDB(date)

    // Cannot input on weekends
    if (isWeekend(date)) {
        return false
    }

    // Cannot input on holidays (but can on events)
    const holiday = isHoliday(dateStr, holidays)
    if (holiday && holiday.tipe === 'libur') {
        return false
    }

    return true
}

/**
 * Get month/year options for selector
 */
export function getMonthYearOptions(startYear: number = 2024, endYear: number = 2026) {
    const options: { value: string; label: string }[] = []

    for (let year = startYear; year <= endYear; year++) {
        for (let month = 0; month < 12; month++) {
            const value = `${year}-${String(month + 1).padStart(2, '0')}`
            const label = `${BULAN_INDONESIA[month]} ${year}`
            options.push({ value, label })
        }
    }

    return options
}

/**
 * Get year options for separate dropdown
 */
export function getYearOptions(startYear: number = 2024, endYear: number = 2030) {
    const options: { value: number; label: string }[] = []

    for (let year = startYear; year <= endYear; year++) {
        options.push({ value: year, label: year.toString() })
    }

    return options
}

/**
 * Get month options for separate dropdown
 */
export function getMonthOptions() {
    return BULAN_INDONESIA.map((name, index) => ({
        value: index,
        label: name
    }))
}

/**
 * Get start and end of a single day
 */
export function getDayRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

/**
 * Get start and end of a week (Monday to Sunday)
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
    const day = getDay(date)
    const diff = day === 0 ? -6 : 1 - day // Adjust to Monday

    const start = new Date(date)
    start.setDate(date.getDate() + diff)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // Sunday
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

/**
 * Get start and end of a month
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
    const start = startOfMonth(new Date(year, month, 1))
    const end = endOfMonth(new Date(year, month, 1))

    return { start, end }
}

/**
 * Get date range based on filter mode
 */
export function getDateRangeByMode(
    mode: 'day' | 'week' | 'month',
    referenceDate: Date,
    year?: number,
    month?: number
): { start: Date; end: Date } {
    switch (mode) {
        case 'day':
            return getDayRange(referenceDate)
        case 'week':
            return getWeekRange(referenceDate)
        case 'month':
            if (year !== undefined && month !== undefined) {
                return getMonthRange(year, month)
            }
            return getMonthRange(referenceDate.getFullYear(), referenceDate.getMonth())
        default:
            return getMonthRange(referenceDate.getFullYear(), referenceDate.getMonth())
    }
}

