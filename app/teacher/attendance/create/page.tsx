"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  Loader2,
  Save,
  ArrowLeft,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import axios from "axios"
import { getLocalStorageValue } from "@/lib/utils"

interface Course {
  courseId: string
  courseName: string
  courseCode: string
  gradeLevel: string
  section: string
  timeSlots: {
    day: string
    startTime: string
    endTime: string
  }[]
}

interface Student {
  _id: string
  studentId: string
  studentName: string
  attendance: string
  note: string
}

export default function CreateAttendancePage() {
  const router = useRouter()
  const teacherId = getLocalStorageValue("id")
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedGradeSection, setSelectedGradeSection] = useState<string>("") // Format: "Grade 1-Section B"
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch teacher's courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/courses`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      // Handle response structure
      const coursesData = response.data?.data || response.data || []
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      console.log('Fetched courses:', coursesData)
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      toast.error(error.response?.data?.message || 'Failed to load courses')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch students when course and grade/section combination are selected
  const fetchStudents = useCallback(async () => {
    if (!selectedCourse || !selectedGradeSection) {
      setStudents([])
      return
    }

    // Parse grade and section from selectedGradeSection (format: "Grade 1-Section B")
    const [gradePart, sectionPart] = selectedGradeSection.split('-Section ')
    // Keep the full grade format (e.g., "Grade 1") as backend expects it
    const gradeLevel = gradePart.trim() // This will be "Grade 1", "Grade 2", etc.
    const section = sectionPart?.trim() || ''

    if (!gradeLevel || !section) {
      console.warn('Missing grade or section:', { gradeLevel, section, selectedGradeSection })
      setStudents([])
      return
    }

    console.log('Fetching students for:', { gradeLevel, section, selectedGradeSection })

    try {
      setLoadingStudents(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      // Send the full grade format (e.g., "Grade 1") to match backend database format
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/students?gradeLevel=${encodeURIComponent(gradeLevel)}&section=${encodeURIComponent(section)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      // Handle response structure
      const studentsData = response.data?.data || response.data || []
      const studentsArray = Array.isArray(studentsData) ? studentsData : []
      setStudents(studentsArray)
      console.log(`Fetched ${studentsArray.length} students for gradeLevel: "${gradeLevel}", section: "${section}"`)
      console.log('Students data:', studentsData)
      
      if (studentsArray.length === 0) {
        toast.info(`No students found for ${gradeLevel} - Section ${section}`)
      }
    } catch (error: any) {
      console.error('Error fetching students:', error)
      console.error('Request params:', { gradeLevel, section })
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || `Failed to load students for ${gradeLevel} - Section ${section}`)
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedCourse, selectedGradeSection])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
    setSelectedGradeSection("") // Reset grade/section selection
    setStudents([]) // Reset students when course changes
    setErrors({})
  }

  // Get unique courses (deduplicate by courseId)
  const getUniqueCourses = () => {
    const courseMap = new Map<string, Course>()
    courses.forEach(course => {
      const courseId = typeof course.courseId === 'string' 
        ? course.courseId 
        : (course.courseId?._id || course.courseId?.toString() || '')
      if (courseId && !courseMap.has(courseId)) {
        courseMap.set(courseId, course)
      }
    })
    return Array.from(courseMap.values())
  }

  // Get all grade/section combinations for selected course
  const getCourseGradeSections = () => {
    if (!selectedCourse) return []
    
    const courseId = typeof selectedCourse === 'string' 
      ? selectedCourse 
      : (selectedCourse?._id || selectedCourse?.toString() || '')
    
    // Find all course assignments for this course
    const courseAssignments = courses.filter(c => {
      const id = typeof c.courseId === 'string' 
        ? c.courseId 
        : (c.courseId?._id || c.courseId?.toString() || '')
      return id === courseId
    })

    // Create unique grade/section combinations
    const combinations = new Map<string, { gradeLevel: string; section: string }>()
    courseAssignments.forEach(course => {
      const key = `${course.gradeLevel}-${course.section}`
      if (!combinations.has(key)) {
        combinations.set(key, {
          gradeLevel: course.gradeLevel,
          section: course.section
        })
      }
    })

    return Array.from(combinations.values()).map(combo => ({
      value: `${combo.gradeLevel}-Section ${combo.section}`,
      label: `${combo.gradeLevel} - Section ${combo.section}`,
      gradeLevel: combo.gradeLevel,
      section: combo.section
    }))
  }

  const updateStudentAttendance = (studentId: string, attendance: string) => {
    setStudents(prev => prev.map(s => 
      s._id === studentId ? { ...s, attendance } : s
    ))
  }

  const updateStudentNote = (studentId: string, note: string) => {
    setStudents(prev => prev.map(s => 
      s._id === studentId ? { ...s, note } : s
    ))
  }

  const handleSave = async () => {
    // Parse grade and section from selectedGradeSection
    const [gradePart, sectionPart] = selectedGradeSection.split('-Section ')
    const selectedGrade = gradePart.replace('Grade ', '')
    const selectedSection = sectionPart || ''

    // Validation
    const newErrors: Record<string, string> = {}
    if (!selectedCourse) newErrors.course = 'Course is required'
    if (!selectedDate) newErrors.date = 'Date is required'
    if (!selectedGradeSection) newErrors.gradeSection = 'Grade and Section combination is required'
    if (students.length === 0) newErrors.students = 'No students found for this class'

    // Validate that all students have attendance status
    const studentsWithoutStatus = students.filter(s => !s.attendance || s.attendance === '')
    if (studentsWithoutStatus.length > 0) {
      newErrors.students = 'Please mark attendance for all students'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      
      // Format date as YYYY-MM-DD
      const formattedDate = selectedDate

      // Get courseId - handle both string and object
      let courseIdValue = selectedCourse
      if (typeof selectedCourse !== 'string') {
        const course = courses.find(c => {
          const id = typeof c.courseId === 'string' ? c.courseId : (c.courseId?._id || c.courseId?.toString())
          return id === selectedCourse || id?.toString() === selectedCourse
        })
        courseIdValue = course ? (typeof course.courseId === 'string' ? course.courseId : (course.courseId?._id || course.courseId?.toString())) : selectedCourse
      }

      // Map attendance values to match backend enum exactly
      const mapAttendanceValue = (value: string): string => {
        if (!value) return 'Present';
        const normalized = value.trim();
        // Map common variations to enum values
        if (normalized.toLowerCase() === 'present') return 'Present';
        if (normalized.toLowerCase() === 'absent') return 'Absent';
        if (normalized.toLowerCase() === 'late') return 'Late';
        if (normalized.toLowerCase() === 'excused') return 'Excused';
        // If already correct, return as is
        if (['Present', 'Absent', 'Late', 'Excused'].includes(normalized)) {
          return normalized;
        }
        return 'Present'; // Default fallback
      };

      // Parse grade and section from selectedGradeSection
      const [gradePart, sectionPart] = selectedGradeSection.split('-Section ')
      const gradeLevel = gradePart.replace('Grade ', '')
      const section = sectionPart || ''

      const payload = {
        teacherId,
        courseId: courseIdValue,
        date: formattedDate,
        class: gradeLevel,
        section: section,
        students: students.map(s => {
          // Ensure all required fields are present and valid
          if (!s._id || !s.studentId) {
            console.error('Invalid student data:', s);
            throw new Error(`Student ${s.studentName} is missing required ID fields`);
          }
          return {
            _id: s._id.toString().trim(),
            studentId: s.studentId.toString().trim(),
            studentName: s.studentName || '',
            attendance: mapAttendanceValue(s.attendance),
            note: s.note || '',
          };
        }),
      }

      console.log('Sending attendance payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/markAttendance`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success('Attendance saved successfully')
      router.push('/teacher/attendance')
    } catch (error: any) {
      console.error('Error saving attendance:', error)
      if (error.response?.status === 409) {
        // If attendance already exists, we should update it instead
        toast.error('Attendance already exists for this date. Please use the update function.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to save attendance')
      }
    } finally {
      setSaving(false)
    }
  }

  const formatTimeSlots = (timeSlots: Course['timeSlots']) => {
    if (!timeSlots || timeSlots.length === 0) return 'No schedule'
    return timeSlots.map(ts => `${ts.day}: ${ts.startTime} - ${ts.endTime}`).join(', ')
  }

  const getAttendanceBadgeVariant = (status: string) => {
    switch (status) {
      case 'Present':
        return 'default'
      case 'Absent':
        return 'destructive'
      case 'Late':
        return 'outline'
      case 'Excused':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Get unique courses
  const availableCourses = getUniqueCourses()
  const courseGradeSections = getCourseGradeSections()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/teacher/attendance')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create Attendance</h1>
        </div>
      </div>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">
                Course <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={selectedCourse} 
                onValueChange={handleCourseSelect}
              >
                <SelectTrigger id="course" className={errors.course ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No courses assigned. Please contact admin.
                    </div>
                  ) : (
                    availableCourses.map((course) => {
                      const courseId = typeof course.courseId === 'string' ? course.courseId : (course.courseId?._id || course.courseId?.toString())
                      return (
                        <SelectItem key={courseId} value={courseId}>
                          {course.courseName} ({course.courseCode})
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
              {errors.course && <p className="text-sm text-red-500">{errors.course}</p>}
            </div>

            {selectedCourse && courseGradeSections.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="gradeSection">
                  Grade & Section <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={selectedGradeSection} 
                  onValueChange={(value) => {
                    setSelectedGradeSection(value)
                    setStudents([]) // Reset students when grade/section changes
                    setErrors(prev => ({ ...prev, gradeSection: '' }))
                  }}
                >
                  <SelectTrigger id="gradeSection" className={errors.gradeSection ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Grade & Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseGradeSections.map((combo) => (
                      <SelectItem key={combo.value} value={combo.value}>
                        {combo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gradeSection && <p className="text-sm text-red-500">{errors.gradeSection}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setErrors(prev => ({ ...prev, date: '' }))
                }}
                className={errors.date ? 'border-red-500' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>
          </div>

          {selectedCourse && selectedGradeSection && (() => {
            // Find the selected course and grade/section combination to get time slots
            const courseId = typeof selectedCourse === 'string' ? selectedCourse : (selectedCourse?._id || selectedCourse?.toString() || '')
            const [gradePart] = selectedGradeSection.split('-Section ')
            const gradeLevel = gradePart.trim()
            const section = selectedGradeSection.split('-Section ')[1]?.trim() || ''
            
            const matchingCourse = courses.find(c => {
              const id = typeof c.courseId === 'string' ? c.courseId : (c.courseId?._id || c.courseId?.toString() || '')
              return id === courseId && c.gradeLevel === gradeLevel && c.section === section
            })
            
            const timeSlots = matchingCourse?.timeSlots || []
            const scheduleText = formatTimeSlots(timeSlots)
            
            // Only show schedule if there are actual time slots
            if (scheduleText && scheduleText !== 'No schedule' && timeSlots.length > 0) {
              return (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Schedule:</span>
                    <span>{scheduleText}</span>
                  </div>
                </div>
              )
            }
            return null
          })()}
        </CardContent>
      </Card>

      {/* Students Table */}
      {selectedCourse && selectedGradeSection && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No students found for this class</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">
                            {student.studentName}
                          </TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-32 p-0">
                                  <Badge variant={getAttendanceBadgeVariant(student.attendance)}>
                                    {student.attendance}
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Present')}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Present
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Absent')}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Absent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Late')}>
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Late
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Excused')}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Excused
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={student.note}
                              onChange={(e) => updateStudentNote(student._id, e.target.value)}
                              placeholder="Add note (optional)"
                              className="h-8"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {errors.students && (
                  <p className="text-sm text-red-500 mt-2">{errors.students}</p>
                )}

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSave} disabled={saving || students.length === 0}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

