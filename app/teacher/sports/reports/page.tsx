"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  Calendar,
  Users,
  Trophy,
  Target,
  Loader2
} from 'lucide-react'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function TeacherSportsReportsPage() {
  const [reports, setReports] = useState<any>({
    overview: {},
    attendance: {},
    participation: {},
    programs: [],
    students: [],
    insights: {}
  })
  const [myPrograms, setMyPrograms] = useState<any[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyPrograms()
  }, [])

  useEffect(() => {
    if (myPrograms.length > 0) {
      fetchData()
    }
  }, [selectedProgramId, myPrograms])

  const fetchMyPrograms = async () => {
    try {
      const response = await sportsApi.programs.getMyCoachPrograms()
      let programsData: any[] = []
      if (response) {
        if (response.success && response.data) {
          programsData = Array.isArray(response.data) ? response.data : (Array.isArray(response.data.programs) ? response.data.programs : [])
        } else if (Array.isArray(response.data)) {
          programsData = response.data
        } else if (Array.isArray(response.programs)) {
          programsData = response.programs
        } else if (Array.isArray(response)) {
          programsData = response
        }
      }
      setMyPrograms(programsData)
      if (programsData.length > 0 && selectedProgramId === 'all') {
        // Auto-select first program if available
        setSelectedProgramId(programsData[0]._id)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get program IDs to filter
      const programIds = selectedProgramId === 'all' 
        ? myPrograms.map((p: any) => p._id)
        : [selectedProgramId]

      if (programIds.length === 0) {
        setReports({
          overview: {},
          attendance: {},
          participation: {},
          programs: [],
          students: [],
          insights: {}
        })
        setLoading(false)
        return
      }

      // Fetch assignments for participant count
      const assignmentsResponse = await sportsApi.assignments.getAll({ limit: '10000' })
      let assignmentsData: any[] = []
      if (assignmentsResponse?.data?.assignments) {
        assignmentsData = Array.isArray(assignmentsResponse.data.assignments) ? assignmentsResponse.data.assignments : []
      } else if (Array.isArray(assignmentsResponse?.assignments)) {
        assignmentsData = assignmentsResponse.assignments
      } else if (Array.isArray(assignmentsResponse?.data)) {
        assignmentsData = assignmentsResponse.data
      }

      // Filter assignments for selected programs
      const myAssignments = assignmentsData.filter((a: any) => {
        const assignmentProgramId = a.sportsProgramId?._id || a.sportsProgramId
        return programIds.includes(assignmentProgramId) && (a.status === 'active' || !a.status)
      })

      // Fetch attendance for attendance stats
      const attendanceResponse = await sportsApi.attendance.getAll({ limit: '10000' })
      let attendanceData: any[] = []
      if (attendanceResponse?.data?.attendance) {
        attendanceData = Array.isArray(attendanceResponse.data.attendance) ? attendanceResponse.data.attendance : []
      } else if (Array.isArray(attendanceResponse?.attendance)) {
        attendanceData = attendanceResponse.attendance
      } else if (Array.isArray(attendanceResponse?.data)) {
        attendanceData = attendanceResponse.data
      }

      // Filter attendance for selected programs
      const myAttendance = attendanceData.filter((a: any) => {
        const attendanceProgramId = a.sportsProgramId?._id || a.sportsProgramId
        return programIds.includes(attendanceProgramId)
      })

      // Calculate stats
      const totalStudents = myAssignments.length
      const presentCount = myAttendance.filter((a: any) => 
        a.status?.toLowerCase() === 'present'
      ).length
      const absentCount = myAttendance.filter((a: any) => 
        a.status?.toLowerCase() === 'absent'
      ).length
      const lateCount = myAttendance.filter((a: any) => 
        a.status?.toLowerCase() === 'late'
      ).length
      const attendanceRate = myAttendance.length > 0 
        ? Math.round((presentCount / myAttendance.length) * 100) 
        : 0

      // Fetch schedules for upcoming events
      const scheduleResponse = await sportsApi.schedule.getAll({ limit: '10000' })
      let scheduleData: any[] = []
      if (scheduleResponse?.data?.schedules) {
        scheduleData = Array.isArray(scheduleResponse.data.schedules) ? scheduleResponse.data.schedules : []
      } else if (Array.isArray(scheduleResponse?.schedules)) {
        scheduleData = scheduleResponse.schedules
      } else if (Array.isArray(scheduleResponse?.data)) {
        scheduleData = scheduleResponse.data
      }

      const mySchedules = scheduleData.filter((s: any) => {
        const scheduleProgramId = s.sportsProgramId?._id || s.sportsProgramId
        return programIds.includes(scheduleProgramId)
      })

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcomingEvents = mySchedules.filter((s: any) => {
        const scheduleDate = new Date(s.startDate || s.date)
        scheduleDate.setHours(0, 0, 0, 0)
        return scheduleDate >= today
      }).length

      // Build reports data
      const reportsData = {
        overview: {
          totalPrograms: selectedProgramId === 'all' ? myPrograms.length : 1,
          totalStudents,
          totalAttendance: myAttendance.length,
          attendanceRate,
          upcomingEvents
        },
        attendance: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: myAttendance.filter((a: any) => a.status?.toLowerCase() === 'excused').length,
          total: myAttendance.length,
          rate: attendanceRate
        },
        participation: {
          activeStudents: totalStudents,
          programs: myPrograms.filter((p: any) => 
            selectedProgramId === 'all' || p._id === selectedProgramId
          )
        },
        programs: myPrograms.filter((p: any) => 
          selectedProgramId === 'all' || p._id === selectedProgramId
        ),
        students: myAssignments.map((a: any) => ({
          ...a.studentId || a.student,
          program: a.sportsProgramId || a.program
        })),
        insights: {
          averageAttendance: attendanceRate,
          mostActiveProgram: myPrograms.length > 0 ? myPrograms[0].name : 'N/A'
        }
      }

      setReports(reportsData)
    } catch (error: any) {
      console.error('Error fetching reports:', error)
      toast.error(error?.message || 'Failed to load reports data')
      setReports({
        overview: {},
        attendance: {},
        participation: {},
        programs: [],
        students: [],
        insights: {}
      })
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }: {
    title: string
    value: string | number
    subtitle: string
    icon: any
    color?: string
  }) => {
    const colorClasses: { [key: string]: { text: string; bg: string; icon: string } } = {
      blue: { text: 'text-blue-600', bg: 'bg-blue-100', icon: 'text-blue-600' },
      green: { text: 'text-green-600', bg: 'bg-green-100', icon: 'text-green-600' },
      purple: { text: 'text-purple-600', bg: 'bg-purple-100', icon: 'text-purple-600' },
      orange: { text: 'text-orange-600', bg: 'bg-orange-100', icon: 'text-orange-600' }
    }
    const colors = colorClasses[color] || colorClasses.blue

    return (
      <Card className="h-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${colors.text} mt-1 truncate`}>{value}</p>
              {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>}
            </div>
            <div className={`${colors.bg} p-2 sm:p-3 rounded-lg shrink-0`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4 border max-w-xs mx-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="text-sm font-medium text-gray-700 text-center">Loading reports...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sports Reports</h1>
          <p className="text-gray-600 mt-1">View statistics and insights for your sports programs</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {myPrograms.map((program: any) => (
                <SelectItem key={program._id} value={program._id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Programs"
          value={reports.overview?.totalPrograms || 0}
          subtitle="Programs you coach"
          icon={Trophy}
          color="blue"
        />
        <StatCard
          title="Active Students"
          value={reports.overview?.totalStudents || 0}
          subtitle="Students participating"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Attendance Rate"
          value={`${reports.overview?.attendanceRate || 0}%`}
          subtitle="Overall attendance"
          icon={BarChart3}
          color="purple"
        />
        <StatCard
          title="Upcoming Events"
          value={reports.overview?.upcomingEvents || 0}
          subtitle="Scheduled events"
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* Attendance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{reports.attendance?.present || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Present</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{reports.attendance?.absent || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Absent</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{reports.attendance?.late || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Late</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{reports.attendance?.excused || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Excused</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Details */}
      {reports.programs && reports.programs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.programs.map((program: any) => {
                const programAssignments = reports.students?.filter((s: any) => 
                  (s.program?._id || s.program) === program._id
                ) || []
                
                return (
                  <div key={program._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{program.name}</h3>
                      <Badge variant={program.isActive ? 'default' : 'secondary'}>
                        {program.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-gray-600">Participants</div>
                        <div className="text-lg font-semibold">{programAssignments.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Season</div>
                        <div className="text-lg font-semibold capitalize">{program.season || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Type</div>
                        <div className="text-lg font-semibold capitalize">{program.type || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="text-lg font-semibold">{program.isActive ? 'Active' : 'Inactive'}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Average Attendance Rate</div>
                <div className="text-sm text-blue-700">{reports.insights?.averageAttendance || 0}%</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Trophy className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Most Active Program</div>
                <div className="text-sm text-green-700">{reports.insights?.mostActiveProgram || 'N/A'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

