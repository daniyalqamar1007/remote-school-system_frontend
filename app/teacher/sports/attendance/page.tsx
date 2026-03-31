"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  UserCheck, 
  UserX, 
  Users, 
  Calendar,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Building,
  Trophy,
  CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

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

export default function TeacherSportsAttendancePage() {
  const router = useRouter()
  const [attendance, setAttendance] = useState<any[]>([])
  const [myPrograms, setMyPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')

  useEffect(() => {
    fetchMyPrograms()
  }, [])

  useEffect(() => {
    if (myPrograms.length > 0) {
      fetchAttendance()
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

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true)
      
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

      const response = await sportsApi.attendance.getAll(filters)
      
      let attendanceData: any[] = []
      let paginationData: any = {}
      
      if (response?.data?.attendance) {
        attendanceData = Array.isArray(response.data.attendance) ? response.data.attendance : []
        paginationData = response.data.pagination || {}
      } else if (Array.isArray(response?.attendance)) {
        attendanceData = response.attendance
      } else if (Array.isArray(response?.data)) {
        attendanceData = response.data
      } else if (Array.isArray(response)) {
        attendanceData = response
      }

      setAttendance(attendanceData)
      
      // Update pagination
      if (paginationData.totalPages !== undefined) {
        setTotalPages(paginationData.totalPages)
        setCurrentPage(paginationData.currentPage || currentPage)
        setTotalCount(paginationData.totalCount || paginationData.total || attendanceData.length)
      } else {
        const total = attendanceData.length
        const totalPagesCount = Math.ceil(total / pageSize)
        setTotalPages(totalPagesCount)
        setTotalCount(total)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Failed to load attendance')
      setAttendance([])
    } finally {
      setAttendanceLoading(false)
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sports Attendance</h1>
          <p className="text-gray-600 mt-1">View and manage attendance for your sports programs</p>
        </div>
        <Link href="/teacher/sports/attendance/take">
          <Button className="bg-black hover:bg-gray-800 text-white">
            <UserCheck className="w-4 h-4 mr-2" />
            Take Attendance
          </Button>
        </Link>
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
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
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

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Attendance Records ({totalCount})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Program</TableHead>
                    <TableHead className="hidden md:table-cell">Event</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record: any) => {
                    // Prioritize populated student object over studentId string
                    const student = record.student || (typeof record.studentId === 'object' ? record.studentId : null)
                    const program = record.program || record.sportsProgramId
                    const schedule = record.schedule || record.scheduleId
                    const attendanceDate = record.attendanceDate || record.markedAt || record.createdAt
                    const markedTime = record.markedAt ? new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
                    
                    return (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student?.firstName || 'N/A'} {student?.lastName || ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student?.studentId || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{program?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{schedule?.title || schedule?.eventType || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(attendanceDate).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{markedTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
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
        {totalCount > 0 && (
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
                disabled={currentPage === 1 || attendanceLoading}
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
                      disabled={attendanceLoading}
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
                disabled={currentPage === totalPages || attendanceLoading}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {attendance.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
