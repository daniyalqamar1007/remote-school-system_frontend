'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export default function StudentHealthRecordsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fetch students with pagination
  const fetchStudents = useCallback(async (page: number, limit: number, search: string, grade: string, status: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (search) {
        params.append('search', search)
      }
      if (grade && grade !== 'all') {
        params.append('gradeLevel', grade)
      }
      if (status && status !== 'all') {
        // Map filter values to actual status values
        const statusMap: { [key: string]: string } = {
          'healthy': 'Healthy',
          'has_alerts': 'Has Alerts',
          'on_medication': 'On Medication',
          'high_risk': 'High Risk',
          'no_record': 'No Record'
        }
        params.append('healthStatus', statusMap[status] || status)
      }

      const response = await fetch(`${API_BASE_URL}/nurse/students?${params.toString()}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        let studentsList: any[] = []
        let total = 0
        
        if (data?.students && data?.pagination) {
          studentsList = Array.isArray(data.students) ? data.students : []
          total = data.pagination.total || 0
          setTotalPages(data.pagination.totalPages || 1)
        } else if (Array.isArray(data)) {
          studentsList = data
          total = data.length
          setTotalPages(Math.ceil(data.length / limit))
        } else if (data?.data) {
          studentsList = Array.isArray(data.data) ? data.data : []
          total = studentsList.length
          setTotalPages(Math.ceil(studentsList.length / limit))
        }
        
        setStudents(studentsList)
        setTotalStudents(total)
      } else {
        console.error('Failed to fetch students')
        toast.error('Failed to load students')
        setStudents([])
      }
    } catch (error: any) {
      console.error('Error fetching students:', error)
      toast.error('Error loading students')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents(currentPage, pageSize, searchTerm, gradeFilter, statusFilter)
  }, [currentPage, pageSize])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchStudents(1, pageSize, searchTerm, gradeFilter, statusFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, gradeFilter, statusFilter, pageSize])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleViewStudent = (studentId: string) => {
    router.push(`/nurse/health-record/${studentId}`)
  }

  const handleDeleteStudent = (student: any) => {
    setStudentToDelete(student)
    setDeleteError(null) // Clear any previous errors
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!studentToDelete) return

    setDeleting(true)
    setDeleteError(null) // Clear previous errors
    
    try {
      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentToDelete._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      let data: any = {}
      try {
        data = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, create error object
        console.error('Error parsing response:', parseError)
        const errorMessage = `Failed to delete health record: ${response.statusText || 'Unknown error'}`
        setDeleteError(errorMessage)
        toast.error(errorMessage)
        setDeleting(false)
        return
      }
      
      if (response.ok && data.success !== false) {
        // Success - show toast and remove from list
        const successMessage = data.message || 'Student health record deleted successfully'
        toast.success(successMessage)
        setDeleteError(null)
        setDeleteDialogOpen(false)
        setStudentToDelete(null)
        
        // Remove the deleted student from the current list immediately
        setStudents(prev => prev.filter(student => student._id !== studentToDelete._id))
        setTotalStudents(prev => Math.max(0, prev - 1))
        
        // Refresh the list to ensure consistency
        await fetchStudents(currentPage, pageSize, searchTerm, gradeFilter, statusFilter)
      } else {
        // Error response - show in both modal and toast
        const errorMessage = data.message || data.error || `Failed to delete student health record (Status: ${response.status})`
        setDeleteError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error deleting student:', error)
      const errorMessage = error.message || 'Network error: Failed to delete student health record'
      setDeleteError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const getHealthStatusBadge = (student: any) => {
    const status = student.healthStatus || 'No Record'
    switch (status) {
      case 'High Risk':
        return <Badge variant="destructive">High Risk</Badge>
      case 'Has Alerts':
        return <Badge className="bg-yellow-500">Has Alerts</Badge>
      case 'On Medication':
        return <Badge className="bg-blue-500">On Medication</Badge>
      case 'Healthy':
        return <Badge className="bg-green-500">Healthy</Badge>
      default:
        return <Badge variant="outline">No Record</Badge>
    }
  }

  const gradeLevels = [
    { value: 'all', label: 'All Grades' },
    { value: 'Kindergarten', label: 'Kindergarten' },
    { value: 'Grade 1', label: 'Grade 1' },
    { value: 'Grade 2', label: 'Grade 2' },
    { value: 'Grade 3', label: 'Grade 3' },
    { value: 'Grade 4', label: 'Grade 4' },
    { value: 'Grade 5', label: 'Grade 5' },
    { value: 'Grade 6', label: 'Grade 6' },
    { value: 'Grade 7', label: 'Grade 7' },
    { value: 'Grade 8', label: 'Grade 8' },
    { value: 'Grade 9', label: 'Grade 9' },
    { value: 'Grade 10', label: 'Grade 10' },
    { value: 'Grade 11', label: 'Grade 11' },
    { value: 'Grade 12', label: 'Grade 12' },
  ]

  // Removed full page loading - will show loading only in table

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Health Records</h1>
          <p className="text-gray-600 mt-1">Manage student health information, allergies, medications, and nurse visits</p>
        </div>
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => router.push('/nurse/health-record/select-student')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Health Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by student name, ID, grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Students ({totalStudents})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages || 1}
              </Badge>
              <Badge variant="outline">
                {pageSize} per page
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Grade</TableHead>
                  <TableHead className="hidden md:table-cell">Section</TableHead>
                  <TableHead className="hidden md:table-cell">Age</TableHead>
                  <TableHead>Health Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Alerts</TableHead>
                  <TableHead className="hidden lg:table-cell">Medications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading students...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(students) || students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student: any) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-black">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.studentId || student.email || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-black">
                        {student.gradeLevel || student.class || 'N/A'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-black">
                        {student.section || 'N/A'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-black">
                        {student.age != null ? student.age : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getHealthStatusBadge(student)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-black">
                        {student.activeAlerts || 0}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-black">
                        {student.activeMedications || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student._id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/nurse/health-record/${student._id}/edit`)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show per page:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open)
        if (!open) {
          setDeleteError(null) // Clear error when dialog closes
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Health Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the health record for {studentToDelete?.firstName} {studentToDelete?.lastName}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 font-medium">Error:</p>
              <p className="text-sm text-red-700 mt-1">{deleteError}</p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteError(null)
              }} 
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
