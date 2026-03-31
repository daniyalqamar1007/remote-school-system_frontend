"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { BulkImportErrorModal } from "@/components/BulkImportErrorModal"
import { ExcelUploadModal } from './Add-students/excellUpload'
import { Search, Plus, Edit, Trash2, Download, Upload, Eye, EyeOff, MoreHorizontal, Loader2 } from 'lucide-react'
import axios from 'axios'
import AddStudentModal from './Add-students/AddStudents'
import { activities } from '@/lib/activities'
import { addActivity } from '@/lib/actitivityFunctions'

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

interface Student {
  _id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  class: string // Changed from 'grade' to match backend User schema
  guardianInfo?: {
    firstName: string
    lastName: string
    relationship: string
  }
  emergencyContact?: {
    firstName: string
    lastName: string
    relationship: string
    phone: string
    phoneNumber?: string
    contact?: string
  }
  status: 'active' | 'inactive'
  address?: string | { street?: string; city?: string; state?: string; zipCode?: string }
  phone?: string
  gender?: string
  dob?: string
  section?: string
  enrollDate?: string
  expectedGraduation?: string
  previousSchool?: string
  previousGrade?: string
  bloodGroup?: string
  allergies?: string[] | string
  medicalConditions?: string[] | string
  transportMode?: string
  busRoute?: string
  nationality?: string
  religion?: string
  clubs?: string[] | string
  lunch?: string
  iipFlag?: boolean
  honorRolls?: boolean
  athletics?: boolean
  parents?: Array<{ firstName?: string; lastName?: string; email?: string; phone?: string; address?: string }>
  createdAt?: string
  updatedAt?: string
}

const grades = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [importResults, setImportResults] = useState<{
    insertedCount: number
    skippedCount: number
    errors: string[] | null
  } | null>(null)
  const [importFileName, setImportFileName] = useState<string>("")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  
  // Loading states
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async (page = 1, limit = 5, search = '', grade = 'all') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')

      console.log('token for students', token)
      
      const params: any = {
        page,
        limit
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }
      
      if (grade && grade !== 'all') {
        params.grade = grade;
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params
      })
      
      // Handle new API response structure
      if (response.data.success && response.data.data) {
        const { students, pagination } = response.data.data;
        
        // Process students data to ensure proper field parsing
        const processedStudents = (students || []).map((student: any) => {
          // Map parent information to guardianInfo for compatibility
          if (student.parentIds && student.parentIds.length > 0) {
            const primaryParent = student.parentIds[0];
            student.guardianInfo = {
              firstName: primaryParent.firstName || '',
              lastName: primaryParent.lastName || '',
              relationship: 'Parent/Guardian'
            };
          }
          
          // Add status field based on isActive
          student.status = student.isActive ? 'active' : 'inactive';
          
          return student;
        });
        
        setStudents(processedStudents);
        
        // Update pagination state
        setCurrentPage(pagination.currentPage || page);
        setTotalPages(pagination.totalPages || 1);
        setTotalStudents(pagination.totalCount || 0);
        setPageSize(pagination.limit || limit);
      } else {
        setStudents([]);
        setTotalStudents(0);
        setTotalPages(1);
      }
    } catch (error) {
      // Silently log error - no toast
      console.log('Error fetching students:', error)
      setStudents([])
      setTotalStudents(0);
      setTotalPages(1);
    } finally {
      setLoading(false)
    }
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchStudents(newPage, pageSize, searchTerm, gradeFilter);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchStudents(1, newSize, searchTerm, gradeFilter);
  };

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string, grade: string) => {
      setCurrentPage(1);
      fetchStudents(1, pageSize, search, grade);
    }, 500),
    [pageSize]
  );

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value, gradeFilter);
  };

  // Handle grade filter change
  const handleGradeFilterChange = (value: string) => {
    setGradeFilter(value);
    setCurrentPage(1);
    fetchStudents(1, pageSize, searchTerm, value);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null)
    setIsAddStudentModalOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setIsAddStudentModalOpen(true)
  }

  const handleViewStudent = (student: Student) => {
    router.push(`/secretary/manage-students/view/${student._id}`)
  }

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/${studentToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      toast({
        title: "Success",
        description: "Student deleted successfully",
      })

      // Log the activity with actual student name
      const message = activities.admin.deleteStudent.description.replace("{studentName}", `${studentToDelete.firstName} ${studentToDelete.lastName}`)
      const activity = {
        title: activities.admin.deleteStudent.action,
        subtitle: message,
        performBy: "Admin",
      }
      await addActivity(activity)

      setIsDeleteDialogOpen(false)
      setStudentToDelete(null)
      fetchStudents(currentPage, pageSize, searchTerm, gradeFilter)
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  const exportStudents = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      })

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition']
      let filename = 'students.csv'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Students exported successfully",
      })
    } catch (error: any) {
      console.error("Error exporting students:", error)
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to export students"
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExcelUpload = () => {
    setIsExcelUploadModalOpen(true)
  }

  // Remove full-page loading – we'll show a table-level loader instead

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Manage Students
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Add, edit, and manage student information across your school
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleExcelUpload} 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
            <Button 
              onClick={exportStudents} 
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
            <Button 
              onClick={handleAddStudent}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              name="student-search"
              id="student-search"
            />
          </div>
          <Select value={gradeFilter} onValueChange={handleGradeFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by grade" />
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
      </div>

      {/* Students Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Students ({totalStudents})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages}
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
                  <TableHead className="w-[100px]">Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Grade</TableHead>
                  <TableHead className="hidden lg:table-cell">Guardian</TableHead>
                  <TableHead className="hidden xl:table-cell">Emergency Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-500 sm:hidden">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{student.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {student.guardianInfo ? 
                          `${student.guardianInfo.firstName} ${student.guardianInfo.lastName}` : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {student.emergencyContact?.phone || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            title="Edit student"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            title="Delete student"
                          >
                            <Trash2 className="h-4 w-4" />
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
        {/* {totalPages > 1 && ( */}
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
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
            </div>
          </div>
        {/* )} */}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete student "{studentToDelete?.firstName} {studentToDelete?.lastName}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteStudent}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        open={isExcelUploadModalOpen}
        onOpenChange={(open) => {
          setIsExcelUploadModalOpen(open)
          if (!open) {
            setImportResults(null)
            setShowErrorModal(false)
            setImportFileName("")
          }
        }}
        onClose={() => {
          setIsExcelUploadModalOpen(false)
          setImportResults(null)
          setShowErrorModal(false)
          setImportFileName("")
        }}
        refetch={() => fetchStudents(currentPage, pageSize, searchTerm, gradeFilter)}
      />

      {/* Bulk Import Error Modal */}
      {importResults && (
        <BulkImportErrorModal
          open={showErrorModal}
          onOpenChange={(open) => {
            setShowErrorModal(open)
            if (!open) {
              setImportResults(null)
              setImportFileName("")
            }
          }}
          insertedCount={importResults.insertedCount}
          skippedCount={importResults.skippedCount}
          errors={importResults.errors}
          fileName={importFileName}
        />
      )}

      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={isAddStudentModalOpen}
        onClose={() => {
          setIsAddStudentModalOpen(false)
          setSelectedStudent(null)
        }}
        studentData={selectedStudent}
        handleDone={() => {
          fetchStudents(currentPage, pageSize, searchTerm, gradeFilter)
          setIsAddStudentModalOpen(false)
          setSelectedStudent(null)
        }}
      />
    </div>
  )
}
