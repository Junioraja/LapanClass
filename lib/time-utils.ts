// Time to period mapping utilities
// P1: 06:45-07:25, P2: 07:25-08:10, P3: 08:10-09:00, P4: 09:00-09:40, P5: 09:40-10:40
// P6: 10:40-11:30, P7: 11:30-12:00, P8: 12:00-13:40, P9: 13:40-14:20, P10: 14:20-15:00

interface PeriodSchedule {
    period: number
    start: { hour: number; minute: number }
    end: { hour: number; minute: number }
}

const PERIOD_SCHEDULE: PeriodSchedule[] = [
    { period: 1, start: { hour: 6, minute: 45 }, end: { hour: 7, minute: 25 } },
    { period: 2, start: { hour: 7, minute: 25 }, end: { hour: 8, minute: 10 } },
    { period: 3, start: { hour: 8, minute: 10 }, end: { hour: 9, minute: 0 } },
    { period: 4, start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 40 } },
    { period: 5, start: { hour: 9, minute: 40 }, end: { hour: 10, minute: 40 } },
    { period: 6, start: { hour: 10, minute: 40 }, end: { hour: 11, minute: 30 } },
    { period: 7, start: { hour: 11, minute: 30 }, end: { hour: 12, minute: 0 } },
    { period: 8, start: { hour: 12, minute: 0 }, end: { hour: 13, minute: 40 } },
    { period: 9, start: { hour: 13, minute: 40 }, end: { hour: 14, minute: 20 } },
    { period: 10, start: { hour: 14, minute: 20 }, end: { hour: 15, minute: 0 } },
]

/**
 * Convert time to minutes since midnight for easier comparison
 */
function timeToMinutes(hour: number, minute: number): number {
    return hour * 60 + minute
}

/**
 * Check if a time range overlaps with a period
 */
function rangesOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number
): boolean {
    return start1 < end2 && end1 > start2
}

/**
 * Convert time range to period numbers (1-10)
 * @param startTime - Start time in HH:MM format (e.g., "07:00")
 * @param endTime - End time in HH:MM format (e.g., "09:30")
 * @returns Array of period numbers that overlap with the time range
 */
export function timeToPeriods(startTime: string, endTime: string): number[] {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startMinutes = timeToMinutes(startHour, startMinute)
    const endMinutes = timeToMinutes(endHour, endMinute)

    const periods: number[] = []

    for (const schedule of PERIOD_SCHEDULE) {
        const periodStart = timeToMinutes(schedule.start.hour, schedule.start.minute)
        const periodEnd = timeToMinutes(schedule.end.hour, schedule.end.minute)

        if (rangesOverlap(startMinutes, endMinutes, periodStart, periodEnd)) {
            periods.push(schedule.period)
        }
    }

    return periods
}

/**
 * Get period schedule for display purposes
 */
export function getPeriodSchedule(): PeriodSchedule[] {
    return PERIOD_SCHEDULE
}

/**
 * Format period for display (e.g., "P1: 06:45-07:25")
 */
export function formatPeriod(period: number): string {
    const schedule = PERIOD_SCHEDULE.find((s) => s.period === period)
    if (!schedule) return `P${period}`

    const formatTime = (h: number, m: number) =>
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

    return `P${period}: ${formatTime(schedule.start.hour, schedule.start.minute)}-${formatTime(schedule.end.hour, schedule.end.minute)}`
}
