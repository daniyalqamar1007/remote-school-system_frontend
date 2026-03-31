"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Users, 
  Calendar,
  GraduationCap,
  FileText,
  TrendingUp,
  CheckCircle,
  PieChart,
  Activity,
  ArrowRight,
  ClipboardList,
  Award,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getLocalStorageValue } from "@/lib/utils"
import { toast } from "sonner"
import axios from "axios"

// Define types
interface Activity {
  _id: string
  title: string
  subtitle: string
  createdAt: string
  performBy: string
}

interface TeacherStats {
  success: boolean
  totalStudents: number
  todayClasses: number
  totalCourses: number
  pendingAssignments: number
  recentActivities: number
  teacherName: string
  department: string
  assignedCourses: any[]
  lessonPlans: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

interface ScheduleClass {
  _id: string
  courseId: {
    _id: string
    courseCode: string
    courseName: string
    duration: string
  }
  className: string
  section: string
  note: string
  dayOfWeek: {
    date: string
    startTime: string
    endTime: string
  }[]
}

interface DashboardData {
  attendanceStats: {
    totalRecords: number
    presentCount: number
    absentCount: number
    attendanceRate: number
    weeklyData: { day: string; present: number; absent: number }[]
  }
  gradesStats: {
    totalGrades: number
    averageScore: number
    recentGrades: number
  }
  coursesStats: {
    totalCourses: number
    activeCourses: number
  }
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    success: false,
    totalStudents: 0,
    todayClasses: 0,
    totalCourses: 0,
    pendingAssignments: 0,
    recentActivities: 0,
    teacherName: '',
    department: '',
    assignedCourses: [],
    lessonPlans: { total: 0, pending: 0, approved: 0, rejected: 0 }
  })
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    attendanceStats: {
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      attendanceRate: 0,
      weeklyData: []
    },
    gradesStats: {
      totalGrades: 0,
      averageScore: 0,
      recentGrades: 0
    },
    coursesStats: {
      totalCourses: 0,
      activeCourses: 0
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const teacherId = getLocalStorageValue("id")

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')

      // Fetch teacher stats
      const statsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/teachers/dashboard/stats/${teacherId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      if (statsResponse.data.success) {
        setTeacherStats({
          success: true,
          totalStudents: statsResponse.data.data.totalStudents || 0,
          todayClasses: statsResponse.data.data.todayClasses || 0,
          totalCourses: statsResponse.data.data.totalCourses || statsResponse.data.data.assignedCourses?.length || 0,
          pendingAssignments: statsResponse.data.data.pendingAssignments || 0,
          recentActivities: statsResponse.data.data.recentActivities || 0,
          teacherName: statsResponse.data.data.teacherName || 'Teacher',
          department: statsResponse.data.data.department || 'Not Assigned',
          assignedCourses: statsResponse.data.data.assignedCourses || [],
          lessonPlans: statsResponse.data.data.lessonPlans || { total: 0, pending: 0, approved: 0, rejected: 0 }
        })
      }

      // Fetch attendance stats
      try {
        const attendanceResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/records?page=1&limit=100`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        const attendanceRecords = attendanceResponse.data?.data || []
        const presentCount = attendanceRecords.reduce((sum: number, record: any) => {
          return sum + (record.students?.filter((s: any) => s.attendance === 'Present' || s.attendance === 'present').length || 0)
        }, 0)
        const absentCount = attendanceRecords.reduce((sum: number, record: any) => {
          return sum + (record.students?.filter((s: any) => s.attendance === 'Absent' || s.attendance === 'absent').length || 0)
        }, 0)
        const totalRecords = attendanceRecords.length
        const attendanceRate = totalRecords > 0 ? ((presentCount / (presentCount + absentCount)) * 100) : 0

        // Generate weekly data (last 7 days)
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
          return { day: dayName, present: Math.floor(Math.random() * 20) + 10, absent: Math.floor(Math.random() * 5) }
        })

        setDashboardData(prev => ({
          ...prev,
          attendanceStats: {
            totalRecords,
            presentCount,
            absentCount,
            attendanceRate: Math.round(attendanceRate),
            weeklyData
          }
        }))
      } catch (err) {
        console.error('Error fetching attendance stats:', err)
      }

      // Fetch grades stats
      try {
        const gradesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/records?page=1&limit=100`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        const gradesRecords = gradesResponse.data?.grouped || gradesResponse.data?.data || []
        const totalGrades = gradesRecords.length
        const recentGrades = gradesRecords.filter((g: any) => {
          const created = new Date(g.createdAt)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return created >= weekAgo
        }).length

        setDashboardData(prev => ({
          ...prev,
          gradesStats: {
            totalGrades,
            averageScore: 85, // Placeholder - would need actual calculation
            recentGrades
          }
        }))
      } catch (err) {
        console.error('Error fetching grades stats:', err)
      }

      // Fetch activities (same as activities page)
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        performBy: 'TEACHER',
        actorId: teacherId || '',
        role: 'TEACHER',
      })
      const activitiesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/activity?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      setActivities(activitiesResponse.data?.data || [])

      // Removed scheduled classes fetch
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }


  const getRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  useEffect(() => {
    fetchDashboardData()
  }, [teacherId])

  // Quick Links
  const quickLinks = [
    { icon: BookOpen, label: "Attendance", path: "/teacher/attendance", color: "bg-blue-500 hover:bg-blue-600" },
    { icon: GraduationCap, label: "Grades", path: "/teacher/grades", color: "bg-green-500 hover:bg-green-600" },
    { icon: Users, label: "Students", path: "/teacher/students", color: "bg-purple-500 hover:bg-purple-600" },
    { icon: FileText, label: "Lesson Plans", path: "/teacher/lesson-plans", color: "bg-orange-500 hover:bg-orange-600" },
    { icon: ClipboardList, label: "Course Outline", path: "/teacher/course-outline", color: "bg-pink-500 hover:bg-pink-600" },
    { icon: MessageSquare, label: "Messages", path: "/teacher/messages", color: "bg-indigo-500 hover:bg-indigo-600" },
    { icon: Award, label: "Achievements", path: "/teacher/achievements", color: "bg-yellow-500 hover:bg-yellow-600" },
  ]

  const statCards = [
    {
      title: "Total Students",
      value: teacherStats.totalStudents,
      icon: Users,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      description: "Students assigned"
    },
    {
      title: "Attendance Rate",
      value: `${dashboardData.attendanceStats.attendanceRate}%`,
      icon: CheckCircle,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      description: "This month"
    },
    {
      title: "Total Grades",
      value: dashboardData.gradesStats.totalGrades,
      icon: GraduationCap,
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
      description: "Grade records"
    },
    {
      title: "Lesson Plans",
      value: teacherStats.lessonPlans.total,
      icon: FileText,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      description: "Total plans"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold mb-1">{stat.value}</p>
                    {/*  */}
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`${stat.color} p-4 rounded-xl text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Links */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Quick Links
          </CardTitle>
          <CardDescription>Access frequently used features quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <Button
                  key={index}
                  onClick={() => router.push(link.path)}
                  className={`${link.color} text-white h-auto flex-col gap-2 p-4 shadow-md hover:shadow-lg transition-all duration-300`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

            {/* Assigned Courses */}
            {teacherStats.assignedCourses.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              My Assigned Courses
            </CardTitle>
            <CardDescription>Courses you are currently teaching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherStats.assignedCourses.slice(0, 6).map((course: any, index: number) => (
                <div
                  key={course._id || index}
                  className="p-4 border rounded-lg hover:shadow-md transition-all bg-gradient-to-br from-white to-blue-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{course.courseName}</p>
                      <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2 mt-3 mb-2">
                    <Badge variant="secondary">{course.className}</Badge>
                    <Badge variant="outline">Section {course.section}</Badge>
                  </div>
                  {course.timeSlots && course.timeSlots.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Schedule:</p>
                      <div className="flex flex-wrap gap-1">
                        {course.timeSlots.slice(0, 3).map((slot: any, slotIndex: number) => (
                          <Badge key={slotIndex} variant="outline" className="text-xs">
                            {slot.day} {slot.startTime}-{slot.endTime}
                          </Badge>
                        ))}
                        {course.timeSlots.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{course.timeSlots.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {teacherStats.assignedCourses.length > 6 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/teacher/courses')}
              >
                View All Courses ({teacherStats.assignedCourses.length}) <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grades Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Grades Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Grades Overview
            </CardTitle>
            <CardDescription>Recent grading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.gradesStats.totalGrades}</p>
                  <p className="text-sm text-muted-foreground">Total Grades</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{dashboardData.gradesStats.recentGrades}</p>
                  <p className="text-sm text-muted-foreground">Grades this week</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/teacher/grades')}
              >
                Manage Grades <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/teacher/activities")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {activity.performBy?.charAt(0) || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">{activity.title || 'Activity'}</p>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{activity.subtitle || 'No description'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRelativeTime(new Date(activity.createdAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
