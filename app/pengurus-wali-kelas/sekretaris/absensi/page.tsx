'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AttendanceModal } from '@/components/attendance-modal'
import { AttendanceChart } from '@/components/attendance-chart'
import { DailyAbsences } from '@/components/daily-absences'
import { StatsCard } from '@/components/stats-card'
import { HolidayModal } from '@/components/holiday-modal'
import { MarkAllPresentButton } from '@/components/mark-all-present-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { supabase } from '@/lib/supabase'
import { Holiday } from '@/lib/types'
import { formatIndonesianDate, formatDateForDB, getHolidayStatusText } from '@/lib/date-utils'

export default function Home() {
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [holidayModalOpen, setHolidayModalOpen] = useState(false)
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
  })
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const today = new Date()
  const todayStr = formatDateForDB(today)

  useEffect(() => {
    async function fetchData() {
      // Get total students
      const { count: totalStudents } = await supabase
        .from('students_master')
        .select('*', { count: 'exact', head: true })

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('tanggal', todayStr)

      // Get holidays
      const { data: holidaysData } = await supabase.from('holidays').select('*')

      // Calculate stats
      const presentCount = todayAttendance?.filter((r) => r.status === 'Hadir').length || 0
      const absentCount = todayAttendance?.filter((r) => r.status !== 'Hadir').length || 0

      setStats({
        totalStudents: totalStudents || 0,
        presentToday: presentCount,
        absentToday: absentCount,
      })

      if (holidaysData) setHolidays(holidaysData)
    }

    fetchData()
  }, [refreshKey, todayStr])

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const holidayStatus = getHolidayStatusText(today, holidays)
  const attendanceRate =
    stats.totalStudents > 0 ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Dashboard Kehadiran
          </h1>
          <p className="mt-1 text-sm text-gray-600">{formatIndonesianDate(today)}</p>
        </div>

        {/* Holiday Banner */}
        {holidayStatus && (
          <div className="mb-6 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-md">
            <p className="text-center text-base font-semibold text-amber-900 sm:text-lg">
              🎉 {holidayStatus}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <MarkAllPresentButton
            date={today}
            onSuccess={handleSuccess}
            disabled={!!holidayStatus}
          />
          <Button
            onClick={() => setAttendanceModalOpen(true)}
            size="lg"
            className="gap-2 bg-sky-500 hover:bg-sky-600 shadow-md hover:shadow-lg transition-all"
          >
            <UserX className="h-5 w-5" />
            Catat Absensi
          </Button>
          <Button
            onClick={() => setHolidayModalOpen(true)}
            variant="outline"
            size="lg"
            className="gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Calendar className="h-5 w-5" />
            Tetapkan Libur
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Siswa"
            value={stats.totalStudents}
            icon={Users}
            description="Terdaftar di kelas"
            gradient="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Hadir Hari Ini"
            value={stats.presentToday}
            icon={UserCheck}
            description={`${attendanceRate}% tingkat kehadiran`}
            gradient="from-emerald-500 to-emerald-600"
          />
          <StatsCard
            title="Tidak Hadir"
            value={stats.absentToday}
            icon={UserX}
            description="Sakit, Izin, atau Alpha"
            gradient="from-amber-500 to-amber-600"
          />
        </div>

        {/* Charts & Data Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attendance Trend Chart */}
          <div key={`chart-${refreshKey}`}>
            <AttendanceChart />
          </div>

          {/* Daily Absences */}
          <div key={`absences-${refreshKey}`}>
            <DailyAbsences />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AttendanceModal
        open={attendanceModalOpen}
        onOpenChange={setAttendanceModalOpen}
        onSuccess={handleSuccess}
      />
      <HolidayModal
        open={holidayModalOpen}
        onOpenChange={setHolidayModalOpen}
        onSuccess={handleSuccess}
      />
    </DashboardLayout>
  )
}
