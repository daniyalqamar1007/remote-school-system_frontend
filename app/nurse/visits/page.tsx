'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Stethoscope,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import NurseVisitForm from './components/NurseVisitForm'
import { 
  NurseVisitStatus, 
  NurseVisitPriority, 
  NurseVisitDisposition,
  NurseVisitStatusLabels,
  NurseVisitPriorityLabels,
  NurseVisitDispositionLabels
} from '@/lib/enums/nurse-visit.enums'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

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

export default function NurseVisitsPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalVisits, setTotalVisits] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false)
  const [isViewVisitOpen, setIsViewVisitOpen] = useState(false)
  const [isEditVisitOpen, setIsEditVisitOpen] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [isActionTakenDialogOpen, setIsActionTakenDialogOpen] = useState(false)
  const [actionTakenText, setActionTakenText] = useState('')
  const [addingAction, setAddingAction] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [visitToDelete, setVisitToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalVisits: 0,
    visitsToday: 0,
    emergencyVisits: 0,
    followUpRequired: 0
  })
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch stats (only called on page load)
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await fetch(`${API_BASE_URL}/nurse/visits/stats`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setStats({
            totalVisits: data.data.totalVisits || 0,
            visitsToday: data.data.visitsToday || 0,
            emergencyVisits: data.data.emergencyVisits || 0,
            followUpRequired: data.data.followUpRequired || 0
          })
        }
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch visits with pagination
  const fetchVisits = useCallback(async (page: number, limit: number, search: string, priority: string, status: string) => {
    try {
      setVisitsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (search) {
        params.append('search', search)
      }
      if (priority !== 'all') {
        params.append('priority', priority)
      }
      if (status !== 'all') {
        params.append('status', status)
      }

      const response = await fetch(`${API_BASE_URL}/nurse/visits?${params.toString()}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[fetchVisits] API Response:', { 
          success: data.success, 
          visitsCount: data.visits?.length || 0,
          pagination: data.pagination,
          fullData: data
        })
        
        // Check if backend returned an error
        if (data.success === false) {
          const errorMessage = data.message || data.error || 'Failed to load nurse visits'
          console.error('[fetchVisits] Backend error:', errorMessage)
          toast.error(errorMessage)
          setVisits([])
          setTotalVisits(0)
          setTotalPages(1)
          setStats({
            totalVisits: 0,
            visitsToday: 0,
            emergencyVisits: 0,
            followUpRequired: 0
          })
          return
        }
        
        const visitsList = data?.visits || data?.data?.visits || (Array.isArray(data) ? data : [])
        const pagination = data?.pagination || data?.data?.pagination || {}
        
        console.log('[fetchVisits] Processed visits:', { 
          visitsListLength: visitsList.length, 
          pagination 
        })
        
        setVisits(Array.isArray(visitsList) ? visitsList : [])
        setTotalVisits(pagination.total || visitsList.length)
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || visitsList.length) / limit))
      } else {
        // HTTP error - try to get error message from response
        let errorMessage = 'Failed to load nurse visits'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Failed to load nurse visits (Status: ${response.status})`
        }
        console.error('Failed to fetch visits:', errorMessage)
        toast.error(errorMessage)
        setVisits([])
        setTotalVisits(0)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error('Error fetching visits:', error)
      const errorMessage = error.message || 'Network error: Failed to load nurse visits'
      toast.error(errorMessage)
      setVisits([])
      setTotalVisits(0)
      setTotalPages(1)
    } finally {
      setVisitsLoading(false)
      setLoading(false)
    }
  }, [])

  // Fetch stats on page load only
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchVisits(currentPage, pageSize, searchTerm, priorityFilter, statusFilter)
  }, [currentPage, pageSize, fetchVisits])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchVisits(1, pageSize, searchTerm, priorityFilter, statusFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, priorityFilter, statusFilter, pageSize, fetchVisits])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleViewVisit = async (visit: any) => {
    // Fetch fresh visit data to ensure we have the latest action taken
    try {
      const response = await fetch(`${API_BASE_URL}/nurse/visits?studentId=${visit.studentId}`, {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success === false) {
          // If API returns error, use existing visit data
          console.error('Error fetching visit:', data.message)
          setSelectedVisit(visit)
        } else {
          const visitsList = data?.visits || data?.data?.visits || []
          const freshVisit = visitsList.find((v: any) => v._id === visit._id)
          setSelectedVisit(freshVisit || visit)
        }
      } else {
        // HTTP error - use existing visit data
        setSelectedVisit(visit)
      }
    } catch (error: any) {
      console.error('Error fetching fresh visit data:', error)
      // On error, use existing visit data
      setSelectedVisit(visit)
    }
    setIsViewVisitOpen(true)
  }

  const handleEditVisit = (visit: any) => {
    setSelectedVisit(visit)
    setIsEditVisitOpen(true)
  }

  const handleDeleteVisit = (visit: any) => {
    setVisitToDelete(visit)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!visitToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/nurse/health-records/student/${visitToDelete.studentId}/nurse-visit/${visitToDelete._id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      )

      const data = await response.json()
      if (response.ok && data.success !== false) {
        toast.success(data.message || 'Nurse visit deleted successfully')
        setDeleteDialogOpen(false)
        setVisitToDelete(null)
        await fetchVisits(currentPage, pageSize, searchTerm, priorityFilter, statusFilter)
        fetchStats() // Refresh stats after deleting a visit
      } else {
        toast.error(data.message || data.error || 'Failed to delete nurse visit')
      }
    } catch (error: any) {
      console.error('Error deleting visit:', error)
      toast.error(error.message || 'Error deleting nurse visit')
    } finally {
      setDeleting(false)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityValue = priority || NurseVisitPriority.LOW
    const label = NurseVisitPriorityLabels[priorityValue as NurseVisitPriority] || priorityValue
    const colorClass = priorityValue === NurseVisitPriority.EMERGENCY ? 'bg-red-500' :
                       priorityValue === NurseVisitPriority.HIGH ? 'bg-orange-500' :
                       priorityValue === NurseVisitPriority.MEDIUM ? 'bg-yellow-500' : 'bg-gray-500'
    return <Badge className={colorClass}>{label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const statusValue = status || NurseVisitStatus.IN_PROGRESS
    const label = NurseVisitStatusLabels[statusValue as NurseVisitStatus] || statusValue
    const colorClass = statusValue === NurseVisitStatus.COMPLETED ? 'bg-green-500' :
                       statusValue === NurseVisitStatus.FOLLOW_UP_REQUIRED ? 'bg-orange-500' :
                       statusValue === NurseVisitStatus.CANCELLED ? 'bg-gray-500' : 'bg-blue-500'
    return <Badge className={colorClass}>{label}</Badge>
  }

  if (loading && visits.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading nurse visits...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nurse Visits</h1>
          <p className="text-gray-600 mt-1">Track and monitor student nurse visits</p>
        </div>
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => setIsAddVisitOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Visit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Stethoscope className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visitsToday}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency</CardTitle>
            <Stethoscope className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emergencyVisits}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-up</CardTitle>
            <Stethoscope className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followUpRequired}</div>
            <p className="text-xs text-muted-foreground">Required</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by student name, reason, treatment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value={NurseVisitPriority.EMERGENCY}>{NurseVisitPriorityLabels[NurseVisitPriority.EMERGENCY]}</SelectItem>
                <SelectItem value={NurseVisitPriority.HIGH}>{NurseVisitPriorityLabels[NurseVisitPriority.HIGH]}</SelectItem>
                <SelectItem value={NurseVisitPriority.MEDIUM}>{NurseVisitPriorityLabels[NurseVisitPriority.MEDIUM]}</SelectItem>
                <SelectItem value={NurseVisitPriority.LOW}>{NurseVisitPriorityLabels[NurseVisitPriority.LOW]}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={NurseVisitStatus.COMPLETED}>{NurseVisitStatusLabels[NurseVisitStatus.COMPLETED]}</SelectItem>
                <SelectItem value={NurseVisitStatus.IN_PROGRESS}>{NurseVisitStatusLabels[NurseVisitStatus.IN_PROGRESS]}</SelectItem>
                <SelectItem value={NurseVisitStatus.FOLLOW_UP_REQUIRED}>{NurseVisitStatusLabels[NurseVisitStatus.FOLLOW_UP_REQUIRED]}</SelectItem>
                <SelectItem value={NurseVisitStatus.CANCELLED}>{NurseVisitStatusLabels[NurseVisitStatus.CANCELLED]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Nurse Visits ({totalVisits})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {totalPages || 1}
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
                  <TableHead>Student</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Treatment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading visits...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(visits) || visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No nurse visits found
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((visit: any) => (
                    <TableRow key={visit._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-black">
                            {visit.student?.firstName || 'Unknown'} {visit.student?.lastName || 'Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {visit.student?.gradeLevel || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-black">
                        <div>
                          <div>{visit.visitDate ? format(new Date(visit.visitDate), 'MMM dd, yyyy') : 'N/A'}</div>
                          <div className="text-sm text-gray-500">{visit.visitTime || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-black">{visit.reason || 'N/A'}</TableCell>
                      <TableCell>{getPriorityBadge(visit.priority || 'Low')}</TableCell>
                      <TableCell>{getStatusBadge(visit.status || 'In Progress')}</TableCell>
                      <TableCell className="hidden lg:table-cell text-black">
                        {visit.treatment ? (visit.treatment.length > 50 ? visit.treatment.substring(0, 50) + '...' : visit.treatment) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewVisit(visit)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVisit(visit)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVisit(visit)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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
            <span className="text-sm text-gray-600">Show per page:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalVisits)} of {totalVisits}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
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
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Visit Dialog */}
      <Dialog open={isAddVisitOpen} onOpenChange={setIsAddVisitOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Nurse Visit</DialogTitle>
            <DialogDescription>
              Fill in the details of the nurse visit. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <NurseVisitForm
            onSuccess={() => {
              setIsAddVisitOpen(false)
              fetchVisits(currentPage, pageSize, searchTerm, priorityFilter, statusFilter)
              fetchStats() // Refresh stats after adding a visit
            }}
            onCancel={() => setIsAddVisitOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Visit Dialog */}
      <Dialog open={isViewVisitOpen} onOpenChange={setIsViewVisitOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nurse Visit Details</DialogTitle>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium text-black">
                    {selectedVisit.student?.firstName} {selectedVisit.student?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-medium text-black">{selectedVisit.student?.gradeLevel || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-black">
                    {selectedVisit.visitDate ? format(new Date(selectedVisit.visitDate), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-black">{selectedVisit.visitTime || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-medium text-black">{selectedVisit.reason || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <div>{getPriorityBadge(selectedVisit.priority || NurseVisitPriority.LOW)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div>{getStatusBadge(selectedVisit.status || NurseVisitStatus.IN_PROGRESS)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disposition</p>
                  <p className="font-medium text-black">
                    {selectedVisit.disposition ? NurseVisitDispositionLabels[selectedVisit.disposition as NurseVisitDisposition] || selectedVisit.disposition : 'N/A'}
                  </p>
                </div>
              </div>
              {selectedVisit.symptoms && selectedVisit.symptoms.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Symptoms</p>
                  <p className="font-medium text-black">
                    {Array.isArray(selectedVisit.symptoms) ? selectedVisit.symptoms.join(', ') : selectedVisit.symptoms}
                  </p>
                </div>
              )}
              {selectedVisit.treatment && (
                <div>
                  <p className="text-sm text-gray-500">Treatment</p>
                  <p className="font-medium text-black">{selectedVisit.treatment}</p>
                </div>
              )}
              {selectedVisit.medications && selectedVisit.medications.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Medications</p>
                  <p className="font-medium text-black">
                    {Array.isArray(selectedVisit.medications) ? selectedVisit.medications.join(', ') : selectedVisit.medications}
                  </p>
                </div>
              )}
              {(selectedVisit.temperature || selectedVisit.heartRate || selectedVisit.bloodPressure) && (
                <div className="grid grid-cols-3 gap-4">
                  {selectedVisit.temperature && (
                    <div>
                      <p className="text-sm text-gray-500">Temperature</p>
                      <p className="font-medium text-black">{selectedVisit.temperature}°F</p>
                    </div>
                  )}
                  {selectedVisit.heartRate && (
                    <div>
                      <p className="text-sm text-gray-500">Heart Rate</p>
                      <p className="font-medium text-black">{selectedVisit.heartRate} BPM</p>
                    </div>
                  )}
                  {selectedVisit.bloodPressure && (
                    <div>
                      <p className="text-sm text-gray-500">Blood Pressure</p>
                      <p className="font-medium text-black">{selectedVisit.bloodPressure}</p>
                    </div>
                  )}
                </div>
              )}
              {selectedVisit.restrictionsNotes && (
                <div>
                  <p className="text-sm text-gray-500">Restrictions Notes</p>
                  <p className="font-medium text-black">{selectedVisit.restrictionsNotes}</p>
                </div>
              )}
              {selectedVisit.actionTaken && Array.isArray(selectedVisit.actionTaken) && selectedVisit.actionTaken.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Actions Taken</p>
                  <div className="space-y-1">
                    {selectedVisit.actionTaken.map((action: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm font-medium text-black">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedVisit.followUpNeeded} disabled />
                  <span className="text-sm">Follow-up Needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedVisit.parentNotified} disabled />
                  <span className="text-sm">Parent Notified</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedVisit.returnToClass} disabled />
                  <span className="text-sm">Return to Class</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewVisitOpen(false)}>Close</Button>
            {selectedVisit && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setActionTakenText('')
                    setIsActionTakenDialogOpen(true)
                  }}
                >
                  Add Action Taken
                </Button>
                <Button onClick={() => {
                  setIsViewVisitOpen(false)
                  handleEditVisit(selectedVisit)
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditVisitOpen} onOpenChange={setIsEditVisitOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Nurse Visit</DialogTitle>
            <DialogDescription>
              Update the details of the nurse visit. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {selectedVisit && (
            <NurseVisitForm
              visit={selectedVisit}
              studentId={selectedVisit.studentId}
              onSuccess={() => {
                setIsEditVisitOpen(false)
                setSelectedVisit(null)
                fetchVisits(currentPage, pageSize, searchTerm, priorityFilter, statusFilter)
                fetchStats() // Refresh stats after editing a visit
              }}
              onCancel={() => {
                setIsEditVisitOpen(false)
                setSelectedVisit(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Nurse Visit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this nurse visit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {visitToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Student:</strong> {visitToDelete.student?.firstName} {visitToDelete.student?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {visitToDelete.visitDate ? format(new Date(visitToDelete.visitDate), 'MMM dd, yyyy') : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Reason:</strong> {visitToDelete.reason || 'N/A'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
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

      {/* Add Action Taken Dialog */}
      <Dialog open={isActionTakenDialogOpen} onOpenChange={setIsActionTakenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Action Taken</DialogTitle>
            <DialogDescription>
              Record an action that was taken during this nurse visit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actionTaken">Action Taken</Label>
              <Textarea
                id="actionTaken"
                placeholder="Enter the action taken (e.g., Applied bandage, Administered medication, Called parent)"
                value={actionTakenText}
                onChange={(e) => setActionTakenText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionTakenDialogOpen(false)} disabled={addingAction}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!actionTakenText.trim() || !selectedVisit) return
                
                setAddingAction(true)
                try {
                  const currentActions = Array.isArray(selectedVisit.actionTaken) ? selectedVisit.actionTaken : []
                  const updatedActions = [...currentActions, actionTakenText.trim()]
                  
                  const response = await fetch(
                    `${API_BASE_URL}/nurse/health-records/student/${selectedVisit.studentId}/nurse-visit/${selectedVisit._id}`,
                    {
                      method: 'PUT',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        actionTaken: updatedActions
                      }),
                    }
                  )

                  let data: any = {}
                  try {
                    data = await response.json()
                  } catch (parseError) {
                    const errorMessage = `Failed to add action taken: Invalid response from server (Status: ${response.status})`
                    toast.error(errorMessage)
                    setAddingAction(false)
                    return
                  }

                  if (response.ok && data.success !== false) {
                    const successMessage = data.message || 'Action taken added successfully'
                    toast.success(successMessage)
                    setIsActionTakenDialogOpen(false)
                    setActionTakenText('')
                    // Refresh the visit data
                    await fetchVisits(currentPage, pageSize, searchTerm, priorityFilter, statusFilter)
                    fetchStats() // Refresh stats after adding action taken
                    // Update selected visit if view is still open
                    if (isViewVisitOpen && selectedVisit) {
                      // Fetch fresh data for the selected visit
                      try {
                        const response = await fetch(`${API_BASE_URL}/nurse/visits?studentId=${selectedVisit.studentId}`, {
                          headers: getAuthHeaders(),
                        })
                        if (response.ok) {
                          const data = await response.json()
                          if (data.success !== false) {
                            const visitsList = data?.visits || data?.data?.visits || []
                            const freshVisit = visitsList.find((v: any) => v._id === selectedVisit._id)
                            if (freshVisit) {
                              setSelectedVisit(freshVisit)
                            } else {
                              setSelectedVisit({ ...selectedVisit, actionTaken: updatedActions })
                            }
                          } else {
                            setSelectedVisit({ ...selectedVisit, actionTaken: updatedActions })
                          }
                        } else {
                          setSelectedVisit({ ...selectedVisit, actionTaken: updatedActions })
                        }
                      } catch (error) {
                        setSelectedVisit({ ...selectedVisit, actionTaken: updatedActions })
                      }
                    }
                  } else {
                    const errorMessage = data.message || data.error || 'Failed to add action taken'
                    toast.error(errorMessage)
                  }
                } catch (error: any) {
                  console.error('Error adding action taken:', error)
                  toast.error(error.message || 'Error adding action taken')
                } finally {
                  setAddingAction(false)
                }
              }}
              disabled={addingAction || !actionTakenText.trim()}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {addingAction ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Action'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
