"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import { Edit, Trash2, Plus, Loader2, FileText, Eye, Upload, Download, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { activities } from "@/lib/activities"
import { addActivity } from "@/lib/actitivityFunctions"
import { TeachersExcelUploadModal } from "./Add-Teachers/excellUpload"
import { BulkImportErrorModal } from "@/components/BulkImportErrorModal"
import AddTeacherModal from "./Add-Teachers/AddTeachers"
import AssignCoursesModal from "./assignedCourseModal"
import CourseAssignmentModal from "./CourseAssignmentModal"
import { useRouter } from "next/navigation"

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

interface Teacher {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  address: string
  qualification: string
  // profilePhoto?: string
  employeeId?: string
  schoolId?: { _id: string; name: string }
  createdAt?: string
}

interface School {
  _id: string
  name: string
  schoolCode?: string
}

export default function TeachersTable() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("")
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignCoursesModalOpen, setIsAssignCoursesModalOpen] = useState(false)
  const [isCourseAssignmentModalOpen, setIsCourseAssignmentModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [teacherForAssignment, setTeacherForAssignment] = useState<Teacher | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importSchoolId, setImportSchoolId] = useState<string>("")
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [importResults, setImportResults] = useState<{
    insertedCount: number
    skippedCount: number
    errors: string[] | null
  } | null>(null)
  const [importFileName, setImportFileName] = useState<string>("")
  const errorModalTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const errorModalManuallyClosedRef = useRef(false)

  const fetchTeachers = useCallback(async (page = 1, pageLimit = 10, query = "", schoolId = "") => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const base = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers`
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageLimit))
      if (query.trim()) params.set('search', query.trim())
      if (schoolId && schoolId.trim()) params.set('schoolId', schoolId.trim())
      const url = `${base}?${params.toString()}`
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const list = response.data?.data?.teachers || []
      const pg = response.data?.data?.pagination || {}
      setTeachers(Array.isArray(list) ? list : [])
      setCurrentPage(pg.currentPage || page)
      setTotalPages(pg.totalPages || 1)
      setTotalCount(pg.totalCount || 0)
      setLimit(pg.limit || pageLimit)
    } catch (error) {
      console.error("Error fetching teachers:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSchools = async () => {
    try {
      setIsSchoolsLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const list = response.data?.data?.schools || response.data?.data || []
      setSchools(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error("Error fetching schools:", error)
    } finally {
      setIsSchoolsLoading(false)
    }
  }

  useEffect(() => {
    // initial load
    fetchSchools()
    fetchTeachers(1, limit, "", selectedSchoolId)
  }, [fetchTeachers])

  // debounce search term into debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    fetchTeachers(1, limit, debouncedSearch, selectedSchoolId)
  }, [debouncedSearch, selectedSchoolId])

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return

    const schoolIdParam = teacherToDelete.schoolId?._id || selectedSchoolId
    if (!schoolIdParam) {
      toast.error("School ID is required for deletion")
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/${teacherToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          schoolId: schoolIdParam
        }
      })
      toast.success("Teacher deleted successfully")

      const message = activities.admin.deleteTeacher.description
      const activity = {
        title: activities.admin.deleteTeacher.action,
        subtitle: message,
        performBy: "Admin",
      }
      await addActivity(activity)
      
      setDeleteConfirmOpen(false)
      setTeacherToDelete(null)
      fetchTeachers(currentPage, limit, debouncedSearch, selectedSchoolId)
    } catch (error) {
      console.error("Error deleting teacher:", error)
      toast.error("Failed to delete teacher")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setTeacherToDelete(null)
  }

  const exportTeachers = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/export`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob',
      })
      const contentDisposition = (response as any).headers?.['content-disposition']
      let filename = 'teachers.csv'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/i)
        if (match && match[1]) filename = match[1]
      }
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error exporting teachers:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExcelUpload = () => {
    setIsImportModalOpen(true)
  }

  const handleEditTeacher = async (teacher: Teacher) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const schoolIdParam = teacher.schoolId?._id || selectedSchoolId
      if (!schoolIdParam) {
        toast.error("School ID is required to edit teacher")
        return
      }
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/${teacher._id}?schoolId=${schoolIdParam}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const full = res.data?.data?.teacher || teacher
      setSelectedTeacher(full)
      setIsModalOpen(true)
    } catch (e) {
      console.error('Failed to load teacher details', e)
      toast.error("Failed to load teacher details")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTeacher(null)
  }

  const handlePageChange = (page: number) => {
    const p = Math.max(1, Math.min(totalPages, page))
    fetchTeachers(p, limit, debouncedSearch, selectedSchoolId)
  }

  const handleSchoolFilterChange = (schoolId: string) => {
    const next = schoolId === "all" ? "" : schoolId
    setSelectedSchoolId(next)
    setCurrentPage(1)
    fetchTeachers(1, limit, debouncedSearch, next)
  }

  return (
    <div className="container mx-auto py-6 lg:py-10 px-4 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold">Teachers</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={exportTeachers} variant="outline" className="w-full sm:w-auto" disabled={isExporting}>
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
          <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          placeholder="Search teachers by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <div className="min-w-[200px]">
          <Select
            value={selectedSchoolId || "all"}
            onValueChange={handleSchoolFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school._id} value={school._id}>
                  {school.name}{school.schoolCode ? ` (${school.schoolCode})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Employee ID</TableHead>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="min-w-[200px] hidden sm:table-cell">Email</TableHead>
                  <TableHead className="min-w-[150px] hidden md:table-cell">School Name</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Gender</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Record Created At</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <TableRow key={teacher._id}>
                      <TableCell className="truncate max-w-[180px]">{teacher.employeeId || '—'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{teacher.firstName} {teacher.lastName || '—'}</div>
                          <div className="text-sm text-gray-500 sm:hidden truncate">{teacher.email || '—'}</div>
                          <div className="text-sm text-gray-500 md:hidden">{teacher.schoolId?.name || '—'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate hidden sm:table-cell">{teacher.email || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{teacher.schoolId?.name || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell capitalize">{String(teacher.gender || '').toLowerCase() || '—'}</TableCell>
                      <TableCell className="hidden xl:table-cell">{teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/super-admin/manage/teachers/view/${teacher._id}?schoolId=${teacher.schoolId?._id || ''}`)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditTeacher(teacher)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTeacherForAssignment(teacher)
                              setIsCourseAssignmentModalOpen(true)
                            }}
                            title="Assign Courses"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(teacher)}
                            disabled={deleteLoading === teacher._id}
                            title="Delete"
                          >
                            {deleteLoading === teacher._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No teachers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={String(limit)}
                onChange={(e) => fetchTeachers(1, Number(e.target.value), debouncedSearch, selectedSchoolId)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) pageNum = i + 1
                  else if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {totalCount === 0 ? 0 : ((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} teachers
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete teacher{" "}
              <span className="font-semibold">
                {teacherToDelete?.firstName} {teacherToDelete?.lastName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Teacher'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddTeacherModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        teacherData={selectedTeacher}
        onSuccess={fetchTeachers}
      />

      <AssignCoursesModal
        isOpen={isAssignCoursesModalOpen}
        onClose={() => setIsAssignCoursesModalOpen(false)}
        teachers={teachers}
      />

      <CourseAssignmentModal
        isOpen={isCourseAssignmentModalOpen}
        onClose={() => {
          setIsCourseAssignmentModalOpen(false)
          setTeacherForAssignment(null)
        }}
        teacherId={teacherForAssignment?._id || ''}
        teacherName={teacherForAssignment ? `${teacherForAssignment.firstName} ${teacherForAssignment.lastName}` : ''}
        schoolId={teacherForAssignment?.schoolId?._id || selectedSchoolId}
        onSuccess={() => {
          fetchTeachers(currentPage, limit, debouncedSearch, selectedSchoolId)
        }}
      />

      {/* Import Modal - Using TeachersExcelUploadModal */}
      <Dialog open={isImportModalOpen} onOpenChange={(open) => {
        setIsImportModalOpen(open)
        if (!open) {
          setImportResults(null)
          setShowErrorModal(false)
          setImportFileName("")
          setImportSchoolId("")
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Teachers</DialogTitle>
            <DialogDescription>
              Select the school to import teachers for, then upload the Excel file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">School <span className="text-red-500">*</span></label>
              <Select value={importSchoolId} onValueChange={setImportSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}{s.schoolCode ? ` (${s.schoolCode})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {importSchoolId && (
              <TeachersExcelUploadModal
                open={true}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsImportModalOpen(false)
                    setImportSchoolId("")
                  }
                }}
                onClose={() => {
                  setIsImportModalOpen(false)
                  setImportSchoolId("")
                }}
                refetch={() => fetchTeachers(currentPage, limit, debouncedSearch, selectedSchoolId)}
                schoolId={importSchoolId}
                onImportComplete={(results, fileName) => {
                  console.log('Import complete callback:', results, fileName)
                  // Clear any pending timeout
                  if (errorModalTimeoutRef.current) {
                    clearTimeout(errorModalTimeoutRef.current)
                    errorModalTimeoutRef.current = null
                  }
                  // Reset the manually closed flag when new import starts
                  errorModalManuallyClosedRef.current = false
                  setImportResults(results)
                  setImportFileName(fileName || "")
                  if (results.skippedCount > 0 || (results.errors && results.errors.length > 0)) {
                    console.log('Setting showErrorModal to true')
                    errorModalTimeoutRef.current = setTimeout(() => {
                      // Only open if user hasn't manually closed it
                      if (!errorModalManuallyClosedRef.current) {
                        setShowErrorModal(true)
                      }
                      errorModalTimeoutRef.current = null
                    }, 300)
                  }
                }}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsImportModalOpen(false)
                setImportSchoolId("")
              }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Error Modal */}
      {importResults && (
        <BulkImportErrorModal
          open={showErrorModal}
          onOpenChange={(open) => {
            // When closing (open = false), clear all state to prevent reopening
            if (!open) {
              // Clear any pending timeout
              if (errorModalTimeoutRef.current) {
                clearTimeout(errorModalTimeoutRef.current)
                errorModalTimeoutRef.current = null
              }
              setShowErrorModal(false)
              errorModalManuallyClosedRef.current = true // Mark as manually closed
              setImportResults(null)
              setImportFileName("")
            } else {
              setShowErrorModal(true)
              errorModalManuallyClosedRef.current = false
            }
          }}
          insertedCount={importResults.insertedCount}
          skippedCount={importResults.skippedCount}
          errors={importResults.errors}
          fileName={importFileName}
          entityType="teacher"
        />
      )}
    </div>
  )
}
