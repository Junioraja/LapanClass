'use client'

import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMonthDays, formatDateForDB, getMonthName } from '@/lib/date-utils'

interface AttendanceData {
    date: string
    present: number
    displayDate: string
    hasData: boolean
}

export function AttendanceChart() {
    const [data, setData] = useState<AttendanceData[]>([])
    const [totalStudents, setTotalStudents] = useState(0)

    useEffect(() => {
        async function fetchData() {
            // Get total students
            const { count: studentsCount } = await supabase
                .from('students_master')
                .select('*', { count: 'exact', head: true })

            setTotalStudents(studentsCount || 0)

            // Get attendance data for current month
            const today = new Date()
            const monthStart = startOfMonth(today)
            const monthEnd = endOfMonth(today)

            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('tanggal, status')
                .gte('tanggal', formatDateForDB(monthStart))
                .lte('tanggal', formatDateForDB(monthEnd))

            // Get all days in month
            const allDays = getMonthDays(today.getFullYear(), today.getMonth())

            // Count attendance per day
            const attendanceByDate: Record<string, { present: number; total: number }> = {}

            attendanceData?.forEach((record) => {
                if (!attendanceByDate[record.tanggal]) {
                    attendanceByDate[record.tanggal] = { present: 0, total: 0 }
                }
                attendanceByDate[record.tanggal].total++
                if (record.status === 'Hadir') {
                    attendanceByDate[record.tanggal].present++
                }
            })

            // Calculate present students for each day (only for days with data)
            const chartData: AttendanceData[] = allDays.map((day) => {
                const dateStr = formatDateForDB(day)
                const dayData = attendanceByDate[dateStr]
                const hasData = !!dayData

                // If we have data for this day, calculate present
                // Otherwise, don't show a data point (will be filtered or shown as 0)
                const present = hasData
                    ? (studentsCount || 0) - (dayData.total - dayData.present)
                    : 0

                return {
                    date: dateStr,
                    present: hasData ? present : 0,
                    displayDate: format(day, 'd'),
                    hasData,
                }
            })

            setData(chartData)
        }

        fetchData()
    }, [])

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle>Tren Kehadiran Bulanan</CardTitle>
                <CardDescription>
                    Grafik kehadiran harian untuk {getMonthName(new Date().getMonth())} {new Date().getFullYear()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="displayDate"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, totalStudents]}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload as AttendanceData
                                    if (!data.hasData) return null

                                    return (
                                        <div className="rounded-lg border bg-white p-3 shadow-lg">
                                            <p className="text-sm font-medium">{data.present} siswa hadir</p>
                                            <p className="text-xs text-muted-foreground">
                                                Tanggal {data.displayDate}
                                            </p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="present"
                            stroke="#0ea5e9"
                            strokeWidth={3}
                            dot={(props) => {
                                const data = props.payload as AttendanceData
                                if (!data.hasData) return null
                                return <circle cx={props.cx} cy={props.cy} fill="#0ea5e9" r={4} />
                            }}
                            activeDot={{ r: 7 }}
                            connectNulls={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
