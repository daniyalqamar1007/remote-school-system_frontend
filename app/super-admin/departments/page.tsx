"use client"

import React, { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Edit, Eye, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Department {
  _id: string
  departmentName: string
  code?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  schoolId?: { _id: string; name: string }
}

export default function DepartmentsPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [schools, setSchools] = useState<Array<{ _id: string; name: string; schoolCode?: string }>>([])
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [selectedEditSchoolName, setSelectedEditSchoolName] = useState<string>('')
  const [formData, setFormData] = useState({
    departmentName: "",
    code: "",
    description: ""
  })
  const [formErrors, setFormErrors] = useState<{ departmentName?: string }>({})

  const fetchDepartments = async (page = 1, limit = 10, search = '', schoolFilter?: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          page,
          limit,
          ...(search && search.trim() ? { search: search.trim() } : {}),
          ...((schoolFilter ?? selectedSchoolFilter) !== 'all' ? { schoolId: (schoolFilter ?? selectedSchoolFilter) } : {})
        }
      })
      if (response.data?.success && response.data?.data) {
        const { departments: rows, pagination } = response.data.data
        setDepartments(rows || [])
        setCurrentPage(pagination?.currentPage || page)
        setTotalPages(pagination?.totalPages || 1)
        setTotalCount(pagination?.totalCount || 0)
        setPageSize(pagination?.limit || limit)
      } else {
        setDepartments([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast.error("Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const list = res.data?.data?.schools || res.data?.data || []
      setSchools(Array.isArray(list) ? list : [])
    } catch {
      setSchools([])
    }
  }

  // debounce
  const debounce = (func: Function, wait: number) => {
    let timeout: any
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  const debouncedSearch = useCallback(
    debounce((value: string, school: string) => {
      setCurrentPage(1)
      fetchDepartments(1, pageSize, value, school)
    }, 500),
    [pageSize, selectedSchoolFilter]
  )

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value, selectedSchoolFilter)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchDepartments(page, pageSize, searchTerm, selectedSchoolFilter)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchDepartments(1, newSize, searchTerm, selectedSchoolFilter)
  }

  const handleCreateDepartment = async () => {
    const errors: any = {}
    if (!formData.departmentName.trim()) errors.departmentName = 'Department name is required'
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/departments`, { ...formData, schoolId: selectedSchoolId }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      toast.success("Department created successfully!")
      setIsModalOpen(false)
      setFormData({ departmentName: "", code: "", description: "" })
      setSelectedSchoolId('')
      setFormErrors({})
      fetchDepartments(currentPage, pageSize, searchTerm)
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Department with this name already exists")
      } else {
        toast.error(error?.response?.data?.message || "Failed to create department")
      }
      console.error("Error creating department:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditDepartment = async () => {
    const errors: any = {}
    if (!formData.departmentName.trim()) errors.departmentName = 'Department name is required'
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const sid = departmentToEdit?.schoolId?._id || (selectedSchoolFilter !== 'all' ? selectedSchoolFilter : '')
      await axios.put(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/departments/${departmentToEdit?._id}`, { ...formData, schoolId: sid }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      toast.success("Department updated successfully!")
      setIsEditModalOpen(false)
      setDepartmentToEdit(null)
      setFormData({ departmentName: "", code: "", description: "" })
      setFormErrors({})
      fetchDepartments(currentPage, pageSize, searchTerm)
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Department with this name already exists")
      } else {
        toast.error(error?.response?.data?.message || "Failed to update department")
      }
      console.error("Error updating department:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const sid = departmentToDelete.schoolId?._id || (selectedSchoolFilter !== 'all' ? selectedSchoolFilter : '')
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/departments/${departmentToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: sid ? { schoolId: sid } : undefined
      })

      toast.success("Department deleted successfully!")
      setIsDeleteModalOpen(false)
      setDepartmentToDelete(null)
      // refetch current page (adjust if last item deleted)
      const nextPage = departments.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      fetchDepartments(nextPage, pageSize, searchTerm)
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Cannot delete department that has courses assigned to it")
      } else {
        toast.error("Failed to delete department")
      }
      console.error("Error deleting department:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (department: Department) => {
    setDepartmentToEdit(department)
    setFormData({
      departmentName: department.departmentName,
      code: department.code || "",
      description: department.description || ""
    })
    setSelectedEditSchoolName(department.schoolId?.name || '')
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (department: Department) => {
    setDepartmentToDelete(department)
    setIsDeleteModalOpen(true)
  }

  const resetForm = () => {
    setFormData({ departmentName: "", code: "", description: "" })
    setDepartmentToEdit(null)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Departments</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage departments</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Department
        </Button>
      </div>

      {/* Search & School Filter */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Label className="mb-1 block">Search</Label>
          <Search className="absolute left-3 transform -translate-y-1/2 text-gray-400 h-4 w-4 py-auto my-auto mt-5" />
          <Input
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
        </div>
        <div className="w-full sm:w-64">
          <Label className="mb-1 block">Filter by School</Label>
          <Select
            value={selectedSchoolFilter}
            onValueChange={(v) => {
              setSelectedSchoolFilter(v);
              setCurrentPage(1);
              // Use the newly selected value immediately to avoid stale state issue
              fetchDepartments(1, pageSize, searchTerm, v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose school" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map(s => (
                <SelectItem key={s._id} value={s._id}>{s.name}{s.schoolCode ? ` (${s.schoolCode})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Departments ({totalCount})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="hidden md:table-cell">School Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Record Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No departments found</TableCell>
                  </TableRow>
                ) : (
                  departments.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell className="font-medium">{d.departmentName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{d.code || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.schoolId?.name || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" title="View" onClick={() => router.push(`/super-admin/departments/view/${d._id}?schoolId=${d.schoolId?._id}`)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEditModal(d)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => openDeleteModal(d)}><Trash2 className="h-4 w-4" /></Button>
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
              <Select value={pageSize.toString()} onValueChange={(v) => handlePageSizeChange(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue placeholder={pageSize.toString()} /></SelectTrigger>
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
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) pageNum = i + 1
                  else if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i
                  return (
                    <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange(pageNum)} className="w-8 h-8 p-0">{pageNum}</Button>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
            </div>

            <div className="text-sm text-gray-600">Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} departments</div>
          </div>
        {/* )} */}
      </Card>

      {/* Create Department Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          resetForm()
          setFormErrors({})
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="school">School *</Label>
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.name}{s.schoolCode ? ` (${s.schoolCode})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="departmentName">Department Name *</Label>
              <Input
                id="departmentName"
                value={formData.departmentName}
                onChange={(e) => { setFormData({ ...formData, departmentName: e.target.value }); if (formErrors.departmentName) setFormErrors({}) }}
                placeholder="e.g., Mathematics, Science, English"
              />
              {formErrors.departmentName && (
                <p className="text-red-600 text-xs mt-1">{formErrors.departmentName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="code">Department Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., MATH, SCI, ENG"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
                setFormErrors({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDepartment} disabled={isSubmitting || !formData.departmentName.trim() || !selectedSchoolId}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open)
        if (!open) {
          setDepartmentToEdit(null)
          resetForm()
          setFormErrors({})
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>School</Label>
              <Input value={selectedEditSchoolName || departmentToEdit?.schoolId?.name || ''} disabled />
            </div>
            <div>
              <Label htmlFor="editDepartmentName">Department Name *</Label>
              <Input
                id="editDepartmentName"
                value={formData.departmentName}
                onChange={(e) => { setFormData({ ...formData, departmentName: e.target.value }); if (formErrors.departmentName) setFormErrors({}) }}
                placeholder="e.g., Mathematics, Science, English"
              />
              {formErrors.departmentName && (
                <p className="text-red-600 text-xs mt-1">{formErrors.departmentName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="editCode">Department Code</Label>
              <Input
                id="editCode"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., MATH, SCI, ENG"
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false)
                setDepartmentToEdit(null)
                resetForm()
                setFormErrors({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditDepartment} disabled={isSubmitting || !formData.departmentName.trim()}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the department "{departmentToDelete?.departmentName}"?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDepartmentToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
