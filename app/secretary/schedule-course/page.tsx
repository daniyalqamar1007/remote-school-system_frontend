

"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Trash2, Calendar, Clock, Edit } from "lucide-react"
import axios from "axios"
import { toast } from 'sonner'
import { activities } from "@/lib/activities"
import { addActivity } from "@/lib/actitivityFunctions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter, useSearchParams } from "next/navigation"
import { ScheduleModal, DeleteConfirmationModal } from "./scheduleModals"

interface Course {
  _id: string
  courseName: string
  courseCode: string
  departmentId?: {
    departmentName: string
  }
}

interface Teacher {
  _id: string
  firstName: string
  lastName: string
  department: string
  email: string
}

interface DaySchedule {
  startTime: string
  endTime: string
  date: string
}

interface Schedule {
  _id: string
  courseId: {
    _id: string
    courseName: string
    courseCode: string
  }
  className: string
  section: string
  teacherId: {
    _id: string
    firstName: string
    lastName: string
    department: string
  }
  note: string
  dayOfWeek: DaySchedule[]
  createdAt: string
  updatedAt: string
}

interface FormErrors {
  courseId?: boolean
  className?: boolean
  section?: boolean
  teacherId?: boolean
  dayOfWeek?: boolean
}

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const timeOptions = [
  "7:00 AM",
  "7:15 AM",
  "7:30 AM",
  "7:45 AM",
  "8:00 AM",
  "8:15 AM",
  "8:30 AM",
  "8:45 AM",
  "9:00 AM",
  "9:15 AM",
  "9:30 AM",
  "9:45 AM",
  "10:00 AM",
  "10:15 AM",
  "10:30 AM",
  "10:45 AM",
  "11:00 AM",
  "11:15 AM",
  "11:30 AM",
  "11:45 AM",
  "12:00 PM",
  "12:15 PM",
  "12:30 PM",
  "12:45 PM",
  "1:00 PM",
  "1:15 PM",
  "1:30 PM",
  "1:45 PM",
  "2:00 PM",
  "2:15 PM",
  "2:30 PM",
  "2:45 PM",
  "3:00 PM",
  "3:15 PM",
  "3:30 PM",
  "3:45 PM",
  "4:00 PM",
  "4:15 PM",
  "4:30 PM",
  "4:45 PM",
  "5:00 PM",
  "5:15 PM",
  "5:30 PM",
  "5:45 PM",
  "6:00 PM",
  "6:15 PM",
  "6:30 PM",
  "6:45 PM",
  "7:00 PM",
  "7:15 PM",
  "7:30 PM",
  "7:45 PM",
  "8:00 PM",
  "8:15 PM",
  "8:30 PM",
  "8:45 PM",
  "9:00 PM",
]

export default function ScheduleCoursePage() {
  // Data states
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)
  const [isTeachersLoading, setIsTeachersLoading] = useState(true)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    _id: "",
    courseId: "",
    className: "",
    section: "",
    teacherId: "",
    note: "",
    dayOfWeek: [] as DaySchedule[],
  })

  // Delete state
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter states
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filterClass, setFilterClass] = useState<string>(searchParams.get("class") || "")
  const [filterSection, setFilterSection] = useState<string>(searchParams.get("section") || "")
  const [inputClassValue, setInputClassValue] = useState<string>(searchParams.get("class") || "")

  // Debouncing for class filter
  // const [debouncedClassFilter, setDebouncedClassFilter = useState<string>(filterClass)

  // Debounce effect for class filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterClass(inputClassValue)
    }, 500) // 500ms debounce delay

    return () => clearTimeout(timer)
  }, [inputClassValue])

  useEffect(() => {
    fetchSchedules()
    fetchCourses()
    fetchTeachers()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchSchedules()

    // Update URL with current filters
    const params = new URLSearchParams()
    if (filterClass) params.set("class", filterClass)
    if (filterSection) params.set("section", filterSection)

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
    window.history.pushState({}, "", newUrl)
  }, [filterClass, filterSection])

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setIsLoading(true)

      // Build query parameters based on filters - use correct schedule endpoint
      let url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/schedule`
      const params = new URLSearchParams()

      if (filterClass) {
        params.append("class", filterClass)
      }

      // Only append section parameter if it's explicitly selected (not empty string)
      if (filterSection) {
        params.append("section", filterSection)
      }

      // Add query parameters if any exist
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      setSchedules(response.data.data || [])
    } catch (error) {
      console.error("Error fetching schedules:", error)
      // Suppress error toast as requested by user
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      setIsCoursesLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses?active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      setCourses(response.data)
    } catch (error) {
      console.error("Error fetching courses:", error)
      // Suppress error toast as requested by user
    } finally {
      setIsCoursesLoading(false)
    }
  }

  // Update the fetchTeachers function to fetch all teachers initially
  // This will be the default list before a course is selected

  // Replace the current fetchTeachers function with:
  const fetchTeachers = async (departmentName?: string) => {
    try {
      setIsTeachersLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

      // Build the URL based on whether a department is specified
      let url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers`
      if (departmentName) {
        url += `?department=${departmentName}`
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      // Admin service returns teachers array directly, not wrapped in data
      setTeachers(response.data || [])
    } catch (error) {
      console.error("Error fetching teachers:", error)
      // Suppress error toast as requested by user
    } finally {
      setIsTeachersLoading(false)
    }
  }

  // Open modal for creating new schedule
  const openModal = () => {
    setFormData({
      _id: "",
      courseId: "",
      className: "",
      section: "",
      teacherId: "",
      note: "",
      dayOfWeek: [],
    })
    setIsEditMode(false)
    setIsModalOpen(true)
  }

  // Open modal for editing existing schedule
  const openEditModal = (schedule: Schedule) => {
    setFormData({
      _id: schedule._id,
      courseId: schedule.courseId._id,
      className: schedule.className,
      section: schedule.section,
      teacherId: schedule.teacherId._id,
      note: schedule.note,
      dayOfWeek: [...schedule.dayOfWeek], // This already has the correct structure with date, startTime, endTime
    })
    setIsEditMode(true)
    setIsModalOpen(true)
  }

  // Open delete confirmation modal
  const openDeleteModal = (schedule: Schedule) => {
    setScheduleToDelete(schedule)
    setIsDeleteModalOpen(true)
  }

  // Handle delete schedule
  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return

    try {
      setIsDeleting(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/schedule/${scheduleToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      toast.success("Schedule deleted successfully!")
      const message = activities.admin.removeScheduleClass.description.replace(
        "{className}",
        scheduleToDelete.className,
      )
      const activity = {
        title: activities.admin.removeScheduleClass.action,
        subtitle: message,
        performBy: "Admin",
      }
      await addActivity(activity)
      setIsDeleteModalOpen(false)
      setScheduleToDelete(null)
      fetchSchedules()
    } catch (error) {
      console.error("Error deleting schedule:", error)
      // Suppress error toast as requested by user
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle form submission (create or update)
  const handleSubmit = async (submittedFormData: typeof formData, isEdit: boolean) => {
    try {
      // Find the course name for the selected course ID
      const selectedCourse = courses.find(course => course._id === submittedFormData.courseId)
      const courseName = selectedCourse?.courseName || ''
      
      // Create a copy of the form data without the _id field for POST requests
      const dataToSubmit = isEdit
        ? submittedFormData
        : {
            courseId: submittedFormData.courseId,
            courseName: courseName, // Add the required courseName field
            className: submittedFormData.className,
            section: submittedFormData.section,
            teacherId: submittedFormData.teacherId,
            note: submittedFormData.note,
            dayOfWeek: submittedFormData.dayOfWeek,
          }

      if (isEdit) {
        // Update existing schedule
        const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        const response = await axios.patch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/schedule/${submittedFormData._id}`, dataToSubmit, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        // toast.success("Schedule updated successfully!")
        console.log(response)
                    // if(response.data.success){
                    //   toast.success(response.data.message)
                    // }else{
                    //   toast.error(response.data.message)
                    //   return
                    // }
        toast.success('Schedule Updated')
        const message = activities.admin.updateScheduleClass.description.replace(
          "{className}",
          submittedFormData.className,
        )
        const activity = {
          title: activities.admin.updateScheduleClass.action,
          subtitle: message,
          performBy: "Admin",
        }

        await addActivity(activity)
      } else {
        // Create new schedule
        const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        const response = await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/schedule/add`, dataToSubmit, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (response.data?.success === false) {
          toast.error(response.data?.message || 'Failed to add schedule')
          throw new Error(response.data?.message || 'Failed to add schedule')
        }
        toast.success(response.data?.message || 'Course scheduled successfully')
        const message = activities.admin.scheduleClass.description.replace("{className}", submittedFormData.className)
        const activity = {
          title: activities.admin.scheduleClass.action,
          subtitle: message,
          performBy: "Admin",
        }
        await addActivity(activity)
      }

      setIsModalOpen(false)
      fetchSchedules()
    } catch (error: any) {
      console.error(`Error ${isEdit ? "updating" : "scheduling"} course:`, error)
      const msg = error?.response?.data?.message || error?.message || (isEdit ? 'Failed to update schedule' : 'Failed to add schedule')
      toast.error(msg)
      throw error
    }
  }

  // Filter handlers
  const handleClassFilterChange = (value: string) => {
    setFilterClass(value)
  }

  const handleSectionFilterChange = (value: string) => {
    setFilterSection(value)
  }

  const clearFilters = () => {
    setFilterClass("")
    setInputClassValue("")
    setFilterSection("")
  }

  // Helper function for day color
  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      Monday: "bg-blue-100 text-blue-800 border-blue-200",
      Tuesday: "bg-purple-100 text-purple-800 border-purple-200",
      Wednesday: "bg-green-100 text-green-800 border-green-200",
      Thursday: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Friday: "bg-red-100 text-red-800 border-red-200",
      Saturday: "bg-indigo-100 text-indigo-800 border-indigo-200",
      Sunday: "bg-pink-100 text-pink-800 border-pink-200",
    }

    return colors[day] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent">
            Course Schedules
          </h1>
          <p className="text-muted-foreground mt-1">View and manage your course schedules</p>
        </div>
        <Button onClick={openModal} className="bg-black text-white hover:bg-black/90">
          <Plus className="mr-2 h-4 w-4" /> Schedule Class
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/4 space-y-2">
            <Label htmlFor="filterClass" className="font-medium">
              Filter by Grade Level
            </Label>
            <Input
              id="filterClass"
              type="text"
              placeholder="Enter Grade Level"
              value={inputClassValue}
              onChange={(e) => setInputClassValue(e.target.value)}
              className="border-gray-300 focus:border-black focus:ring-black"
            />
          </div>

          <div className="w-full md:w-1/4 space-y-2">
            <Label htmlFor="filterSection" className="font-medium">
              Filter by Section
            </Label>
            <Select onValueChange={handleSectionFilterChange} value={filterSection}>
              <SelectTrigger id="filterSection" className="border-gray-300 focus:border-black focus:ring-black">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                  <SelectItem key={`filter-section-${letter}`} value={letter}>
                    Section {letter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full md:w-auto"
              disabled={!filterClass && !filterSection}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {(filterClass || filterSection) && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <span className="font-medium mr-2">Active Filters:</span>
            {filterClass && (
              <Badge variant="secondary" className="mr-2">
                Grade Level: {filterClass}
              </Badge>
            )}
            {filterSection && <Badge variant="secondary">Section: {filterSection}</Badge>}
          </div>
        )}
      </div>

      {/* Schedules List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading schedules...</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">
            {filterClass || filterSection ? "No schedules found matching your filters" : "No schedules found"}
          </h3>
          <p className="text-gray-500 mt-1">
            {filterClass || filterSection
              ? "Try changing your filter criteria or clear filters"
              : "Get started by scheduling your first class"}
          </p>
          {filterClass || filterSection ? (
            <Button onClick={clearFilters} className="mt-4 bg-gray-200 text-gray-800 hover:bg-gray-300">
              Clear Filters
            </Button>
          ) : (
            <Button onClick={openModal} className="mt-4 bg-black text-white hover:bg-black/90">
              <Plus className="mr-2 h-4 w-4" /> Schedule Class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules?.map((schedule) => (
            <Card key={schedule._id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{schedule?.courseId?.courseCode}</CardTitle>
                    <CardDescription className="mt-1 font-medium text-black">
                      {schedule?.courseId?.courseName}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className="mb-1">
                      Class: {schedule.className}
                    </Badge>
                    <Badge variant="outline">Section: {schedule.section}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <span className="font-medium mr-2">Instructor:</span>
                    <span>
                      {schedule.teacherId?.firstName} {schedule.teacherId?.lastName}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Schedule:</div>
                    <div className="space-y-2">
                      {schedule.dayOfWeek.map((day, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded-md border ${getDayColor(day.date)}`}
                        >
                          <div className="font-medium">{day.date}</div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-3 w-3 mr-1" />
                            {day.startTime} - {day.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {schedule.note && (
                    <div className="text-sm mt-2">
                      <span className="font-medium">Notes:</span> {schedule.note}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Created on {new Date(schedule.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openEditModal(schedule)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteModal(schedule)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Modal (Create/Edit) */}
      <ScheduleModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={formData}
        isEditMode={isEditMode}
        courses={courses}
        teachers={teachers}
        isCoursesLoading={isCoursesLoading}
        isTeachersLoading={isTeachersLoading}
        weekdays={weekdays}
        timeOptions={timeOptions}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteSchedule}
        schedule={scheduleToDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
