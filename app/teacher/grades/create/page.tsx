"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Clock, 
  BookOpen, 
  Users, 
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  GraduationCap
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
}

interface GradeData {
  studentId: string
  score: number
}

export default function CreateGradePage() {
  const router = useRouter()
  const teacherId = getLocalStorageValue("id")
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedGradeSection, setSelectedGradeSection] = useState<string>("")
  const [selectedMarkingType, setSelectedMarkingType] = useState<string>("")
  const [totalMarks, setTotalMarks] = useState<number>(100)
  const [grades, setGrades] = useState<Record<string, GradeData>>({})

  // Marking types (comprehensive list)
  const markingTypes = [
    "Test",
    "Quiz",
    "Exam",
    "Assignment",
    "Project",
    "Lab Work",
    "Presentation",
    "Participation",
    "Homework",
    "Mid-Term",
    "Final Exam",
    "Practical",
    "Oral Exam",
    "Coursework",
    "Assessment",
    "Class Test",
    "Unit Test",
    "Chapter Test",
    "Pop Quiz",
    "Weekly Test",
    "Monthly Test",
    "Formative Assessment",
    "Summative Assessment",
    "Diagnostic Test",
    "Placement Test",
    "Standardized Test",
    "Essay",
    "Research Paper",
    "Report",
    "Portfolio",
    "Field Work",
    "Observation",
    "Performance Task",
    "Group Work",
    "Individual Work",
    "Peer Assessment",
    "Self Assessment",
    "Reflection",
    "Journal",
    "Notebook",
    "Classwork",
    "Seatwork",
    "Exercise",
    "Worksheet",
    "Drill",
    "Practice Test",
    "Mock Exam",
    "Preliminary Exam",
    "Board Exam",
    "Entrance Exam",
    "Exit Exam",
    "Comprehensive Exam",
    "Thesis",
    "Dissertation",
    "Capstone Project",
    "Internship",
    "Clinical",
    "Workshop",
    "Seminar",
    "Case Study",
    "Problem Solving",
    "Critical Thinking",
    "Creative Task",
    "Art Project",
    "Science Fair",
    "Math Olympiad",
    "Spelling Bee",
    "Debate",
    "Speech",
    "Recitation",
    "Reading Comprehension",
    "Writing Sample",
    "Grammar Test",
    "Vocabulary Test",
    "Listening Test",
    "Speaking Test",
    "Lab Report",
    "Experiment",
    "Demonstration",
    "Simulation",
    "Role Play",
    "Drama",
    "Music Performance",
    "Physical Education",
    "Sports Assessment",
    "Health Check",
    "Behavioral Assessment",
    "Attendance",
    "Punctuality",
    "Effort",
    "Progress Report",
    "Report Card",
    "Continuous Assessment",
    "Term Assessment",
    "Year-End Assessment"
  ]

  const [errors, setErrors] = useState<Record<string, string>>({})

  const terms = ["Q1", "Q2", "Q3", "Q4", "Semester 1", "Semester 2", "Final"]

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
      setCourses(response.data || [])
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [])

  // Get unique courses (deduplicate by courseId)
  const getUniqueCourses = () => {
    const courseMap = new Map<string, Course>()
    courses.forEach(course => {
      const key = course.courseId
      if (!courseMap.has(key)) {
        courseMap.set(key, course)
      }
    })
    return Array.from(courseMap.values())
  }

  // Get grade/section combinations for selected course
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

  // Fetch students when course, grade, and section are selected
  const fetchStudents = useCallback(async () => {
    if (!selectedCourse || !selectedGradeSection) {
      setStudents([])
      setGrades({})
      return
    }

    // Parse grade and section from selectedGradeSection (format: "Grade 1-Section B")
    const [gradePart, sectionPart] = selectedGradeSection.split('-Section ')
    const gradeLevel = gradePart.trim() // This will be "Grade 1", "Grade 2", etc.
    const section = sectionPart?.trim() || ''

    if (!gradeLevel || !section) {
      setStudents([])
      setGrades({})
      return
    }

    try {
      setLoadingStudents(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/students?gradeLevel=${encodeURIComponent(gradeLevel)}&section=${encodeURIComponent(section)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const studentsData = response.data?.data || response.data || []
      const studentsArray = Array.isArray(studentsData) ? studentsData : []
      setStudents(studentsArray)
      
      // Initialize grades for each student
      const initialGrades: Record<string, GradeData> = {}
      studentsArray.forEach((student: Student) => {
        initialGrades[student._id] = {
          studentId: student._id,
          score: 0,
        }
      })
      setGrades(initialGrades)
    } catch (error: any) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
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
    setSelectedGradeSection("")
    setSelectedMarkingType("")
    setTotalMarks(100)
    setStudents([])
    setGrades({})
    setErrors({})
  }

  const handleGradeSectionSelect = (value: string) => {
    setSelectedGradeSection(value)
    setSelectedMarkingType("")
    setTotalMarks(100)
    setStudents([])
    setGrades({})
    setErrors(prev => ({ ...prev, gradeSection: '' }))
  }

  const updateGrade = (studentId: string, score: number) => {
    setGrades(prev => {
      const updated = { ...prev }
      if (!updated[studentId]) {
        updated[studentId] = {
          studentId,
          score: 0,
        }
      }
      updated[studentId].score = score
      return updated
    })
  }

  const handleSave = async () => {
    // Validation
    const newErrors: Record<string, string> = {}
    if (!selectedCourse) newErrors.course = 'Course is required'
    if (!selectedGradeSection) newErrors.gradeSection = 'Grade and Section are required'
    if (!selectedMarkingType) newErrors.markingType = 'Marking type is required'
    if (!totalMarks || totalMarks <= 0) newErrors.totalMarks = 'Total marks must be greater than 0'
    if (students.length === 0) newErrors.students = 'No students found for this class'

    // Validate all grades
    Object.keys(grades).forEach(studentId => {
      const grade = grades[studentId]
      if (grade.score < 0) {
        newErrors[`${studentId}.score`] = 'Score cannot be negative'
      }
      if (grade.score > totalMarks) {
        newErrors[`${studentId}.score`] = `Score cannot exceed total marks (${totalMarks})`
      }
    })

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      
      // Parse grade and section from selectedGradeSection
      const [gradePart, sectionPart] = selectedGradeSection.split('-Section ')
      const gradeLevel = gradePart.trim()
      const section = sectionPart?.trim() || ''

      const gradesToCreate = Object.values(grades).map(grade => ({
        teacherId,
        courseId: selectedCourse,
        studentId: grade.studentId,
        class: gradeLevel,
        section: section,
        markingType: selectedMarkingType,
        totalMarks: totalMarks,
        score: grade.score,
      }))

      await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/create`,
        { grades: gradesToCreate },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success('Grades created successfully')
      router.push('/teacher/grades')
    } catch (error: any) {
      console.error('Error saving grades:', error)
      if (error.response?.status === 409 || error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Grades already exist for this marking type')
      } else {
        toast.error(error.response?.data?.message || 'Failed to save grades')
      }
    } finally {
      setSaving(false)
    }
  }

  const formatTimeSlots = (timeSlots: Course['timeSlots']) => {
    if (!timeSlots || timeSlots.length === 0) return 'No schedule'
    return timeSlots.map(ts => `${ts.day}: ${ts.startTime} - ${ts.endTime}`).join(', ')
  }

  const uniqueCourses = getUniqueCourses()
  const gradeSectionOptions = getCourseGradeSections()

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
          <Button variant="ghost" size="sm" onClick={() => router.push('/teacher/grades')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Add Grades</h1>
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
                  {uniqueCourses.map((course) => (
                    <SelectItem key={course.courseId} value={course.courseId}>
                      {course.courseName} ({course.courseCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course && <p className="text-sm text-red-500">{errors.course}</p>}
            </div>

            {selectedCourse && gradeSectionOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="gradeSection">
                  Grade and Section <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={selectedGradeSection} 
                  onValueChange={handleGradeSectionSelect}
                >
                  <SelectTrigger id="gradeSection" className={errors.gradeSection ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select grade and section" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeSectionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gradeSection && <p className="text-sm text-red-500">{errors.gradeSection}</p>}
              </div>
            )}

            {selectedGradeSection && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="markingType">
                    Marking Type <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedMarkingType} 
                    onValueChange={(value) => {
                      setSelectedMarkingType(value)
                      setErrors(prev => ({ ...prev, markingType: '' }))
                    }}
                  >
                    <SelectTrigger id="markingType" className={errors.markingType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select marking type" />
                    </SelectTrigger>
                    <SelectContent>
                      {markingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.markingType && <p className="text-sm text-red-500">{errors.markingType}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalMarks">
                    Total Marks <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    min="1"
                    value={totalMarks}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setTotalMarks(value)
                      setErrors(prev => ({ ...prev, totalMarks: '' }))
                    }}
                    className={errors.totalMarks ? 'border-red-500' : ''}
                    placeholder="Enter total marks"
                  />
                  {errors.totalMarks && <p className="text-sm text-red-500">{errors.totalMarks}</p>}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Grades Table */}
      {selectedCourse && selectedGradeSection && selectedMarkingType && totalMarks > 0 && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Score (out of {totalMarks})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const grade = grades[student._id] || {
                          studentId: student._id,
                          score: 0,
                        }
                        return (
                          <TableRow key={student._id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{student.studentName}</div>
                                <div className="text-sm text-muted-foreground">ID: {student.studentId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={totalMarks}
                                value={grade.score || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  updateGrade(student._id, value)
                                  // Clear error when user types
                                  if (errors[`${student._id}.score`]) {
                                    setErrors(prev => {
                                      const newErrors = { ...prev }
                                      delete newErrors[`${student._id}.score`]
                                      return newErrors
                                    })
                                  }
                                }}
                                className={`w-32 ${errors[`${student._id}.score`] ? 'border-red-500' : ''}`}
                                placeholder="Enter score"
                              />
                              {errors[`${student._id}.score`] && (
                                <p className="text-xs text-red-500 mt-1">{errors[`${student._id}.score`]}</p>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
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
                        Save Grades
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {selectedCourse && students.length === 0 && !loadingStudents && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students found for this class</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

