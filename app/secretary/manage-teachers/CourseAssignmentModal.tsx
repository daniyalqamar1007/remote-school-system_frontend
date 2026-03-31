"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { Loader2, BookOpen, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'

interface Course {
  _id: string
  courseName: string
  courseCode: string
}

interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

interface GradeSection {
  level: number
  section: string
  roomNumber?: string
  timeSlots: TimeSlot[]
}

interface CourseAssignment {
  courseId: string
  grades: GradeSection[]
}

interface CourseAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  teacherId: string
  teacherName: string
  onSuccess?: () => void
  schoolId?: string
}

const GRADES = [0, ...Array.from({ length: 12 }, (_, i) => i + 1)] // K (0) and 1 to 12
const SECTIONS = ['None', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))] // None, A to Z
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const buildEmptyTimeSlots = (): TimeSlot[] =>
  WEEK_DAYS.map((day) => ({
    day,
    startTime: "",
    endTime: "",
  }))

const mergeTimeSlots = (incoming?: TimeSlot[]) => {
  const map = new Map((incoming || []).map((slot) => [slot.day, slot]))
  return WEEK_DAYS.map((day) => ({
    day,
    startTime: map.get(day)?.startTime || "",
    endTime: map.get(day)?.endTime || "",
  }))
}

export default function CourseAssignmentModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  onSuccess,
  schoolId,
}: CourseAssignmentModalProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [courseGrades, setCourseGrades] = useState<{ [courseId: string]: GradeSection[] }>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [copiedSchedule, setCopiedSchedule] = useState<{ courseId: string; gradeIndex: number } | null>(null)

  useEffect(() => {
    if (isOpen && teacherId) {
      fetchCourses()
      fetchAssigned()
    } else {
      // Reset state when modal closes
      setSelectedCourses(new Set())
      setCourseGrades({})
      setErrors({})
      setCopiedSchedule(null)
    }
  }, [isOpen, teacherId])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const qp = new URLSearchParams()
      qp.set('userId', teacherId)
      if (schoolId) qp.set('schoolId', schoolId)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/course-assignment?${qp.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const coursesList = response.data?.data?.courses || []
      setCourses(Array.isArray(coursesList) ? coursesList : [])
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      // increase toast timeout to 10 seconds
      toast.error(error?.response?.data?.message || 'Failed to fetch courses', { autoClose: 10000 })
    } finally {
      setLoading(false)
    }
  }

  const fetchAssigned = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const qp = new URLSearchParams()
      qp.set('userId', teacherId)
      if (schoolId) qp.set('schoolId', schoolId)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/course-assignment/assigned?${qp.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const assignments = response.data?.data?.assignments || []
      if (Array.isArray(assignments) && assignments.length > 0) {
        const preselected = new Set<string>()
        const preGrades: { [courseId: string]: GradeSection[] } = {}
        for (const a of assignments) {
          if (a?.courseId) {
            preselected.add(a.courseId)
            if (Array.isArray(a.grades)) {
              preGrades[a.courseId] = a.grades.map((g: any) => ({
                level: Number(g.level),
                section: String(g.section),
                roomNumber: String(g.roomNumber || ""),
                timeSlots: mergeTimeSlots(g.timeSlots),
              }))
            }
          }
        }
        setSelectedCourses(preselected)
        setCourseGrades((prev) => ({ ...prev, ...preGrades }))
      }
    } catch (error: any) {
      console.error('Error fetching assigned courses:', error)
      // Do not toast here aggressively to keep UX clean
    }
  }

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const clearCourseErrors = (courseId: string) => {
    setErrors((prev) => {
      const keys = Object.keys(prev)
      const filteredKeys = keys.filter(
        (key) => key !== courseId && !key.startsWith(`${courseId}-`),
      )
      if (filteredKeys.length === keys.length) return prev
      const next: { [key: string]: string } = {}
      for (const key of filteredKeys) {
        next[key] = prev[key]
      }
      return next
    })
  }

  const toggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses)
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId)
      setCourseGrades((prev) => {
        if (!(courseId in prev)) return prev
        const { [courseId]: _, ...rest } = prev
        return rest
      })
      clearCourseErrors(courseId)
    } else {
      newSelected.add(courseId)
      setCourseGrades((prev) => (prev[courseId] ? prev : { ...prev, [courseId]: [] }))
      clearError("general")
      clearCourseErrors(courseId)
    }
    setSelectedCourses(newSelected)
  }

  const addGradeSection = (courseId: string) => {
    setCourseGrades((prev) => {
      const currentGrades = prev[courseId] || []
      const nextGrades = [
        ...currentGrades,
        { level: 1, section: "A", roomNumber: "", timeSlots: buildEmptyTimeSlots() },
      ]
      return { ...prev, [courseId]: nextGrades }
    })
    clearError(courseId)
    clearError("general")
  }

  const removeGradeSection = (courseId: string, index: number) => {
    setCourseGrades((prev) => {
      const currentGrades = prev[courseId] || []
      const updated = currentGrades.filter((_, i) => i !== index)
      return { ...prev, [courseId]: updated }
    })
    clearError(courseId)
  }

  const updateGradeSection = (courseId: string, index: number, field: 'level' | 'section' | 'roomNumber', value: number | string) => {
    setCourseGrades((prev) => {
      const currentGrades = prev[courseId] || []
      const updated = [...currentGrades]
      const existing =
        updated[index] || { level: 1, section: "A", roomNumber: "", timeSlots: buildEmptyTimeSlots() }
      updated[index] = {
        ...existing,
        [field]: value,
        timeSlots: existing.timeSlots?.length ? existing.timeSlots : buildEmptyTimeSlots(),
      }
      return { ...prev, [courseId]: updated }
    })
  }

  const updateTimeSlot = (
    courseId: string,
    gradeIndex: number,
    day: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setCourseGrades((prev) => {
      const currentGrades = prev[courseId] || []
      const updated = [...currentGrades]
      const existing =
        updated[gradeIndex] || { level: 1, section: "A", roomNumber: "", timeSlots: buildEmptyTimeSlots() }
      const slots = existing.timeSlots?.length ? existing.timeSlots : buildEmptyTimeSlots()
      const nextSlots = slots.map((slot) =>
        slot.day === day ? { ...slot, [field]: value } : slot,
      )
      updated[gradeIndex] = {
        ...existing,
        timeSlots: nextSlots,
      }
      return { ...prev, [courseId]: updated }
    })
  }

  const copySchedule = (courseId: string, gradeIndex: number) => {
    const grades = courseGrades[courseId] || []
    const gradeSection = grades[gradeIndex]
    if (gradeSection && gradeSection.timeSlots) {
      setCopiedSchedule({ courseId, gradeIndex })
      toast.success('Schedule copied! Click "Paste" on another grade section to apply.')
    }
  }

  const pasteSchedule = (targetCourseId: string, targetGradeIndex: number) => {
    if (!copiedSchedule) {
      toast.error('No schedule copied. Please copy a schedule first.')
      return
    }

    const sourceGrades = courseGrades[copiedSchedule.courseId] || []
    const sourceGradeSection = sourceGrades[copiedSchedule.gradeIndex]
    
    if (!sourceGradeSection || !sourceGradeSection.timeSlots) {
      toast.error('Source schedule not found.')
      return
    }

    setCourseGrades((prev) => {
      const currentGrades = prev[targetCourseId] || []
      const updated = [...currentGrades]
      const existing = updated[targetGradeIndex] || { 
        level: 1, 
        section: "A", 
        roomNumber: "", 
        timeSlots: buildEmptyTimeSlots() 
      }
      
      // Copy time slots from source
      updated[targetGradeIndex] = {
        ...existing,
        timeSlots: sourceGradeSection.timeSlots.map(slot => ({ ...slot })),
      }
      return { ...prev, [targetCourseId]: updated }
    })
    
    toast.success('Schedule pasted successfully!')
    setCopiedSchedule(null)
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (selectedCourses.size === 0) {
      newErrors.general = "Please select at least one course"
    }

    selectedCourses.forEach((courseId) => {
      const grades = courseGrades[courseId] || []
      if (grades.length === 0) {
        newErrors[courseId] = "Please add at least one grade and section for this course"
        return
      }

      grades.forEach((grade, index) => {
        const key = `${courseId}-${index}`
        const slots = grade.timeSlots || []
        const filledSlots = slots.filter((slot) => slot.startTime && slot.endTime)

        if (filledSlots.length === 0) {
          newErrors[key] = "Configure at least one time slot across Monday to Saturday"
          return
        }

        for (const slot of filledSlots) {
          if (slot.endTime <= slot.startTime) {
            newErrors[key] = `For ${slot.day}, end time must be after start time`
            break
          }
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      
      const assignments: CourseAssignment[] = Array.from(selectedCourses).map((courseId) => ({
        courseId,
        grades: (courseGrades[courseId] || []).map(({ level, section, roomNumber, timeSlots }) => ({
          level,
          section,
          roomNumber: roomNumber || undefined,
          timeSlots: (timeSlots || [])
            .filter((slot) => slot.startTime && slot.endTime)
            .map((slot) => ({
              day: slot.day,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
        })),
      }))

      const payload = {
        userId: teacherId,
        assignments,
        ...(schoolId ? { schoolId } : {}),
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/course-assignment`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      toast.success(response.data?.message || 'Courses assigned successfully', { autoClose: 10000 })
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error assigning courses:', error)
      toast.error(error?.response?.data?.message || 'Failed to assign courses' , { autoClose: 10000 })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Courses to {teacherName}</DialogTitle>
          <DialogDescription>
            Select courses and assign grades and sections for this teacher.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading courses...</span>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No courses available</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {errors.general && (
              <p className="text-sm text-black font-medium">{errors.general}</p>
            )}

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {courses.map((course) => {
                const isSelected = selectedCourses.has(course._id)
                const grades = courseGrades[course._id] || []
                const courseError = errors[course._id]

                return (
                  <div key={course._id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`course-${course._id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleCourse(course._id)}
                      />
                      <Label
                        htmlFor={`course-${course._id}`}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {course.courseName} ({course.courseCode})
                      </Label>
                    </div>

                    {isSelected && (
                      <div className="ml-7 space-y-4">
                        {grades.map((gradeSection, index) => {
                          const gradeKey = `${course._id}-${index}`
                          const timeSlots =
                            gradeSection.timeSlots?.length > 0
                              ? gradeSection.timeSlots
                              : buildEmptyTimeSlots()

                          return (
                            <div
                              key={gradeKey}
                              className="space-y-3 rounded-md border border-gray-200 p-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-600">Grade (Level)</Label>
                                  <Select
                                    value={String(gradeSection.level)}
                                    onValueChange={(value) => {
                                      updateGradeSection(course._id, index, 'level', Number(value))
                                      clearError(course._id)
                                      clearError(gradeKey)
                                    }}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {GRADES.map((grade) => (
                                        <SelectItem key={grade} value={String(grade)}>
                                          {grade === 0 ? 'Kindergarten' : `Grade ${grade}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-600">Section</Label>
                                  <Select
                                    value={gradeSection.section}
                                    onValueChange={(value) => {
                                      updateGradeSection(course._id, index, 'section', value)
                                      clearError(course._id)
                                      clearError(gradeKey)
                                    }}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SECTIONS.map((section) => (
                                        <SelectItem key={section} value={section}>
                                          {section}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-600">Room Number</Label>
                                  <Input
                                    type="text"
                                    placeholder="e.g., 101, A-12"
                                    value={gradeSection.roomNumber || ""}
                                    onChange={(e) => {
                                      updateGradeSection(course._id, index, 'roomNumber', e.target.value)
                                      clearError(course._id)
                                      clearError(gradeKey)
                                    }}
                                    className="h-9"
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copySchedule(course._id, index)}
                                    title="Copy schedule"
                                    className="h-9 w-9 p-0"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  {copiedSchedule && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => pasteSchedule(course._id, index)}
                                      title="Paste schedule"
                                      className="h-9 w-9 p-0"
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      removeGradeSection(course._id, index)
                                      clearError(gradeKey)
                                    }}
                                    className="h-9 w-9 p-0"
                                    title="Remove grade section"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {timeSlots.map((slot) => (
                                  <div
                                    key={slot.day}
                                    className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                                  >
                                    <div className="text-sm font-medium text-gray-600">
                                      {slot.day}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-gray-500">Start</Label>
                                      <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => {
                                          updateTimeSlot(
                                            course._id,
                                            index,
                                            slot.day,
                                            "startTime",
                                            e.target.value,
                                          )
                                          clearError(gradeKey)
                                        }}
                                        className="h-9 w-full rounded-md border border-gray-300 px-2"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-gray-500">End</Label>
                                      <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => {
                                          updateTimeSlot(
                                            course._id,
                                            index,
                                            slot.day,
                                            "endTime",
                                            e.target.value,
                                          )
                                          clearError(gradeKey)
                                        }}
                                        className="h-9 w-full rounded-md border border-gray-300 px-2"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {errors[gradeKey] && (
                                <p className="text-sm text-black font-medium">{errors[gradeKey]}</p>
                              )}
                            </div>
                          )
                        })}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addGradeSection(course._id)}
                          className="w-full"
                        >
                          + Add Grade & Section
                        </Button>
                        {courseError && (
                          <p className="text-sm text-black font-medium">{courseError}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loading || courses.length === 0}
            className="bg-black text-white hover:bg-gray-800"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign These Courses'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

