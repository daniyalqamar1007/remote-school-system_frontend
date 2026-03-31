"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter
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

interface AttendanceRecord {
  _id: string
  courseId: {
    _id: string
    courseName: string
    courseCode: string
  }
  class: string
  section: string
  date: string
  students: {
    _id: string
    studentId: string
    studentName: string
    attendance: string
    note?: string
  }[]
  createdAt: string
}

export default function TeacherAttendancePage() {
  const router = useRouter()
  const teacherId = getLocalStorageValue("id")
  const [courses, setCourses] = useState<Course[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [attendanceToDelete, setAttendanceToDelete] = useState<AttendanceRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // Fetch attendance records
  const fetchAttendanceRecords = useCallback(async () => {
    if (!teacherId) return

    try {
      setLoadingRecords(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      if (selectedCourse && selectedCourse !== 'all') params.append('courseId', selectedCourse)
      if (selectedDate) params.append('date', selectedDate)

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/records?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Handle response structure - backend returns { data, total, page, totalPages }
      const responseData = response.data
      setAttendanceRecords(responseData.data || responseData || [])
      setTotalRecords(responseData.total || 0)
      setTotalPages(responseData.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching attendance records:', error)
      toast.error('Failed to load attendance records')
    } finally {
      setLoadingRecords(false)
    }
  }, [teacherId, currentPage, pageSize, selectedCourse, selectedDate])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [fetchAttendanceRecords])

  const handleDelete = async () => {
    if (!attendanceToDelete) return

    try {
      setDeleting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/${attendanceToDelete._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success('Attendance deleted successfully')
      setDeleteDialogOpen(false)
      setAttendanceToDelete(null)
      fetchAttendanceRecords()
    } catch (error: any) {
      console.error('Error deleting attendance:', error)
      toast.error(error.response?.data?.message || 'Failed to delete attendance')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatTimeSlots = (timeSlots: Course['timeSlots']) => {
    if (!timeSlots || timeSlots.length === 0) return 'No schedule'
    return timeSlots.map(ts => `${ts.day}: ${ts.startTime} - ${ts.endTime}`).join(', ')
  }

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800'
      case 'Absent':
        return 'bg-red-100 text-red-800'
      case 'Late':
        return 'bg-yellow-100 text-yellow-800'
      case 'Excused':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get unique courses assigned to teacher (remove duplicates by courseId)
  const filteredCourses = Array.from(
    new Map(
      courses.map(course => {
        // Handle both string and object courseId
        const courseId =
          typeof course.courseId === 'string'
            ? course.courseId
            : typeof course.courseId === 'object' && course.courseId !== null
              ? (typeof (course.courseId as { _id?: string; toString?: () => string })._id === 'string'
                  ? (course.courseId as { _id: string })._id
                  : (typeof (course.courseId as { toString?: () => string }).toString === 'function'
                      ? (course.courseId as { toString: () => string }).toString()
                      : ''))
              : ''
        return [courseId, course]
      })
    ).values()
  )

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
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
        <Button onClick={() => router.push('/teacher/attendance/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Attendance
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Grade - Section</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => {
                      const presentCount = record.students.filter(s => s.attendance === 'Present').length
                      const totalCount = record.students.length
                      return (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.courseId?.courseName || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{record.courseId?.courseCode || ''}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            Grade {record.class} - Section {record.section}
                          </TableCell>
                          <TableCell>
                            {presentCount} / {totalCount} Present
                          </TableCell>
                          <TableCell>
                            <Badge className={getAttendanceStatusColor('Present')}>
                              Recorded
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/teacher/attendance/view/${record._id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/teacher/attendance/update/${record._id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAttendanceToDelete(record)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {attendanceToDelete && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Date:</strong> {formatDate(attendanceToDelete.date)}<br />
                <strong>Course:</strong> {attendanceToDelete.courseId?.courseName || 'N/A'}<br />
                <strong>Grade - Section:</strong> Grade {attendanceToDelete.class} - Section {attendanceToDelete.section}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setAttendanceToDelete(null)
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
