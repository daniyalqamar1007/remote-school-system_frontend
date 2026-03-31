"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, User, BookOpen, Loader2, AlertCircle, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useStudent } from "../context/StudentContext"
import axios from "axios"

interface ScheduleItem {
  courseName: string
  teacherName: string
  day: string
  startTime: string
  endTime: string
  roomNumber?: string
  note?: string
}

interface DaySchedule {
  day: string
  dayShort: string
  date: Date
  classes: ScheduleItem[]
  isToday: boolean
}

const WEEK_DAYS = [
  { full: "Monday", short: "Mon" },
  { full: "Tuesday", short: "Tue" },
  { full: "Wednesday", short: "Wed" },
  { full: "Thursday", short: "Thu" },
  { full: "Friday", short: "Fri" },
  { full: "Saturday", short: "Sat" },
  { full: "Sunday", short: "Sun" },
]

const getDayColor = (day: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    Monday: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
    Tuesday: { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
    Wednesday: { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
    Thursday: { bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800" },
    Friday: { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
    Saturday: { bg: "bg-indigo-50 dark:bg-indigo-950/20", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
    Sunday: { bg: "bg-pink-50 dark:bg-pink-950/20", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800" },
  }
  return colors[day] || { bg: "bg-gray-50 dark:bg-gray-900/20", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800" }
}

export default function ParentSchedulePage() {
  const { selectedStudent, isLoading: isStudentLoading } = useStudent()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentInfo, setStudentInfo] = useState<{ class: string; section: string } | null>(null)

  useEffect(() => {
    if (selectedStudent) {
      fetchSchedule()
    } else {
      setLoading(false)
    }
  }, [selectedStudent])

  const fetchSchedule = async () => {
    if (!selectedStudent) {
      setError("Please select a student to view their schedule.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const studentId = selectedStudent._id
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Fetch student info first to get class and section
      try {
        const studentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/${studentId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const studentData = studentResponse.data?.data || studentResponse.data
        setStudentInfo({
          class: studentData?.class || studentData?.gradeLevel || selectedStudent.class || 'N/A',
          section: studentData?.section || selectedStudent.section || 'A',
        })
      } catch (err) {
        console.error('Error fetching student info:', err)
        // Use fallback from selectedStudent
        setStudentInfo({
          class: selectedStudent.class || 'N/A',
          section: selectedStudent.section || 'A',
        })
      }

      // Fetch weekly schedule - try the week endpoint first, fallback to full schedule
      let scheduleData = []
      
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/schedule/for-student/${studentId}/week`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const rawData = response.data?.data || response.data || []
        console.log('📅 Week endpoint response:', JSON.stringify(rawData, null, 2))
        
        scheduleData = rawData.map((item: any) => {
          // Extract room number from various possible locations in week endpoint response
          // Check multiple nested locations where room number might be stored
          const roomNumber = item.roomNumber || item.room_number || item.room ||
                            item.grade?.roomNumber || item.grade?.room_number || item.grade?.room ||
                            item.grades?.[0]?.roomNumber || item.grades?.[0]?.room_number || item.grades?.[0]?.room ||
                            item.courseAssignment?.grades?.[0]?.roomNumber || 
                            item.courseAssignment?.grades?.[0]?.room_number ||
                            item.courseAssignment?.grades?.[0]?.room ||
                            item.assignment?.grades?.[0]?.roomNumber ||
                            item.assignment?.grades?.[0]?.room_number ||
                            item.assignment?.grades?.[0]?.room || ''
          
          console.log('🔍 Extracting room number for item:', {
            courseName: item.courseName || item.course?.courseName,
            itemKeys: Object.keys(item),
            roomNumberFound: roomNumber,
            grade: item.grade,
            grades: item.grades,
            courseAssignment: item.courseAssignment,
            assignment: item.assignment
          })
          
          return {
            ...item,
            roomNumber: roomNumber ? String(roomNumber).trim() : undefined,
          }
        })
        
        console.log('✅ Processed schedule data with room numbers:', JSON.stringify(scheduleData, null, 2))
      } catch (weekError: any) {
        // If week endpoint fails, try the full schedule endpoint and transform it
        console.log('Week endpoint failed, trying full schedule endpoint:', weekError.message)
        try {
          const fullResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/schedule/student-full-schedule?studentId=${studentId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
          const fullSchedule = fullResponse.data?.data || fullResponse.data || []
          console.log('📅 Full schedule endpoint response:', JSON.stringify(fullSchedule, null, 2))
          
          // Get student's grade and section to match with course assignment grades
          const studentGrade = studentInfo?.class || selectedStudent?.class || ''
          const studentSection = studentInfo?.section || selectedStudent?.section || ''
          
          // Transform full schedule to week schedule format
          scheduleData = []
          for (const sched of fullSchedule) {
            const courseName = sched.courseId?.courseName || sched.course?.courseName || 'N/A'
            const teacher = sched.teacherId
            const teacherName = teacher && teacher.firstName
              ? `${teacher.firstName} ${teacher.lastName}`
              : 'N/A'
            
            // Extract room number from course assignment grades
            // Match student's grade/section with assignment grades
            let roomNumber = ''
            if (sched.grades && Array.isArray(sched.grades)) {
              // Try to find matching grade/section
              const matchingGrade = sched.grades.find((g: any) => 
                String(g.level) === String(studentGrade) && 
                String(g.section) === String(studentSection)
              )
              if (matchingGrade) {
                roomNumber = matchingGrade.roomNumber || matchingGrade.room_number || matchingGrade.room || ''
              } else if (sched.grades.length > 0) {
                // Fallback to first grade if no match
                roomNumber = sched.grades[0].roomNumber || sched.grades[0].room_number || sched.grades[0].room || ''
              }
            }
            
            // Also check other possible locations
            if (!roomNumber) {
              roomNumber = sched.roomNumber || sched.room_number || sched.room || 
                          sched.grade?.roomNumber || sched.grade?.room_number || sched.grade?.room || ''
            }
            
            console.log('🔍 Processing schedule item:', {
              courseName,
              studentGrade,
              studentSection,
              grades: sched.grades,
              roomNumberFound: roomNumber,
              schedKeys: Object.keys(sched)
            })
            
            if (sched.dayOfWeek && Array.isArray(sched.dayOfWeek)) {
              for (const day of sched.dayOfWeek) {
                // Also check day-level room number
                const dayRoomNumber = day.roomNumber || day.room_number || day.room || roomNumber
                
                scheduleData.push({
                  courseName,
                  teacherName,
                  day: day.date,
                  startTime: day.startTime,
                  endTime: day.endTime,
                  roomNumber: dayRoomNumber ? String(dayRoomNumber).trim() : undefined,
                  note: sched.note,
                })
              }
            }
          }
          
          console.log('✅ Processed full schedule data with room numbers:', JSON.stringify(scheduleData, null, 2))
        } catch (fullError: any) {
          throw fullError // Re-throw if both fail
        }
      }

      setSchedule(Array.isArray(scheduleData) ? scheduleData : [])
    } catch (err: any) {
      console.error("Error fetching schedule:", err)
      if (err.response?.status === 404) {
        setError("Schedule not found. Please contact your administrator.")
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.")
      } else if (err.message) {
        setError(err.message)
      } else {
        setError("An error occurred while loading the schedule. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Organize schedule by days of the week
  const organizeScheduleByDays = (): DaySchedule[] => {
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysUntilMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
    const mondayDate = new Date(today)
    mondayDate.setDate(today.getDate() - daysUntilMonday)

    return WEEK_DAYS.map((dayInfo, index) => {
      const dayDate = new Date(mondayDate)
      dayDate.setDate(mondayDate.getDate() + index)
      
      const isToday = dayDate.toDateString() === today.toDateString()
      const dayClasses = schedule.filter((item) => item.day === dayInfo.full)

      return {
        day: dayInfo.full,
        dayShort: dayInfo.short,
        date: dayDate,
        classes: dayClasses.sort((a, b) => {
          // Sort by start time
          const timeA = convertTo24Hour(a.startTime)
          const timeB = convertTo24Hour(b.startTime)
          return timeA - timeB
        }),
        isToday,
      }
    })
  }

  // Convert time string (e.g., "10:00 AM") to minutes for sorting
  const convertTo24Hour = (timeStr: string): number => {
    const [time, modifier] = timeStr.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    let totalMinutes = hours * 60 + minutes
    if (modifier === 'PM' && hours !== 12) totalMinutes += 12 * 60
    if (modifier === 'AM' && hours === 12) totalMinutes -= 12 * 60
    return totalMinutes
  }

  const daySchedules = organizeScheduleByDays()

  if (isStudentLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-500" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading schedule...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please select a student to view their schedule.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchSchedule} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                Class Schedule
              </h1>
              {selectedStudent && (
                <p className="text-gray-600 dark:text-gray-400">
                  Viewing schedule for <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                  {studentInfo && (
                    <> • Grade {studentInfo.class} - Section {studentInfo.section}</>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Week of {daySchedules[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Weekly Schedule - One Day Per Row */}
        <div className="space-y-4 sm:space-y-6">
          {daySchedules.map((daySchedule, index) => {
            const colors = getDayColor(daySchedule.day)
            const hasClasses = daySchedule.classes.length > 0

            return (
              <motion.div
                key={daySchedule.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`w-full ${colors.bg} ${colors.border} border-2 ${
                    daySchedule.isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                  } transition-all hover:shadow-lg`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${colors.bg} ${colors.border} border-2 flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xl font-bold ${colors.text}`}>
                            {daySchedule.dayShort}
                          </span>
                        </div>
                        <div>
                          <CardTitle className={`text-xl sm:text-2xl font-bold ${colors.text}`}>
                            {daySchedule.day}
                          </CardTitle>
                          <p className={`text-sm ${colors.text} opacity-70 mt-1`}>
                            {daySchedule.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {daySchedule.isToday && (
                        <Badge variant="default" className="bg-indigo-500 text-white text-sm px-3 py-1">
                          Today
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasClasses ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daySchedule.classes.map((classItem, classIndex) => (
                          <motion.div
                            key={classIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + classIndex * 0.05 }}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
                                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-2">
                                    {classItem.courseName}
                                  </h3>
                                </div>
                              </div>

                              <div className="space-y-2 pl-11">
                                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                  <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                  <span className="font-medium">
                                    {classItem.startTime} - {classItem.endTime}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                  <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                  <span className="truncate">{classItem.teacherName}</span>
                                </div>

                                {classItem.roomNumber && (
                                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                    <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                    <span className="font-medium">Room: {classItem.roomNumber}</span>
                                  </div>
                                )}

                                {classItem.note && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    {classItem.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-8 sm:p-12 text-center border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className={`text-base sm:text-lg font-medium ${colors.text} opacity-60`}>
                            No classes scheduled - Day Off
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Summary Card */}
        {schedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 sm:mt-8"
          >
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Schedule Summary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {schedule.length} class{schedule.length !== 1 ? 'es' : ''} scheduled this week
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((dayInfo) => {
                      const dayCount = schedule.filter((item) => item.day === dayInfo.full).length
                      if (dayCount === 0) return null
                      return (
                        <Badge key={dayInfo.full} variant="secondary" className="text-xs">
                          {dayInfo.short}: {dayCount}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
