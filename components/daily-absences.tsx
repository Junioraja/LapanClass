'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase'
import { AttendanceWithStudent, Holiday } from '@/lib/types'
import { formatDateForDB, getHolidayStatusText } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export function DailyAbsences() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [absences, setAbsences] = useState<AttendanceWithStudent[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])

    useEffect(() => {
        async function fetchData() {
            const dateStr = formatDateForDB(selectedDate)

            // Fetch absences
            const { data: absenceData } = await supabase
                .from('attendance')
                .select(`
          *,
          students_master (nomor_absen, nama, nis)
        `)
                .eq('tanggal', dateStr)
                .neq('status', 'Hadir')
                .order('nomor_absen')

            // Fetch holidays
            const { data: holidayData } = await supabase.from('holidays').select('*')

            setAbsences((absenceData as any) || [])
            if (holidayData) setHolidays(holidayData)
        }

        fetchData()
    }, [selectedDate])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Sakit':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'Izin':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'Alpha':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const holidayStatus = getHolidayStatusText(selectedDate, holidays)

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Siapa yang tidak masuk hari ini?</CardTitle>
                        <CardDescription>Daftar siswa yang tidak hadir pada tanggal dipilih</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start text-left font-normal shadow-sm',
                                    !selectedDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(selectedDate, 'dd/MM/yyyy')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                {/* Holiday Banner */}
                {holidayStatus && (
                    <div className="mb-4 rounded-lg border-2 border-amber-200 bg-amber-50 p-3">
                        <p className="text-sm font-medium text-amber-900">
                            📅 {holidayStatus}
                        </p>
                    </div>
                )}

                {/* Absences List */}
                {absences.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-sm text-muted-foreground">
                            Tidak ada siswa yang tidak masuk 🎉
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {absences.map((absence) => (
                            <div
                                key={absence.id}
                                className="flex items-center justify-between rounded-lg border-2 p-3 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">
                                        {absence.students_master?.nomor_absen}. {absence.students_master?.nama}
                                    </p>
                                    {absence.keterangan && (
                                        <p className="text-sm text-muted-foreground">{absence.keterangan}</p>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'rounded-full border-2 px-3 py-1 text-xs font-semibold',
                                        getStatusColor(absence.status)
                                    )}
                                >
                                    {absence.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
