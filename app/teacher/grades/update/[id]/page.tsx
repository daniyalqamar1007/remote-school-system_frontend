"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
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

export default function UpdateGradePage() {
  const router = useRouter()
  const params = useParams()
  const gradeId = params.id as string
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
  // NOTE: This is not used in edit mode - we fetch students in fetchExistingGrade
  // Keeping it for compatibility but it won't overwrite existing grades
  const fetchStudents = useCallback(async () => {
    // Don't fetch if we're in edit mode (gradeId exists) and grades are already set
    if (gradeId && Object.keys(grades).length > 0) {
      return
    }
    
    if (!selectedCourse || !selectedGradeSection) {
      setStudents([])
      if (!gradeId) {
        setGrades({})
      }
      return
    }

    // Parse grade and section from selectedGradeSection (format: "Grade 1-Section B")
    const [gradePart, sectionPart] = selectedGradeSection.split('-Section ')
    const gradeLevel = gradePart.trim() // This will be "Grade 1", "Grade 2", etc.
    const section = sectionPart?.trim() || ''

    if (!gradeLevel || !section) {
      setStudents([])
      if (!gradeId) {
        setGrades({})
      }
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
      
      // Only initialize grades if we're not in edit mode (no existing grades)
      if (!gradeId || Object.keys(grades).length === 0) {
        const initialGrades: Record<string, GradeData> = {}
        studentsArray.forEach((student: Student) => {
          initialGrades[student._id] = {
            studentId: student._id,
            score: 0,
          }
        })
        setGrades(initialGrades)
      }
    } catch (error: any) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedCourse, selectedGradeSection, gradeId, grades])

  // Fetch existing grade data on mount
  useEffect(() => {
    const fetchExistingGrade = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        
        // First, get the single grade to get the combination details
        const singleGradeResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/${gradeId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        const singleGrade = singleGradeResponse.data
        
        // Now fetch all grades for the same combination (course, class, section, markingType, term)
        const params = new URLSearchParams({
          page: '1',
          limit: '1000', // Get all records
        })
        
        if (singleGrade.courseId?._id) params.append('courseId', singleGrade.courseId._id)
        if (singleGrade.class) params.append('className', singleGrade.class)
        if (singleGrade.section) params.append('section', singleGrade.section)
        if (singleGrade.markingType) params.append('markingType', singleGrade.markingType)
        if (singleGrade.term) params.append('term', singleGrade.term)
        
        const groupedResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/records?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        // Find the matching grouped record
        const groupedRecords = groupedResponse.data?.grouped || []
        const matchingGroup = groupedRecords.find((g: any) => 
          g.courseId?._id === singleGrade.courseId?._id &&
          g.class === singleGrade.class &&
          g.section === singleGrade.section &&
          g.markingType === singleGrade.markingType &&
          (g.term || 'N/A') === (singleGrade.term || 'N/A')
        )
        
        if (matchingGroup) {
          // Set pre-filled values
          setSelectedCourse(matchingGroup.courseId._id)
          setSelectedGradeSection(`${matchingGroup.class}-Section ${matchingGroup.section}`)
          setSelectedMarkingType(matchingGroup.markingType)
          setTotalMarks(matchingGroup.totalMarks || 100)
          
          // Fetch courses to get students
          await fetchCourses()
          
          // Fetch students for this grade/section
          const [gradePart, sectionPart] = `${matchingGroup.class}-Section ${matchingGroup.section}`.split('-Section ')
          const gradeLevel = gradePart.trim()
          const section = sectionPart?.trim() || ''
          
          if (gradeLevel && section) {
            const studentsResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/students?gradeLevel=${encodeURIComponent(gradeLevel)}&section=${encodeURIComponent(section)}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            const studentsData = studentsResponse.data?.data || studentsResponse.data || []
            const studentsArray = Array.isArray(studentsData) ? studentsData : []
            setStudents(studentsArray)
            
            // Initialize grades from existing data - match by student ID
            const initialGrades: Record<string, GradeData> = {}
            
            console.log('Matching group students:', matchingGroup.students)
            console.log('Fetched students array:', studentsArray)
            
            // First, populate from existing grade records
            matchingGroup.students.forEach((student: any) => {
              // Handle different possible structures of studentId from grade record
              let existingStudentId: string | undefined
              
              if (student.studentId) {
                if (typeof student.studentId === 'object') {
                  existingStudentId = student.studentId._id?.toString() || student.studentId.toString()
                } else {
                  existingStudentId = student.studentId.toString()
                }
              }
              
              // Ensure score is a number, defaulting to 0 if null/undefined
              const existingScore = (student.score !== null && student.score !== undefined) 
                ? Number(student.score) 
                : 0
              
              if (!existingStudentId) {
                console.warn('No studentId found in grade record:', student)
                return
              }
              
              // Find matching student in the fetched students array
              // Students from attendance API have _id field (already converted to string)
              const matchingStudent = studentsArray.find((s: Student) => {
                const sId = String(s._id || '')
                const existingIdStr = String(existingStudentId)
                return sId === existingIdStr
              })
              
              if (matchingStudent) {
                initialGrades[matchingStudent._id] = {
                  studentId: matchingStudent._id,
                  score: existingScore,
                }
                console.log(`✓ Matched student ${matchingStudent._id} (${matchingStudent.studentName}) with existing score: ${existingScore}`)
              } else {
                // If student not found in fetched list, log for debugging
                console.warn(`✗ Student ${existingStudentId} not found in students list, but has grade ${existingScore}`)
                console.warn('Available student IDs:', studentsArray.map((s: Student) => s._id))
              }
            })
            
            // Fill in any missing students with 0 (students who don't have grades yet)
            studentsArray.forEach((student: Student) => {
              if (!initialGrades[student._id]) {
                initialGrades[student._id] = {
                  studentId: student._id,
                  score: 0,
                }
                console.log(`✓ Added student ${student._id} (${student.studentName}) with default score: 0`)
              }
            })
            
            console.log('Final initialized grades:', initialGrades)
            console.log('Total students:', studentsArray.length, 'Total grades initialized:', Object.keys(initialGrades).length)
            setGrades(initialGrades)
          }
        } else {
          toast.error('Grade record not found')
          router.push('/teacher/grades')
        }
      } catch (error: any) {
        console.error('Error fetching grade:', error)
        toast.error('Failed to load grade record')
        router.push('/teacher/grades')
      } finally {
        setLoading(false)
      }
    }

    if (gradeId) {
      fetchExistingGrade()
    }
  }, [gradeId, router, fetchCourses])

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
    
    // Clear error when user types
    if (errors[`${studentId}.score`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${studentId}.score`]
        return newErrors
      })
    }
  }

  const handleSave = async () => {
    // Validation (same as create page)
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

      // Get all individual grade records for this combination
      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
      })
      
      if (selectedCourse) params.append('courseId', selectedCourse)
      if (gradeLevel) params.append('className', gradeLevel)
      if (section) params.append('section', section)
      if (selectedMarkingType) params.append('markingType', selectedMarkingType)
      
      const allGradesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/records?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      const allGrades = allGradesResponse.data?.data || []
      
      // Update each grade record
      const updatePromises = Object.values(grades).map(async (gradeData) => {
        // Find the existing grade record by matching student ID
        const existingGrade = allGrades.find((g: any) => {
          let gStudentId: string | undefined
          
          if (g.studentId) {
            if (typeof g.studentId === 'object') {
              gStudentId = g.studentId._id?.toString() || g.studentId.toString()
            } else {
              gStudentId = g.studentId.toString()
            }
          }
          
          const gradeStudentId = gradeData.studentId?.toString() || String(gradeData.studentId)
          
          return gStudentId && gradeStudentId && String(gStudentId) === String(gradeStudentId)
        })
        
        if (existingGrade && existingGrade._id) {
          try {
            console.log(`Updating grade for student ${gradeData.studentId}:`, {
              gradeId: existingGrade._id,
              totalMarks,
              score: gradeData.score
            })
            
            const response = await axios.put(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/${existingGrade._id}`,
              {
                totalMarks: totalMarks,
                score: gradeData.score,
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            console.log(`✓ Successfully updated grade for student ${gradeData.studentId}:`, response.data)
            return { success: true, studentId: gradeData.studentId, data: response.data }
          } catch (err: any) {
            console.error(`✗ Error updating grade for student ${gradeData.studentId}:`, err)
            return { 
              success: false, 
              studentId: gradeData.studentId, 
              error: err.response?.data?.message || err.message 
            }
          }
        } else {
          // If no existing grade found, create a new one
          try {
            console.log(`Creating new grade for student ${gradeData.studentId}`)
            
            // Find the student object to get studentId for the API
            const student = students.find((s: Student) => s._id === gradeData.studentId)
            if (!student) {
              console.warn(`Student not found for ID ${gradeData.studentId}`)
              return { 
                success: false, 
                studentId: gradeData.studentId, 
                error: 'Student not found' 
              }
            }
            
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/create`,
              {
                courseId: selectedCourse,
                studentId: student._id,
                className: gradeLevel,
                section: section,
                markingType: selectedMarkingType,
                totalMarks: totalMarks,
                score: gradeData.score,
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            console.log(`✓ Successfully created grade for student ${gradeData.studentId}:`, response.data)
            return { success: true, studentId: gradeData.studentId, data: response.data }
          } catch (err: any) {
            console.error(`✗ Error creating grade for student ${gradeData.studentId}:`, err)
            return { 
              success: false, 
              studentId: gradeData.studentId, 
              error: err.response?.data?.message || err.message 
            }
          }
        }
      })
      
      const results = await Promise.all(updatePromises)
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success)
      
      console.log('All updates completed:', successful, 'successful out of', results.length)
      
      if (failed.length > 0) {
        console.error('Failed updates:', failed)
        const failedStudents = failed.map(f => {
          const student = students.find((s: Student) => s._id === f.studentId)
          return student?.studentName || f.studentId
        }).join(', ')
        toast.error(`Failed to update grades for: ${failedStudents}`)
      }
      
      if (successful === 0) {
        toast.error('No grades were updated. Please check the errors above.')
        return
      }

      if (failed.length > 0) {
        toast.warning(`${successful} grade(s) updated successfully, but ${failed.length} failed.`)
      } else {
        toast.success(`All ${successful} grade(s) updated successfully`)
      }
      
      router.push('/teacher/grades')
    } catch (error: any) {
      console.error('Error updating grades:', error)
      toast.error(error.response?.data?.message || 'Failed to update grades')
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Grades</h1>
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
                onValueChange={() => {}} // Disabled - cannot change
                disabled={true}
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
                  onValueChange={() => {}} // Disabled - cannot change
                  disabled={true}
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
                    onValueChange={() => {}} // Disabled - cannot change
                    disabled={true}
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
                                step="0.01"
                                value={grade.score !== undefined && grade.score !== null ? String(grade.score) : '0'}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
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
                                placeholder="0"
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
                        Update Grades
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
