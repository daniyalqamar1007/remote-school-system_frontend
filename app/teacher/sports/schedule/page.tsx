"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Calendar, 
  Clock, 
  MapPin,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Building,
  Trophy
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

export default function TeacherSportsSchedulePage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<any[]>([])
  const [myPrograms, setMyPrograms] = useState<any[]>([])
  const [allSchedules, setAllSchedules] = useState<any[]>([])
  const [displayedSchedules, setDisplayedSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMyPrograms()
  }, [])

  useEffect(() => {
    if (myPrograms.length > 0) {
      fetchSchedules()
    }
  }, [myPrograms])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (myPrograms.length > 0) {
      fetchSchedules()
    }
  }, [debouncedSearchTerm, typeFilter, dateFilter, programFilter, currentPage, pageSize])

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

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true)
      
      // Get my program IDs
      const programIds = myPrograms.map((p: any) => p._id)
      if (programIds.length === 0) {
        setAllSchedules([])
        setDisplayedSchedules([])
        setTotalPages(1)
        setSchedulesLoading(false)
        setLoading(false)
        return
      }

      // Build filters for backend
      const filters: any = {
        page: currentPage.toString(),
        limit: pageSize.toString()
      }

      // Add program filter - filter by my programs
      if (programFilter !== 'all') {
        filters.sportsProgramId = programFilter
      } else {
        // If "all", we need to filter by all my programs on backend
        // For now, we'll fetch all and filter client-side for multiple programs
        // Or we can make multiple API calls - but let's use a single call with first program
        // Actually, let's fetch all and filter client-side for program filter
      }

      // Add type filter
      if (typeFilter !== 'all') {
        filters.eventType = typeFilter
      }

      // Add date filter
      if (dateFilter !== 'all') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        today.setHours(0, 0, 0, 0)
        
        switch (dateFilter) {
          case 'today':
            filters.startDate = today.toISOString().split('T')[0]
            filters.endDate = today.toISOString().split('T')[0]
            break
          case 'this_week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            filters.startDate = today.toISOString().split('T')[0]
            filters.endDate = weekFromNow.toISOString().split('T')[0]
            break
          case 'upcoming':
            filters.startDate = today.toISOString().split('T')[0]
            break
          case 'past':
            const yesterday = new Date(today.getTime() - 1)
            filters.endDate = yesterday.toISOString().split('T')[0]
            break
        }
      }

      // Add search filter
      if (debouncedSearchTerm.trim()) {
        filters.search = debouncedSearchTerm.trim()
      }

      // Fetch schedules with filters
      const response = await sportsApi.schedule.getAll(filters)
      
      let schedulesData: any[] = []
      let paginationData: any = {}
      
      if (response?.data) {
        schedulesData = Array.isArray(response.data.schedules) 
          ? response.data.schedules 
          : Array.isArray(response.data)
            ? response.data
            : []
        paginationData = response.data.pagination || {}
      } else if (response?.schedules) {
        schedulesData = Array.isArray(response.schedules) ? response.schedules : []
        paginationData = response.pagination || {}
      } else if (Array.isArray(response)) {
        schedulesData = response
      }

      // Filter schedules for my programs (in case backend doesn't filter by program array)
      const mySchedules = schedulesData.filter((s: any) => {
        const scheduleProgramId = s.sportsProgramId?._id || s.sportsProgramId || s.program?._id || s.program
        return programIds.includes(scheduleProgramId)
      })

      // If program filter is "all", show all my programs' schedules
      // If a specific program is selected, filter by that program
      const filteredSchedules = programFilter !== 'all' 
        ? mySchedules.filter((s: any) => {
            const scheduleProgramId = s.sportsProgramId?._id || s.sportsProgramId || s.program?._id || s.program
            return scheduleProgramId === programFilter
          })
        : mySchedules

      setAllSchedules(filteredSchedules)
      setDisplayedSchedules(filteredSchedules)
      
      // Update pagination from backend
      if (paginationData.totalPages !== undefined) {
        setTotalPages(paginationData.totalPages)
        setCurrentPage(paginationData.currentPage || currentPage)
        setTotalCount(paginationData.totalCount || paginationData.total || filteredSchedules.length)
      } else {
        const totalFiltered = filteredSchedules.length
        const totalPagesCount = Math.ceil(totalFiltered / pageSize)
        setTotalPages(totalPagesCount)
        setTotalCount(totalFiltered)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Failed to load schedules')
      setAllSchedules([])
      setDisplayedSchedules([])
    } finally {
      setSchedulesLoading(false)
      setLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleProgramFilterChange = (value: string) => {
    setProgramFilter(value)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (time: string) => {
    if (!time) return 'N/A'
    return time
  }

  const handleDeleteSchedule = (schedule: any) => {
    setScheduleToDelete(schedule)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return

    setDeleting(true)
    try {
      const result = await sportsApi.schedule.delete(scheduleToDelete._id)
      if (result?.success || result === true || result?.statusCode === 200) {
        toast.success(result?.message || 'Schedule deleted successfully')
      } else {
        toast.success('Schedule deleted successfully')
      }
      setDeleteDialogOpen(false)
      setScheduleToDelete(null)
      await fetchSchedules()
    } catch (error: any) {
      console.error('Error deleting schedule:', error)
      toast.error(error?.message || 'Failed to delete schedule')
    } finally {
      setDeleting(false)
    }
  }

  const getEventTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'game':
      case 'match':
        return <Badge variant="destructive">Game</Badge>
      case 'practice':
        return <Badge className="bg-blue-100 text-blue-800">Practice</Badge>
      case 'tournament':
        return <Badge className="bg-purple-100 text-purple-800">Tournament</Badge>
      default:
        return <Badge variant="outline">{type || 'Event'}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sports Schedule</h1>
          <p className="text-gray-600 mt-1">Manage games, practices, and events for your programs</p>
        </div>
        <Link href="/teacher/sports/schedule/new">
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Event
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
                placeholder="Search by program, title, opponent, or location..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
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
            {/* <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="game">Game</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select> */}
            {/* <Select value={dateFilter} onValueChange={handleDateFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Schedules ({allSchedules.length})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {schedulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : displayedSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No schedules found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="hidden sm:table-cell">Program</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Time</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedSchedules.map((schedule: any) => {
                    const program = schedule.sportsProgramId || schedule.program
                    const eventType = schedule.eventType || schedule.type
                    const scheduleDate = schedule.startDate || schedule.date
                    const startTime = schedule.startTime || schedule.time
                    const location = schedule.location || schedule.venue
                    
                    return (
                      <TableRow key={schedule._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{schedule.title || `${program?.name || 'Event'} - ${eventType || 'Event'}`}</div>
                            {schedule.opponent && (
                              <div className="text-sm text-gray-500">vs {schedule.opponent}</div>
                            )}
                            <div className="text-sm text-gray-500 md:hidden">
                              {formatDate(scheduleDate)} • {formatTime(startTime)}
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
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(scheduleDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatTime(startTime)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{location || 'TBD'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getEventTypeBadge(eventType)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/teacher/sports/schedule/${schedule._id}`)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/teacher/sports/schedule/${schedule._id}/edit`)}
                              title="Edit schedule"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule)}
                              title="Delete schedule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
        {allSchedules.length > 0 && (
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
              Showing {displayedSchedules.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} schedules
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {scheduleToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Event:</strong> {scheduleToDelete.title || scheduleToDelete.eventType}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {formatDate(scheduleToDelete.startDate || scheduleToDelete.date)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteSchedule}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

