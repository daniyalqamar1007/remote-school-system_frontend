"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  MapPin,
  Plus,
  Search,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Loader2,
  Eye
} from 'lucide-react'
import Link from 'next/link'
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

export default function SportsSchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSchedules, setTotalSchedules] = useState(0)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPrograms()
    fetchSchedulesData(currentPage, pageSize, '', 'all', 'all', 'all')
  }, [])

  useEffect(() => {
    debouncedSearch(searchTerm, programFilter, typeFilter, dateFilter)
  }, [searchTerm, programFilter, typeFilter, dateFilter])

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((search: string, program: string, type: string, date: string) => {
      setCurrentPage(1)
      fetchSchedulesData(1, pageSize, search, program, type, date)
    }, 500),
    [pageSize]
  )

  const fetchPrograms = async () => {
    try {
      const response = await sportsApi.programs.getAll({ page: '1', limit: '100' })
      const programsList = response?.data?.programs || response?.programs || (Array.isArray(response) ? response : [])
      setPrograms(Array.isArray(programsList) ? programsList : [])
    } catch (error: any) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchSchedulesData = async (page: number, limit: number, search: string, program: string, type: string, date: string) => {
    try {
      setSchedulesLoading(true)
      const filters: any = { page: page.toString(), limit: limit.toString() }
      
      // Apply filters
      if (program !== 'all') {
        filters.sportsProgramId = program
      }
      if (type !== 'all') {
        filters.eventType = type
      }
      
      const response = await sportsApi.schedule.getAll(filters)
      
      let schedulesList: any[] = []
      let paginationData: any = {}
      
      if (response?.data) {
        schedulesList = Array.isArray(response.data.schedules) 
          ? response.data.schedules 
          : Array.isArray(response.data)
            ? response.data
            : []
        paginationData = response.data.pagination || {}
      } else if (response?.schedules) {
        schedulesList = Array.isArray(response.schedules) ? response.schedules : []
        paginationData = response.pagination || {}
      } else if (Array.isArray(response)) {
        schedulesList = response
      }

      // Apply client-side filters
      if (search) {
        schedulesList = schedulesList.filter((schedule: any) =>
          schedule.program?.name?.toLowerCase().includes(search.toLowerCase()) ||
          schedule.title?.toLowerCase().includes(search.toLowerCase()) ||
          schedule.opponent?.toLowerCase().includes(search.toLowerCase()) ||
          schedule.location?.toLowerCase().includes(search.toLowerCase()) ||
          schedule.venue?.toLowerCase().includes(search.toLowerCase())
        )
      }

      if (date !== 'all') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        schedulesList = schedulesList.filter((schedule: any) => {
          const scheduleDate = new Date(schedule.startDate || schedule.date)
          const scheduleDateOnly = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate())
          
          switch (date) {
            case 'today':
              return scheduleDateOnly.getTime() === today.getTime()
            case 'this_week':
              const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
              return scheduleDateOnly >= today && scheduleDateOnly <= weekFromNow
            case 'upcoming':
              return scheduleDateOnly >= today
            case 'past':
              return scheduleDateOnly < today
            default:
              return true
          }
        })
      }

      // Sort by createdAt (newest first)
      schedulesList.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.created_at || a.startDate || a.date || 0).getTime()
        const dateB = new Date(b.createdAt || b.created_at || b.startDate || b.date || 0).getTime()
        if (dateB !== dateA) {
          return dateB - dateA // Descending order (newest first)
        }
        return (b._id || '').localeCompare(a._id || '')
      })

      setSchedules(schedulesList)
      setCurrentPage(paginationData.currentPage || page)
      setTotalPages(paginationData.totalPages || 1)
      setTotalSchedules(paginationData.totalCount || schedulesList.length)
      setPageSize(paginationData.limit || limit)
    } catch (error: any) {
      console.error('Error fetching schedules:', error)
      toast.error(error?.message || 'Failed to load schedules')
      setSchedules([])
      setTotalSchedules(0)
      setTotalPages(1)
    } finally {
      setSchedulesLoading(false)
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchSchedulesData(page, pageSize, searchTerm, programFilter, typeFilter, dateFilter)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchSchedulesData(1, newSize, searchTerm, programFilter, typeFilter, dateFilter)
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
      if (result?.success || result?.statusCode === 200) {
        toast.success(result?.message || 'Schedule deleted successfully')
      } else {
        toast.success('Schedule deleted successfully')
      }
      setDeleteDialogOpen(false)
      setScheduleToDelete(null)
      await fetchSchedulesData(currentPage, pageSize, searchTerm, programFilter, typeFilter, dateFilter)
      
      // If current page becomes empty after deletion, go to previous page
      if (schedules.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (error: any) {
      console.error('Error deleting schedule:', error)
      toast.error(error?.message || 'Failed to delete schedule')
    } finally {
      setDeleting(false)
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'game':
      case 'match':
        return 'bg-gray-900'
      case 'practice':
      case 'training':
        return 'bg-green-600'
      case 'tournament':
        return 'bg-purple-600'
      case 'meeting':
        return 'bg-orange-600'
      default:
        return 'bg-gray-800'
    }
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const isUpcoming = (dateString: string | Date) => {
    return new Date(dateString) > new Date()
  }

  if (loading && schedules.length === 0) {
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
          <Link href="/secretary/sports/programs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sports Schedule</h1>
            <p className="text-gray-600 mt-1">Manage games, practices, and events</p>
          </div>
        </div>
        <Link href="/secretary/sports/schedule/new">
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Event
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
                  placeholder="Search events, opponents, venues..."
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="game">Games</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(schedules) || schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No schedule events found
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule: any) => {
                    const program = schedule.program || schedule.sportsProgramId
                    const eventType = schedule.eventType || schedule.type
                    const scheduleDate = schedule.startDate || schedule.date
                    const startTime = schedule.startTime || schedule.time
                    const endTime = schedule.endTime
                    const location = schedule.location || schedule.venue
                    
                    return (
                      <TableRow 
                        key={schedule._id}
                        className={!isUpcoming(scheduleDate) ? 'opacity-60' : ''}
                      >
                        <TableCell>
                          <div className="font-medium text-gray-900">{program?.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${getEventTypeColor(eventType)} text-white font-medium`}
                          >
                            {eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{schedule.title || schedule.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-black" />
                            <span className="text-black font-medium">
                              {formatDate(schedule.startDate || scheduleDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-black" />
                            <span className="text-black font-medium">
                              {formatDate(schedule.endDate || schedule.startDate || scheduleDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-black" />
                            <span className="text-black font-medium">
                              {formatTime(startTime)}
                              {endTime && ` - ${formatTime(endTime)}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-black" />
                            <span className="text-black font-medium">{location || 'TBD'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/secretary/sports/schedule/${schedule._id}`}>
                              <Button variant="ghost" size="sm" title="View">
                                <Eye className="h-4 w-4 text-black" />
                              </Button>
                            </Link>
                            {/* <Link href={`/secretary/sports/attendance?schedule=${schedule._id}`}>
                              <Button variant="ghost" size="sm" title="Attendance">
                                <Users className="h-4 w-4 text-black" />
                              </Button>
                            </Link> */}
                            <Link href={`/secretary/sports/schedule/${schedule._id}/edit`}>
                              <Button variant="ghost" size="sm" title="Edit">
                                <Edit className="h-4 w-4 text-black" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule)}
                              title="Delete"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
          {!schedulesLoading && schedules.length > 0 && (
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
                  disabled={currentPage === 1 || schedulesLoading}
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
                        disabled={schedulesLoading}
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
                  disabled={currentPage >= totalPages || schedulesLoading}
                >
                  Next
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSchedules)} of {totalSchedules} events
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {scheduleToDelete && (
            <div className="py-4">
              <p className="font-medium">{scheduleToDelete.title || scheduleToDelete.name}</p>
              <p className="text-sm text-gray-600">
                {scheduleToDelete.program?.name || scheduleToDelete.sportsProgramId?.name} - {formatDate(scheduleToDelete.startDate || scheduleToDelete.date)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setScheduleToDelete(null)
              }}
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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