"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  FileText, 
  Download, 
  Plus, 
  Calendar, 
  Filter,
  Eye,
  Trash2,
  Play
} from "lucide-react"
import { toast } from 'sonner'
import axios from "axios"

interface Report {
  _id: string
  name: string
  type: string
  description: string
  parameters: {
    schoolIds?: string[]
    dateRange?: {
      start: string
      end: string
    }
    userRoles?: string[]
    includeInactive?: boolean
  }
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'running' | 'draft'
  fileUrl?: string
  fileSize?: number
  size?: number
  createdBy: {
    firstName?: string
    lastName?: string
    email?: string
    name?: string
  }
  createdAt: string
  completedAt?: string
}

interface School {
  _id?: string
  id?: string
  name: string
  schoolCode?: string
}

interface GenerateReportForm {
  name: string
  type: string
  description: string
  schoolIds: string[]
  dateStart: string
  dateEnd: string
  userRoles: string[]
  includeInactive: boolean
}

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  const [generateForm, setGenerateForm] = useState<GenerateReportForm>({
    name: "",
    type: "",
    description: "",
    schoolIds: [],
    dateStart: "",
    dateEnd: "",
    userRoles: [],
    includeInactive: false
  })

  const reportTypes = [
    { value: "student", label: "Student Report", dataSource: "students" },
    { value: "teacher", label: "Teacher Report", dataSource: "teachers" },
    { value: "grade", label: "Grade Report", dataSource: "grades" },
    { value: "attendance", label: "Attendance Report", dataSource: "attendance" },
    { value: "behavior", label: "Behavior Report", dataSource: "behavior" },
    { value: "club", label: "Club Report", dataSource: "clubs" },
    { value: "sports", label: "Sports Report", dataSource: "sports" },
    { value: "parent", label: "Parent Report", dataSource: "parents" },
    { value: "course", label: "Course Report", dataSource: "courses" },
    { value: "academic-performance", label: "Academic Performance Report", dataSource: "grades" }
  ]

  const userRoles = ["Teacher", "Student", "Parent", "Nurse", "Admin", "Secretary"]

  useEffect(() => {
    fetchReports()
    fetchSchools()
  }, [currentPage, statusFilter, typeFilter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      if (!token) {
        toast.error("Authentication required")
        setLoading(false)
        return
      }

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter })
      })

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.data && response.data.success) {
        const data = response.data.data || response.data
        setReports(data.reports || data || [])
        setTotalPages(data.totalPages || 1)
      } else {
        // Handle case where response might be direct array
        if (Array.isArray(response.data)) {
          setReports(response.data)
          setTotalPages(1)
        } else {
          toast.error(response.data?.message || "Failed to fetch reports")
          setReports([])
        }
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error fetching reports"
      toast.error(errorMessage)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (!token) {
        console.warn("No authentication token found")
        setSchools([])
        return
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Handle different response structures
      if (response.data) {
        if (response.data.success && response.data.data) {
          // Structure: { success: true, data: { schools: [...] } }
          const schoolsData = response.data.data.schools || response.data.data
          setSchools(Array.isArray(schoolsData) ? schoolsData : [])
        } else if (Array.isArray(response.data)) {
          // Direct array response
          setSchools(response.data)
        } else if (response.data.schools) {
          // Structure: { schools: [...] }
          setSchools(Array.isArray(response.data.schools) ? response.data.schools : [])
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Structure: { data: [...] }
          setSchools(response.data.data)
        } else {
          setSchools([])
        }
      } else {
        setSchools([])
      }
    } catch (error: any) {
      console.error("Error fetching schools:", error)
      // Try alternative endpoint
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
        if (token) {
          const altResponse = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/schools?limit=1000`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (altResponse.data) {
            if (altResponse.data.success && altResponse.data.data) {
              const schoolsData = altResponse.data.data.schools || altResponse.data.data
              setSchools(Array.isArray(schoolsData) ? schoolsData : [])
            } else if (Array.isArray(altResponse.data)) {
              setSchools(altResponse.data)
            } else if (altResponse.data.schools) {
              setSchools(Array.isArray(altResponse.data.schools) ? altResponse.data.schools : [])
            }
          }
        }
      } catch (altError) {
        console.error("Alternative endpoint also failed:", altError)
        setSchools([])
      }
    }
  }

  const handleGenerateReport = async () => {
    try {
      if (!generateForm.type) {
        toast.error("Please select a report type")
        return
      }

      if (!generateForm.name) {
        toast.error("Please enter a report name")
        return
      }

      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      // Find the selected report type to get the correct dataSource
      const selectedReportType = reportTypes.find(rt => rt.value === generateForm.type)
      if (!selectedReportType) {
        toast.error("Invalid report type selected")
        return
      }

      // Build columns based on report type
      let columns: any[] = []
      if (generateForm.type === 'student') {
        columns = [
          { field: 'studentId', label: 'Student ID', format: 'text', visible: true, order: 0 },
          { field: 'firstName', label: 'First Name', format: 'text', visible: true, order: 1 },
          { field: 'lastName', label: 'Last Name', format: 'text', visible: true, order: 2 },
          { field: 'email', label: 'Email', format: 'text', visible: true, order: 3 },
          { field: 'class', label: 'Class', format: 'text', visible: true, order: 4 },
          { field: 'section', label: 'Section', format: 'text', visible: true, order: 5 }
        ]
      } else if (generateForm.type === 'teacher') {
        columns = [
          { field: 'employeeId', label: 'Employee ID', format: 'text', visible: true, order: 0 },
          { field: 'firstName', label: 'First Name', format: 'text', visible: true, order: 1 },
          { field: 'lastName', label: 'Last Name', format: 'text', visible: true, order: 2 },
          { field: 'email', label: 'Email', format: 'text', visible: true, order: 3 }
        ]
      } else if (generateForm.type === 'grade') {
        columns = [
          { field: 'studentName', label: 'Student Name', format: 'text', visible: true, order: 0 },
          { field: 'courseName', label: 'Course', format: 'text', visible: true, order: 1 },
          { field: 'marksObtained', label: 'Marks Obtained', format: 'number', visible: true, order: 2 },
          { field: 'totalMarks', label: 'Total Marks', format: 'number', visible: true, order: 3 },
          { field: 'percentage', label: 'Percentage', format: 'percentage', visible: true, order: 4 }
        ]
      } else if (generateForm.type === 'attendance') {
        columns = [
          { field: 'studentName', label: 'Student Name', format: 'text', visible: true, order: 0 },
          { field: 'courseName', label: 'Course', format: 'text', visible: true, order: 1 },
          { field: 'date', label: 'Date', format: 'date', visible: true, order: 2 },
          { field: 'status', label: 'Status', format: 'text', visible: true, order: 3 }
        ]
      } else {
        // Default columns
        columns = [
          { field: 'firstName', label: 'First Name', format: 'text', visible: true, order: 0 },
          { field: 'lastName', label: 'Last Name', format: 'text', visible: true, order: 1 },
          { field: 'email', label: 'Email', format: 'text', visible: true, order: 2 }
        ]
      }

      // Build filters
      const filters: any[] = []
      if (generateForm.dateStart) {
        filters.push({
          field: 'createdAt',
          operator: 'greater_equal',
          value: generateForm.dateStart
        })
      }
      if (generateForm.dateEnd) {
        filters.push({
          field: 'createdAt',
          operator: 'less_equal',
          value: generateForm.dateEnd
        })
      }

      // Create report data
      const reportData = {
        name: generateForm.name,
        type: generateForm.type,
        description: generateForm.description || `${selectedReportType.label}`,
        dataSource: selectedReportType.dataSource,
        columns: columns,
        filters: filters,
        status: 'draft'
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/reports`,
        reportData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        toast.success("Report created successfully")
        setIsGenerateDialogOpen(false)
        setGenerateForm({
          name: "",
          type: "",
          description: "",
          schoolIds: [],
          dateStart: "",
          dateEnd: "",
          userRoles: [],
          includeInactive: false
        })
        fetchReports()
      } else {
        toast.error(response.data.message || "Failed to create report")
      }
    } catch (error: any) {
      console.error("Error creating report:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error creating report"
      toast.error(errorMessage)
      
      // Log detailed error for debugging
      if (error.response?.data) {
        console.error("Detailed error:", error.response.data)
      }
    }
  }

  const handleExecuteReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (!token) {
        toast.error("Authentication required")
        return
      }

      toast.info("Executing report...")
      
      // Execute the report
      const executeResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/reports/${reportId}/execute`,
        { format: 'excel' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (executeResponse.data.success) {
        const executionId = executeResponse.data.data?.executionId
        if (!executionId) {
          toast.error("Failed to get execution ID")
          return
        }

        toast.info("Report is being generated. Please wait...")
        
        // Poll for completion
        let attempts = 0
        const maxAttempts = 60
        
        const checkStatus = async (): Promise<void> => {
          attempts++
          
          if (attempts > maxAttempts) {
            toast.error("Report generation timed out. Please try again.")
            fetchReports() // Refresh the list
            return
          }

          try {
            const statusResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/reports/executions/${executionId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            )
            
            if (statusResponse.data.success) {
              const execution = statusResponse.data.data
              if (execution.status === 'completed' && execution.fileUrl) {
                window.open(execution.fileUrl, '_blank')
                toast.success("Report generated and downloaded successfully")
                fetchReports() // Refresh the list to show updated status
              } else if (execution.status === 'failed') {
                toast.error(execution.error || "Report generation failed")
                fetchReports()
              } else {
                setTimeout(checkStatus, 2000)
              }
            } else {
              setTimeout(checkStatus, 2000)
            }
          } catch (statusError: any) {
            console.error("Error checking status:", statusError)
            setTimeout(checkStatus, 2000)
          }
        }
        
        setTimeout(checkStatus, 2000)
      } else {
        toast.error(executeResponse.data.message || "Failed to execute report")
      }
    } catch (error: any) {
      console.error("Error executing report:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error executing report"
      toast.error(errorMessage)
    }
  }

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (!token) {
        toast.error("Authentication required")
        return
      }

      toast.info("Starting report generation...")
      
      // First, execute the report
      const executeResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/reports/${reportId}/execute`,
        { format: 'excel' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (executeResponse.data.success) {
        const executionId = executeResponse.data.data?.executionId
        if (!executionId) {
          toast.error("Failed to get execution ID")
          return
        }

        toast.info("Report is being generated. Please wait...")
        
        // Poll for completion with timeout
        let attempts = 0
        const maxAttempts = 60 // 2 minutes max wait time
        
        const checkStatus = async (): Promise<void> => {
          attempts++
          
          if (attempts > maxAttempts) {
            toast.error("Report generation timed out. Please try again.")
            return
          }

          try {
            const statusResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/reports/executions/${executionId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            )
            
            if (statusResponse.data.success) {
              const execution = statusResponse.data.data
              if (execution.status === 'completed' && execution.fileUrl) {
                // Open the file URL in a new tab
                window.open(execution.fileUrl, '_blank')
                toast.success("Report downloaded successfully")
              } else if (execution.status === 'failed') {
                toast.error(execution.error || "Report generation failed")
              } else if (execution.status === 'running' || execution.status === 'pending') {
                // Still processing, check again in 2 seconds
                setTimeout(checkStatus, 2000)
              } else {
                // Unknown status, check again
                setTimeout(checkStatus, 2000)
              }
            } else {
              // If status check fails, try again
              setTimeout(checkStatus, 2000)
            }
          } catch (statusError: any) {
            console.error("Error checking status:", statusError)
            // Continue polling on error
            setTimeout(checkStatus, 2000)
          }
        }
        
        // Start checking status after 2 seconds
        setTimeout(checkStatus, 2000)
      } else {
        toast.error(executeResponse.data.message || "Failed to execute report")
      }
    } catch (error: any) {
      console.error("Error downloading report:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error downloading report"
      toast.error(errorMessage)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    setReportToDelete(reportId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/reports/${reportToDelete}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        toast.success("Report deleted successfully")
        fetchReports()
      } else {
        toast.error(response.data.message || "Failed to delete report")
      }
    } catch (error: any) {
      console.error("Error deleting report:", error)
      toast.error(error.response?.data?.message || "Error deleting report")
    } finally {
      setDeleteDialogOpen(false)
      setReportToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      draft: "bg-gray-100 text-gray-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports Management</h2>
          <p className="text-muted-foreground">
            Generate and manage system reports for data analysis
          </p>
        </div>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Create a custom report with specific parameters and filters.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={generateForm.name}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Monthly User Activity Report"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={generateForm.type}
                  onValueChange={(value) => setGenerateForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={generateForm.description}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Report description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateStart">Start Date</Label>
                  <Input
                    id="dateStart"
                    type="date"
                    value={generateForm.dateStart}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, dateStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateEnd">End Date</Label>
                  <Input
                    id="dateEnd"
                    type="date"
                    value={generateForm.dateEnd}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, dateEnd: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Schools (Leave empty for all schools)</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !generateForm.schoolIds.includes(value)) {
                      setGenerateForm(prev => ({
                        ...prev,
                        schoolIds: [...prev.schoolIds, value]
                      }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add schools..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schools && schools.length > 0 ? (
                      schools.map((school) => {
                        const schoolId = school._id || school.id
                        return schoolId ? (
                          <SelectItem key={schoolId} value={schoolId}>
                            {school.name} {school.schoolCode ? `(${school.schoolCode})` : ''}
                          </SelectItem>
                        ) : null
                      })
                    ) : (
                      <SelectItem value="no-schools" disabled>
                        {loading ? "Loading schools..." : "No schools available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {generateForm.schoolIds.map((schoolId) => {
                    const school = schools?.find(s => (s._id || s.id) === schoolId)
                    return school ? (
                      <Badge key={schoolId} variant="secondary" className="cursor-pointer"
                        onClick={() => setGenerateForm(prev => ({
                          ...prev,
                          schoolIds: prev.schoolIds.filter(id => id !== schoolId)
                        }))}
                      >
                        {school.name} ×
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>User Roles (Leave empty for all roles)</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !generateForm.userRoles.includes(value)) {
                      setGenerateForm(prev => ({
                        ...prev,
                        userRoles: [...prev.userRoles, value]
                      }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add roles..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {generateForm.userRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="cursor-pointer"
                      onClick={() => setGenerateForm(prev => ({
                        ...prev,
                        userRoles: prev.userRoles.filter(r => r !== role)
                      }))}
                    >
                      {role} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeInactive"
                  checked={generateForm.includeInactive}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, includeInactive: e.target.checked }))}
                />
                <Label htmlFor="includeInactive">Include inactive users</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Reports</CardTitle>
          <CardDescription>Filter reports by status and type</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-48">
            <Label htmlFor="statusFilter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Label htmlFor="typeFilter">Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
                <SelectItem value="user-activity">User Activity Report</SelectItem>
                <SelectItem value="school-summary">School Summary Report</SelectItem>
                <SelectItem value="system-usage">System Usage Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            All system reports and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading reports...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reportTypes.find(t => t.value === report.type)?.label || report.type || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(report.status || 'pending')}>
                        {report.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {report.createdBy?.firstName && report.createdBy?.lastName 
                            ? `${report.createdBy.firstName} ${report.createdBy.lastName}`
                            : report.createdBy?.name || 'System'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {report.createdBy?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {report.createdAt ? new Date(report.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.fileSize ? formatFileSize(report.fileSize) : report.size ? formatFileSize(report.size) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = report.status || 'draft'
                          if (status === 'completed' && report.fileUrl) {
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadReport(report._id, `${report.name || 'report'}.xlsx`)}
                                title="Download Report"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )
                          } else if (status === 'draft' || status === 'pending') {
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExecuteReport(report._id)}
                                title="Execute/Generate Report"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )
                          } else if (status === 'running' || status === 'processing') {
                            return (
                              <Badge variant="outline" className="text-xs">
                                Generating...
                              </Badge>
                            )
                          }
                          return null
                        })()}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(report._id)}
                          title="Delete Report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {reports.length} reports
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
