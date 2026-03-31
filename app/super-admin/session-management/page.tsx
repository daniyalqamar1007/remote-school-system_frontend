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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { 
  Users,
  Monitor,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Ban,
  Eye,
  X,
  Search,
  Filter,
  Globe,
  Smartphone,
  Clock
} from "lucide-react"
import { toast } from 'sonner'
import { sessionManagementApi } from '@/lib/api'

interface UserSession {
  _id: string
  sessionId: string
  userId: string
  userEmail?: string
  userName?: string
  userRole: string
  ipAddress: string
  userAgent: string
  location: {
    country?: string
    city?: string
    latitude?: number
    longitude?: number
  }
  deviceInfo: {
    browser?: string
    os?: string
    device?: string
  }
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'SUSPICIOUS'
  loginTime: string
  lastActivity: string
  expiresAt: string
  terminatedBy?: string
  terminatedAt?: string
  isCurrentSession?: boolean
  suspiciousActivity?: string[]
  createdAt: string
}

interface SessionAnalytics {
  totalActiveSessions: number
  suspiciousSessions: number
  uniqueUsers: number
  topLocations: Array<{ country: string; count: number }>
  topDevices: Array<{ device: string; count: number }>
  sessionTrends: Array<{ date: string; count: number }>
}

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalSessions, setTotalSessions] = useState(0)

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    userRole: 'all',
    searchTerm: '',
    suspicious: false
  })

  const getCurrentUserId = () => {
    if (typeof window === 'undefined') return 'super-admin'
    try {
      const raw = localStorage.getItem('userInfo')
      if (raw) {
        const info = JSON.parse(raw)
        return info?.id ?? info?._id ?? 'super-admin'
      }
    } catch (_) {}
    return 'super-admin'
  }

  useEffect(() => {
    fetchSessions()
    fetchAnalytics()
  }, [currentPage, pageSize, filters])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const data = await sessionManagementApi.getSessions({
        page: currentPage,
        limit: pageSize,
        status: filters.status !== 'all' ? filters.status : undefined,
        userRole: filters.userRole !== 'all' ? filters.userRole : undefined,
        search: filters.searchTerm || undefined,
        suspicious: filters.suspicious || undefined,
      })
      const payload = data?.data ?? data
      const list = payload?.sessions ?? (Array.isArray(data) ? data : [])
      setSessions(Array.isArray(list) ? list : [])
      setTotalSessions(typeof payload?.total === 'number' ? payload.total : (Array.isArray(list) ? list.length : 0))
    } catch (error: any) {
      console.error('Error fetching sessions:', error)
      toast.error(error?.message ?? 'Failed to fetch user sessions')
      setSessions([])
      setTotalSessions(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const data = await sessionManagementApi.getAnalytics('7d')
      const payload = data?.data ?? data
      setAnalytics(payload ?? null)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setAnalytics(null)
    }
  }

  const terminateSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this session?')) return

    try {
      await sessionManagementApi.terminateSession(sessionId, getCurrentUserId())
      toast.success('Session terminated successfully')
      fetchSessions()
      fetchAnalytics()
    } catch (error: any) {
      console.error('Error terminating session:', error)
      toast.error(error?.message ?? 'Failed to terminate session')
    }
  }

  const terminateAllUserSessions = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate ALL sessions for this user?')) return

    try {
      await sessionManagementApi.terminateAllUserSessions(userId, getCurrentUserId())
      toast.success('All user sessions terminated successfully')
      fetchSessions()
      fetchAnalytics()
    } catch (error: any) {
      console.error('Error terminating user sessions:', error)
      toast.error(error?.message ?? 'Failed to terminate user sessions')
    }
  }

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'EXPIRED':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'TERMINATED':
        return <X className="h-4 w-4 text-red-600" />
      case 'SUSPICIOUS':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Monitor className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'EXPIRED':
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>
      case 'TERMINATED':
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>
      case 'SUSPICIOUS':
        return <Badge className="bg-orange-100 text-orange-800">Suspicious</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime()
    const end = endTime ? new Date(endTime).getTime() : Date.now()
    const duration = end - start
    
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const totalPages = Math.ceil(totalSessions / pageSize)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Session Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage active user sessions across the system
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalActiveSessions ?? analytics?.activeSessions ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.suspiciousSessions || 0}</p>
                  <p className="text-sm text-muted-foreground">Suspicious Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.uniqueUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Unique Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.topLocations?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              <Label>Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                  <SelectItem value="SUSPICIOUS">Suspicious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>User Role</Label>
              <Select 
                value={filters.userRole} 
                onValueChange={(value) => handleFilterChange('userRole', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="User email or IP..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Show Suspicious Only</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.suspicious}
                  onChange={(e) => handleFilterChange('suspicious', e.target.checked)}
                  className="rounded"
                />
                <Label>Suspicious Sessions</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions ({totalSessions} total)
          </CardTitle>
          <CardDescription>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalSessions)} of {totalSessions} sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Sessions Found</h3>
              <p className="text-muted-foreground">
                No sessions match your current filters
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{session.userEmail || session.userName}</p>
                            <Badge variant="outline" className="text-xs">
                              {session.userRole}
                            </Badge>
                            {session.isCurrentSession && (
                              <Badge className="ml-1 text-xs bg-blue-100 text-blue-800">Current</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(session.status)}
                            {getStatusBadge(session.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">
                              {session.location?.city ?? ''}, {session.location?.country ?? '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <div className="text-sm">
                              <p>{session.deviceInfo?.browser ?? '—'}</p>
                              <p className="text-muted-foreground">{session.deviceInfo?.os ?? '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {session.ipAddress}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDuration(session.loginTime, session.terminatedAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(session.lastActivity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSession(session)
                                setDetailsDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {session.status === 'ACTIVE' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => terminateSession(session.sessionId)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => terminateAllUserSessions(session.userId)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
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

      {/* Session Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user session
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">{selectedSession.userEmail || selectedSession.userName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Badge variant="outline">{selectedSession.userRole}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Session ID</Label>
                  <p className="font-mono text-sm">{selectedSession.sessionId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedSession.status)}
                    {getStatusBadge(selectedSession.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="font-mono text-sm">{selectedSession.ipAddress}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Login Time</Label>
                  <p className="text-sm">{formatDate(selectedSession.loginTime)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Activity</Label>
                  <p className="text-sm">{formatDate(selectedSession.lastActivity)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Session Duration</Label>
                  <p className="text-sm">{formatDuration(selectedSession.loginTime, selectedSession.terminatedAt)}</p>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Location Information</Label>
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-md">
                  <div>
                    <Label className="text-xs text-muted-foreground">Country</Label>
                    <p className="text-sm">{selectedSession.location?.country || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">City</Label>
                    <p className="text-sm">{selectedSession.location?.city || 'Unknown'}</p>
                  </div>
                  {selectedSession.location?.latitude != null && selectedSession.location?.longitude != null && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">Latitude</Label>
                        <p className="text-sm font-mono">{selectedSession.location.latitude}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Longitude</Label>
                        <p className="text-sm font-mono">{selectedSession.location.longitude}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Device Information */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Device Information</Label>
                <div className="grid grid-cols-1 gap-2 p-3 bg-muted rounded-md">
                  <div>
                    <Label className="text-xs text-muted-foreground">User Agent</Label>
                    <p className="text-sm font-mono break-all">{selectedSession.userAgent}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Browser</Label>
                      <p className="text-sm">{selectedSession.deviceInfo?.browser || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">OS</Label>
                      <p className="text-sm">{selectedSession.deviceInfo?.os || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Device</Label>
                      <p className="text-sm">{selectedSession.deviceInfo?.device || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suspicious Activity */}
              {selectedSession.suspiciousActivity && selectedSession.suspiciousActivity.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Suspicious Activity</Label>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Security Alert</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {selectedSession.suspiciousActivity.map((activity, index) => (
                          <li key={index}>{activity}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Termination Info */}
              {selectedSession.status === 'TERMINATED' && selectedSession.terminatedBy && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Termination Information</Label>
                  <div className="grid grid-cols-2 gap-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div>
                      <Label className="text-xs text-muted-foreground">Terminated By</Label>
                      <p className="text-sm">{selectedSession.terminatedBy}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Terminated At</Label>
                      <p className="text-sm">{selectedSession.terminatedAt ? formatDate(selectedSession.terminatedAt) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedSession.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      terminateSession(selectedSession.sessionId)
                      setDetailsDialogOpen(false)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Terminate Session
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      terminateAllUserSessions(selectedSession.userId)
                      setDetailsDialogOpen(false)
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Terminate All User Sessions
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
