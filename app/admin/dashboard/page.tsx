"use client"

import { 
  Calendar, 
  GraduationCap, 
  LineChart, 
  Users, 
  RefreshCw, 
  Building2, 
  BookOpen, 
  UserPlus, 
  Activity, 
  Heart,
  TrendingUp,
  School,
  MapPin,
  Code,
  UserCheck,
  Clock,
  Stethoscope
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LoadingSpinner from "@/components/LoadingSpinner"

interface Overview {
  totalActiveStudents: number
  totalMaleStudents: number
  totalFemaleStudents: number
  totalActiveTeachers: number
  totalActiveParents: number
  totalActiveNurses: number
  totalActiveCourses: number
  totalActiveDepartments: number
}

interface UserDistribution {
  role: string
  count: number
}

interface SchoolInfo {
  _id: string
  name: string
  code: string
  type: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

interface Department {
  _id: string
  name: string
  code: string
}

interface Course {
  _id: string
  courseName: string
  courseCode: string
}

interface Student {
  _id: string
  email: string
  firstName: string
  lastName: string
  studentId: string
  class: string
  createdAt: string
}

interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
}

interface ActivityItem {
  _id: string
  title: string
  subtitle: string
  performBy: string
  createdAt: string
}

interface DashboardData {
  overview: Overview
  distributions: {
    usersByRole: UserDistribution[]
  }
  school: SchoolInfo
  recentDepartments: Department[]
  recentCourses: Course[]
  recentStudents: Student[]
  recentUsers: User[]
  recentActivities: ActivityItem[]
  generatedAt: string
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setDashboardData(result.data)
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGenderPercentage = (count: number, total: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0'
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'STUDENT': 'bg-blue-100 text-blue-800',
      'TEACHER': 'bg-green-100 text-green-800',
      'PARENT': 'bg-purple-100 text-purple-800',
      'ADMIN': 'bg-orange-100 text-orange-800',
      'NURSE': 'bg-pink-100 text-pink-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-gray-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Admin Dashboard</h2>
            <p className="text-base text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  const overview = dashboardData?.overview
  const school = dashboardData?.school

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            {school ? (
              <div className="space-y-1">
                <p className="text-lg sm:text-xl font-semibold text-gray-800">
                  {school.name}
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  {school.code} • {school.type} School
                </p>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-600">
                Comprehensive overview of your institution
              </p>
            )}
          </div>
          {/* <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh</span>
          </button> */}
        </div>

        {/* School Info Card */}
        {school && (
          <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-6 w-6 text-blue-600" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-3">
                  <School className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">School Name</p>
                    <p className="text-base font-semibold text-gray-900">{school.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">School Code</p>
                    <p className="text-base font-semibold text-gray-900">{school.code}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="text-base font-semibold text-gray-900">
                      {school.address.city}, {school.address.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                    <Badge className="mt-1 bg-blue-100 text-blue-800">{school.type}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Stats Grid */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-t-blue-500 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Students</CardTitle>
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{overview.totalActiveStudents}</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-blue-600 font-medium">
                    {overview.totalMaleStudents}M
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-pink-600 font-medium">
                    {overview.totalFemaleStudents}F
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="flex h-full">
                    <div 
                      className="bg-blue-500"
                      style={{ width: `${getGenderPercentage(overview.totalMaleStudents, overview.totalActiveStudents)}%` }}
                    />
                    <div 
                      className="bg-pink-500"
                      style={{ width: `${getGenderPercentage(overview.totalFemaleStudents, overview.totalActiveStudents)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-t-green-500 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Teachers</CardTitle>
                <UserCheck className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{overview.totalActiveTeachers}</div>
                <p className="text-xs text-gray-500 mt-2">Faculty members</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-t-purple-500 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Parents</CardTitle>
                <UserPlus className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{overview.totalActiveParents}</div>
                <p className="text-xs text-gray-500 mt-2">Registered parents</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-t-orange-500 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Courses</CardTitle>
                <BookOpen className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{overview.totalActiveCourses}</div>
                <p className="text-xs text-gray-500 mt-2">{overview.totalActiveDepartments} departments</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Stats */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-pink-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Nurses</CardTitle>
                {/* medical staff icon */}
                <Stethoscope className="h-5 w-5 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{overview.totalActiveNurses}</div>
                <p className="text-xs text-gray-500 mt-2">Healthcare staff</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Departments</CardTitle>
                <Building2 className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{overview.totalActiveDepartments}</div>
                <p className="text-xs text-gray-500 mt-2">Academic departments</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users by Role Distribution */}
        {dashboardData?.distributions?.usersByRole && dashboardData.distributions.usersByRole.length > 0 && (
          <Card className="shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6 text-blue-600" />
                Users by Role
              </CardTitle>
              <CardDescription>Distribution of users across different roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.distributions.usersByRole.map((roleData, idx) => (
                  <div key={idx} className="p-4 rounded-lg border-2 border-gray-100 hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getRoleColor(roleData.role)}>{roleData.role}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{roleData.count}</div>
                    <p className="text-xs text-gray-500 mt-1">Total users</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Departments */}
          {dashboardData?.recentDepartments && dashboardData.recentDepartments.length > 0 && (
            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Recent Departments
                </CardTitle>
                <CardDescription>Latest added departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentDepartments.map((dept) => (
                    <div key={dept._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{dept.name}</p>
                        <p className="text-xs text-gray-500">Code: {dept.code}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Department</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Courses */}
          {dashboardData?.recentCourses && dashboardData.recentCourses.length > 0 && (
            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Recent Courses
                </CardTitle>
                <CardDescription>Latest added courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentCourses.map((course) => (
                    <div key={course._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{course.courseName}</p>
                        <p className="text-xs text-gray-500">Code: {course.courseCode}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Course</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Students */}
          {dashboardData?.recentStudents && dashboardData.recentStudents.length > 0 && (
            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  Recent Students
                </CardTitle>
                <CardDescription>Recently enrolled students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentStudents.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">{student.studentId}</p>
                          <span className="text-gray-300">•</span>
                          <p className="text-xs text-gray-500">{student.class}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDateTime(student.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Users */}
          {dashboardData?.recentUsers && dashboardData.recentUsers.length > 0 && (
            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Recent Users
                </CardTitle>
                <CardDescription>Recently added users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        <span className="text-xs text-gray-400">{formatDateTime(user.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activities */}
        {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 && (
          <Card className="shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-6 w-6 text-indigo-600" />
                Recent Activities
              </CardTitle>
              <CardDescription>Latest system activities and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {dashboardData.recentActivities.map((activity, idx) => (
                  <div key={activity._id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.subtitle}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.performBy}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Static Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/manage-students">
            <Card className="cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105 border-t-4 border-t-blue-500">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Manage Students</h3>
                <p className="text-xs text-gray-600 mt-2">Add, edit, or view students</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/manage-teachers">
            <Card className="cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105 border-t-4 border-t-green-500">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Manage Teachers</h3>
                <p className="text-xs text-gray-600 mt-2">Add, edit, or view teachers</p>
              </CardContent>
            </Card>
          </Link>
          
          {/* <Link href="/admin/generate-report">
            <Card className="cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105 border-t-4 border-t-purple-500">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <LineChart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Generate Reports</h3>
                <p className="text-xs text-gray-600 mt-2">Create detailed reports</p>
              </CardContent>
            </Card>
          </Link> */}
        </div>

        {/* Footer with timestamp */}
        {dashboardData?.generatedAt && (
          <div className="flex justify-center">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: {formatDateTime(dashboardData.generatedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
