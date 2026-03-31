"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  User, Book, Award, Bell, TrendingUp, Calendar, Clock, Mail, 
  AlertCircle, BookOpen, Heart, Users, BarChart3,
  Activity, Target, CheckCircle2, XCircle, AlertTriangle,
  Trophy, FileText, MessageSquare, ArrowUpRight,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStudent } from "../context/StudentContext"
import Link from "next/link"
import axios from "axios"

export default function ParentDashboard() {
  const { students, isLoading, selectedStudent, setSelectedStudent } = useStudent()
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  
  // Data states
  const [studentGrades, setStudentGrades] = useState<any[]>([])
  const [classAttendance, setClassAttendance] = useState<any[]>([])
  const [clubAttendance, setClubAttendance] = useState<any[]>([])
  const [sportsAttendance, setSportsAttendance] = useState<any[]>([])
  const [behaviorRecords, setBehaviorRecords] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [clubEvents, setClubEvents] = useState<any[]>([])
  const [sportsEvents, setSportsEvents] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])

  // Fetch all student data
  const fetchStudentData = async (studentId: string) => {
    if (!studentId) return
    
    setDataLoading(true)
    setDataError(null)
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      const [
        gradesRes,
        classAttRes,
        clubAttRes,
        sportsAttRes,
        behaviorRes,
        announcementsRes,
        clubEventsRes,
        clubsRes
      ] = await Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/student/records?studentId=${studentId}&page=1&limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/student/attendance?studentId=${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/attendance?studentId=${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/sports/student/my-attendance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/behavior?studentId=${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/announcements`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/events?studentId=${studentId}&page=1&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/my-clubs?studentId=${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (gradesRes.status === 'fulfilled') {
        setStudentGrades(gradesRes.value.data?.data || gradesRes.value.data || [])
      }
      if (classAttRes.status === 'fulfilled') {
        const attData = classAttRes.value.data
        setClassAttendance(Array.isArray(attData) ? attData : [])
      }
      if (clubAttRes.status === 'fulfilled') {
        const clubData = clubAttRes.value.data
        const clubs = Array.isArray(clubData) 
          ? clubData 
          : (clubData?.data && Array.isArray(clubData.data) ? clubData.data : [])
        setClubAttendance(clubs)
      }
      if (sportsAttRes.status === 'fulfilled') {
        const sportsData = sportsAttRes.value.data
        if (sportsData?.attendance && Array.isArray(sportsData.attendance)) {
          setSportsAttendance(sportsData.attendance)
        } else if (Array.isArray(sportsData)) {
          setSportsAttendance(sportsData)
        } else {
          setSportsAttendance([])
        }
      }
      if (behaviorRes.status === 'fulfilled') {
        setBehaviorRecords(behaviorRes.value.data || [])
      }
      if (announcementsRes.status === 'fulfilled') {
        setAnnouncements(announcementsRes.value.data || [])
      }
      if (clubEventsRes.status === 'fulfilled') {
        const eventsData = clubEventsRes.value.data
        setClubEvents(eventsData?.events || eventsData || [])
      }
      if (clubsRes.status === 'fulfilled') {
        setClubs(clubsRes.value.data || [])
      }

      // Fetch sports events for student using parent endpoint
      try {
        const sportsEventsRes = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/sports/parent/children-schedule`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const sportsData = sportsEventsRes.data?.data || sportsEventsRes.data || []
        // Filter for selected student and upcoming events
        const studentSportsEvents = Array.isArray(sportsData) 
          ? sportsData
              .filter((event: any) => {
                // Filter by student ID - check if event has students array or direct studentId
                if (event.students && Array.isArray(event.students)) {
                  const hasStudent = event.students.some((s: any) => 
                    (s.studentId?._id || s.studentId || s._id)?.toString() === studentId
                  )
                  if (!hasStudent) return false
                } else {
                  const eventStudentId = event.studentId?._id || event.studentId || event.student?._id
                  if (eventStudentId && eventStudentId.toString() !== studentId) {
                    return false
                  }
                }
                // Filter upcoming events
                const eventDate = new Date(event.startDate || event.date || event.scheduleDate)
                return eventDate >= new Date()
              })
              .sort((a: any, b: any) => {
                const dateA = new Date(a.startDate || a.date || a.scheduleDate)
                const dateB = new Date(b.startDate || b.date || b.scheduleDate)
                return dateA.getTime() - dateB.getTime()
              })
          : []
        setSportsEvents(studentSportsEvents)
      } catch (error) {
        console.error('Error fetching sports events:', error)
        setSportsEvents([])
      }
      
    } catch (error: any) {
      console.error('Error fetching student data:', error)
      setDataError(error.message || 'Failed to load student data')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (selectedStudent?._id) {
      fetchStudentData(selectedStudent._id)
    }
  }, [selectedStudent])

  // Calculate statistics
  const calculateStats = () => {
    const totalGrades = studentGrades.length
    const avgGrade = studentGrades.length > 0
      ? studentGrades.reduce((sum: number, g: any) => {
          const grade = g.percentage || g.gradeValue || g.totalMarks || 0
          return sum + (typeof grade === 'number' ? grade : 0)
        }, 0) / studentGrades.length
      : 0
    
    const classAttendanceRate = classAttendance.length > 0
      ? classAttendance.reduce((sum: number, a: any) => sum + (a.attendancePercentage || 0), 0) / classAttendance.length
      : 0
    
    const activeClubs = clubs.filter((c: any) => 
      c.status === 'active' || c.status === 'approved'
    ).length
    
    const behaviorScore = behaviorRecords.length > 0
      ? Math.max(0, 100 - (behaviorRecords.filter((b: any) => b.type === 'negative' || b.behaviorType === 'negative').length * 5))
      : 100

    const totalDataSize = totalGrades + classAttendance.length + clubAttendance.length + sportsAttendance.length + behaviorRecords.length

    return {
      totalGrades,
      avgGrade: avgGrade.toFixed(1),
      classAttendanceRate: classAttendanceRate.toFixed(1),
      activeClubs,
      behaviorScore,
      totalDataSize
    }
  }

  const stats = calculateStats()

  // Prepare attendance chart data for class, club, and sports
  const prepareAttendanceChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    
    // Class attendance data
    const classData = classAttendance.length > 0
      ? classAttendance.slice(0, 6).map((item: any, index: number) => ({
          month: months[index] || `Month ${index + 1}`,
          class: item.attendancePercentage || 0
        }))
      : months.map((month, index) => ({
          month,
          class: 0
        }))
    
    // Club attendance data
    const clubData = clubAttendance.length > 0
      ? clubAttendance.slice(0, 6).map((club: any, index: number) => {
          const totalMeetings = club.totalMeetings || club.attendance?.length || 0
          const presentMeetings = club.presentMeetings || 
            (club.attendance?.filter((a: any) => a?.status?.toLowerCase() === 'present').length || 0)
          const rate = totalMeetings > 0 ? (presentMeetings / totalMeetings) * 100 : 0
          return {
            month: months[index] || `Month ${index + 1}`,
            club: rate
          }
        })
      : months.map((month) => ({ month, club: 0 }))
    
    // Sports attendance data
    const sportsData = sportsAttendance.length > 0
      ? sportsAttendance.slice(0, 6).map((sport: any, index: number) => ({
          month: months[index] || `Month ${index + 1}`,
          sports: 85 // Default or calculate from sports data
        }))
      : months.map((month) => ({ month, sports: 0 }))
    
    // Combine data
    return months.map((month, index) => ({
      month,
      class: classData[index]?.class || 0,
      club: clubData[index]?.club || 0,
      sports: sportsData[index]?.sports || 0
    }))
  }

  const attendanceChartData = prepareAttendanceChartData()

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">Please select a student to view their dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Parent Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Welcome back! Here's an overview of {selectedStudent.firstName}'s progress
              </p>
            </div>
            {students.length > 1 && (
              <Select
                value={selectedStudent._id}
                onValueChange={(value) => {
                  const student = students.find(s => s._id === value)
                  if (student) setSelectedStudent(student)
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px] bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </motion.div>

        {dataError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        )}

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Class Attendance</p>
                    <p className="text-3xl font-bold">{stats.classAttendanceRate}%</p>
                    <p className="text-green-100 text-xs mt-1 flex items-center">
                      {parseFloat(stats.classAttendanceRate) >= 95 ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Excellent</>
                      ) : parseFloat(stats.classAttendanceRate) >= 90 ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Good</>
                      ) : (
                        <><AlertTriangle className="h-3 w-3 mr-1" /> Needs Improvement</>
                      )}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-full p-3">
                    <Calendar className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Active Clubs</p>
                    <p className="text-3xl font-bold">{stats.activeClubs}</p>
                    <p className="text-purple-100 text-xs mt-1">Memberships</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-3">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Grades</p>
                    <p className="text-3xl font-bold">{stats.totalGrades}</p>
                    <p className="text-blue-100 text-xs mt-1">Records</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-3">
                    <BookOpen className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Attendance Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Attendance Trend
              </CardTitle>
              <CardDescription>Class, Club, and Sports attendance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="class" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Class"
                    dot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="club" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="Club"
                    dot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sports" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    name="Sports"
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Grades and Quick Stats */}
        <div className="gap-6 mb-8">
          {/* Recent Grades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    Recent Grades
                  </CardTitle>
                  <CardDescription>Latest 5 grade records</CardDescription>
                </div>
                <Link href="/parent/grades">
                  <Button variant="ghost" size="sm">
                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {studentGrades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Exam/Marking Type</TableHead>
                          <TableHead>Total Marks</TableHead>
                          <TableHead>Marks Obtained</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentGrades.map((grade: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {grade.courseName || grade.course?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {grade.markingType || grade.examType || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {grade.totalMarks || grade.total || grade.maxMarks || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {grade.marksObtained || grade.obtainedMarks || grade.score || grade.marks || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No grade records available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Events Row - Separated */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-indigo-600" />
                    Sports Events
                  </CardTitle>
                  <CardDescription>Upcoming sports events and schedules</CardDescription>
                </div>
                <Link href="/parent/sports">
                  <Button variant="ghost" size="sm">
                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {sportsEvents.length > 0 ? (
                  <div className="space-y-3">
                    {sportsEvents.slice(0, 5).map((event: any, index: number) => {
                      const eventDate = new Date(event.startDate || event.date || event.scheduleDate)
                      const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-2">
                            <Trophy className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {event.title || event.name || event.eventType || 'Sports Event'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {eventDate.toLocaleDateString()} 
                              {event.startTime && ` • ${event.startTime}`}
                              {daysUntil > 0 ? ` • In ${daysUntil} days` : daysUntil === 0 ? ' • Today' : ' • Past'}
                            </p>
                            {event.sportsProgramId && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {event.sportsProgramId?.name || event.sportsProgram || 'Sports Program'}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No sports events scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Club Events
                  </CardTitle>
                  <CardDescription>Upcoming club events</CardDescription>
                </div>
                <Link href="/parent/clubs-activities">
                  <Button variant="ghost" size="sm">
                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {clubEvents.length > 0 ? (
                  <div className="space-y-3">
                    {clubEvents.slice(0, 5).map((event: any, index: number) => {
                      const eventDate = new Date(event.startDate || event.date)
                      const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {event.name || event.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {eventDate.toLocaleDateString()} • {daysUntil > 0 ? `In ${daysUntil} days` : daysUntil === 0 ? 'Today' : 'Past'}
                            </p>
                            {event.clubId && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {event.clubId.name || 'Club Event'}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No club events</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div> */}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">Quick Access</h3>
                  <p className="text-indigo-100 text-sm">Navigate to important sections quickly</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/parent/grades">
                    <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Grades
                    </Button>
                  </Link>
                  <Link href="/parent/attendance">
                    <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                      <Calendar className="h-4 w-4 mr-2" />
                      Attendance
                    </Button>
                  </Link>
                  <Link href="/parent/schedule">
                    <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </Link>
                  <Link href="/parent/clubs-activities">
                    <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                      <Users className="h-4 w-4 mr-2" />
                      Clubs
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
