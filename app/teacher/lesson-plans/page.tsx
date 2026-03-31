"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
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
}

interface LessonPlan {
  _id: string
  title: string
  description: string
  courseId: {
    _id: string
    courseCode: string
    courseName: string
  }
  objectives: string[]
  materials: string[]
  duration: number
  status: 'pending' | 'approved' | 'rejected' | 'revision_required'
  reviewComments: string[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: {
    firstName: string
    lastName: string
  }
}

interface Stats {
  pending: number
  approved: number
  rejected: number
  revision_required: number
  total?: number
}

export default function TeacherLessonPlansPage() {
  const router = useRouter()
  const teacherId = getLocalStorageValue("id")
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    revision_required: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lessonPlanToDelete, setLessonPlanToDelete] = useState<LessonPlan | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch teacher's courses (same as attendance)
  const fetchCourses = useCallback(async () => {
    try {
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
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!teacherId) return

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/lesson-plan/teacher/${teacherId}/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const statsData = response.data || {}
      setStats({
        pending: statsData.pending || 0,
        approved: statsData.approved || 0,
        rejected: statsData.rejected || 0,
        revision_required: statsData.revision_required || 0,
        total: (statsData.pending || 0) + (statsData.approved || 0) + (statsData.rejected || 0) + (statsData.revision_required || 0)
      })
    } catch (error: any) {
      console.error('Error fetching stats:', error)
      // Don't show error toast for stats, just log it
    }
  }, [teacherId])

  // Fetch lesson plans
  const fetchLessonPlans = useCallback(async () => {
    if (!teacherId) return

    try {
      setLoadingRecords(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      if (selectedCourse && selectedCourse !== 'all') {
        params.append('courseId', selectedCourse)
      }
      
      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
      }
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/lesson-plan/teacher/${teacherId}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Handle response structure - backend returns { data, total, page, totalPages }
      const responseData = response.data
      setLessonPlans(responseData.data || [])
      setTotalRecords(responseData.total || 0)
      setTotalPages(responseData.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching lesson plans:', error)
      toast.error('Failed to load lesson plans')
      setLessonPlans([])
      setTotalRecords(0)
      setTotalPages(1)
    } finally {
      setLoadingRecords(false)
    }
  }, [teacherId, currentPage, pageSize, selectedCourse, selectedStatus, debouncedSearchTerm])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchCourses(), fetchStats()])
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [fetchCourses, fetchStats])

  useEffect(() => {
    if (!loading && teacherId) {
      fetchLessonPlans()
    }
  }, [fetchLessonPlans, loading, teacherId])

  const handleDelete = async () => {
    if (!lessonPlanToDelete) return

    try {
      setDeleting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/lesson-plan/${lessonPlanToDelete._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success('Lesson plan deleted successfully')
      setDeleteDialogOpen(false)
      setLessonPlanToDelete(null)
      fetchLessonPlans()
      fetchStats() // Refresh stats
    } catch (error: any) {
      console.error('Error deleting lesson plan:', error)
      toast.error(error.response?.data?.message || 'Failed to delete lesson plan')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'revision_required':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Revision Required</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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

  // Get unique courses assigned to teacher (remove duplicates by courseId)
  const filteredCourses = Array.from(
    new Map(
      courses.map(course => {
        const courseId = typeof course.courseId === 'string' 
          ? course.courseId 
          : (course.courseId?._id || course.courseId?.toString() || '')
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
        <h1 className="text-3xl font-bold tracking-tight">Lesson Plans</h1>
        <Button 
          onClick={() => router.push('/teacher/lesson-plans/create')}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Lesson Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Plans</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejected || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={selectedStatus || "all"} 
                onValueChange={(value) => {
                  const statusValue = value === "all" ? "" : value
                  setSelectedStatus(statusValue)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revision_required">Revision Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search lesson plans..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Lesson Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : lessonPlans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCourse || selectedStatus
                  ? 'Try adjusting your filters'
                  : 'Start by creating your first lesson plan'
                }
              </p>
              {!searchTerm && !selectedCourse && !selectedStatus && (
                <Button 
                  onClick={() => router.push('/teacher/lesson-plans/create')}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Lesson Plan
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonPlans.map((plan) => (
                      <TableRow key={plan._id}>
                        <TableCell className="font-medium">{plan.title}</TableCell>
                        <TableCell>
                          {plan.courseId?.courseCode ? 
                            `${plan.courseId.courseCode} - ${plan.courseId.courseName}` : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>{plan.duration} min</TableCell>
                        <TableCell>{getStatusBadge(plan.status)}</TableCell>
                        <TableCell>{formatDate(plan.submittedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/teacher/lesson-plans/view/${plan._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/teacher/lesson-plans/update/${plan._id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setLessonPlanToDelete(plan)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
                    Showing {totalRecords > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
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
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {lessonPlanToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium">{lessonPlanToDelete.title}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
