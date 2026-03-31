"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CheckIcon, Loader2, Pencil, Plus, Trash2, Eye, Copy } from "lucide-react"
import axios from "axios"
import { toast } from 'sonner'
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { activities } from "@/lib/activities"
import { addActivity } from "@/lib/actitivityFunctions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Department {
  _id: string
  departmentName: string
  code?: string
}

interface Course {
  _id: string
  courseName: string
  courseCode: string
  departmentId?: {
    departmentName: any
    _id?: string
  }
  Prerequisites: string
  description: string
  createdAt: string
}

export default function CoursesPage() {
  const router = useRouter()
  // State for courses and departments
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormPrefillLoading, setIsFormPrefillLoading] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)

  // Form state (aligned with API payload)
  const [formData, setFormData] = useState({
    courseName: "",
    courseCode: "",
    departmentIds: [] as string[],
    Prerequisites: "",
    description: "",
  })

  // Add a new state for search query and search loading
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  // Department filter state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [departmentFilterSearch, setDepartmentFilterSearch] = useState<string>("")

  // Add useEffect for debouncing search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms debounce delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Modify the fetchCourses function to handle search
  const fetchCourses = async (query = "", page = 1, pageLimit = 10, departmentId: string = selectedDepartmentId) => {
    try {
      setIsLoading(true)
      const base = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses`
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(pageLimit))
      if (query.trim()) params.set("search", query.trim())
      if (departmentId && departmentId.trim()) params.set("departmentId", departmentId.trim())
      const url = `${base}?${params.toString()}`

      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const list = response.data?.data?.courses || []
      const pg = response.data?.data?.pagination || {}
      setCourses(Array.isArray(list) ? list : [])
      setTotalPages(pg.totalPages || 1)
      setTotalCount(pg.totalCount || 0)
      setCurrentPage(pg.currentPage || page)
      setLimit(pg.limit || pageLimit)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Add useEffect to handle search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      setIsSearching(true)
    }
    // Reset to first page on new search
    fetchCourses(debouncedSearchQuery, 1, limit, selectedDepartmentId)

    const url = new URL(window.location.href)
    if (debouncedSearchQuery) url.searchParams.set("search", debouncedSearchQuery)
    else url.searchParams.delete("search")
    url.searchParams.set("page", "1")
    url.searchParams.set("limit", String(limit))
    if (selectedDepartmentId) url.searchParams.set("departmentId", selectedDepartmentId)
    else url.searchParams.delete("departmentId")
    window.history.pushState({}, "", url)
  }, [debouncedSearchQuery])

  // Add a function to handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setIsDepartmentsLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/departments/names`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const names = response.data?.data?.departments || []
      setDepartments(Array.isArray(names) ? names : [])
    } catch (error) {
      console.error("Error fetching departments:", error)
      // Suppress error toast as requested by user
    } finally {
      setIsDepartmentsLoading(false)
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get("search") || ""
    const pageParam = Number(urlParams.get("page") || 1)
    const limitParam = Number(urlParams.get("limit") || 10)
    const departmentParam = urlParams.get("departmentId") || ""

    setSearchQuery(searchParam)
    setDebouncedSearchQuery(searchParam)
    setCurrentPage(pageParam)
    setLimit(limitParam)
    setSelectedDepartmentId(departmentParam)
    fetchCourses(searchParam, pageParam, limitParam, departmentParam)

    fetchDepartments()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const toggleDepartment = (value: string) => {
    setFormData((prev) => {
      const exists = prev.departmentIds.includes(value)
      const next = exists
        ? prev.departmentIds.filter((id) => id !== value)
        : [...prev.departmentIds, value]
      return { ...prev, departmentIds: next }
    })
  }

  const resetForm = () => {
    setFormData({
      courseName: "",
      courseCode: "",
      departmentIds: [],
      Prerequisites: "",
      description: "",
    })
    setIsEditing(false)
    setCourseToEdit(null)
  }

  // Open modal for adding a new course
  const openModal = () => {
    resetForm()
    if (departments.length === 0) {
      fetchDepartments()
    }
    setIsModalOpen(true)
  }

  // Open edit with server prefill
  const openEditModalById = async (courseId: string) => {
    setIsEditing(true)
    setIsModalOpen(true)
    setIsFormPrefillLoading(true)
    try {
      if (departments.length === 0) {
        await fetchDepartments()
      }
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const course = res.data?.data?.course
      setCourseToEdit(course)
      setFormData({
        courseName: course?.courseName || "",
        courseCode: course?.courseCode || "",
        departmentIds: Array.isArray(course?.departmentIds)
          ? course.departmentIds.map((d: any) => d?._id || d)
          : [],
        Prerequisites: course?.Prerequisites || "",
        description: course?.description || "",
      })
    } catch (e) {
      toast.error("Failed to load course details")
      setIsModalOpen(false)
      setIsEditing(false)
    } finally {
      setIsFormPrefillLoading(false)
    }
  }

  // Open copy modal (same as edit but with new course code)
  const openCopyModalById = async (courseId: string) => {
    setIsEditing(false) // Not editing, creating a copy
    setIsModalOpen(true)
    setIsFormPrefillLoading(true)
    try {
      if (departments.length === 0) {
        await fetchDepartments()
      }
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const course = res.data?.data?.course
      setCourseToEdit(null) // No course to edit, creating new
      setFormData({
        courseName: course?.courseName || "",
        courseCode: "", // Clear course code so user must enter new one
        departmentIds: Array.isArray(course?.departmentIds)
          ? course.departmentIds.map((d: any) => d?._id || d)
          : [],
        Prerequisites: course?.Prerequisites || "",
        description: course?.description || "",
      })
    } catch (e) {
      toast.error("Failed to load course details")
      setIsModalOpen(false)
    } finally {
      setIsFormPrefillLoading(false)
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    resetForm()
    setIsModalOpen(false)
  }

  // Department filter change
  const handleDepartmentFilterChange = (deptId: string) => {
    const next = deptId === "all" ? "" : deptId
    setSelectedDepartmentId(next)
    setCurrentPage(1)
    fetchCourses(debouncedSearchQuery, 1, limit, next)

    const url = new URL(window.location.href)
    if (next) url.searchParams.set("departmentId", next)
    else url.searchParams.delete("departmentId")
    url.searchParams.set("page", "1")
    url.searchParams.set("limit", String(limit))
    if (debouncedSearchQuery) url.searchParams.set("search", debouncedSearchQuery)
    else url.searchParams.delete("search")
    window.history.pushState({}, "", url)
  }

  // Handle pagination page change (numbered + prev/next)
  const handlePageChange = (newPage: number) => {
    const page = Math.max(1, Math.min(totalPages, newPage))
    setCurrentPage(page)
    fetchCourses(debouncedSearchQuery, page, limit, selectedDepartmentId)

    const url = new URL(window.location.href)
    url.searchParams.set("page", String(page))
    url.searchParams.set("limit", String(limit))
    if (debouncedSearchQuery) url.searchParams.set("search", debouncedSearchQuery)
    else url.searchParams.delete("search")
    if (selectedDepartmentId) url.searchParams.set("departmentId", selectedDepartmentId)
    else url.searchParams.delete("departmentId")
    window.history.pushState({}, "", url)
  }

  // Open delete confirmation modal
  const openDeleteModal = (course: Course) => {
    setCourseToDelete(course)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return

    try {
      setIsDeleting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      await axios.delete(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses/${courseToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      toast.success("Course deleted successfully!")
      
      // Log activity with correct performer
      const userRole = localStorage.getItem('role') || 'ADMIN'
      const performBy = userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'
      const message = activities.admin.deleteCourse.description.replace("{courseName}", courseToDelete.courseName)
      const activity = {
        title: activities.admin.deleteCourse.action,
        subtitle: message,
        performBy: performBy,
      }
      await addActivity(activity)
      setIsDeleteModalOpen(false)
      setCourseToDelete(null)
      fetchCourses() // Refresh courses list
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle form submission (for both add and edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.courseName || !formData.courseCode || formData.departmentIds.length === 0) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setIsSubmitting(true)
      const dataToSubmit = {
        courseName: formData.courseName.trim(),
        courseCode: formData.courseCode.trim(),
        departmentIds: formData.departmentIds,
        Prerequisites: formData.Prerequisites || "",
        description: formData.description || "",
      }
      console.log(dataToSubmit)
      if (isEditing && courseToEdit) {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        const res = await axios.put(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses/${courseToEdit._id}`, dataToSubmit, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        console.log("res", res)
        toast.success("Course updated successfully!")
        
        // Log activity with correct performer
        const userRole = localStorage.getItem('role') || 'ADMIN'
        const performBy = userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'
        const message = activities.admin.updatedCourse.description.replace("{courseName}", formData.courseName)
        const activity = {
          title: activities.admin.updatedCourse.action,
          subtitle: message,
          performBy: performBy,
        }
        await addActivity(activity)
      } else {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses`, dataToSubmit, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        toast.success("Course added successfully!")
        
        // Log activity with correct performer
        const userRole = localStorage.getItem('role') || 'ADMIN'
        const performBy = userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'
        const message = activities.admin.addCourse.description.replace("{courseName}", formData.courseName)
        const activity = {
          title: activities.admin.addCourse.action,
          subtitle: message,
          performBy: performBy,
        }
        await addActivity(activity)
      }

      setIsModalOpen(false)
      resetForm()
      fetchCourses()
    } catch (error: any) {
      if (error.status === 409) {
        toast.error(error.response.data.message)
        return
      }
      console.error(`Error ${isEditing ? "updating" : "adding"} course:`, error)
      toast.error(`Failed to ${isEditing ? "update" : "add"} course`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Find department name by ID
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find((dept) => dept._id === departmentId)
    return department ? department.departmentName : "Unknown Department"
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent">
            Courses
          </h1>
          <p className="text-muted-foreground mt-1">Manage your school's course catalog</p>
        </div>
        <Button onClick={openModal} className="bg-black text-white hover:bg-black/90">
          <Plus className="mr-2 h-4 w-4" /> Add Course
        </Button>
      </div>
      <div className="mb-6 mt-4">
        <div className="relative flex flex-col md:flex-row gap-3 md:items-center">
          <Input
            type="text"
            placeholder="Search courses by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 border-gray-300 focus:border-black focus:ring-black"
          />
          {isSearching ? (
            <Loader2 className="h-4 w-4 absolute left-3 top-3 animate-spin text-gray-500" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-3 top-3 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="min-w-[240px] w-full md:w-[280px]">
              <div className="flex gap-2">
                <Select
                  value={selectedDepartmentId || "all"}
                  onValueChange={handleDepartmentFilterChange}
                >
                  <SelectTrigger className="min-w-[160px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments
                      .filter((d) =>
                        !departmentFilterSearch.trim()
                          ? true
                          : `${d.departmentName}${d.code ? ` (${d.code})` : ""}`
                              .toLowerCase()
                              .includes(departmentFilterSearch.trim().toLowerCase())
                      )
                      .map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.departmentName}{dept.code ? ` (${dept.code})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Courses ({totalCount})</CardTitle>
            <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden lg:table-cell">Departments</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
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
                ) : courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No courses found</TableCell>
                  </TableRow>
                ) : (
                  courses.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.courseName}</TableCell>
                      <TableCell>{c.courseCode}</TableCell>
                      <TableCell className="hidden lg:table-cell">{(c as any).departmentsCount ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" title="View" onClick={() => router.push(`/secretary/courses/view/${c._id}`)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEditModalById(c._id)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Copy" onClick={() => openCopyModalById(c._id)}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Delete" onClick={() => openDeleteModal(c)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={String(limit)} onValueChange={(v) => { const l = Number(v); setLimit(l); setCurrentPage(1); fetchCourses(debouncedSearchQuery, 1, l, selectedDepartmentId) }}>
              <SelectTrigger className="w-20"><SelectValue placeholder={String(limit)} /></SelectTrigger>
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
              disabled={currentPage === 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
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
              disabled={currentPage === totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
          <div className="text-sm text-gray-600">Showing {totalCount === 0 ? 0 : ((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} courses</div>
        </div>
      </Card>

      {/* Add/Edit Course Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Course" : courseToEdit ? "Copy Course" : "Add New Course"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details for this course."
                : courseToEdit
                ? "Create a copy of this course. Please provide a new course code."
                : "Enter the details for the new course you want to add to the curriculum."}
            </DialogDescription>
          </DialogHeader>
          {isFormPrefillLoading ? (
            <div className="grid gap-6 py-12 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Loading course...</span>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName" className="font-medium">
                    Course Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="courseName"
                    placeholder="Introduction to Computer Science"
                    value={formData.courseName}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCode" className="font-medium">
                    Course Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="courseCode"
                    placeholder="CS101"
                    value={formData.courseCode}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">
                  Departments <span className="text-red-500">*</span>
                </Label>
                {isDepartmentsLoading ? (
                  <div className="flex items-center space-x-2 h-10 px-3 border rounded-md border-gray-300">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Loading departments...</span>
                  </div>
                ) : (
                  <div className="border rounded-md border-gray-300 p-2 max-h-56 overflow-auto">
                    {departments.length === 0 ? (
                      <div className="text-sm text-gray-500 px-1 py-2">No departments found</div>
                    ) : (
                      departments.map((dept) => (
                        <label key={dept._id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={formData.departmentIds.includes(dept._id)}
                            onChange={() => toggleDepartment(dept._id)}
                          />
                          <span className="text-sm text-gray-700">
                            {dept.departmentName}{dept.code ? ` (${dept.code})` : ""}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {formData.departmentIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.departmentIds.map((id) => {
                      const d = departments.find((x) => x._id === id)
                      return (
                        <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border">
                          {d ? `${d.departmentName}${d.code ? ` (${d.code})` : ''}` : id}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="Prerequisites" className="font-medium">
                  Prerequisites
                </Label>
                <Input
                  id="Prerequisites"
                  placeholder="e.g., MATH101, CS100 (or 'None')"
                  value={formData.Prerequisites}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-black focus:ring-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-medium">
                  Course Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the course content, objectives, and learning outcomes."
                  className="min-h-[100px] border-gray-300 focus:border-black focus:ring-black"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-black/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating Course..." : "Adding Course..."}
                  </>
                ) : (
                  <>
                    <CheckIcon className="mr-2 h-4 w-4" /> {isEditing ? "Update Course" : "Add Course"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the course{" "}
              <span className="font-semibold">{courseToDelete?.courseName}</span>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

