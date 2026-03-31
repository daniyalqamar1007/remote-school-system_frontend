"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  ArrowLeft,
  Clock,
  Calendar,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getLocalStorageValue } from "@/lib/utils"
import { toast } from "sonner"
import axios from "axios"

interface Course {
  _id: string
  courseName: string
  courseCode: string
  className: string
  section: string
  timeSlots: Array<{
    day: string
    startTime: string
    endTime: string
  }>
  assignmentId?: string
}

export default function TeacherCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const teacherId = getLocalStorageValue("id")

  useEffect(() => {
    fetchCourses()
  }, [teacherId])

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')

      const statsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/teachers/dashboard/stats/${teacherId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (statsResponse.data.success) {
        const assignedCourses = statsResponse.data.data.assignedCourses || []
        setCourses(assignedCourses)
      }
    } catch (err) {
      console.error("Error fetching courses:", err)
      toast.error("Failed to load courses")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string) => {
    // Convert 24-hour format to 12-hour format if needed
    if (!time) return time
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      'Monday': 'bg-blue-100 text-blue-800 border-blue-300',
      'Tuesday': 'bg-green-100 text-green-800 border-green-300',
      'Wednesday': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Thursday': 'bg-purple-100 text-purple-800 border-purple-300',
      'Friday': 'bg-pink-100 text-pink-800 border-pink-300',
      'Saturday': 'bg-orange-100 text-orange-800 border-orange-300',
    }
    return colors[day] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/teacher/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              View all your assigned courses and schedules
            </p>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Courses Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any courses assigned yet. Contact your administrator to get assigned to courses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Card
              key={course._id || index}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{course.courseName}</CardTitle>
                    <CardDescription className="text-base font-medium">
                      {course.courseCode}
                    </CardDescription>
                  </div>
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Class and Section */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {course.className}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Section {course.section}
                  </Badge>
                </div>

                {/* Schedule */}
                {course.timeSlots && course.timeSlots.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Schedule</span>
                    </div>
                    <div className="space-y-2">
                      {course.timeSlots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className={`flex items-center justify-between p-2 rounded-lg border ${getDayColor(slot.day)}`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium text-sm">{slot.day}</span>
                          </div>
                          <span className="text-sm font-semibold">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No schedule information available
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {courses.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Schedule Slots</p>
                  <p className="text-2xl font-bold">
                    {courses.reduce((total, course) => total + (course.timeSlots?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

