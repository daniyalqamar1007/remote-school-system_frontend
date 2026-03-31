"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { Loader2, BookOpen, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'

interface Course {
  _id: string
  courseName: string
  courseCode: string
}

interface GradeSection {
  level: number
  section: string
  roomNumber?: string
  timeSlots?: any[]
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
  schoolId?: string
  onSuccess?: () => void
}

const GRADES = [0, ...Array.from({ length: 12 }, (_, i) => i + 1)] // K (0) and 1 to 12
const SECTIONS = ['None', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))] // None, A to Z

export default function CourseAssignmentModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  schoolId,
  onSuccess,
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/course-assignment?userId=${teacherId}${schoolId ? `&schoolId=${schoolId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const coursesList = response.data?.data?.courses || []
      setCourses(Array.isArray(coursesList) ? coursesList : [])
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      toast.error(error?.response?.data?.message || 'Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssigned = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/course-assignment/assigned?userId=${teacherId}${schoolId ? `&schoolId=${schoolId}` : ''}`, {
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
              preGrades[a.courseId] = a.grades.map((g: any) => ({ level: Number(g.level), section: String(g.section) }))
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

  const toggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses)
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId)
      const newGrades = { ...courseGrades }
      delete newGrades[courseId]
      setCourseGrades(newGrades)
    } else {
      newSelected.add(courseId)
      setCourseGrades({ ...courseGrades, [courseId]: [] })
    }
    setSelectedCourses(newSelected)
    // Clear errors for this course
    if (errors[courseId]) {
      const newErrors = { ...errors }
      delete newErrors[courseId]
      setErrors(newErrors)
    }
  }

  const addGradeSection = (courseId: string) => {
    const currentGrades = courseGrades[courseId] || []
    setCourseGrades({
      ...courseGrades,
      [courseId]: [...currentGrades, { level: 1, section: 'A' }],
    })
    // Clear error for this course
    if (errors[courseId]) {
      const newErrors = { ...errors }
      delete newErrors[courseId]
      setErrors(newErrors)
    }
  }

  const removeGradeSection = (courseId: string, index: number) => {
    const currentGrades = courseGrades[courseId] || []
    const updated = currentGrades.filter((_, i) => i !== index)
    setCourseGrades({
      ...courseGrades,
      [courseId]: updated,
    })
  }

  const updateGradeSection = (courseId: string, index: number, field: 'level' | 'section', value: number | string) => {
    const currentGrades = courseGrades[courseId] || []
    const updated = [...currentGrades]
    updated[index] = { ...updated[index], [field]: value }
    setCourseGrades({
      ...courseGrades,
      [courseId]: updated,
    })
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    if (selectedCourses.size === 0) {
      newErrors.general = 'Please select at least one course'
    }

    selectedCourses.forEach((courseId) => {
      const grades = courseGrades[courseId] || []
      if (grades.length === 0) {
        newErrors[courseId] = 'Please add at least one grade and section for this course'
      }
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
        grades: courseGrades[courseId] || [],
      }))

      const payload = {
        userId: teacherId,
        assignments,
        schoolId: schoolId,
      }

      await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/course-assignment`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      toast.success('Courses assigned successfully')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error assigning courses:', error)
      toast.error(error?.response?.data?.message || 'Failed to assign courses')
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
                      <div className="ml-7 space-y-3">
                        {grades.map((gradeSection, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label className="text-xs text-gray-600">Grade (Level)</Label>
                              <Select
                                value={String(gradeSection.level)}
                                onValueChange={(value) =>
                                  updateGradeSection(course._id, index, 'level', Number(value))
                                }
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
                                onValueChange={(value) =>
                                  updateGradeSection(course._id, index, 'section', value)
                                }
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
                            <div className="flex gap-1 mt-6">
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
                                onClick={() => removeGradeSection(course._id, index)}
                                className="h-9 w-9 p-0"
                                title="Remove grade section"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
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

