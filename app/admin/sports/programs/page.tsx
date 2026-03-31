"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Trophy, 
  Users, 
  Calendar, 
  Plus,
  Search,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Loader2
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

export default function SportsProgramsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [programs, setPrograms] = useState<any[]>([])
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
  const [totalPrograms, setTotalPrograms] = useState(0)
  
  // Filter states
  const [seasonFilter, setSeasonFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Loading state for programs table
  const [programsLoading, setProgramsLoading] = useState(false)

  useEffect(() => {
    // Fetch programs first (used in table)
    fetchProgramsData(1, pageSize, '', 'all', 'all', 'all')
    // Then fetch stats (doesn't overwrite programs)
    fetchSportsData()
    
    // Check for refresh parameter
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('refresh') === 'true') {
      // Remove the refresh parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      // Fetch data again to ensure latest information
      setTimeout(() => {
        fetchProgramsData(1, pageSize, '', 'all', 'all', 'all')
        fetchSportsData()
      }, 100)
    }
  }, [])
  
  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string, season: string, type: string, isActive: string) => {
      setCurrentPage(1)
      fetchProgramsData(1, pageSize, search, season, type, isActive)
    }, 500),
    [pageSize]
  )

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value, seasonFilter, typeFilter, isActiveFilter)
  }

  const handleSeasonFilterChange = (value: string) => {
    setSeasonFilter(value)
    setCurrentPage(1)
    fetchProgramsData(1, pageSize, searchTerm, value, typeFilter, isActiveFilter)
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    setCurrentPage(1)
    fetchProgramsData(1, pageSize, searchTerm, seasonFilter, value, isActiveFilter)
  }

  const handleIsActiveFilterChange = (value: string) => {
    setIsActiveFilter(value)
    setCurrentPage(1)
    fetchProgramsData(1, pageSize, searchTerm, seasonFilter, typeFilter, value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchProgramsData(page, pageSize, searchTerm, seasonFilter, typeFilter, isActiveFilter)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchProgramsData(1, newSize, searchTerm, seasonFilter, typeFilter, isActiveFilter)
  }

  // Fetch programs with pagination and filters
  const fetchProgramsData = async (
    page = 1, 
    limit = 10, 
    search = '', 
    season = 'all', 
    type = 'all', 
    isActive = 'all'
  ) => {
    try {
      setProgramsLoading(true)
      
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc' // Newest first
      }
      
      if (search.trim()) {
        params.search = search.trim()
      }
      
      if (season && season !== 'all') {
        params.season = season
      }
      
      if (type && type !== 'all') {
        params.type = type
      }
      
      if (isActive && isActive !== 'all') {
        params.isActive = isActive === 'true' ? 'true' : 'false'
      }
      
      const response = await sportsApi.programs.getAll(params)
      
      // Handle API response structure
      let programsData: any[] = []
      let paginationData: any = {}
      
      if (response) {
        if (response.success && response.data) {
          programsData = Array.isArray(response.data.programs) ? response.data.programs : []
          paginationData = response.data.pagination || {}
        } else if (response.data && response.data.programs) {
          programsData = Array.isArray(response.data.programs) ? response.data.programs : []
          paginationData = response.data.pagination || {}
        } else if (Array.isArray(response.programs)) {
          programsData = response.programs
          paginationData = response.pagination || {}
        } else if (Array.isArray(response)) {
          programsData = response
        }
      }
      
      // Ensure programsData is always an array
      if (!Array.isArray(programsData)) {
        console.warn('Programs data is not an array:', programsData)
        programsData = []
      }
      
      // Sort by createdAt descending (newest first)
      programsData.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0).getTime()
        const dateB = new Date(b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0).getTime()
        if (dateB !== dateA) {
          return dateB - dateA // Descending order (newest first)
        }
        return (b._id || '').localeCompare(a._id || '')
      })
      
      setPrograms(programsData)
      setCurrentPage(paginationData.currentPage || page)
      setTotalPages(paginationData.totalPages || 1)
      setTotalPrograms(paginationData.totalCount || programsData.length)
      setPageSize(paginationData.limit || limit)
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error('Failed to load sports programs')
      setPrograms([])
      setTotalPrograms(0)
      setTotalPages(1)
    } finally {
      setProgramsLoading(false)
    }
  }

  const fetchSportsData = async () => {
    try {
      setLoading(true)
      
      let programsCount = totalPrograms || 0
      
      if (!programsCount || programsCount === 0) {
        try {
          const programsResponse = await sportsApi.programs.getAll({ page: '1', limit: '1' })
          if (programsResponse?.data?.pagination?.totalCount) {
            programsCount = programsResponse.data.pagination.totalCount
          } else if (programsResponse?.pagination?.totalCount) {
            programsCount = programsResponse.pagination.totalCount
          } else {
            const programsData = programsResponse?.data?.programs || programsResponse?.programs || []
            programsCount = Array.isArray(programsData) ? programsData.length : 0
          }
        } catch (err) {
          programsCount = 0
        }
      }
      
      // Fetch student assignments
      const assignmentsResponse = await sportsApi.assignments.getAll({ status: 'active', limit: '100' })
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
      const activeStudents = assignmentsData.length || 0
      
      // Fetch upcoming events
      const scheduleResponse = await sportsApi.schedule.getAll({
        startDate: new Date().toISOString().split('T')[0],
        limit: '100'
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
      const upcomingEvents = scheduleData.length || 0
      
      // Calculate attendance rate
      let attendanceRate = 0
      try {
        const attendanceResponse = await sportsApi.attendance.getAll({ limit: '100' })
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
        const presentCount = attendanceData.filter((a: any) => a.status === 'present').length
        attendanceRate = attendanceData.length > 0 ? Math.round((presentCount / attendanceData.length) * 100) : 0
      } catch (attendanceError) {
        console.warn('Attendance API error (non-critical):', attendanceError)
        attendanceRate = 0
      }
      
      setStats({
        totalPrograms: programsCount,
        activeStudents,
        upcomingEvents,
        attendanceRate
      })
      
    } catch (error) {
      console.error('Error fetching sports data:', error)
      toast.error('Failed to load sports data')
      setStats({
        totalPrograms: totalPrograms || 0,
        activeStudents: 0,
        upcomingEvents: 0,
        attendanceRate: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle view, edit, delete actions
  const handleViewProgram = (program: any) => {
    router.push(`/admin/sports/programs/${program._id}`)
  }

  const handleEditProgram = (program: any) => {
    router.push(`/admin/sports/programs/${program._id}/edit`)
  }

  const handleDeleteProgram = (program: any) => {
    setProgramToDelete(program)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteProgram = async () => {
    if (!programToDelete) return

    setIsDeleting(true)
    try {
      const result = await sportsApi.programs.delete(programToDelete._id)
      
      if (result?.success || result === true || result?.statusCode === 200) {
        toast.success(result?.message || 'Sports program deleted successfully')
      } else {
        toast.success('Sports program deleted successfully')
      }
      
      setIsDeleteDialogOpen(false)
      setProgramToDelete(null)
      
      // Refresh programs list and stats
      fetchProgramsData(currentPage, pageSize, searchTerm, seasonFilter, typeFilter, isActiveFilter)
      fetchSportsData()
    } catch (error: any) {
      console.error('Error deleting program:', error)
      toast.error(error?.message || 'Failed to delete sports program')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sports Programs</h1>
          <p className="text-gray-600 mt-1">Manage sports programs and view statistics</p>
        </div>
        <Link href="/admin/sports/programs/new">
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Program
          </Button>
        </Link>
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
              <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
              <p className="text-xs text-muted-foreground">Active sports programs</p>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
              <p className="text-xs text-muted-foreground">Students participating</p>
            </CardContent>
          </Card> */}

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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Programs Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Sports Programs ({totalPrograms})
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
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoComplete="off"
              />
            </div>
            <Select value={seasonFilter} onValueChange={handleSeasonFilterChange}>
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
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
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
            <Select value={isActiveFilter} onValueChange={handleIsActiveFilterChange}>
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
                  <TableHead className="hidden sm:table-cell">Season</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Participants</TableHead>
                  <TableHead className="hidden xl:table-cell">Max Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programsLoading ? (
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
                ) : !Array.isArray(programs) || programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No sports programs found
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(programs) ? programs : []).map((program: any) => (
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
                      <TableCell className="hidden xl:table-cell">
                        {program.maxParticipants || 'Unlimited'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={program.isActive ? 'default' : 'secondary'}>
                          {program.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProgram(program)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProgram(program)}
                            title="Edit program"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProgram(program)}
                            title="Delete program"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
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
              disabled={currentPage === 1 || programsLoading}
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
                    disabled={programsLoading}
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
              disabled={currentPage === totalPages || programsLoading}
            >
              Next
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalPrograms)} of {totalPrograms} programs
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete sports program "{programToDelete?.name}"? 
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
              onClick={confirmDeleteProgram}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Program'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

