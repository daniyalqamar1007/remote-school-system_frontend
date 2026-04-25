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
  Filter,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Loader2,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi, studentsApi, adminApi } from '@/lib/api'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

export default function SportsAssignmentsPage() {
  const searchParams = useSearchParams()
  const [assignments, setAssignments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [showAssignModal, setShowAssignModal] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSchools()
    fetchProgramsAndStudents()
    fetchAssignments(currentPage, pageSize, searchTerm, 'all', statusFilter, schoolFilter)
  }, [])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchAssignments(1, pageSize, searchTerm, 'all', statusFilter, schoolFilter)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, schoolFilter, pageSize])

  useEffect(() => {
    fetchAssignments(currentPage, pageSize, searchTerm, 'all', statusFilter, schoolFilter)
  }, [currentPage])

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        const schoolsList = data?.data?.schools || data?.schools || []
        setSchools(schoolsList)
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
    }
  }

  const fetchProgramsAndStudents = async () => {
    try {
      const [programsRes, studentsRes] = await Promise.all([
        sportsApi.programs.getAll({ page: '1', limit: '100' }),
        adminApi.students.getAll({ page: '1', limit: '100' })
      ])

      let programsList: any[] = []
      let studentsList: any[] = []

      if (programsRes?.data) {
        programsList = Array.isArray(programsRes.data.programs) 
          ? programsRes.data.programs 
          : Array.isArray(programsRes.data)
            ? programsRes.data
            : []
      } else if (programsRes?.programs) {
        programsList = Array.isArray(programsRes.programs) ? programsRes.programs : []
      } else if (Array.isArray(programsRes)) {
        programsList = programsRes
      }

      if (studentsRes?.data) {
        studentsList = Array.isArray(studentsRes.data.students) 
          ? studentsRes.data.students 
          : Array.isArray(studentsRes.data)
            ? studentsRes.data
            : []
      } else if (studentsRes?.students) {
        studentsList = Array.isArray(studentsRes.students) ? studentsRes.students : []
      } else if (Array.isArray(studentsRes)) {
        studentsList = studentsRes
      }

      // Filter students to only show those with athletics: true
      // Note: Further filtering by school will happen in the modal when school is selected
      studentsList = studentsList.filter((student: any) => 
        student.athletics === true || student.athletics === 'true'
      )

      setPrograms(programsList)
      setStudents(studentsList)
    } catch (error: any) {
      console.error('Error fetching programs and students:', error)
      toast.error(error?.message || 'Failed to load programs and students')
    }
  }

  const fetchAssignments = async (page: number, limit: number, search: string, _program: string, status: string, school: string) => {
    try {
      setAssignmentsLoading(true)
      const filters: any = { page: page.toString(), limit: limit.toString() }
      
      if (status !== 'all') {
        filters.status = status
      }

      // Add schoolId filter for super-admin
      if (school && school !== 'all') {
        filters.schoolId = school
      }

      const assignmentsRes = await sportsApi.assignments.getAll(filters)

      let assignmentsList: any[] = []
      let total = 0

      if (assignmentsRes?.data) {
        if (assignmentsRes.data.assignments) {
          assignmentsList = Array.isArray(assignmentsRes.data.assignments) 
            ? assignmentsRes.data.assignments 
            : []
          total = assignmentsRes.data.pagination?.total || assignmentsRes.data.pagination?.totalCount || assignmentsList.length
        } else if (Array.isArray(assignmentsRes.data)) {
          assignmentsList = assignmentsRes.data
          total = assignmentsList.length
        }
      } else if (assignmentsRes?.assignments) {
        assignmentsList = Array.isArray(assignmentsRes.assignments) ? assignmentsRes.assignments : []
        total = assignmentsList.length
      } else if (Array.isArray(assignmentsRes)) {
        assignmentsList = assignmentsRes
        total = assignmentsList.length
      }

      // Apply search filter on frontend if needed
      if (search) {
        assignmentsList = assignmentsList.filter((assignment: any) =>
          assignment.student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          assignment.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          assignment.program?.name?.toLowerCase().includes(search.toLowerCase())
        )
      }

      setAssignments(assignmentsList)
      setTotalAssignments(total)
    } catch (error: any) {
      console.error('Error fetching assignments:', error)
      toast.error(error?.message || 'Failed to load assignments')
    } finally {
      setAssignmentsLoading(false)
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleStatusUpdate = async (assignmentId: string, newStatus: string) => {
    try {
      const result = await sportsApi.assignments.update(assignmentId, { status: newStatus })
      if (result?.success || result?.statusCode === 200) {
        toast.success(result?.message || 'Assignment status updated successfully')
      } else {
        toast.success('Assignment status updated successfully')
      }
      fetchAssignments(currentPage, pageSize, searchTerm, 'all', statusFilter, schoolFilter)
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
      // Refresh the assignments list immediately after deletion
      await fetchAssignments(currentPage, pageSize, searchTerm, 'all', statusFilter, schoolFilter)
      
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

  const handleAssignStudent = async (assignmentData: any) => {
    try {
      const result = await sportsApi.assignments.create(assignmentData)
      if (result?.success || result?.statusCode === 201 || result?.data) {
        toast.success(result?.message || 'Student assigned to sports program successfully')
        fetchAssignments(currentPage, pageSize, searchTerm, 'all', statusFilter, schoolFilter)
      } else {
        toast.success('Student assigned to sports program successfully')
        fetchAssignments(currentPage, pageSize, searchTerm, 'all', statusFilter, schoolFilter)
      }
    } catch (error: any) {
      console.error('Error assigning student:', error)
      // Show backend error message if available
      const errorMessage = error?.response?.data?.message || 
                          error?.data?.message || 
                          error?.message || 
                          'Failed to assign student to sports program'
      toast.error(errorMessage)
      throw error
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const totalPages = Math.ceil(totalAssignments / pageSize)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/sports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Assignments</h1>
            <p className="text-gray-600 mt-1">Manage student assignments to sports programs</p>
          </div>
        </div>
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => setShowAssignModal(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Student
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
                  placeholder="Search by student name or program..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school._id} value={school._id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Student Assignments ({totalAssignments})
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
                  <TableHead>Student Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Student ID</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="hidden sm:table-cell">School</TableHead>
                  <TableHead className="hidden lg:table-cell">Assigned Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(assignments) || assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No student assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment: any) => (
                    <TableRow key={assignment._id}>
                      <TableCell className="font-medium">
                        {assignment.student?.firstName && assignment.student?.lastName 
                          ? `${assignment.student.firstName} ${assignment.student.lastName}`
                          : assignment.student?.email || 'Unknown Student'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {assignment.student?.studentId || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.program?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500 lg:hidden">
                            {assignment.assignedDate || assignment.enrollmentDate ? 
                              new Date(assignment.assignedDate || assignment.enrollmentDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {assignment.program?.schoolId?.name || assignment.program?.school?.name || assignment.schoolId?.name || assignment.school?.name || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {assignment.assignedDate || assignment.enrollmentDate ? 
                          new Date(assignment.assignedDate || assignment.enrollmentDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(assignment.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(assignment.status)}
                            <span className="capitalize">{assignment.status || 'unknown'}</span>
                          </div>
                        </Badge>
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
                          <Link href={`/super-admin/sports/assignments/${assignment._id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
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
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalAssignments)} of {totalAssignments} assignments
          </div>
        </div>
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
          programs={programs}
          students={students}
          schools={schools}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignStudent}
        />
      )}
    </div>
  )
}

// Assign Student Modal Component
function AssignStudentModal({ programs, students, schools: propSchools, onClose, onAssign }: any) {
  const [selectedSchool, setSelectedSchool] = useState('')
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [medicalNotes, setMedicalNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [schools, setSchools] = useState<any[]>([])

  React.useEffect(() => {
    // Fetch schools on mount
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          const data = await response.json()
          const schoolsList = data?.data?.schools || data?.schools || []
          setSchools(schoolsList.length > 0 ? schoolsList : (propSchools || []))
        }
      } catch (error) {
        console.error('Error fetching schools:', error)
      }
    }
    fetchSchools()
  }, [])

  React.useEffect(() => {
    // Filter programs and students by selected school AND athletics: true
    if (selectedSchool) {
      const filteredProgs = programs.filter((p: any) => 
        p.schoolId?._id === selectedSchool || 
        p.schoolId === selectedSchool ||
        p.school?._id === selectedSchool ||
        p.school === selectedSchool
      )
      // Filter students by school AND athletics: true
      const filteredStuds = students.filter((s: any) => {
        const matchesSchool = 
          s.schoolId?._id === selectedSchool || 
          s.schoolId === selectedSchool ||
          s.school?._id === selectedSchool ||
          s.school === selectedSchool
        const hasAthletics = s.athletics === true || s.athletics === 'true'
        return matchesSchool && hasAthletics
      })
      setFilteredPrograms(filteredProgs)
      setFilteredStudents(filteredStuds)
      // Reset selections when school changes
      setSelectedStudent('')
      setSelectedProgram('')
    } else {
      setFilteredPrograms([])
      setFilteredStudents([])
      setSelectedStudent('')
      setSelectedProgram('')
    }
  }, [selectedSchool, programs, students])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedProgram) {
      toast.error('Please select both student and program')
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
      setSelectedSchool('')
      setSelectedStudent('')
      setSelectedProgram('')
      setMedicalNotes('')
    } catch (error: any) {
      console.error('Error assigning student:', error)
      // Error is already handled in handleAssignStudent, modal stays open on error
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Assign Student to Sports Program</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select School * <span className="text-red-500">*</span>
            </label>
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a school first" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school: any) => (
                  <SelectItem key={school._id} value={school._id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Please select a school first to see programs and students</p>
          </div>

          {selectedSchool && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student *
                </label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedSchool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student: any) => (
                        <SelectItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} - {student.gradeLevel || student.class}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No students found for this school</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Sports Program *
                </label>
                <Select value={selectedProgram} onValueChange={setSelectedProgram} disabled={!selectedSchool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPrograms.length > 0 ? (
                      filteredPrograms.map((program: any) => (
                        <SelectItem key={program._id} value={program._id}>
                          {program.name} - {program.season}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No programs found for this school</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {selectedStudent && (
            <div className="border-t pt-4">
              <div className="mt-2">
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
              disabled={saving || !selectedSchool || !selectedStudent || !selectedProgram} 
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
