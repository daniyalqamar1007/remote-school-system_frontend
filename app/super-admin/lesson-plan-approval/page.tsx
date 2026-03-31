"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Target,
  Package,
  MessageSquare,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
  Eye
} from "lucide-react"
import { toast } from 'sonner'

interface LessonPlan {
  _id: string
  title: string
  description: string
  courseId: {
    _id: string
    courseCode: string
    courseName: string
    schoolId?: {
      _id: string
      name: string
    }
  }
  teacherId: {
    _id: string
    firstName: string
    lastName: string
    schoolId?: {
      _id: string
      name: string
    }
  }
  objectives: string[]
  materials: string[]
  duration: number
  status: 'pending' | 'approved' | 'rejected' | 'revision_required'
  reviewComments: string[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: {
    _id: string
    firstName: string
    lastName: string
  }
  school?: {
    _id: string
    name: string
  }
  schoolId?: {
    _id: string
    name: string
  }
}

interface School {
  _id: string
  name: string
  schoolCode?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SuperAdminLessonPlanApproval() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewDetailsPlan, setViewDetailsPlan] = useState<LessonPlan | null>(null)
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [schoolFilter, setSchoolFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [reviewData, setReviewData] = useState({
    status: 'approved' as 'approved' | 'rejected' | 'revision_required',
    comments: ['']
  })

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    revision_required: 0
  })

  useEffect(() => {
    fetchSchools()
  }, [])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearchTerm, filterStatus, schoolFilter])

  // Fetch lesson plans when filters or pagination changes
  useEffect(() => {
    fetchLessonPlans()
  }, [pagination.page, pagination.limit, debouncedSearchTerm, filterStatus, schoolFilter])

  // Fetch stats when school filter changes
  useEffect(() => {
    fetchStats()
  }, [schoolFilter])

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Handle different response formats - match secretaries page pattern
        const list = data?.data?.schools || data?.data || data?.schools || data || []
        setSchools(Array.isArray(list) ? list : [])
      } else {
        console.error('Failed to fetch schools:', response.status)
        setSchools([])
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
      setSchools([])
    }
  }

  const fetchStats = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_SRS_SERVER
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      const params = new URLSearchParams()
      if (schoolFilter && schoolFilter !== 'all') {
        params.append('schoolId', schoolFilter)
      }
      
      const response = await fetch(`${API}/admin/lesson-plans/stats?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          total: data.total || 0,
          pending: data.pending || 0,
          approved: data.approved || 0,
          rejected: data.rejected || 0,
          revision_required: data.revision_required || 0
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchLessonPlans = async () => {
    try {
      setIsLoading(true)
      const API = process.env.NEXT_PUBLIC_SRS_SERVER
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() }),
        ...(schoolFilter && schoolFilter !== 'all' && { schoolId: schoolFilter }),
      })
      
      const response = await fetch(`${API}/admin/lesson-plans?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        const { data, pagination: pag } = result
        
        let lessonPlansData: any[] = []
        if (Array.isArray(data)) {
          lessonPlansData = data
        } else if (data?.data && Array.isArray(data.data)) {
          lessonPlansData = data.data
        }
        
        // Add school info to each plan if available
        lessonPlansData = lessonPlansData.map((plan: any) => {
          // Try to find school info from populated fields
          let schoolName = 'N/A'
          let schoolId = null
          
          if (plan.courseId?.schoolId) {
            const school = typeof plan.courseId.schoolId === 'object' 
              ? plan.courseId.schoolId 
              : schools.find(s => s._id === plan.courseId.schoolId)
            if (school) {
              schoolName = typeof school === 'object' ? school.name : schools.find(s => s._id === school)?.name || 'N/A'
              schoolId = typeof school === 'object' ? school._id : school
            }
          } else if (plan.teacherId?.schoolId) {
            const school = typeof plan.teacherId.schoolId === 'object'
              ? plan.teacherId.schoolId
              : schools.find(s => s._id === plan.teacherId.schoolId)
            if (school) {
              schoolName = typeof school === 'object' ? school.name : schools.find(s => s._id === school)?.name || 'N/A'
              schoolId = typeof school === 'object' ? school._id : school
            }
          }
          
          return {
            ...plan,
            school: schoolId ? { _id: schoolId, name: schoolName } : undefined,
            schoolId: schoolId ? { _id: schoolId, name: schoolName } : undefined
          }
        })
        
        setLessonPlans(lessonPlansData)

        if (pag) {
          setPagination(prev => ({
            ...prev,
            ...pag
          }))
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('API failed:', errorData)
        toast.error(errorData.message || 'Failed to fetch lesson plans')
        setLessonPlans([])
      }
    } catch (error) {
      console.error('Error fetching lesson plans:', error)
      toast.error('Failed to fetch lesson plans')
      setLessonPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  const getSchoolName = (plan: LessonPlan): string => {
    // Check direct school properties first (added by our fetch logic)
    if (plan.school?.name) return plan.school.name
    if (plan.schoolId?.name) return plan.schoolId.name
    
    // Check nested in teacherId (now populated with schoolId)
    if (plan.teacherId && typeof plan.teacherId === 'object') {
      const teacher = plan.teacherId as any
      // Check if schoolId is populated as an object
      if (teacher.schoolId && typeof teacher.schoolId === 'object' && teacher.schoolId.name) {
        return teacher.schoolId.name
      }
      // Check if schoolId is a string and look it up
      if (teacher.schoolId && typeof teacher.schoolId === 'string' && schools.length > 0) {
        const school = schools.find(s => s._id === teacher.schoolId || s._id?.toString() === teacher.schoolId)
        if (school) return school.name
      }
    }
    
    // Check nested in courseId
    if (plan.courseId && typeof plan.courseId === 'object') {
      const course = plan.courseId as any
      if (course.schoolId?.name) return course.schoolId.name
      if (course.school?.name) return course.school.name
      if (course.schoolId && typeof course.schoolId === 'string' && schools.length > 0) {
        const school = schools.find(s => s._id === course.schoolId || s._id?.toString() === course.schoolId)
        if (school) return school.name
      }
    }
    
    // Fallback: check nested in teacherId (legacy check)
    if (plan.teacherId && typeof plan.teacherId === 'object') {
      if ((plan.teacherId as any).schoolId?.name) return (plan.teacherId as any).schoolId.name
      if ((plan.teacherId as any).school?.name) return (plan.teacherId as any).school.name
      if ((plan.teacherId as any).schoolId && typeof (plan.teacherId as any).schoolId === 'string') {
        const school = schools.find(s => s._id === (plan.teacherId as any).schoolId)
        if (school) return school.name
      }
    }
    
    return 'N/A'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'revision_required': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'revision_required': return <AlertTriangle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleActionClick = (plan: LessonPlan, action: 'approve' | 'reject' | 'revision') => {
    setSelectedPlan(plan)
    setReviewData({
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_required',
      comments: ['']
    })
    setIsModalOpen(true)
  }

  const submitReview = async () => {
    if (!selectedPlan) return

    try {
      setIsSubmitting(true)
      const API = process.env.NEXT_PUBLIC_SRS_SERVER
      
      let endpoint = ''
      let body: any = {}

      if (reviewData.status === 'approved') {
        endpoint = `${API}/admin/lesson-plans/${selectedPlan._id}/approve`
        body = {
          comments: reviewData.comments.filter(c => c.trim() !== '').join('; ')
        }
      } else if (reviewData.status === 'rejected') {
        endpoint = `${API}/admin/lesson-plans/${selectedPlan._id}/reject`
        body = {
          feedback: reviewData.comments.filter(c => c.trim() !== '')
        }
      } else if (reviewData.status === 'revision_required') {
        endpoint = `${API}/admin/lesson-plans/${selectedPlan._id}/request-revision`
        body = {
          comments: reviewData.comments.filter(c => c.trim() !== '')
        }
      }
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(`Lesson plan ${reviewData.status === 'approved' ? 'approved' : reviewData.status === 'rejected' ? 'rejected' : 'revision requested'} successfully!`)
        setIsModalOpen(false)
        setSelectedPlan(null)
        setReviewData({
          status: 'approved',
          comments: ['']
        })
        await fetchLessonPlans()
        await fetchStats()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to ${reviewData.status} lesson plan`)
      }
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error(error.message || `Failed to ${reviewData.status} lesson plan`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateComment = (index: number, value: string) => {
    setReviewData(prev => ({
      ...prev,
      comments: prev.comments.map((comment, i) => i === index ? value : comment)
    }))
  }

  const addComment = () => {
    setReviewData(prev => ({
      ...prev,
      comments: [...prev.comments, '']
    }))
  }

  const removeComment = (index: number) => {
    setReviewData(prev => ({
      ...prev,
      comments: prev.comments.filter((_, i) => i !== index)
    }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lesson Plan Approval</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve teacher lesson plans across all schools</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-gray-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Plans</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revision Req.</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.revision_required}</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by title, course, or teacher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="w-full md:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="revision_required">Revision Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={schoolFilter} onValueChange={(value) => {
                  setSchoolFilter(value)
                  setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filter changes
                  fetchStats()
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools && Array.isArray(schools) && schools.length > 0 ? (
                      schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}{school.schoolCode ? ` (${school.schoolCode})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-schools" disabled>
                        No schools available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Plans ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : lessonPlans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No lesson plans found</h3>
                <p className="text-gray-600 dark:text-gray-400">No lesson plans match your search criteria.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lessonPlans.map((plan) => (
                        <TableRow key={plan._id}>
                          <TableCell className="font-medium">
                            {getSchoolName(plan)}
                          </TableCell>
                          <TableCell className="font-medium">{plan.title}</TableCell>
                          <TableCell>
                            {plan.courseId?.courseName || 'N/A'}
                            {plan.courseId?.courseCode && (
                              <span className="text-sm text-gray-500 ml-1">({plan.courseId.courseCode})</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {plan.teacherId?.firstName} {plan.teacherId?.lastName}
                          </TableCell>
                          <TableCell>{plan.duration} min</TableCell>
                          <TableCell>
                            {new Date(plan.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(plan.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(plan.status)}
                                {plan.status.replace('_', ' ')}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(plan.status === 'pending' || String(plan.status).toLowerCase().trim() === 'pending') && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setViewDetailsPlan(plan)
                                        setIsViewDetailsModalOpen(true)
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                      View Lesson Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleActionClick(plan, 'approve')}>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleActionClick(plan, 'revision')}>
                                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                                      Request Revision
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleActionClick(plan, 'reject')}>
                                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {plan.status !== 'pending' && String(plan.status).toLowerCase().trim() !== 'pending' && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedPlan(plan)
                                      setIsModalOpen(true)
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 0 && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                      <Select
                        value={pagination.limit.toString()}
                        onValueChange={(value) => handlePageSizeChange(Number(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {pagination.totalPages > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1 || isLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i
                          } else {
                            pageNum = pagination.page - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      {pagination.totalPages > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages || isLoading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} plans
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.title}</DialogTitle>
            <DialogDescription>
              {selectedPlan?.courseId?.courseName} • {selectedPlan?.teacherId?.firstName} {selectedPlan?.teacherId?.lastName}
              {selectedPlan && (
                <span className="block mt-1">School: {getSchoolName(selectedPlan)}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6">
              {/* Plan Details */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedPlan.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Objectives
                  </h4>
                  <ul className="space-y-2">
                    {selectedPlan.objectives.map((objective, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2">
                        <span className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full mt-2"></span>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Required Materials
                  </h4>
                  <ul className="space-y-2">
                    {selectedPlan.materials.map((material, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2">
                        <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                        {material}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-medium">{selectedPlan.duration} minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                  <p className="font-medium">{new Date(selectedPlan.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Course Code</p>
                  <p className="font-medium">{selectedPlan.courseId?.courseCode || 'N/A'}</p>
                </div>
              </div>

              {selectedPlan.reviewComments && selectedPlan.reviewComments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Previous Comments
                  </h4>
                  <div className="space-y-2">
                    {selectedPlan.reviewComments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Form - Only show for pending plans */}
              {selectedPlan.status === 'pending' && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label htmlFor="decision">Decision</Label>
                    <Select 
                      value={reviewData.status} 
                      onValueChange={(value: any) => setReviewData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="revision_required">Request Revision</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Comments/Feedback</Label>
                    {reviewData.comments.map((comment, index) => (
                      <div key={index} className="mt-2 flex gap-2">
                        <Textarea
                          value={comment}
                          onChange={(e) => updateComment(index, e.target.value)}
                          placeholder={`Comment ${index + 1}`}
                          rows={3}
                          className="flex-1"
                        />
                        {reviewData.comments.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeComment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addComment} className="mt-2">
                      Add Comment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              {selectedPlan?.status === 'pending' ? 'Cancel' : 'Close'}
            </Button>
            {selectedPlan?.status === 'pending' && (
              <Button onClick={submitReview} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `${reviewData.status.charAt(0).toUpperCase() + reviewData.status.slice(1).replace('_', ' ')} Lesson Plan`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal - Read Only */}
      <Dialog open={isViewDetailsModalOpen} onOpenChange={setIsViewDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{viewDetailsPlan?.title}</DialogTitle>
            <DialogDescription className="text-base">
              {viewDetailsPlan?.courseId?.courseName} • {viewDetailsPlan?.teacherId?.firstName} {viewDetailsPlan?.teacherId?.lastName}
              {viewDetailsPlan && (
                <span className="block mt-1 text-sm">School: {getSchoolName(viewDetailsPlan)}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewDetailsPlan && (
            <div className="space-y-6 py-4">
              {/* Plan Details */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Description</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{viewDetailsPlan.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Learning Objectives
                  </h4>
                  <ul className="space-y-2">
                    {viewDetailsPlan.objectives && viewDetailsPlan.objectives.length > 0 ? (
                      viewDetailsPlan.objectives.map((objective, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2">
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                          <span>{objective}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 dark:text-gray-400 text-sm">No objectives listed</li>
                    )}
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Required Materials
                  </h4>
                  <ul className="space-y-2">
                    {viewDetailsPlan.materials && viewDetailsPlan.materials.length > 0 ? (
                      viewDetailsPlan.materials.map((material, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2">
                          <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                          <span>{material}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 dark:text-gray-400 text-sm">No materials listed</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{viewDetailsPlan.duration} minutes</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Submitted</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(viewDetailsPlan.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Course Code</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {viewDetailsPlan.courseId?.courseCode || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <Badge className={getStatusColor(viewDetailsPlan.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(viewDetailsPlan.status)}
                      {viewDetailsPlan.status.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
              </div>

              {viewDetailsPlan.reviewComments && viewDetailsPlan.reviewComments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Previous Comments
                  </h4>
                  <div className="space-y-2">
                    {viewDetailsPlan.reviewComments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-purple-500">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewDetailsPlan.reviewedAt && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reviewed At</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(viewDetailsPlan.reviewedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {viewDetailsPlan.reviewedBy && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reviewed By</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {viewDetailsPlan.reviewedBy.firstName} {viewDetailsPlan.reviewedBy.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

