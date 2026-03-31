"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Trophy, 
  Users, 
  Calendar, 
  Search,
  BarChart3,
  Eye,
  Loader2,
  Building
} from 'lucide-react'
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

export default function TeacherSportsProgramsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [allPrograms, setAllPrograms] = useState<any[]>([])
  const [programsWithCounts, setProgramsWithCounts] = useState<any[]>([])
  const [displayedPrograms, setDisplayedPrograms] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activeStudents: 0,
    upcomingEvents: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filter states
  const [seasonFilter, setSeasonFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')

  useEffect(() => {
    // Always fetch data on mount
    // This will run every time the component mounts (including navigation)
    fetchProgramsData()
    fetchSportsData()
  }, [])

  // Also fetch when programs array becomes empty (handles navigation edge cases)
  useEffect(() => {
    if (allPrograms.length === 0 && !loading) {
      fetchProgramsData()
      fetchSportsData()
    }
  }, [allPrograms.length, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Apply filters and pagination whenever programs, search, or filters change
    applyFiltersAndPagination()
  }, [programsWithCounts, searchTerm, seasonFilter, typeFilter, isActiveFilter, currentPage, pageSize])

  const applyFiltersAndPagination = () => {
    let filtered = [...programsWithCounts]

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((program: any) =>
        program.name?.toLowerCase().includes(searchLower) ||
        program.sport?.toLowerCase().includes(searchLower)
      )
    }

    // Season filter
    if (seasonFilter !== 'all') {
      filtered = filtered.filter((program: any) => program.season === seasonFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((program: any) => program.type === typeFilter)
    }

    // Active filter
    if (isActiveFilter !== 'all') {
      const isActive = isActiveFilter === 'true'
      filtered = filtered.filter((program: any) => program.isActive === isActive)
    }

    // Calculate pagination
    const totalFiltered = filtered.length
    const totalPagesCount = Math.ceil(totalFiltered / pageSize)
    setTotalPages(totalPagesCount)

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filtered.slice(startIndex, endIndex)

    setDisplayedPrograms(paginated)
  }

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string) => {
      setSearchTerm(search)
    }, 500),
    []
  )

  const handleSearchChange = (value: string) => {
    debouncedSearch(value)
  }

  const fetchProgramsData = async () => {
    try {
      setLoading(true)
      const response = await sportsApi.programs.getMyCoachPrograms()
      
      // Handle different response structures
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
      
      setAllPrograms(programsData)
      
      // Fetch participant counts for each program
      await fetchParticipantCounts(programsData)
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error('Failed to load sports programs')
      setAllPrograms([])
      setProgramsWithCounts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipantCounts = async (programs: any[]) => {
    try {
      // Fetch all assignments
      const assignmentsResponse = await sportsApi.assignments.getAll({ limit: '10000' })
      let assignmentsData: any[] = []
      
      if (assignmentsResponse?.data?.assignments) {
        assignmentsData = Array.isArray(assignmentsResponse.data.assignments) ? assignmentsResponse.data.assignments : []
      } else if (Array.isArray(assignmentsResponse?.assignments)) {
        assignmentsData = assignmentsResponse.assignments
      } else if (Array.isArray(assignmentsResponse?.data)) {
        assignmentsData = assignmentsResponse.data
      } else if (Array.isArray(assignmentsResponse)) {
        assignmentsData = assignmentsResponse
      }

      // Count active assignments per program
      const programsWithCounts = programs.map((program: any) => {
        const programId = program._id
        const activeAssignments = assignmentsData.filter((a: any) => {
          const assignmentProgramId = a.sportsProgramId?._id || a.sportsProgramId
          return assignmentProgramId === programId && (a.status === 'active' || !a.status)
        })
        
        // Ensure schoolId is properly handled - check various possible structures
        let schoolInfo = null
        if (program.schoolId) {
          if (typeof program.schoolId === 'object') {
            schoolInfo = program.schoolId
          } else {
            // If schoolId is a string, we'll need to fetch it separately if needed
            // For now, keep the string ID
            schoolInfo = { _id: program.schoolId }
          }
        } else if (program.school) {
          schoolInfo = program.school
        }
        
        return {
          ...program,
          participantCount: activeAssignments.length,
          schoolId: schoolInfo || program.schoolId
        }
      })

      setProgramsWithCounts(programsWithCounts)
    } catch (error) {
      console.error('Error fetching participant counts:', error)
      // If error, just set programs without counts
      setProgramsWithCounts(programs.map((p: any) => ({ ...p, participantCount: 0 })))
    }
  }

  const fetchSportsData = async () => {
    try {
      // Get programs count
      const programsResponse = await sportsApi.programs.getMyCoachPrograms()
      let programsData: any[] = []
      if (programsResponse) {
        if (programsResponse.success && programsResponse.data) {
          programsData = Array.isArray(programsResponse.data) ? programsResponse.data : (Array.isArray(programsResponse.data.programs) ? programsResponse.data.programs : [])
        } else if (Array.isArray(programsResponse.data)) {
          programsData = programsResponse.data
        } else if (Array.isArray(programsResponse.programs)) {
          programsData = programsResponse.programs
        } else if (Array.isArray(programsResponse)) {
          programsData = programsResponse
        }
      }
      const programsCount = programsData.length || 0
      
      // Fetch student assignments for my programs
      const programIds = programsData.map((p: any) => p._id)
      let activeStudents = 0
      if (programIds.length > 0) {
        try {
          const assignmentsResponse = await sportsApi.assignments.getAll({ limit: '1000' })
          let assignmentsData: any[] = []
          if (assignmentsResponse?.data) {
            assignmentsData = Array.isArray(assignmentsResponse.data.assignments) 
              ? assignmentsResponse.data.assignments 
              : Array.isArray(assignmentsResponse.data)
                ? assignmentsResponse.data
                : []
          } else if (assignmentsResponse?.assignments) {
            assignmentsData = Array.isArray(assignmentsResponse.assignments) ? assignmentsResponse.assignments : []
          } else if (Array.isArray(assignmentsResponse)) {
            assignmentsData = assignmentsResponse
          }
          // Filter assignments for my programs
          activeStudents = assignmentsData.filter((a: any) => 
            programIds.includes(a.sportsProgramId?._id || a.sportsProgramId) && a.status === 'active'
          ).length
        } catch (err) {
          console.warn('Error fetching assignments:', err)
        }
      }
      
      // Fetch upcoming events for my programs
      let upcomingEvents = 0
      if (programIds.length > 0) {
        try {
          const scheduleResponse = await sportsApi.schedule.getAll({
            startDate: new Date().toISOString().split('T')[0],
            limit: '1000'
          })
          let scheduleData: any[] = []
          if (scheduleResponse?.data) {
            scheduleData = Array.isArray(scheduleResponse.data.schedules) 
              ? scheduleResponse.data.schedules 
              : Array.isArray(scheduleResponse.data)
                ? scheduleResponse.data
                : []
          } else if (scheduleResponse?.schedules) {
            scheduleData = Array.isArray(scheduleResponse.schedules) ? scheduleResponse.schedules : []
          } else if (Array.isArray(scheduleResponse)) {
            scheduleData = scheduleResponse
          }
          // Filter schedules for my programs
          upcomingEvents = scheduleData.filter((s: any) => 
            programIds.includes(s.sportsProgramId?._id || s.sportsProgramId)
          ).length
        } catch (err) {
          console.warn('Error fetching schedules:', err)
        }
      }
      
      // Calculate attendance rate for my programs
      let attendanceRate = 0
      if (programIds.length > 0) {
        try {
          const attendanceResponse = await sportsApi.attendance.getAll({ limit: '1000' })
          let attendanceData: any[] = []
          if (attendanceResponse?.data) {
            attendanceData = Array.isArray(attendanceResponse.data.attendance) 
              ? attendanceResponse.data.attendance 
              : Array.isArray(attendanceResponse.data)
                ? attendanceResponse.data
                : []
          } else if (attendanceResponse?.attendance) {
            attendanceData = Array.isArray(attendanceResponse.attendance) ? attendanceResponse.attendance : []
          } else if (Array.isArray(attendanceResponse)) {
            attendanceData = attendanceResponse
          }
          // Filter attendance for my programs
          const myAttendance = attendanceData.filter((a: any) => 
            programIds.includes(a.sportsProgramId?._id || a.sportsProgramId)
          )
          const presentCount = myAttendance.filter((a: any) => a.status === 'present' || a.status === 'Present').length
          attendanceRate = myAttendance.length > 0 ? Math.round((presentCount / myAttendance.length) * 100) : 0
        } catch (err) {
          console.warn('Error fetching attendance:', err)
        }
      }
      
      setStats({
        totalPrograms: programsCount,
        activeStudents,
        upcomingEvents,
        attendanceRate
      })
    } catch (error) {
      console.error('Error fetching sports data:', error)
      setStats({
        totalPrograms: allPrograms.length,
        activeStudents: 0,
        upcomingEvents: 0,
        attendanceRate: 0
      })
    }
  }

  const handleViewProgram = (program: any) => {
    router.push(`/teacher/sports/programs/${program._id}`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sports Programs</h1>
          <p className="text-gray-600 mt-1">View and manage programs where you are the head coach</p>
        </div>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Programs</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
              <p className="text-xs text-muted-foreground">Programs I coach</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
              <p className="text-xs text-muted-foreground">Students participating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card> */}
        </div>
      )}

      {/* Programs Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Sports Programs ({programsWithCounts.length})
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
        
        {/* Search and Filters */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search programs by name..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoComplete="off"
              />
            </div>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                <SelectItem value="fall">Fall</SelectItem>
                <SelectItem value="winter">Winter</SelectItem>
                <SelectItem value="spring">Spring</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="year-round">Year Round</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="competitive">Competitive</SelectItem>
                <SelectItem value="recreational">Recreational</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead className="hidden sm:table-cell">School</TableHead>
                  <TableHead className="hidden sm:table-cell">Season</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No sports programs found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedPrograms.map((program: any) => {
                    // Get school name from various possible locations
                    // Check if schoolId is populated object or string
                    let schoolName = 'N/A'
                    if (program.schoolId) {
                      if (typeof program.schoolId === 'object' && program.schoolId !== null) {
                        schoolName = program.schoolId.name || program.schoolId.schoolName || 'N/A'
                      } else if (typeof program.schoolId === 'string') {
                        // If it's a string ID, we can't get the name directly
                        // The backend should populate it, but if not, show loading or fetch separately
                        schoolName = 'Loading...'
                      }
                    } else if (program.school) {
                      schoolName = program.school.name || program.school.schoolName || 'N/A'
                    }
                    
                    return (
                      <TableRow key={program._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{program.name}</div>
                            <div className="text-sm text-gray-500 sm:hidden">
                              {program.season ? program.season.charAt(0).toUpperCase() + program.season.slice(1) : 'N/A'} • {program.type ? program.type.charAt(0).toUpperCase() + program.type.slice(1) : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {schoolName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">
                            {program.season ? program.season.charAt(0).toUpperCase() + program.season.slice(1).replace('-', ' ') : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {program.type ? program.type.charAt(0).toUpperCase() + program.type.slice(1) : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {program.participantCount || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={program.isActive ? 'default' : 'secondary'}>
                            {program.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProgram(program)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        {programsWithCounts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}>
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                      onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, programsWithCounts.length)} of {programsWithCounts.length} programs
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

