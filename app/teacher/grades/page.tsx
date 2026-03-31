"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface GradeRecord {
  _id: string
  courseId: {
    _id: string
    courseName: string
    courseCode: string
  }
  class: string
  section: string
  term?: string
  markingType: string
  totalMarks: number
  students: Array<{
    studentId: {
      _id: string
      firstName: string
      lastName: string
      studentId: string
      class: string
      section: string
    }
    score: number
  }>
  createdAt: string
}

export default function TeacherGradesPage() {
  const router = useRouter()
  const teacherId = getLocalStorageValue("id")
  const [courses, setCourses] = useState<Course[]>([])
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedMarkingType, setSelectedMarkingType] = useState<string>("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState<GradeRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // Get unique marking types from records
  const uniqueMarkingTypes = useMemo(() => {
    const types = new Set<string>()
    gradeRecords.forEach(record => {
      if (record.markingType) {
        types.add(record.markingType)
      }
    })
    // If no records yet, return all available marking types
    if (types.size === 0) {
      return markingTypes
    }
    return Array.from(types).sort()
  }, [gradeRecords])

  // Grade levels enum (same as admin student management)
  const grades = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
  
  // Sections enum (A-Z)
  const sections = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

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

  // Fetch grade records
  const fetchGradeRecords = useCallback(async () => {
    if (!teacherId) return

    try {
      setLoadingRecords(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      if (selectedCourse) params.append('courseId', selectedCourse)
      if (selectedGrade) params.append('class', selectedGrade)
      if (selectedSection) params.append('section', selectedSection)
      if (selectedMarkingType) params.append('markingType', selectedMarkingType)

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/records?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Use grouped data if available, otherwise use regular data
      const records = response.data.grouped || response.data.data || []
      setGradeRecords(records)
      setTotalRecords(response.data.total || records.length)
      setTotalPages(response.data.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching grade records:', error)
      toast.error('Failed to load grade records')
    } finally {
      setLoadingRecords(false)
    }
  }, [teacherId, currentPage, pageSize, selectedCourse, selectedGrade, selectedSection, selectedMarkingType])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    fetchGradeRecords()
  }, [fetchGradeRecords])

  const handleDelete = async () => {
    if (!gradeToDelete) return

    try {
      setDeleting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/teacher/${gradeToDelete._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success('Grade deleted successfully')
      setDeleteDialogOpen(false)
      setGradeToDelete(null)
      fetchGradeRecords()
    } catch (error: any) {
      console.error('Error deleting grade:', error)
      toast.error(error.response?.data?.message || 'Failed to delete grade')
    } finally {
      setDeleting(false)
    }
  }

  const getLetterGrade = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 80) return 'bg-blue-100 text-blue-800'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800'
    if (score >= 60) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

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

  const uniqueCourses = getUniqueCourses()

  // Filter courses based on selected grade and section
  const filteredCourses = uniqueCourses.filter(course => {
    if (selectedGrade && course.gradeLevel !== selectedGrade) return false
    if (selectedSection && course.section !== selectedSection) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Grade Management</h1>
        <Button onClick={() => router.push('/teacher/grades/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Grade
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade Level</label>
              <Select value={selectedGrade || "all"} onValueChange={(value) => {
                const gradeValue = value === "all" ? "" : value
                setSelectedGrade(gradeValue)
                setSelectedSection("")
                setSelectedCourse("")
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select 
                value={selectedSection || "all"} 
                onValueChange={(value) => {
                  const sectionValue = value === "all" ? "" : value
                  setSelectedSection(sectionValue)
                  setSelectedCourse("")
                  setCurrentPage(1)
                }}
                disabled={!selectedGrade}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      Section {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select 
                value={selectedCourse || "all"} 
                onValueChange={(value) => {
                  const courseValue = value === "all" ? "" : value
                  setSelectedCourse(courseValue)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {filteredCourses.map((course) => (
                    <SelectItem key={course.courseId} value={course.courseId}>
                      {course.courseName} ({course.courseCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Marking Type</label>
              <Select 
                value={selectedMarkingType || "all"} 
                onValueChange={(value) => {
                  const markingTypeValue = value === "all" ? "" : value
                  setSelectedMarkingType(markingTypeValue)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Marking Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marking Types</SelectItem>
                  {uniqueMarkingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : gradeRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No grade records found.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Marking Type</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradeRecords.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.courseId?.courseName || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{record.courseId?.courseCode || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.class || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.section || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.markingType || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{record.totalMarks || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{record.students?.length || 0} student(s)</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/teacher/grades/view/${record._id}`)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/teacher/grades/update/${record._id}`)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button> */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setGradeToDelete(record)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loadingRecords}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loadingRecords}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grade Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grade record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {gradeToDelete && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Course:</strong> {gradeToDelete.courseId?.courseName || 'N/A'}<br />
                <strong>Grade:</strong> {gradeToDelete.class || 'N/A'}<br />
                <strong>Section:</strong> {gradeToDelete.section || 'N/A'}<br />
                <strong>Marking Type:</strong> {gradeToDelete.markingType || 'N/A'}<br />
                <strong>Total Marks:</strong> {gradeToDelete.totalMarks || 0}<br />
                <strong>Total Students:</strong> {gradeToDelete.students?.length || 0}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setGradeToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
