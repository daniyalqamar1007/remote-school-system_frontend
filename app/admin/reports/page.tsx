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
  Play,
  Loader2
} from "lucide-react"
import { toast } from 'sonner'
import axios from "axios"
import { useAuth } from '@/contexts/AuthContext'

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

interface GenerateReportForm {
  name: string
  type: string
  description: string
  dateStart: string
  dateEnd: string
  userRoles: string[]
  includeInactive: boolean
  attendanceGroupBy: 'all' | 'grade' | 'class' | 'teacher' | 'student'
  attendanceGradeLevel: string
  attendanceSection: string
  attendanceTeacherId: string
  attendanceStudentId: string
}

function getSchoolIdFromUser(user: { schoolId?: string | { _id?: string } } | null): string | undefined {
  if (!user?.schoolId) return undefined
  const raw = user.schoolId
  return typeof raw === 'object' && raw != null && raw._id != null ? String(raw._id) : String(raw)
}

export default function ReportsManagement() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [generateForm, setGenerateForm] = useState<GenerateReportForm>({
    name: "",
    type: "",
    description: "",
    dateStart: "",
    dateEnd: "",
    userRoles: [],
    includeInactive: false,
    attendanceGroupBy: "all",
    attendanceGradeLevel: "",
    attendanceSection: "",
    attendanceTeacherId: "",
    attendanceStudentId: ""
  })

  const [attendanceOptions, setAttendanceOptions] = useState<{
    grades: string[]
    sections: string[]
    teachers: { _id: string; firstName: string; lastName: string }[]
    students: { _id: string; firstName: string; lastName: string; studentId?: string }[]
  }>({ grades: [], sections: [], teachers: [], students: [] })
  const [attendanceOptionsLoading, setAttendanceOptionsLoading] = useState(false)

  const reportTypes = [
    { value: "teacher", label: "Teacher Report", dataSource: "teachers" },
    { value: "attendance", label: "Attendance Report", dataSource: "attendance" },
    { value: "behavior", label: "Behavior Report", dataSource: "behavior" },
    { value: "club", label: "Club Report", dataSource: "clubs" },
    { value: "sports", label: "Sports Report", dataSource: "sports" },
    { value: "parent", label: "Parent Report", dataSource: "parents" },
    { value: "course", label: "Course Report", dataSource: "courses" },
    // { value: "academic-performance", label: "Academic Performance Report", dataSource: "grades" }
  ]

  const userRoles = ["Teacher", "Student", "Parent", "Nurse", "Secretary"]

  useEffect(() => {
    fetchReports()
  }, [currentPage, statusFilter, typeFilter])

  useEffect(() => {
    if (generateForm.type !== "attendance" || !isGenerateDialogOpen) return
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
    if (!token) return
    let cancelled = false
    setAttendanceOptionsLoading(true)
    const base = process.env.NEXT_PUBLIC_SRS_SERVER
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      axios.get(`${base}/admin/students?page=1&limit=2000`, { headers }),
      axios.get(`${base}/admin/teachers?page=1&limit=500`, { headers })
    ])
      .then(([studentsRes, teachersRes]) => {
        if (cancelled) return
        const students = studentsRes?.data?.data?.students ?? studentsRes?.data?.students ?? Array.isArray(studentsRes?.data) ? studentsRes.data : []
        const teachers = teachersRes?.data?.data?.teachers ?? teachersRes?.data?.teachers ?? Array.isArray(teachersRes?.data) ? teachersRes.data : []
        const grades = [...new Set((students as any[]).map((s: any) => s.class).filter(Boolean))].sort()
        const sections = [...new Set((students as any[]).map((s: any) => s.section).filter(Boolean))].sort()
        setAttendanceOptions({
          grades,
          sections,
          teachers: (teachers as any[]).map((t: any) => ({ _id: t._id, firstName: t.firstName || "", lastName: t.lastName || "" })),
          students: (students as any[]).map((s: any) => ({ _id: s._id, firstName: s.firstName || "", lastName: s.lastName || "", studentId: s.studentId }))
        })
      })
      .catch(() => {
        if (!cancelled) setAttendanceOptions({ grades: [], sections: [], teachers: [], students: [] })
      })
      .finally(() => {
        if (!cancelled) setAttendanceOptionsLoading(false)
      })
    return () => { cancelled = true }
  }, [generateForm.type, isGenerateDialogOpen])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      if (!token) {
        toast.error("Authentication required")
        setLoading(false)
        return
      }

      const schoolId = getSchoolIdFromUser(user) || (() => {
        try {
          const stored = localStorage.getItem('userInfo')
          if (stored) return getSchoolIdFromUser(JSON.parse(stored))
        } catch { }
        return undefined
      })()
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(schoolId && { schoolId })
      })

      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.data && response.data.success) {
        const data = response.data.data || response.data
        setReports(data.reports || data || [])
        setTotalPages(data.totalPages || 1)
      } else {
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

      setIsGenerating(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (!token) {
        toast.error("Authentication required")
        setIsGenerating(false)
        return
      }

      let schoolId = getSchoolIdFromUser(user) || (() => {
        try {
          const stored = localStorage.getItem('userInfo')
          if (stored) {
            const parsed = JSON.parse(stored)
            return getSchoolIdFromUser(parsed)
          }
        } catch { }
        return undefined
      })()
      if (!schoolId) {
        try {
          const profileRes = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (profileRes.ok) {
            const data = await profileRes.json()
            schoolId = getSchoolIdFromUser(data?.user)
          }
        } catch { }
      }

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

      const reportData: any = {
        name: generateForm.name,
        type: generateForm.type,
        description: generateForm.description || `${selectedReportType.label}`,
        dataSource: selectedReportType.dataSource,
        columns: columns,
        filters: filters,
        userRoles: generateForm.userRoles,
        status: 'draft'
      }
      if (schoolId) reportData.schoolId = schoolId
      if (generateForm.type === 'attendance') {
        reportData.attendanceGroupBy = generateForm.attendanceGroupBy
        reportData.attendanceGradeLevel = generateForm.attendanceGradeLevel || undefined
        reportData.attendanceSection = generateForm.attendanceSection || undefined
        reportData.attendanceTeacherId = generateForm.attendanceTeacherId || undefined
        reportData.attendanceStudentId = generateForm.attendanceStudentId || undefined
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports`,
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
          dateStart: "",
          dateEnd: "",
          userRoles: [],
          includeInactive: false,
          attendanceGroupBy: "all",
          attendanceGradeLevel: "",
          attendanceSection: "",
          attendanceTeacherId: "",
          attendanceStudentId: ""
        })
        // Wait a bit before fetching to ensure report is stored
        setTimeout(() => {
          fetchReports()
        }, 500)
      } else {
        toast.error(response.data.message || "Failed to create report")
      }
    } catch (error: any) {
      console.error("Error creating report:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error creating report"
      toast.error(errorMessage)
      
      if (error.response?.data) {
        console.error("Detailed error:", error.response.data)
      }
    } finally {
      setIsGenerating(false)
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
      
      const executeResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports/${reportId}/execute`,
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
        
        let attempts = 0
        const maxAttempts = 60
        
        const checkStatus = async (): Promise<void> => {
          attempts++
          
          if (attempts > maxAttempts) {
            toast.error("Report generation timed out. Please try again.")
            fetchReports()
            return
          }

          try {
            const statusResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports/executions/${executionId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            )
            
            if (statusResponse.data.success) {
              const execution = statusResponse.data.data
              if (execution.status === 'completed') {
                // Use download endpoint with authorization
                const downloadUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports/${executionId}/download`
                try {
                  const downloadResponse = await fetch(downloadUrl, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  })
                  
                  if (downloadResponse.ok) {
                    const blob = await downloadResponse.blob()
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `report-${executionId}.csv`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                    toast.success("Report generated and downloaded successfully")
                  } else {
                    toast.error("Failed to download report")
                  }
                } catch (downloadError) {
                  console.error("Download error:", downloadError)
                  toast.error("Failed to download report")
                }
                fetchReports()
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
      
      const executeResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports/${reportId}/execute`,
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
        
        let attempts = 0
        const maxAttempts = 60
        
        const checkStatus = async (): Promise<void> => {
          attempts++
          
          if (attempts > maxAttempts) {
            toast.error("Report generation timed out. Please try again.")
            return
          }

          try {
            const statusResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports/executions/${executionId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            )
            
            if (statusResponse.data.success) {
              const execution = statusResponse.data.data
              if (execution.status === 'completed') {
                // Use download endpoint with authorization
                const downloadUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports/${reportId}/download`
                try {
                  const downloadResponse = await fetch(downloadUrl, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  })
                  
                  if (downloadResponse.ok) {
                    const blob = await downloadResponse.blob()
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `${fileName || `report-${reportId}`}.csv`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                    toast.success("Report downloaded successfully")
                  } else {
                    toast.error("Failed to download report")
                  }
                } catch (downloadError) {
                  console.error("Download error:", downloadError)
                  toast.error("Failed to download report")
                }
              } else if (execution.status === 'failed') {
                toast.error(execution.error || "Report generation failed")
              } else if (execution.status === 'running' || execution.status === 'pending') {
                setTimeout(checkStatus, 2000)
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
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/reports/${reportToDelete}`,
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
            Generate and manage reports for your school
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
                Create a custom report with specific parameters and filters for your school.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={generateForm.name}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Monthly Student Report"
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
              {generateForm.type === "attendance" && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <Label>Filter by</Label>
                  <Select
                    value={generateForm.attendanceGroupBy}
                    onValueChange={(value: "all" | "grade" | "class" | "teacher" | "student") =>
                      setGenerateForm(prev => ({
                        ...prev,
                        attendanceGroupBy: value,
                        attendanceGradeLevel: value === "grade" ? prev.attendanceGradeLevel : "",
                        attendanceSection: value === "class" ? prev.attendanceSection : "",
                        attendanceTeacherId: value === "teacher" ? prev.attendanceTeacherId : "",
                        attendanceStudentId: value === "student" ? prev.attendanceStudentId : ""
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="grade">By Grade</SelectItem>
                      <SelectItem value="class">By Class (Section)</SelectItem>
                      <SelectItem value="teacher">By Teacher</SelectItem>
                      <SelectItem value="student">By Student</SelectItem>
                    </SelectContent>
                  </Select>
                  {attendanceOptionsLoading && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading options...
                    </p>
                  )}
                  {generateForm.attendanceGroupBy === "grade" && (
                    <div className="space-y-2">
                      <Label>Grade</Label>
                      <Select
                        value={generateForm.attendanceGradeLevel || "_none"}
                        onValueChange={(v) => setGenerateForm(prev => ({ ...prev, attendanceGradeLevel: v === "_none" ? "" : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Select grade</SelectItem>
                          {attendanceOptions.grades.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {generateForm.attendanceGroupBy === "class" && (
                    <div className="space-y-2">
                      <Label>Class (Section)</Label>
                      <Select
                        value={generateForm.attendanceSection || "_none"}
                        onValueChange={(v) => setGenerateForm(prev => ({ ...prev, attendanceSection: v === "_none" ? "" : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Select section</SelectItem>
                          {attendanceOptions.sections.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {generateForm.attendanceGroupBy === "teacher" && (
                    <div className="space-y-2">
                      <Label>Teacher</Label>
                      <Select
                        value={generateForm.attendanceTeacherId || "_none"}
                        onValueChange={(v) => setGenerateForm(prev => ({ ...prev, attendanceTeacherId: v === "_none" ? "" : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Select teacher</SelectItem>
                          {attendanceOptions.teachers.map((t) => (
                            <SelectItem key={t._id} value={t._id}>{t.firstName} {t.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {generateForm.attendanceGroupBy === "student" && (
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select
                        value={generateForm.attendanceStudentId || "_none"}
                        onValueChange={(v) => setGenerateForm(prev => ({ ...prev, attendanceStudentId: v === "_none" ? "" : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Select student</SelectItem>
                          {attendanceOptions.students.map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.firstName} {s.lastName}{s.studentId ? ` (${s.studentId})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
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
              <Button type="submit" onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
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
            All reports for your school and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
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
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No reports found. Create your first report to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
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
                  ))
                )}
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
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
