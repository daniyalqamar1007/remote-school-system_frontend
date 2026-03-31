
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CheckIcon, Loader2, Plus, Trash2, AlertCircle } from "lucide-react"
import axios from "axios"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
  createdAt?: string
  updatedAt?: string
}

interface FormData {
  _id: string
  courseId: string
  className: string
  section: string
  teacherId: string
  note: string
  dayOfWeek: DaySchedule[]
}

interface FormErrors {
  courseId?: boolean
  className?: boolean
  section?: boolean
  teacherId?: boolean
  dayOfWeek?: boolean
}

interface ScheduleModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (formData: FormData, isEdit: boolean) => Promise<void>
  initialData: FormData
  isEditMode: boolean
  courses: Course[]
  teachers: Teacher[]
  isCoursesLoading: boolean
  isTeachersLoading: boolean
  weekdays: string[]
  timeOptions: string[]
}

export function ScheduleModal({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isEditMode,
  courses,
  teachers,
  isCoursesLoading,
  isTeachersLoading: initialTeachersLoading,
  weekdays,
  timeOptions,
}: ScheduleModalProps) {
  // Form state
  const [formData, setFormData] = useState<FormData>(initialData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Teachers state
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>(teachers)
  const [isTeachersLoading, setIsTeachersLoading] = useState(initialTeachersLoading)

  // Selected day for adding to schedule
  const [selectedDay, setSelectedDay] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData)
    setErrors({})
    setFormSubmitted(false)
    setSelectedDay("")
    setStartTime("")
    setEndTime("")
    setFilteredTeachers(teachers)
  }, [initialData, teachers, isOpen])

  // Validate form when data changes
  useEffect(() => {
    if (formSubmitted) {
      validateForm()
    }
  }, [formData, formSubmitted])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Handle select changes
  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))

    // If the course is changed, fetch instructors for that course's department
    if (id === "courseId") {
      // Find the selected course
      const selectedCourse = courses.find((course) => course._id === value)

      // Reset the teacher selection
      setFormData((prev) => ({ ...prev, teacherId: "" }))

      // If the course has a department, fetch teachers for that department
      if (selectedCourse?.departmentId?.departmentName) {
        const fetchTeachersForDepartment = async () => {
          try {
            setIsTeachersLoading(true)
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers?department=${selectedCourse.departmentId?.departmentName}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            console.log(response)
            // Admin teachers endpoint returns teachers array directly
            if (response.data && Array.isArray(response.data)) {
              setFilteredTeachers(response.data || [])
            } else {
              console.log("No teachers found for this department")
              setFilteredTeachers([])
            }
          } catch (error) {
            console.error("Error fetching teachers for department:", error)
            // Suppress error toast as requested by user
            setFilteredTeachers([])
          } finally {
            setIsTeachersLoading(false)
          }
        }

        fetchTeachersForDepartment()
      } else {
        // If no department, reset to all teachers
        setFilteredTeachers(teachers)
      }
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.courseId) newErrors.courseId = true
    if (!formData.className) newErrors.className = true
    if (!formData.section) newErrors.section = true
    if (!formData.teacherId) newErrors.teacherId = true
    if (formData.dayOfWeek.length === 0) newErrors.dayOfWeek = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uniqueDays = [...new Set(formData.dayOfWeek.map((d) => d.date))]
  const needsMoreDays = uniqueDays.length < 5 && formData.dayOfWeek.length > 0

  const parseTimeMinutes = (time: string) => {
    const [timeStr, period] = time.split(" ")
    const [h, m] = timeStr.split(":").map(Number)
    let hours = h
    if (period === "PM" && h !== 12) hours += 12
    if (period === "AM" && h === 12) hours = 0
    return hours * 60 + (m || 0)
  }

  const slotsOverlap = (a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }) => {
    const aStart = parseTimeMinutes(a.startTime)
    const aEnd = parseTimeMinutes(a.endTime)
    const bStart = parseTimeMinutes(b.startTime)
    const bEnd = parseTimeMinutes(b.endTime)
    return aStart < bEnd && bStart < aEnd
  }

  const addDaySchedule = () => {
    if (!selectedDay || !startTime || !endTime) {
      toast.error("Please select day, start time, and end time")
      return
    }

    const newSlot = { date: selectedDay, startTime, endTime }
    const sameDaySlots = formData.dayOfWeek.filter((d) => d.date === selectedDay)
    const overlaps = sameDaySlots.some((s) => slotsOverlap(s, newSlot))
    if (overlaps) {
      toast.error(`Time overlaps with an existing slot on ${selectedDay}. Choose a different time.`)
      return
    }

    // Validate that end time is after start time
    const startHour = Number.parseInt(startTime.split(":")[0])
    const startMinute = Number.parseInt(startTime.split(":")[1].split(" ")[0])
    const startPeriod = startTime.split(" ")[1]

    const endHour = Number.parseInt(endTime.split(":")[0])
    const endMinute = Number.parseInt(endTime.split(":")[1].split(" ")[0])
    const endPeriod = endTime.split(" ")[1]

    let startTimeValue = startHour
    if (startPeriod === "PM" && startHour !== 12) startTimeValue += 12
    if (startPeriod === "AM" && startHour === 12) startTimeValue = 0

    let endTimeValue = endHour
    if (endPeriod === "PM" && endHour !== 12) endTimeValue += 12
    if (endPeriod === "AM" && endHour === 12) endTimeValue = 0

    if (endTimeValue < startTimeValue || (endTimeValue === startTimeValue && endMinute <= startMinute)) {
      toast.error("End time must be after start time")
      return
    }

    // Create the day schedule with the exact structure needed
    const newDaySchedule = {
      date: selectedDay,
      startTime: startTime,
      endTime: endTime,
    }

    setFormData((prev) => ({
      ...prev,
      dayOfWeek: [...prev.dayOfWeek, newDaySchedule],
    }))

    // Reset selection
    setSelectedDay("")
    setStartTime("")
    setEndTime("")
  }

  // Remove day schedule from the form
  const removeDaySchedule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dayOfWeek: prev.dayOfWeek.filter((_, i) => i !== index),
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)

    // Validation
    if (!validateForm()) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setIsSubmitting(true)

      // Ensure we're sending the correct data structure
      const dataToSubmit = {
        ...formData,
        dayOfWeek: formData.dayOfWeek.map((day) => ({
          date: day.date,
          startTime: day.startTime,
          endTime: day.endTime,
        })),
      }

      await onSubmit(dataToSubmit, isEditMode)
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "scheduling"} course:`, error)
      const msg = error?.response?.data?.message || error?.message || (isEditMode ? 'Failed to update schedule' : 'Failed to add schedule')
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Schedule" : "Schedule New Class"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the course schedule details."
              : "Select a course and set up its schedule for the upcoming term."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="courseSelect" className="font-medium">
                Select Course <span className="text-red-500">*</span>
              </Label>
              {isCoursesLoading ? (
                <div className="flex items-center space-x-2 h-10 px-3 border rounded-md border-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Loading courses...</span>
                </div>
              ) : (
                <>
                  <Select onValueChange={(value) => handleSelectChange("courseId", value)} value={formData.courseId}>
                    <SelectTrigger
                      id="courseSelect"
                      className={`border-gray-300 focus:border-black focus:ring-black ${errors.courseId ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.courseCode} - {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.courseId && (
                    <div className="flex items-center mt-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Course is required
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="className" className="font-medium">
                  Grade Level <span className="text-red-500">*</span>
                </Label>
                <input
                  id="className"
                  type="text"
                  placeholder="Enter Grade Level"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.className ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-black focus:border-black`}
                  value={formData.className}
                  onChange={(e) => handleChange(e)}
                />
                {errors.className && (
                  <div className="flex items-center mt-1 text-sm text-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Grade Level is required
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="section" className="font-medium">
                  Section <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => handleSelectChange("section", value)} value={formData.section}>
                  <SelectTrigger
                    id="section"
                    className={`border-gray-300 focus:border-black focus:ring-black ${errors.section ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="section-none" value="None">
                      None
                    </SelectItem>
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                      <SelectItem key={`section-${letter}`} value={letter}>
                        {letter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.section && (
                  <div className="flex items-center mt-1 text-sm text-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Section is required
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor" className="font-medium">
                Instructor <span className="text-red-500">*</span>
              </Label>
              {isTeachersLoading ? (
                <div className="flex items-center space-x-2 h-10 px-3 border rounded-md border-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Loading instructors...</span>
                </div>
              ) : (
                <>
                  <Select onValueChange={(value) => handleSelectChange("teacherId", value)} value={formData.teacherId}>
                    <SelectTrigger
                      id="instructor"
                      className={`border-gray-300 focus:border-black focus:ring-black ${errors.teacherId ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((teacher) => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            {teacher.firstName} {teacher.lastName} ({teacher.department})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-center text-sm text-gray-500">
                          No instructors available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.teacherId && (
                    <div className="flex items-center mt-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Instructor is required
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={`space-y-4 border rounded-md p-4 bg-gray-50 ${errors.dayOfWeek ? "border-red-500" : ""}`}>
              <div className="font-medium">
                Class Schedule <span className="text-red-500">*</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add days and times. You can add multiple slots per day (non-overlapping) and use &quot;Add to Mon–Fri&quot; so no day is missed.
              </p>
              {needsMoreDays && (
                <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                  Subject is on {uniqueDays.length} day(s) only. Use &quot;Add to Mon–Fri&quot; for balanced coverage across the week.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daySelect" className="text-sm">
                    Day
                  </Label>
                  <Select onValueChange={setSelectedDay} value={selectedDay}>
                    <SelectTrigger id="daySelect" className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekdays.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTimeSelect" className="text-sm">
                    Start Time
                  </Label>
                  <Select onValueChange={setStartTime} value={startTime}>
                    <SelectTrigger id="startTimeSelect" className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={`start-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTimeSelect" className="text-sm">
                    End Time
                  </Label>
                  <Select onValueChange={setEndTime} value={endTime}>
                    <SelectTrigger id="endTimeSelect" className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={`end-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={addDaySchedule}
                  variant="outline"
                  className="border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Slot
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!startTime || !endTime) {
                      toast.error("Select start and end time first")
                      return
                    }
                    const schoolDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                    const existing = new Set(formData.dayOfWeek.map((d) => `${d.date}-${d.startTime}-${d.endTime}`))
                    const toAdd: typeof formData.dayOfWeek = []
                    for (const day of schoolDays) {
                      const key = `${day}-${startTime}-${endTime}`
                      if (existing.has(key)) continue
                      const newSlot = { date: day, startTime, endTime }
                      const sameDay = formData.dayOfWeek.filter((d) => d.date === day)
                      if (sameDay.some((s) => slotsOverlap(s, newSlot))) continue
                      toAdd.push(newSlot)
                      existing.add(key)
                    }
                    if (toAdd.length === 0) {
                      toast.info("All weekdays already have this time slot (or overlapping)")
                      return
                    }
                    setFormData((prev) => ({ ...prev, dayOfWeek: [...prev.dayOfWeek, ...toAdd] }))
                    toast.success(`Added ${toAdd.length} day(s). Subject now covers more days.`)
                  }}
                  variant="outline"
                  className="border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100"
                >
                  Add to Mon–Fri (same time)
                </Button>
              </div>

              {formData.dayOfWeek.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <div className="font-medium text-sm">Scheduled Days:</div>
                  <div className="space-y-2">
                    {formData.dayOfWeek.map((day, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border">
                        <div>
                          <span className="font-medium">{day.date}:</span> {day.startTime} - {day.endTime}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeDaySchedule(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                errors.dayOfWeek && (
                  <div className="flex items-center mt-2 text-sm text-red-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    At least one day schedule is required
                  </div>
                )
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="font-medium">
                Notes / Special Instructions
              </Label>
              <Textarea
                id="note"
                placeholder="Add any special instructions or notes about this course schedule."
                className="min-h-[100px] border-gray-300 focus:border-black focus:ring-black"
                value={formData.note}
                onChange={handleChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-black text-white hover:bg-black/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Scheduling..."}
                </>
              ) : (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" /> {isEditMode ? "Update Schedule" : "Schedule Course"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  schedule: Schedule | null
  isDeleting: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onOpenChange,
  onConfirm,
  schedule,
  isDeleting,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Are you sure you want to delete the schedule for{" "}
            <span className="font-semibold">{schedule?.courseId?.courseName}</span>? This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
