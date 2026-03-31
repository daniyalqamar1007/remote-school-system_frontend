"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

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

export default function SportsAttendancePage() {
  const searchParams = useSearchParams()
  const [attendance, setAttendance] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAttendance, setTotalAttendance] = useState(0)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [scheduleFilter, setScheduleFilter] = useState(searchParams?.get('schedule') || 'all')
  const [programFilter, setProgramFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchProgramsAndSchedules()
    fetchAttendanceData(currentPage, pageSize, '', 'all', 'all', 'all')
  }, [])

  useEffect(() => {
    debouncedSearch(searchTerm, scheduleFilter, programFilter, statusFilter)
  }, [searchTerm, scheduleFilter, programFilter, statusFilter])

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string, schedule: string, program: string, status: string) => {
      setCurrentPage(1)
      fetchAttendanceData(1, pageSize, search, schedule, program, status)
    }, 500),
    [pageSize]
  )

  useEffect(() => {
    fetchAttendanceData(currentPage, pageSize, searchTerm, scheduleFilter, programFilter, statusFilter)
  }, [currentPage])

  const fetchProgramsAndSchedules = async () => {
    try {
      const [schedulesRes, programsRes] = await Promise.all([
        sportsApi.schedule.getAll({ page: '1', limit: '100' }),
        sportsApi.programs.getAll({ page: '1', limit: '100' })
      ])
      
      let schedulesList: any[] = []
      let programsList: any[] = []

      if (schedulesRes?.data) {
        schedulesList = Array.isArray(schedulesRes.data.schedules) 
          ? schedulesRes.data.schedules 
          : Array.isArray(schedulesRes.data)
            ? schedulesRes.data
            : []
      } else if (schedulesRes?.schedules) {
        schedulesList = Array.isArray(schedulesRes.schedules) ? schedulesRes.schedules : []
      } else if (Array.isArray(schedulesRes)) {
        schedulesList = schedulesRes
      }

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
      
      setSchedules(schedulesList)
      setPrograms(programsList)
    } catch (error: any) {
      console.error('Error fetching programs and schedules:', error)
      toast.error(error?.message || 'Failed to load programs and schedules')
    }
  }

  const fetchAttendanceData = async (page: number, limit: number, search: string, schedule: string, program: string, status: string) => {
    try {
      setAttendanceLoading(true)
      const filters: any = { page: page.toString(), limit: limit.toString() }
      
      // Apply filters
      if (schedule !== 'all') {
        filters.scheduleId = schedule
      }
      if (program !== 'all') {
        filters.sportsProgramId = program
      }
      if (status !== 'all') {
        filters.status = status
      }

      const attendanceRes = await sportsApi.attendance.getAll(filters)
      
      let attendanceList: any[] = []
      let paginationData: any = {}
      
      if (attendanceRes?.data) {
        attendanceList = Array.isArray(attendanceRes.data.attendance) 
          ? attendanceRes.data.attendance 
          : Array.isArray(attendanceRes.data)
            ? attendanceRes.data
            : []
        paginationData = attendanceRes.data.pagination || {}
      } else if (attendanceRes?.attendance) {
        attendanceList = Array.isArray(attendanceRes.attendance) ? attendanceRes.attendance : []
        paginationData = attendanceRes.pagination || {}
      } else if (Array.isArray(attendanceRes)) {
        attendanceList = attendanceRes
      }

      // Apply client-side search filter
      if (search) {
        attendanceList = attendanceList.filter((record: any) =>
          record.student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          record.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          record.studentId?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          record.studentId?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          record.schedule?.program?.name?.toLowerCase().includes(search.toLowerCase()) ||
          record.sportsProgramId?.name?.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Sort by date (newest first)
      attendanceList.sort((a: any, b: any) => {
        const dateA = new Date(a.attendanceDate || a.markedAt || a.createdAt || 0).getTime()
        const dateB = new Date(b.attendanceDate || b.markedAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })

      setAttendance(attendanceList)
      setCurrentPage(paginationData.currentPage || page)
      setTotalPages(paginationData.totalPages || 1)
      setTotalAttendance(paginationData.totalCount || attendanceList.length)
      setPageSize(paginationData.limit || limit)
    } catch (error: any) {
      console.error('Error fetching attendance:', error)
      toast.error(error?.message || 'Failed to load attendance')
      setAttendance([])
      setTotalAttendance(0)
      setTotalPages(1)
    } finally {
      setAttendanceLoading(false)
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchAttendanceData(page, pageSize, searchTerm, scheduleFilter, programFilter, statusFilter)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchAttendanceData(1, newSize, searchTerm, scheduleFilter, programFilter, statusFilter)
  }

  const handleStatusUpdate = async (attendanceId: string, newStatus: string) => {
    try {
      const result = await sportsApi.attendance.update(attendanceId, { status: newStatus })
      if (result?.success || result?.statusCode === 200) {
        toast.success(result?.message || 'Attendance status updated successfully')
      } else {
        toast.success('Attendance status updated successfully')
      }
      fetchAttendanceData(currentPage, pageSize, searchTerm, scheduleFilter, programFilter, statusFilter)
    } catch (error: any) {
      console.error('Error updating attendance:', error)
      toast.error(error?.message || 'Failed to update attendance status')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'late':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'excused':
        return <UserCheck className="w-4 h-4 text-gray-600" />
      default:
        return <UserX className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present':
        return 'default'
      case 'absent':
        return 'destructive'
      case 'late':
        return 'secondary'
      case 'excused':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string | Date) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading && attendance.length === 0) {
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
          <Link href="/admin/sports/programs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sports Attendance</h1>
            <p className="text-gray-600 mt-1">Track student attendance for sports activities</p>
          </div>
        </div>
        <Link href="/admin/sports/attendance/take">
          <Button className="bg-black hover:bg-gray-800 text-white">
            <UserCheck className="w-4 h-4 mr-2" />
            Take Attendance
          </Button>
        </Link>
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
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program: any) => (
                    <SelectItem key={program._id} value={program._id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {schedules.map((schedule: any) => {
                    const program = schedule.program || schedule.sportsProgramId
                    const scheduleDate = schedule.startDate || schedule.date
                    return (
                      <SelectItem key={schedule._id} value={schedule._id}>
                        {program?.name} - {formatDate(scheduleDate)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(attendance) || attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((record: any) => {
                    // Handle multiple possible student data structures
                    // studentId should be populated as 'student' object if populate worked
                    const student = record.student || (record.studentId && typeof record.studentId === 'object' ? record.studentId : null)
                    
                    // Extract student name - handle populated student object
                    const studentFirstName = student?.firstName || student?.first_name || ''
                    const studentLastName = student?.lastName || student?.last_name || ''
                    const studentCustomId = student?.studentId || student?.id || ''
                    
                    // Get studentId reference (ObjectId string)
                    const studentIdRef = student?._id?.toString() || record.studentId?.toString() || record.studentId || ''
                    
                    const program = record.schedule?.program || record.program || record.sportsProgramId || (record.scheduleId?.sportsProgramId)
                    const schedule = record.schedule || record.scheduleId
                    const attendanceDate = record.attendanceDate || record.markedAt || record.createdAt
                    
                    // Determine display name - if student is populated, use firstName/lastName
                    let displayName = 'Unknown Student'
                    if (studentFirstName && studentLastName) {
                      displayName = `${studentFirstName} ${studentLastName}`
                    } else if (studentFirstName) {
                      displayName = studentFirstName
                    } else if (studentLastName) {
                      displayName = studentLastName
                    } else if (student && typeof student === 'object') {
                      displayName = student.name || student.firstName || 'Unknown Student'
                    } else if (record.studentId && typeof record.studentId === 'string') {
                      // If studentId is a string but not populated, we can't show name
                      displayName = 'Unknown Student'
                    }
                    
                    return (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-black">
                              {displayName}
                            </div>
                            {studentCustomId && (
                              <div className="text-sm text-gray-600">
                                ID: {studentCustomId}
                              </div>
                            )}
                            {!student && record.studentId && (
                              <div className="text-xs text-red-500">
                                Student data not found (ID: {typeof record.studentId === 'string' ? record.studentId : record.studentId?.toString() || 'N/A'})
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900">{program?.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900">{schedule?.title || schedule?.type || record.eventType || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-900">{formatDate(attendanceDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-900">{formatTime(attendanceDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(record.status)}
                              <span>{record.status || 'N/A'}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Select
                              value={record.status || 'present'}
                              onValueChange={(value) => handleStatusUpdate(record._id, value)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="excused">Excused</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!attendanceLoading && attendance.length > 0 && (
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
                  disabled={currentPage >= totalPages || attendanceLoading}
                >
                  Next
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalAttendance)} of {totalAttendance} records
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}