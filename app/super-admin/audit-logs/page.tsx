"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Filter,
  Search,
  Activity,
  Trash2,
  Loader2
} from "lucide-react"
import { toast } from 'sonner'
import axios from "axios"

interface ActivityLog {
  _id: string
  title: string
  subtitle?: string
  performBy: string
  adminId?: string | {
    _id: string
    firstName?: string
    lastName?: string
    email?: string
  }
  teacherId?: string | {
    _id: string
    firstName?: string
    lastName?: string
    email?: string
  }
  actorId?: string | {
    _id: string
    firstName?: string
    lastName?: string
    email?: string
  }
  createdAt: string
  updatedAt?: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalLogs, setTotalLogs] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Filters - only those that work with Activity schema
  const [filters, setFilters] = useState({
    performBy: 'all', // Role filter (performBy field)
    title: '', // Search by title
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchActivities()
  }, [currentPage, pageSize, filters])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(filters.performBy !== 'all' && { performBy: filters.performBy }),
        ...(filters.title && { title: filters.title }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      })

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/activity?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data) {
        const activities: ActivityLog[] = response.data.data || []
        const resolveName = (log: ActivityLog) => {
          const a = log.actorId && typeof log.actorId === 'object' ? log.actorId : null
          const b = log.adminId && typeof log.adminId === 'object' ? log.adminId : null
          const c = log.teacherId && typeof log.teacherId === 'object' ? log.teacherId : null
          const obj = a || b || c
          return obj ? [obj.firstName, obj.lastName].filter(Boolean).join(' ') || 'Unknown' : 'Unknown'
        }
        const filtered = activities.filter((log) => resolveName(log) !== 'Unknown')
        setLogs(filtered)
        setTotalLogs(filtered.length)
        setTotalPages(Math.ceil(filtered.length / pageSize) || 1)
      } else {
        setLogs([])
        setTotalLogs(0)
        setTotalPages(0)
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error)
      toast.error(error.response?.data?.message || "Failed to fetch activities")
      setLogs([])
      setTotalLogs(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleDelete = async () => {
    if (!deletingActivityId) return

    try {
      setDeleting(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/activity/${deletingActivityId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success("Activity deleted successfully")
      setDeleteDialogOpen(false)
      setDeletingActivityId(null)
      
      // Refresh the list
      await fetchActivities()
    } catch (error: any) {
      console.error('Error deleting activity:', error)
      toast.error(error.response?.data?.message || "Failed to delete activity")
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (activity: ActivityLog) => {
    setDeletingActivityId(activity._id)
    setDeleteDialogOpen(true)
  }
  
  const getActivityById = (id: string) => {
    return logs.find(log => log._id === id) || null
  }

  const getRoleBadge = (performBy: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'ADMIN': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'TEACHER': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'STUDENT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'PARENT': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'NURSE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'SECRETARY': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }

    return (
      <Badge className={roleColors[performBy] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
        {performBy.replace(/_/g, ' ')}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getPersonInfo = (log: ActivityLog) => {
    // Check actorId first (most common)
    if (log.actorId && typeof log.actorId === 'object') {
      const actor = log.actorId
      const name = [actor.firstName, actor.lastName].filter(Boolean).join(' ') || 'Unknown'
      const email = actor.email || ''
      return { name, email }
    }
    
    // Check adminId
    if (log.adminId && typeof log.adminId === 'object') {
      const admin = log.adminId
      const name = [admin.firstName, admin.lastName].filter(Boolean).join(' ') || 'Unknown'
      const email = admin.email || ''
      return { name, email }
    }
    
    // Check teacherId
    if (log.teacherId && typeof log.teacherId === 'object') {
      const teacher = log.teacherId
      const name = [teacher.firstName, teacher.lastName].filter(Boolean).join(' ') || 'Unknown'
      const email = teacher.email || ''
      return { name, email }
    }
    
    // Fallback if no populated data
    return { name: 'Unknown', email: '' }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Activity Logs</h2>
          <p className="text-muted-foreground">
            Track all system activities from all roles (Admin, Teacher etc.)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Role (Perform By)</Label>
              <Select 
                value={filters.performBy || 'all'} 
                onValueChange={(value) => handleFilterChange('performBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Search by Title</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activities ({totalLogs} total)
          </CardTitle>
          <CardDescription>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Activities Found</h3>
              <p className="text-muted-foreground">
                No activities match your current filters
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Subtitle</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const personInfo = getPersonInfo(log)
                      return (
                        <TableRow key={log._id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="font-medium">
                                {personInfo.name}
                              </div>
                              {personInfo.email && (
                                <div className="text-sm text-muted-foreground">
                                  {personInfo.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium max-w-md truncate" title={log.title}>
                              {log.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground max-w-md truncate" title={log.subtitle}>
                              {log.subtitle || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(log.performBy)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(log)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select 
                    value={pageSize.toString()} 
                    onValueChange={(value) => {
                      setPageSize(parseInt(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1 || loading}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || loading}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingActivityId && (() => {
            const activityToDelete = getActivityById(deletingActivityId)
            return activityToDelete ? (
              <div className="py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-medium">{activityToDelete.title}</p>
                  {activityToDelete.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{activityToDelete.subtitle}</p>
                  )}
                  <div className="mt-2">
                    {getRoleBadge(activityToDelete.performBy)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {formatDate(activityToDelete.createdAt)}
                  </p>
                </div>
              </div>
            ) : null
          })()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeletingActivityId(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
