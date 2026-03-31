'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isPast } from 'date-fns'
import HealthAlertForm from './components/HealthAlertForm'
import { 
  HealthAlertType, 
  HealthAlertSeverity,
  HealthAlertTypeLabels,
  HealthAlertSeverityLabels,
  HealthAlertTypeColors,
  HealthAlertSeverityColors
} from '@/lib/enums/health-alert.enums'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export default function HealthAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalAlerts, setTotalAlerts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false)
  const [isViewAlertOpen, setIsViewAlertOpen] = useState(false)
  const [isEditAlertOpen, setIsEditAlertOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    expiredAlerts: 0
  })
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch stats (only called on page load)
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await fetch(`${API_BASE_URL}/nurse/health-alerts/stats`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[fetchStats] API Response:', data)
        if (data.success && data.data) {
          setStats({
            totalAlerts: data.data.totalAlerts || 0,
            activeAlerts: data.data.activeAlerts || 0,
            criticalAlerts: data.data.criticalAlerts || 0,
            expiredAlerts: data.data.expiredAlerts || 0
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[fetchStats] Failed to fetch stats:', errorData)
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch alerts with pagination
  const fetchAlerts = useCallback(async (page: number, limit: number, search: string, severity: string, type: string, status: string) => {
    try {
      setAlertsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (search) {
        params.append('search', search)
      }
      if (severity !== 'all') {
        params.append('severity', severity)
      }
      if (type !== 'all') {
        params.append('type', type)
      }
      if (status !== 'all') {
        params.append('status', status)
      }

      const response = await fetch(`${API_BASE_URL}/nurse/health-alerts/all?${params.toString()}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[fetchAlerts] API Response:', { success: data.success, alertsCount: data.alerts?.length || 0, pagination: data.pagination })
        
        // Check if backend returned an error
        if (data.success === false) {
          const errorMessage = data.message || data.error || 'Failed to load health alerts'
          console.error('[fetchAlerts] Backend error:', errorMessage)
          toast.error(errorMessage)
          setAlerts([])
          setTotalAlerts(0)
          setTotalPages(1)
          return
        }
        
        const alertsList = data?.alerts || data?.data?.alerts || (Array.isArray(data) ? data : [])
        const pagination = data?.pagination || {}
        
        console.log('[fetchAlerts] Processed alerts:', { alertsListLength: alertsList.length, pagination })
        
        setAlerts(Array.isArray(alertsList) ? alertsList : [])
        setTotalAlerts(pagination.total || alertsList.length)
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || alertsList.length) / limit))
      } else {
        // HTTP error - try to get error message from response
        let errorMessage = 'Failed to load health alerts'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Failed to load health alerts (Status: ${response.status})`
        }
        console.error('Failed to fetch alerts:', errorMessage)
        toast.error(errorMessage)
        setAlerts([])
        setTotalAlerts(0)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error)
      toast.error('Error loading health alerts')
      setAlerts([])
    } finally {
      setAlertsLoading(false)
      setLoading(false)
    }
  }, [])

  // Fetch stats on page load only
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchAlerts(currentPage, pageSize, searchTerm, severityFilter, typeFilter, statusFilter)
  }, [currentPage, pageSize])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchAlerts(1, pageSize, searchTerm, severityFilter, typeFilter, statusFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, severityFilter, typeFilter, statusFilter, pageSize])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleViewAlert = (alert: any) => {
    setSelectedAlert(alert)
    setIsViewAlertOpen(true)
  }

  const handleEditAlert = (alert: any) => {
    setSelectedAlert(alert)
    setIsEditAlertOpen(true)
  }

  const handleDeleteAlert = (alert: any) => {
    setAlertToDelete(alert)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!alertToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/nurse/health-records/student/${alertToDelete.studentId}/health-alert/${alertToDelete._id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      )

      const data = await response.json()
      console.log('[confirmDelete] API Response:', { ok: response.ok, success: data.success, data })
      
      if (response.ok) {
        if (data.success === false) {
          const errorMessage = data.message || data.error || 'Failed to delete health alert'
          toast.error(errorMessage)
          setDeleting(false)
          return
        }
        toast.success(data.message || 'Health alert deleted successfully')
        setDeleteDialogOpen(false)
        setAlertToDelete(null)
        await fetchAlerts(currentPage, pageSize, searchTerm, severityFilter, typeFilter, statusFilter)
        fetchStats() // Refresh stats after deleting
      } else {
        const errorMessage = data.message || data.error || `Failed to delete health alert (${response.status})`
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error deleting alert:', error)
      toast.error('Error deleting health alert')
    } finally {
      setDeleting(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const severityEnum = severity as HealthAlertSeverity
    const label = HealthAlertSeverityLabels[severityEnum] || severity
    const color = HealthAlertSeverityColors[severityEnum] || 'bg-gray-500'
    
    if (severityEnum === HealthAlertSeverity.CRITICAL) {
      return <Badge variant="destructive">{label}</Badge>
    }
    return <Badge className={color}>{label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const typeEnum = type as HealthAlertType
    const label = HealthAlertTypeLabels[typeEnum] || type
    const color = HealthAlertTypeColors[typeEnum] || 'bg-gray-500'
    return <Badge className={color}>{label}</Badge>
  }

  if (loading && alerts.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading health alerts...</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Health Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and manage student health alerts</p>
        </div>
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => setIsAddAlertOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">All alerts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Critical priority</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiredAlerts}</div>
            <p className="text-xs text-muted-foreground">Expired alerts</p>
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
                  placeholder="Search by student name, title, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {Object.values(HealthAlertSeverity).map(severity => (
                  <SelectItem key={severity} value={severity}>
                    {HealthAlertSeverityLabels[severity]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(HealthAlertType).map(type => (
                  <SelectItem key={type} value={type}>
                    {HealthAlertTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Health Alerts ({totalAlerts})
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
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Expiry</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading alerts...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(alerts) || alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No health alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  [...alerts]
                    .sort((a: any, b: any) => {
                      // Sort by createdDate descending (newest first)
                      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0
                      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0
                      // If no createdDate, use updatedAt as fallback
                      const fallbackA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
                      const fallbackB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
                      const finalA = dateA || fallbackA
                      const finalB = dateB || fallbackB
                      return finalB - finalA // Descending order (newest first)
                    })
                    .map((alert: any) => {
                    const isExpired = alert.expiryDate && isPast(new Date(alert.expiryDate))
                    return (
                      <TableRow key={alert._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-black">
                              {alert.student?.firstName || 'Unknown'} {alert.student?.lastName || 'Student'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {alert.student?.gradeLevel || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-black">{alert.title || 'N/A'}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {alert.description || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(alert.type || 'Custom Alert')}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity || HealthAlertSeverity.LOW)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={alert.isActive ? "default" : "outline"}>
                            {alert.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-black">
                          {alert.expiryDate ? (
                            <div>
                              <div>{format(new Date(alert.expiryDate), 'MMM dd, yyyy')}</div>
                              {isExpired && (
                                <Badge variant="destructive" className="text-xs mt-1">Expired</Badge>
                              )}
                            </div>
                          ) : (
                            'No expiry'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAlert(alert)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAlert(alert)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlert(alert)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalAlerts)} of {totalAlerts}
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

      {/* Add Alert Dialog */}
      <Dialog open={isAddAlertOpen} onOpenChange={setIsAddAlertOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Health Alert</DialogTitle>
            <DialogDescription>
              Fill in the details of the health alert. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <HealthAlertForm
            onSuccess={() => {
              setIsAddAlertOpen(false)
              fetchAlerts(currentPage, pageSize, searchTerm, severityFilter, typeFilter, statusFilter)
              fetchStats() // Refresh stats after adding
            }}
            onCancel={() => setIsAddAlertOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Alert Dialog */}
      <Dialog open={isViewAlertOpen} onOpenChange={setIsViewAlertOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Health Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium text-black">
                    {selectedAlert.student?.firstName} {selectedAlert.student?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-medium text-black">{selectedAlert.student?.gradeLevel || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <div>{getTypeBadge(selectedAlert.type || HealthAlertType.CUSTOM_ALERT)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Severity</p>
                  <div>{getSeverityBadge(selectedAlert.severity || HealthAlertSeverity.LOW)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={selectedAlert.isActive ? "default" : "outline"}>
                    {selectedAlert.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium text-black">
                    {selectedAlert.expiryDate ? format(new Date(selectedAlert.expiryDate), 'MMM dd, yyyy') : 'No expiry'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="font-medium text-black">{selectedAlert.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium text-black">{selectedAlert.description || 'N/A'}</p>
              </div>
              {selectedAlert.triggerConditions && (
                <div>
                  <p className="text-sm text-gray-500">Trigger Conditions</p>
                  <p className="font-medium text-black">{selectedAlert.triggerConditions}</p>
                </div>
              )}
              {selectedAlert.actionRequired && (
                <div>
                  <p className="text-sm text-gray-500">Action Required</p>
                  <p className="font-medium text-black">{selectedAlert.actionRequired}</p>
                </div>
              )}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedAlert.autoTrigger} disabled />
                  <span className="text-sm">Auto Trigger</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedAlert.notifyParents} disabled />
                  <span className="text-sm">Notify Parents</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedAlert.notifyTeachers} disabled />
                  <span className="text-sm">Notify Teachers</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewAlertOpen(false)}>Close</Button>
            {selectedAlert && (
              <Button onClick={() => {
                setIsViewAlertOpen(false)
                handleEditAlert(selectedAlert)
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Alert Dialog */}
      <Dialog open={isEditAlertOpen} onOpenChange={setIsEditAlertOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Health Alert</DialogTitle>
            <DialogDescription>
              Update the details of the health alert. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <HealthAlertForm
              alert={selectedAlert}
              studentId={selectedAlert.studentId}
              onSuccess={() => {
                setIsEditAlertOpen(false)
                setSelectedAlert(null)
                fetchAlerts(currentPage, pageSize, searchTerm, severityFilter, typeFilter, statusFilter)
                fetchStats() // Refresh stats after editing
              }}
              onCancel={() => {
                setIsEditAlertOpen(false)
                setSelectedAlert(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Health Alert</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this health alert? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {alertToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Student:</strong> {alertToDelete.student?.firstName} {alertToDelete.student?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Title:</strong> {alertToDelete.title || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Severity:</strong> {alertToDelete.severity ? HealthAlertSeverityLabels[alertToDelete.severity as HealthAlertSeverity] || alertToDelete.severity : 'N/A'}
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
    </div>
  )
}
