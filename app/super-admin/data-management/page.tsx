"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileDown,
  FileUp,
  HardDrive,
  RefreshCw,
  Settings,
  Shield,
  Trash2
} from "lucide-react"
import { toast } from 'sonner'
import { getToken } from '@/lib/token'

interface DataOperation {
  _id: string
  type: 'IMPORT' | 'EXPORT' | 'BACKUP' | 'CLEANUP' | 'MIGRATION'
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  description: string
  progress: number
  startedAt: string
  completedAt?: string
  performedBy: string
  metadata?: any
  errorMessage?: string
  recordsProcessed?: number
  totalRecords?: number
}

interface DataStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalSchools: number
  totalActivities: number
  storageUsed: string
  lastBackup?: string
}

function authHeaders(extra: Record<string, string> = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export default function DataManagementPage() {
  const [operations, setOperations] = useState<DataOperation[]>([])
  const [stats, setStats] = useState<DataStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [operationDialogOpen, setOperationDialogOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [operationParams, setOperationParams] = useState<any>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/data-operations`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (!cancelled && data) setOperations(data.operations || []) })
        .catch((e) => { if (!cancelled) console.error('Error fetching operations:', e) }),
      fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/data-stats`, { headers: authHeaders() })
        .then((r) => {
          if (!r.ok) throw new Error('Failed to fetch stats')
          return r.json()
        })
        .then((data) => { if (!cancelled) setStats(data) })
        .catch((e) => {
          if (!cancelled) {
            console.error('Error fetching data stats:', e)
            toast.error('Failed to fetch data statistics')
            setStats(null)
          }
        }),
    ]).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const fetchOperations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/data-operations`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        setOperations(data.operations || [])
      }
    } catch (error) {
      console.error('Error fetching operations:', error)
    }
  }

  const handleExportData = async (entityType: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/export-data`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ entityType, format: 'csv' }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${entityType}-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`${entityType} data exported successfully`)
      } else {
        toast.error(`Failed to export ${entityType} data`)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Error exporting data')
    }
  }

  const handleBackupData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/backup-data`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ includeFiles: true }),
      })

      if (response.ok) {
        toast.success('Backup initiated successfully')
        fetchOperations()
        fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/data-stats`, { headers: authHeaders() })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => data && setStats(data))
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err?.message || 'Failed to initiate backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Error creating backup')
    }
  }

  const handleCleanupData = async (type: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/cleanup-data`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ 
          type,
          dryRun: false,
          olderThan: operationParams.olderThan || 365
        }),
      })

      if (response.ok) {
        toast.success('Data cleanup initiated successfully')
        fetchOperations()
        fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/data-stats`, { headers: authHeaders() })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => data && setStats(data))
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err?.message || 'Failed to initiate data cleanup')
      }
    } catch (error) {
      console.error('Error cleaning up data:', error)
      toast.error('Error cleaning up data')
    }
  }

  const handleBulkUpload = async (file: File | undefined) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/users/bulk-upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || 'Bulk upload completed')
        if (result.errors && result.errors.length > 0) {
          console.warn('Upload errors:', result.errors)
          toast.warning(`Upload completed with ${result.totalErrors || result.errors.length} errors. Check console for details.`)
        }
        fetchOperations()
        setLoading(true)
        fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/data-stats`, { headers: authHeaders() })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => data && setStats(data))
          .finally(() => setLoading(false))
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Error uploading file')
    }
  }

  const downloadBulkTemplate = () => {
    try {
      const templateData = [
        {
          'Email': 'john.doe@example.com',
          'First Name': 'John',
          'Last Name': 'Doe',
          'Role': 'STUDENT',
          'Password': 'DefaultPassword123!',
          'School ID': '',
          'Phone': '+1234567890',
          'Address': '123 Main St',
          'Date of Birth': '2000-01-01',
          'Gender': 'Male',
          'Student ID': 'STU001',
          'Grade Level': '10',
          'Section': 'A',
          'Employee ID': '',
          'Department': '',
          'Subject': '',
          'Occupation': '',
          'Work Phone': '',
          'Active': true
        }
      ]

      // Create CSV content
      const headers = Object.keys(templateData[0]).join(',')
      const csvContent = [
        headers,
        templateData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bulk-upload-template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Template downloaded successfully')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Error downloading template')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'RUNNING':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Database className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'RUNNING':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'EXPORT':
        return <FileDown className="h-4 w-4" />
      case 'IMPORT':
        return <FileUp className="h-4 w-4" />
      case 'BACKUP':
        return <Archive className="h-4 w-4" />
      case 'CLEANUP':
        return <Trash2 className="h-4 w-4" />
      case 'MIGRATION':
        return <Database className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Data Management</h2>
          <p className="text-muted-foreground">
            Comprehensive data operations including import, export, backup, and cleanup
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button variant="outline" size="sm" onClick={fetchOperations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleBackupData}>
            <Archive className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Data Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSchools}</p>
                  <p className="text-sm text-muted-foreground">Total Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.storageUsed}</p>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Archive className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats.lastBackup ? formatDate(stats.lastBackup) : 'Never'}
                  </p>
                  <p className="text-sm text-muted-foreground">Last Backup</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulk Upload Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Bulk Upload Data
            </CardTitle>
            <CardDescription>
              Upload Excel/CSV files to import users, students, and teachers in bulk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileUp className="h-4 w-4" />
              <AlertTitle>Upload Requirements</AlertTitle>
              <AlertDescription>
                Excel files should contain columns: Email, First Name, Last Name, Role, Password, School ID (optional)
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <input
                type="file"
                id="bulk-upload"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleBulkUpload(e.target.files?.[0])}
                className="hidden"
              />
              <label htmlFor="bulk-upload">
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <span>
                    <FileUp className="h-4 w-4 mr-2" />
                    Choose File to Upload
                  </span>
                </Button>
              </label>
              <Button 
                variant="outline" 
                onClick={downloadBulkTemplate}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Export system data in various formats for reporting or analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleExportData('users')}>
                <Download className="h-4 w-4 mr-2" />
                Users
              </Button>
              <Button variant="outline" onClick={() => handleExportData('students')}>
                <Download className="h-4 w-4 mr-2" />
                Students
              </Button>
              <Button variant="outline" onClick={() => handleExportData('teachers')}>
                <Download className="h-4 w-4 mr-2" />
                Teachers
              </Button>
              <Button variant="outline" onClick={() => handleExportData('schools')}>
                <Download className="h-4 w-4 mr-2" />
                Schools
              </Button>
              <Button variant="outline" onClick={() => handleExportData('activities')}>
                <Download className="h-4 w-4 mr-2" />
                Activities
              </Button>
              <Button variant="outline" onClick={() => handleExportData('audit-logs')}>
                <Download className="h-4 w-4 mr-2" />
                Audit Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Data Cleanup
            </CardTitle>
            <CardDescription>
              Clean up old or unnecessary data to optimize system performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Data cleanup operations are irreversible. Please ensure you have recent backups.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setSelectedOperation('cleanup-logs')}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Old Logs
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clean Old Logs</DialogTitle>
                    <DialogDescription>
                      Remove audit logs and activity logs older than specified days
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Days to Keep</Label>
                      <Input
                        type="number"
                        value={operationParams.olderThan || 365}
                        onChange={(e) => setOperationParams({
                          ...operationParams,
                          olderThan: parseInt(e.target.value)
                        })}
                      />
                    </div>
                    <Button onClick={() => handleCleanupData('logs')}>
                      Start Cleanup
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => handleCleanupData('inactive-users')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Inactive Users
              </Button>
              <Button variant="outline" onClick={() => handleCleanupData('temp-files')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Temp Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Recent Operations
          </CardTitle>
          <CardDescription>
            Track the status and progress of data management operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading operations...</div>
          ) : operations.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Operations Found</h3>
              <p className="text-muted-foreground">
                No data operations have been performed recently
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {operations.map((operation) => (
                <div key={operation._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getOperationIcon(operation.type)}
                      <span className="font-medium">{operation.type}</span>
                      {getStatusBadge(operation.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(operation.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(operation.startedAt)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {operation.description}
                  </p>

                  {operation.status === 'RUNNING' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{operation.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${operation.progress}%` }}
                        />
                      </div>
                      {operation.recordsProcessed && operation.totalRecords && (
                        <p className="text-sm text-muted-foreground">
                          {operation.recordsProcessed} of {operation.totalRecords} records processed
                        </p>
                      )}
                    </div>
                  )}

                  {operation.status === 'FAILED' && operation.errorMessage && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{operation.errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {operation.status === 'SUCCESS' && operation.completedAt && (
                    <p className="text-sm text-green-600 mt-2">
                      Completed on {formatDate(operation.completedAt)}
                      {operation.recordsProcessed && (
                        <span> - {operation.recordsProcessed} records processed</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
