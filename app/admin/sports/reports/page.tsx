"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  Calendar,
  Users,
  Trophy,
  Target,
  ArrowLeft,
  FileText,
  PieChart,
  Activity,
  Award,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function SportsReportsPage() {
  const [reports, setReports] = useState<any>({
    overview: {},
    attendance: {},
    participation: {},
    programs: [],
    students: [],
    insights: {}
  })
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch programs first
      const programsRes = await sportsApi.programs.getAll({ page: '1', limit: '100' })
      const programsList = programsRes?.data?.programs || programsRes?.programs || (Array.isArray(programsRes) ? programsRes : [])
      setPrograms(Array.isArray(programsList) ? programsList : [])

      // Fetch overview report - all-time data (no date filters)
      // Admin's schoolId is automatically included from the session
      const overviewRes = await sportsApi.reports.get({
        type: 'overview'
        // No dateRange - get all-time data
        // No schoolId - admin's schoolId comes from session automatically
      })
      
      // Handle API response format
      let reportsData: any = {
        overview: {},
        attendance: {},
        participation: {},
        programs: [],
        students: [],
        insights: {}
      }

      if (overviewRes?.data) {
        reportsData.overview = overviewRes.data
        // Extract additional sections from overview data
        if (overviewRes.data.attendance) {
          reportsData.attendance = overviewRes.data.attendance
        }
        if (overviewRes.data.participation) {
          reportsData.participation = overviewRes.data.participation
        }
        if (overviewRes.data.students) {
          reportsData.students = overviewRes.data.students
        }
        if (overviewRes.data.insights) {
          reportsData.insights = overviewRes.data.insights
        }
      } else if (overviewRes) {
        reportsData.overview = overviewRes
        // Try to extract from direct response
        if (overviewRes.attendance) {
          reportsData.attendance = overviewRes.attendance
        }
        if (overviewRes.participation) {
          reportsData.participation = overviewRes.participation
        }
        if (overviewRes.students) {
          reportsData.students = overviewRes.students
        }
        if (overviewRes.insights) {
          reportsData.insights = overviewRes.insights
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

  const handleExportReport = async (type: string) => {
    try {
      const blob = await sportsApi.reports.export({
        type
        // No dateRange - export all-time data
        // No schoolId - admin's schoolId comes from session automatically
      })
      
      // Create download link from blob
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `sports_${type}_report_${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Report exported successfully')
    } catch (error: any) {
      console.error('Error exporting report:', error)
      toast.error(error?.message || 'Failed to export report')
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 relative">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <Link href="/admin/sports/programs">
            <Button variant="outline" size="sm" className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Sports</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Sports Statistics Report</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">All-time analytics and insights for sports programs</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Programs"
          value={loading ? '...' : (reports.overview.totalPrograms || 0)}
          subtitle="All programs"
          icon={Trophy}
          color="green"
        />
        <StatCard
          title="Active Programs"
          value={loading ? '...' : (reports.overview.activePrograms || 0)}
          subtitle="Currently running"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Total Students"
          value={loading ? '...' : (reports.overview.totalStudents || 0)}
          subtitle="Active participants"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Attendance Rate"
          value={loading ? '...' : `${reports.overview.attendanceSummary?.averageAttendance || 0}%`}
          subtitle="Average across all programs"
          icon={Target}
          color="orange"
        />
      </div>

      {/* Detailed Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Program Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Program Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : reports.participation?.programs && reports.participation.programs.length > 0 ? (
                reports.participation.programs.map((program: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{program.name}</h3>
                      <Badge variant="outline">{program.season || 'N/A'}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Students</p>
                        <p className="font-medium text-gray-900">{program.studentCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Attendance</p>
                        <p className="font-medium text-gray-900">{program.attendanceRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Events</p>
                        <p className="font-medium text-gray-900">{program.eventCount || 0}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No program performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Student Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Top Student Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : reports.students && reports.students.length > 0 ? (
                reports.students.slice(0, 10).map((student: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-900 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name || 'Unknown Student'}</p>
                        <p className="text-sm text-gray-600">{student.program || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{student.attendanceRate || 0}%</p>
                      <p className="text-xs text-gray-600">{student.eventsAttended || 0} of {student.totalEvents || 0} events</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No student performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Attendance Insights</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Best attendance day: <span className="font-medium">{reports.insights?.bestAttendanceDay || 'N/A'}</span></li>
                  <li>• Peak attendance time: <span className="font-medium">{reports.insights?.peakTime || 'N/A'}</span></li>
                  <li>• Most active program: <span className="font-medium">{reports.insights?.mostActiveProgram || 'N/A'}</span></li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Growth Metrics</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• New registrations: <span className="font-medium">+{reports.insights?.newRegistrations || 0}</span></li>
                  <li>• Retention rate: <span className="font-medium">{reports.insights?.retentionRate || 0}%</span></li>
                  <li>• Completion rate: <span className="font-medium">{reports.insights?.completionRate || 0}%</span></li>
                </ul>
              </div>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
