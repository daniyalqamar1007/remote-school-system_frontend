"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  School,
  Activity,
  TrendingUp,
  GraduationCap,
  BookOpen,
  BarChart3,
  RefreshCw,
  UserPlus,
  Building2
} from "lucide-react"
import axios from "axios"
import { toast } from 'sonner'

interface GlobalOverview {
  overview: {
    activeNurses: number
    activeTeachers: number
    activeParents: number
    activeStudents: number
    totalUsers: number
    activeUsers: number
    totalStudents: number
    totalTeachers: number
    totalParents: number
    totalNurses: number
    totalSchools: number
    activeSchools: number
    totalActivities: number
  }
  kpis: {
    newUsersThisMonth: number
    newSchoolsThisMonth: number
    activeUsersLast24h: number
    systemErrors: number
    userGrowthRate: number
    schoolUtilizationRate: number
    systemHealthScore: number
  }
  distributions: {
    usersByRole: Array<{
      role: string
      count: number
      activeCount: number
      percentage: number
    }>
    enrollmentByGrade: Array<{
      grade: string
      count: number
      maleCount: number
      femaleCount: number
    }>
  }
  activity: {
    recent: Array<{
      title: string
      subtitle: string
      performBy: string
      actorName: string
      createdAt: string
    }>
    trends: Array<{
      date: string
      uniqueLogins: number
    }>
  }
  schools: {
    performance: Array<{
      schoolId: string
      name: string
      code: string
      type: string
      isActive: boolean
      totalUsers: number
      activeUsers: number
      studentCount: number
      teacherCount: number
      utilizationRate: number
    }>
    summary: {
      totalSchools: number
      activeSchools: number
      averageUtilization: number
    }
  }
  dataQuality: {
    userDataCompleteness: string
    phoneDataCompleteness: string
    schoolDataCompleteness: number
    overallScore: number
  }
  generatedAt: string
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [overview, setOverview] = useState<GlobalOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("30d")
  const [selectedSchool, setSelectedSchool] = useState("all")

  useEffect(() => {
    fetchGlobalOverview()
  }, [timeframe, selectedSchool])

  const fetchGlobalOverview = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedSchool !== "all") params.append("schoolId", selectedSchool)
      if (timeframe !== "all") {
        const endDate = new Date()
        const startDate = new Date()

        switch (timeframe) {
          case "7d":
            startDate.setDate(endDate.getDate() - 7)
            break
          case "30d":
            startDate.setDate(endDate.getDate() - 30)
            break
          case "90d":
            startDate.setDate(endDate.getDate() - 90)
            break
        }

        params.append("startDate", startDate.toISOString())
        params.append("endDate", endDate.toISOString())
      }

      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      setOverview(response.data.data)
    } catch (error) {
      console.error('Error fetching global overview:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedSchool !== "all") params.append("schoolId", selectedSchool)

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/overview/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `global-overview-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting overview:", error)
    }
  }

  const KpiCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    colorClass = "text-blue-600",
    trend,
    trendLabel
  }: {
    title: string
    value: number | string
    subtitle?: string
    icon: any
    colorClass?: string
    trend?: number
    trendLabel?: string
  }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : (value || 0)}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend !== undefined && trend !== 0 && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-3 w-3 mr-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}% {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading && !overview) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-gray-400" />
            <p className="text-muted-foreground text-lg">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Comprehensive system-wide analytics and key performance indicators
          </p>
        </div>
      </div>

      {/* System Health Status */}
      {overview && (
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">System Health Overview</CardTitle>
                <CardDescription className="mt-1">
                  Real-time system status and performance metrics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <p className="text-2xl md:text-3xl font-bold text-green-600">{overview?.overview?.totalUsers || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Total Users</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{overview?.overview?.activeUsers || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      {overview && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Students"
            value={overview?.overview?.totalStudents || 0}
            subtitle={`${overview?.overview?.activeStudents || 0} active`}
            icon={GraduationCap}
            colorClass="text-green-600"
          />
          <KpiCard
            title="Teachers"
            value={overview?.overview?.totalTeachers || 0}
            subtitle={`${overview?.overview?.activeTeachers || 0} active`}
            icon={BookOpen}
            colorClass="text-purple-600"
          />
          <KpiCard
            title="Parents"
            value={overview?.overview?.totalParents || 0}
            subtitle={`${overview?.overview?.activeParents || 0} active`}
            icon={UserPlus}
            colorClass="text-pink-600"
          />
          <KpiCard
            title="Schools"
            value={overview?.overview?.totalSchools || 0}
            subtitle={`${overview?.overview?.activeSchools || 0} active`}
            icon={School}
            colorClass="text-orange-600"
          />
          <KpiCard
            title="Activities"
            value={overview?.overview?.totalActivities || 0}
            subtitle="Total system activities"
            icon={Activity}
            colorClass="text-indigo-600"
          />
        </div>
      )}

      {/* Additional Metrics */}
      {overview && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                New Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{overview?.kpis?.newUsersThisMonth || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-600" />
                New Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{overview?.kpis?.newSchoolsThisMonth || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {overview && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          {/* Users by Role Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Users by Role
              </CardTitle>
              <CardDescription>Distribution across user types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview?.distributions?.usersByRole && overview.distributions.usersByRole.length > 0 ? (
                  overview.distributions.usersByRole
                    .filter((role) => !['NURSE', 'SECRETARY'].includes((role.role || '').toUpperCase()))
                    .map((role, idx) => (
                    <div key={`${role.role}-${idx}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : idx === 2 ? 'bg-purple-500' : idx === 3 ? 'bg-orange-500' : 'bg-pink-500'
                          }`} />
                        <span className="text-sm font-medium">{(role.role || 'Unknown').replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          ({role.activeCount || 0} active)
                        </span>
                      </div>
                    </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No role data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enrollment by Grade
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                Enrollment by Grade
              </CardTitle>
              <CardDescription>Student distribution by grade level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview?.distributions?.enrollmentByGrade && overview.distributions.enrollmentByGrade.length > 0 ? (
                  overview.distributions.enrollmentByGrade.slice(0, 8).map((grade, idx) => {
                    const maxCount = Math.max(...(overview.distributions.enrollmentByGrade.map(g => g.count || 0)))
                    const widthPercent = maxCount > 0 ? ((grade.count || 0) / maxCount) * 100 : 0
                    return (
                      <div key={`${grade.grade}-${idx}`} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium min-w-[60px]">{grade.grade || 'Unknown'}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                            {grade.count || 0}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No enrollment data available</p>
                )}
              </div>
            </CardContent>
          </Card> */}
        </div>
      )}

      {/* Top Performing Schools */}
      {overview && overview?.schools?.performance && overview.schools.performance.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-blue-600" />
              School Performance Overview
            </CardTitle>
            <CardDescription>
              Top {overview.schools.performance.slice(0, 5).length} schools by total users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.schools.performance.slice(0, 5).map((school, idx) => (
                <div key={`${school.schoolId}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <School className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base my-2">{school.name || 'Unknown School'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Code: {school.code || 'N/A'}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {school.type || 'Public'}
                        </Badge>
                        {school.isActive && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{school.totalUsers || 0}</p>
                      <p className="text-xs text-muted-foreground">Users</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{school.studentCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{school.teacherCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Teachers</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {overview.schools.summary && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">{overview.schools.summary.totalSchools || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Schools</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{overview.schools.summary.activeSchools || 0}</p>
                    <p className="text-xs text-muted-foreground">Active Schools</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {overview && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Recent System Activity
            </CardTitle>
            <CardDescription>
              Latest {overview?.activity?.recent?.length || 0} actions performed across the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {overview?.activity?.recent && overview.activity.recent.length > 0 ? (
                overview.activity.recent.slice(0, 15).map((activity, idx) => (
                  <div key={`activity-${idx}`} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{activity.title || 'Activity'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{activity.subtitle || 'No description'}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {activity.performBy || 'System'}
                        </Badge>
                        <span>by {activity.actorName || 'Unknown'}</span>
                        <span>•</span>
                        <span>{activity.createdAt ? new Date(activity.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Unknown time'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-700">No Recent Activity</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    System activity will appear here as actions are performed
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <p className="text-2xl font-semibold mb-4 mt-8">
        Quick Actions
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Schools Management */}
        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-l-blue-500"
          onClick={() => router.push('/super-admin/schools')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Manage Schools</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <School className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Add, edit, or configure school settings and information</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-l-green-500"
          onClick={() => router.push('/super-admin/manage/students')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Students Management</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create, edit, and manage students accounts and permissions</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-l-purple-500"
          onClick={() => router.push('/super-admin/manage/teachers')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Teachers Management</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create, edit, and manage teachers accounts and permissions</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-l-orange-500"
          onClick={() => router.push('/super-admin/manage/parents')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Parents Management</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create, edit, and manage parents accounts and permissions</p>
          </CardContent>
        </Card>

        {/* Admins Management */}

        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-l-purple-500"
          onClick={() => router.push('/super-admin/manage/admins')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Admins Management</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create, edit, and manage admins accounts and permissions</p>
          </CardContent>
        </Card>

        {/* <Card
          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-l-purple-500"
          onClick={() => router.push('/super-admin/reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Generate Reports</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create and export detailed system analytics reports</p>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
