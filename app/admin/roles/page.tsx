"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { Search, Loader2, Users } from 'lucide-react'
import axios from 'axios'

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
  employeeId: string
  eligible_for_sports: boolean
  eligible_for_iep: boolean
  eligible_for_counselor: boolean
}

export default function RolesPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingTeacherId, setUpdatingTeacherId] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTeachers, setTotalTeachers] = useState(0)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

      if (!token) {
        toast.error('Authentication required. Please log in again.')
        router.push('/admin/login')
        return
      }

      const params: any = {
        page,
        limit
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params
      })

      if (response.data.success && response.data.data) {
        const { teachers: teachersData, pagination } = response.data.data

        setTeachers(teachersData || [])

        // Update pagination state
        setCurrentPage(pagination.currentPage || page)
        setTotalPages(pagination.totalPages || 1)
        setTotalTeachers(pagination.totalCount || 0)
        setPageSize(pagination.limit || limit)
      } else {
        setTeachers([])
        setTotalTeachers(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
      toast.error('Failed to fetch teachers')
      setTeachers([])
      setTotalTeachers(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchTeachers(newPage, pageSize, searchTerm)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchTeachers(1, newSize, searchTerm)
  }

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string) => {
      setCurrentPage(1)
      fetchTeachers(1, pageSize, search)
    }, 500),
    [pageSize]
  )

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // Handle toggle change
  const handleToggleChange = async (
    teacherId: string,
    field: 'eligible_for_sports' | 'eligible_for_iep' | 'eligible_for_counselor',
    value: boolean
  ) => {
    try {
      setUpdatingTeacherId(teacherId)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers/${teacherId}/eligibility`,
        { [field]: value },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        toast.success(`Teacher ${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} eligibility updated successfully`)
        
        // Update local state
        setTeachers(prevTeachers =>
          prevTeachers.map(teacher =>
            teacher._id === teacherId
              ? { ...teacher, [field]: value }
              : teacher
          )
        )
      } else {
        toast.error(response.data.message || 'Failed to update eligibility')
      }
    } catch (error: any) {
      console.error('Error updating eligibility:', error)
      toast.error(error.response?.data?.message || 'Failed to update eligibility')
    } finally {
      setUpdatingTeacherId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Teacher Roles</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage teacher eligibility for Sports, IEP (Special Education), and Counselor roles
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search teachers by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">
                Teachers ({totalTeachers})
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
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Employee ID</TableHead>
                    <TableHead className="text-center">Eligible for Sports</TableHead>
                    <TableHead className="text-center">Eligible for IEP</TableHead>
                    <TableHead className="text-center">Eligible for Counselor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-3 text-gray-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading teachers...</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : teachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No teachers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    teachers.map((teacher) => (
                      <TableRow key={teacher._id}>
                        <TableCell>
                          <div className="font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </div>
                          <div className="text-sm text-gray-500 sm:hidden">
                            {teacher.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{teacher.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{teacher.employeeId || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={teacher.eligible_for_sports || false}
                              onCheckedChange={(checked) =>
                                handleToggleChange(teacher._id, 'eligible_for_sports', checked)
                              }
                              disabled={updatingTeacherId === teacher._id}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={teacher.eligible_for_iep || false}
                              onCheckedChange={(checked) =>
                                handleToggleChange(teacher._id, 'eligible_for_iep', checked)
                              }
                              disabled={updatingTeacherId === teacher._id}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={teacher.eligible_for_counselor || false}
                              onCheckedChange={(checked) =>
                                handleToggleChange(teacher._id, 'eligible_for_counselor', checked)
                              }
                              disabled={updatingTeacherId === teacher._id}
                            />
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
                disabled={currentPage === 1 || loading}
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
                      disabled={loading}
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
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalTeachers)} of {totalTeachers} teachers
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
