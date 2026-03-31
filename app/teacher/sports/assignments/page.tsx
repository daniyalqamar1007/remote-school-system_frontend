"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Users, 
  UserPlus, 
  Search,
  Eye,
  Loader2,
  Building,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi, studentsApi, adminApi, nurseApi } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function TeacherSportsAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<any[]>([])
  const [myPrograms, setMyPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [showAssignModal, setShowAssignModal] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMyPrograms()
  }, [])

  useEffect(() => {
    if (myPrograms.length > 0) {
      fetchAssignments()
    }
  }, [myPrograms, debouncedSearchTerm, statusFilter, programFilter, currentPage, pageSize])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchMyPrograms = async () => {
    try {
      const response = await sportsApi.programs.getMyCoachPrograms()
      let programsData: any[] = []
      if (response) {
        if (response.success && response.data) {
          programsData = Array.isArray(response.data) ? response.data : (Array.isArray(response.data.programs) ? response.data.programs : [])
        } else if (Array.isArray(response.data)) {
          programsData = response.data
        } else if (Array.isArray(response.programs)) {
          programsData = response.programs
        } else if (Array.isArray(response)) {
          programsData = response
        }
      }
      setMyPrograms(programsData)
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true)
      
      const filters: any = {
        page: currentPage.toString(),
        limit: pageSize.toString()
      }

      // Add program filter
      if (programFilter !== 'all') {
        filters.sportsProgramId = programFilter
      }

      // Add status filter
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }

      // Add search filter
      if (debouncedSearchTerm.trim()) {
        filters.search = debouncedSearchTerm.trim()
      }

      const response = await sportsApi.assignments.getAll(filters)
      
      let assignmentsData: any[] = []
      let paginationData: any = {}
      
      if (response?.data?.assignments) {
        assignmentsData = Array.isArray(response.data.assignments) ? response.data.assignments : []
        paginationData = response.data.pagination || {}
      } else if (Array.isArray(response?.assignments)) {
        assignmentsData = response.assignments
      } else if (Array.isArray(response?.data)) {
        assignmentsData = response.data
      } else if (Array.isArray(response)) {
        assignmentsData = response
      }

      setAssignments(assignmentsData)
      
      // Update pagination
      if (paginationData.totalPages !== undefined) {
        setTotalPages(paginationData.totalPages)
        setCurrentPage(paginationData.currentPage || currentPage)
        setTotalAssignments(paginationData.totalCount || paginationData.total || assignmentsData.length)
      } else {
        const total = assignmentsData.length
        const totalPagesCount = Math.ceil(total / pageSize)
        setTotalPages(totalPagesCount)
        setTotalAssignments(total)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to load assignments')
      setAssignments([])
    } finally {
      setAssignmentsLoading(false)
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (assignmentId: string, newStatus: string) => {
    try {
      const result = await sportsApi.assignments.update(assignmentId, { status: newStatus })
      if (result?.success || result?.statusCode === 200) {
        toast.success(result?.message || 'Assignment status updated successfully')
      } else {
        toast.success('Assignment status updated successfully')
      }
      fetchAssignments()
    } catch (error: any) {
      console.error('Error updating assignment:', error)
      toast.error(error?.message || 'Failed to update assignment status')
    }
  }

  const handleRemoveAssignment = (assignment: any) => {
    setAssignmentToDelete(assignment)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return

    setDeleting(true)
    try {
      const result = await sportsApi.assignments.remove(assignmentToDelete._id, {})
      if (result?.success || result?.statusCode === 200) {
        toast.success(result?.message || 'Student removed from sports program successfully')
      } else {
        toast.success('Student removed from sports program successfully')
      }
      setDeleteDialogOpen(false)
      setAssignmentToDelete(null)
      await fetchAssignments()
      
      // If current page becomes empty after deletion, go to previous page
      if (assignments.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (error: any) {
      console.error('Error removing assignment:', error)
      toast.error(error?.message || 'Failed to remove student from sports program')
    } finally {
      setDeleting(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleProgramFilterChange = (value: string) => {
    setProgramFilter(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Assignments</h1>
          <p className="text-gray-600 mt-1">Manage student assignments to your sports programs</p>
        </div>
        <Button onClick={() => setShowAssignModal(true)} className="bg-black hover:bg-gray-800 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={programFilter} onValueChange={handleProgramFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {myPrograms.map((program: any) => (
                  <SelectItem key={program._id} value={program._id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Student Assignments ({totalAssignments})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages || 1}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No assignments found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="hidden sm:table-cell">School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Assigned Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment: any) => {
                    const student = assignment.studentId || assignment.student
                    const program = assignment.sportsProgramId || assignment.program
                    
                    return (
                      <TableRow key={assignment._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student?.firstName} {student?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student?.studentId || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{program?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {program?.schoolId?.name || program?.school?.name || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {assignment.assignedDate 
                            ? new Date(assignment.assignedDate).toLocaleDateString()
                            : assignment.enrollmentDate
                            ? new Date(assignment.enrollmentDate).toLocaleDateString()
                            : assignment.createdAt 
                            ? new Date(assignment.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {(assignment.status === 'pending' || assignment.status === 'active') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(assignment._id, assignment.status === 'active' ? 'inactive' : 'active')}
                                title={assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                {assignment.status === 'active' ? (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            )}
                            {assignment.status === 'inactive' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(assignment._id, 'active')}
                                title="Reactivate"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/teacher/sports/assignments/${assignment._id}`)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment)}
                              title="Remove from program"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {/* Pagination */}
        {totalAssignments > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || assignmentsLoading}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                      disabled={assignmentsLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || assignmentsLoading}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {assignments.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalAssignments)} of {totalAssignments} assignments
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {assignmentToDelete?.student?.firstName} {assignmentToDelete?.student?.lastName} from the sports program "{assignmentToDelete?.program?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setAssignmentToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAssignment}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Student Modal */}
      {showAssignModal && (
        <AssignStudentModal
          programs={myPrograms}
          onClose={() => {
            setShowAssignModal(false)
          }}
          onAssign={async (assignmentData: any) => {
            try {
              const result = await sportsApi.assignments.create(assignmentData)
              if (result?.success || result?.statusCode === 201 || result?.data) {
                toast.success(result?.message || 'Student assigned to sports program successfully')
                await fetchAssignments()
              } else {
                toast.success('Student assigned to sports program successfully')
                await fetchAssignments()
              }
            } catch (error: any) {
              console.error('Error assigning student:', error)
              const errorMessage = error?.response?.data?.message || 
                                  error?.data?.message || 
                                  error?.message || 
                                  'Failed to assign student to sports program'
              toast.error(errorMessage)
              throw error
            }
          }}
        />
      )}
    </div>
  )
}

// Assign Student Modal Component - For Teachers (no school dropdown, auto-fetch from teacher's school)
function AssignStudentModal({ programs, onClose, onAssign }: any) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [healthRecord, setHealthRecord] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<string>('')
  const [isHealthy, setIsHealthy] = useState<boolean>(false)
  const [medicalNotes, setMedicalNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingHealth, setLoadingHealth] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  // Get school ID from programs (all teacher's programs are from the same school)
  const getSchoolId = () => {
    if (programs && programs.length > 0) {
      const firstProgram = programs[0]
      return firstProgram?.schoolId?._id || 
             firstProgram?.schoolId || 
             firstProgram?.school?._id || 
             firstProgram?.school || 
             null
    }
    return null
  }

  React.useEffect(() => {
    // Fetch students from teacher's school on mount
    const fetchStudentsForSchool = async () => {
      try {
        setLoadingStudents(true)
        const schoolId = getSchoolId()
        
        if (!schoolId) {
          console.error('No school ID found from programs')
          setStudents([])
          setLoadingStudents(false)
          return
        }

        // Use adminApi - backend now supports TEACHER role and filters by schoolId automatically
        const response = await adminApi.students.getAll({ 
          page: '1',
          limit: '10000'
        })
        
        let studentsList: any[] = []
        
        // Handle different response structures (same as admin)
        if (response?.data) {
          if (Array.isArray(response.data.students)) {
            studentsList = response.data.students
          } else if (Array.isArray(response.data)) {
            studentsList = response.data
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            studentsList = response.data.data
          }
        } else if (response?.students) {
          studentsList = Array.isArray(response.students) ? response.students : []
        } else if (Array.isArray(response)) {
          studentsList = response
        }
        
        // Filter students by athletics enabled (same logic as admin)
        studentsList = studentsList.filter((student: any) => {
          if (!student || !student._id) {
            return false
          }
          
          const athletics = student.athletics
          const athleticsValue = athletics
          
          // Check if athletics is true in any format (same as admin)
          const hasAthletics = 
            athleticsValue === true || 
            athleticsValue === 'true' || 
            athleticsValue === 1 || 
            athleticsValue === '1' ||
            (typeof athleticsValue === 'string' && athleticsValue.toLowerCase().trim() === 'true')
          
          return hasAthletics
        })
        
        console.log('Fetched students for teacher:', studentsList.length)
        setStudents(studentsList)
      } catch (error: any) {
        console.error('Error fetching students:', error)
        setStudents([])
        toast.error(error?.message || 'Failed to load students')
      } finally {
        setLoadingStudents(false)
      }
    }
    
    fetchStudentsForSchool()
  }, [programs])

  React.useEffect(() => {
    if (selectedStudent) {
      fetchHealthRecord(selectedStudent)
    } else {
      setHealthRecord(null)
      setHealthStatus('')
      setIsHealthy(false)
    }
  }, [selectedStudent])

  const fetchHealthRecord = async (studentId: string) => {
    try {
      setLoadingHealth(true)
      const healthData = await nurseApi.healthRecords.getByStudentId(studentId)
      
      // Backend returns { message: 'No health record found', studentId, academicYear } when no record exists
      // Check if this is a "no record" response - must have _id to be a valid record
      const isNoRecordResponse = !healthData || 
          healthData === null || 
          healthData?.message === 'No health record found' ||
          healthData?.message === 'Health record not found' ||
          (!healthData._id && !healthData.studentId && healthData.message) ||
          (healthData.message && !healthData._id)
      
      if (isNoRecordResponse) {
        console.log('No health record found for student:', studentId, '- Setting to No Record')
        setHealthRecord(null)
        setHealthStatus('No Record')
        setIsHealthy(false) // Disable assignment when no health record
        return
      }

      // Critical check: A valid health record MUST have _id
      // If it doesn't have _id, it's not a valid record (even if it has other fields)
      if (!healthData._id) {
        console.log('Invalid health record - missing _id:', healthData, '- Setting to No Record')
        setHealthRecord(null)
        setHealthStatus('No Record')
        setIsHealthy(false) // Disable assignment when invalid record
        return
      }

      setHealthRecord(healthData)

      // Calculate health status using EXACT same logic as backend nurse.service.ts getHealthStatus method
      // This ensures consistency with what nurse module shows
      const getHealthStatus = (healthRecord: any): string => {
        // Double check - if no _id, it's not a valid record
        if (!healthRecord || !healthRecord._id) return 'No Record'

        const activeAlerts = healthRecord.healthAlerts?.filter((alert: any) => alert.isActive) || []
      const highPriorityAlerts = activeAlerts.filter((alert: any) =>
        alert.severity === 'high' || alert.severity === 'critical'
      )

        if (highPriorityAlerts.length > 0) return 'High Risk'
        if (activeAlerts.length > 0) return 'Has Alerts'

        const activeMeds = healthRecord.medicationLog?.filter((med: any) => med.isActive) || []
        if (activeMeds.length > 0) return 'On Medication'

        return 'Healthy'
      }

      const status = getHealthStatus(healthData)
      
      // Only "Healthy" and "On Medication" allow assignment
      // "High Risk", "Has Alerts", and "No Record" disable assignment
      const healthy = status === 'Healthy' || status === 'On Medication'

      setHealthStatus(status)
      setIsHealthy(healthy) // This enables the button when status is "Healthy" or "On Medication"
    } catch (error: any) {
      console.error('Error fetching health record:', error)
      // If error fetching health record, treat as no record
      setHealthRecord(null)
      setHealthStatus('No Record')
      setIsHealthy(false) // Disable assignment on error
    } finally {
      setLoadingHealth(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedProgram) {
      toast.error('Please select both student and program')
      return
    }

    if (!isHealthy) {
      if (healthStatus === 'No Record') {
        toast.error('Student cannot be assigned. No health record found. The nurse must create a health record first.')
      } else {
      toast.error(`Student cannot be assigned. Health status: ${healthStatus}. Student must be healthy to participate in sports.`)
      }
      return
    }

    setSaving(true)
    try {
      const currentYear = new Date().getFullYear()
      const academicYear = `${currentYear}-${currentYear + 1}`
      
      await onAssign({
        studentId: selectedStudent,
        sportsProgramId: selectedProgram,
        academicYear: academicYear,
        enrollmentDate: new Date().toISOString(),
        medicalNotes: medicalNotes.trim() || undefined
      })
      onClose()
      setSelectedStudent('')
      setSelectedProgram('')
      setMedicalNotes('')
      setHealthRecord(null)
      setHealthStatus('')
      setIsHealthy(false)
    } catch (error: any) {
      console.error('Error assigning student:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Assign Student to Sports Program</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student *
              </label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={loadingStudents}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingStudents ? "Loading students..." : "Choose a student"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingStudents ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">Loading students...</div>
                  ) : students.length > 0 ? (
                    students.map((student: any) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} - {student.gradeLevel || student.class || 'N/A'}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No students found</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Sports Program *
              </label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs && programs.length > 0 ? (
                    programs.map((program: any) => (
                      <SelectItem key={program._id} value={program._id}>
                        {program.name} - {program.season}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No programs available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Health Status Section */}
          {selectedStudent && (
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">Health Status</h4>
              
              {loadingHealth ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Checking health status...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border-2 ${
                    isHealthy 
                      ? 'bg-green-50 border-green-200' 
                      : healthStatus === 'No Record'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${
                          isHealthy ? 'text-green-800' : healthStatus === 'No Record' ? 'text-yellow-800' : 'text-red-800'
                        }`}>
                          Health Status: {healthStatus}
                        </p>
                        {healthStatus === 'No Record' ? (
                          <p className="text-sm text-yellow-700 mt-1">
                            ⚠️ No health record found. The nurse has not created a health record for this student.
                            <span className="block text-xs text-yellow-600 mt-1 font-medium">
                              Student cannot be assigned until a health record is created by the nurse.
                              </span>
                          </p>
                        ) : healthStatus === 'High Risk' ? (
                          <p className="text-sm text-red-700 mt-1">
                            ✗ Student has high or critical priority health alerts. Cannot be assigned to sports.
                          </p>
                        ) : healthStatus === 'Has Alerts' ? (
                          <p className="text-sm text-red-700 mt-1">
                            ✗ Student has active health alerts. Cannot be assigned to sports.
                          </p>
                        ) : healthStatus === 'On Medication' ? (
                          <p className="text-sm text-green-700 mt-1">
                            ✓ Student is on medication but can be assigned to sports
                          </p>
                        ) : (
                          <p className="text-sm text-green-700 mt-1">
                            ✓ Student is healthy and can be assigned to sports
                          </p>
                        )}
                      </div>
                      {isHealthy ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : healthStatus === 'No Record' ? (
                        <XCircle className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                  
                  {healthRecord && healthRecord.healthAlerts?.filter((alert: any) => alert.isActive).length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm font-medium mb-2">
                        ⚠️ Active Health Alerts ({healthRecord.healthAlerts.filter((alert: any) => alert.isActive).length}):
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                        {healthRecord.healthAlerts
                          .filter((alert: any) => alert.isActive)
                          .slice(0, 3)
                          .map((alert: any, index: number) => (
                            <li key={index}>
                              <span className="font-medium">{alert.title || alert.type || 'Alert'}:</span> {alert.description || 'No description'}
                              {alert.severity && (
                                <Badge variant={alert.severity === 'high' || alert.severity === 'critical' ? 'destructive' : 'default'} className="ml-2 text-xs">
                                  {alert.severity}
                                </Badge>
                              )}
                            </li>
                          ))}
                        {healthRecord.healthAlerts.filter((alert: any) => alert.isActive).length > 3 && (
                          <li className="text-yellow-600">
                            +{healthRecord.healthAlerts.filter((alert: any) => alert.isActive).length - 3} more alerts
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Notes (Optional)
                </label>
                <textarea
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="Add any medical notes or considerations for this assignment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving || loadingStudents || !selectedStudent || !selectedProgram || !isHealthy || loadingHealth} 
              className="flex-1"
            >
              {saving ? 'Assigning...' : 'Assign Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
