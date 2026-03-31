"use client"

import React, { useState, useEffect } from "react"
import { Download, FileText, Filter, Search, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react"
import { format } from "date-fns"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

const REPORT_TYPES = [
  { value: "student", label: "Student Report", icon: "👤" },
  { value: "teacher", label: "Teacher Report", icon: "👨‍🏫" },
  { value: "grade", label: "Grade Report", icon: "📊" },
  { value: "attendance", label: "Attendance Report", icon: "📅" },
  { value: "behavior", label: "Behavior Report", icon: "📝" },
  { value: "club", label: "Club Report", icon: "🎯" },
]

const GRADES = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

const SECTIONS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)) // A-Z

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>("student")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [gradeLevel, setGradeLevel] = useState<string>("")
  const [courseId, setCourseId] = useState<string>("")
  const [section, setSection] = useState<string>("")
  const [clubId, setClubId] = useState<string>("")

  const [data, setData] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    totalPages: 0,
    currentPage: 1,
    totalRecords: 0,
    limit: 10,
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [hasAppliedFilters, setHasAppliedFilters] = useState<boolean>(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false)
  const [exportLoading, setExportLoading] = useState<boolean>(false)

  // Fetch courses and clubs for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (!token) return

      try {
        const [coursesRes, clubsRes] = await Promise.allSettled([
          axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/courses`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (coursesRes.status === 'fulfilled') {
          setCourses(coursesRes.value.data?.courses || coursesRes.value.data || [])
        }
        if (clubsRes.status === 'fulfilled') {
          setClubs(clubsRes.value.data?.clubs || clubsRes.value.data || [])
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      }
    }

    fetchFilterData()
  }, [])

  const buildQueryParams = (customLimit?: number, page?: number) => {
    const params = new URLSearchParams()

    if (reportType === "student" && gradeLevel) {
      params.append("className", gradeLevel)
    }
    if (reportType === "student" && section) {
      params.append("section", section)
    }
    if (reportType === "grade" && courseId) {
      params.append("courseId", courseId)
    }
    if (reportType === "grade" && gradeLevel) {
      params.append("className", gradeLevel)
    }
    if (reportType === "grade" && section) {
      params.append("section", section)
    }
    if (reportType === "club" && clubId) {
      params.append("clubId", clubId)
    }
    if (startDate) {
      params.append("startDate", startDate)
    }
    if (endDate) {
      params.append("endDate", endDate)
    }
    if (page) {
      params.append("page", page.toString())
    }
    if (customLimit) {
      params.append("limit", customLimit.toString())
    } else {
      params.append("limit", "10")
    }

    return params.toString()
  }

  const fetchData = async (page: number = 1) => {
    setLoading(true)
    setError(null)
    setHasAppliedFilters(true)

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (!token) {
        throw new Error("Authentication required. Please log in again.")
      }

      const queryParams = buildQueryParams(undefined, page)
      let response
      let apiUrl = ""

      switch (reportType) {
        case "student":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students${queryParams ? `?${queryParams}` : ""}`
          break
        case "teacher":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers${queryParams ? `?${queryParams}` : ""}`
          break
        case "grade":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/getStudentGrades${queryParams ? `?${queryParams}` : ""}`
          break
        case "attendance":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/attendance${queryParams ? `?${queryParams}` : ""}`
          break
        case "behavior":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/behavior${queryParams ? `?${queryParams}` : ""}`
          break
        case "club":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs${queryParams ? `?${queryParams}` : ""}`
          break
        default:
          throw new Error("Invalid report type")
      }

      response = await axios.get(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const responseData = response.data

      // Handle different response structures
      if (Array.isArray(responseData)) {
        setData(responseData)
        setPagination({
          totalPages: 1,
          currentPage: 1,
          totalRecords: responseData.length,
          limit: 10,
        })
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setData(responseData.data)
        setPagination({
          totalPages: responseData.totalPages || 1,
          currentPage: responseData.currentPage || page,
          totalRecords: responseData.totalRecordsCount || responseData.total || responseData.data.length,
          limit: responseData.limit || 10,
        })
      } else if (responseData.grades && Array.isArray(responseData.grades)) {
        setData(responseData.grades)
        setPagination({
          totalPages: responseData.totalPages || 1,
          currentPage: responseData.currentPage || page,
          totalRecords: responseData.total || responseData.grades.length,
          limit: responseData.limit || 10,
        })
      } else {
        setData([])
        setPagination({
          totalPages: 0,
          currentPage: 1,
          totalRecords: 0,
          limit: 10,
        })
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch report data"
      setError(errorMessage)
      setData([])
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (limit: number, format: 'xlsx' | 'csv' = 'xlsx') => {
    setExportLoading(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      if (!token) {
        throw new Error("Authentication required")
      }

      const queryParams = buildQueryParams(limit)
      let apiUrl = ""
      let exportData: any[] = []

      switch (reportType) {
        case "student":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students${queryParams ? `?${queryParams}` : ""}`
          const studentsRes = await axios.get(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const studentsData = studentsRes.data?.data || studentsRes.data || []
          exportData = studentsData.map((student: any) => ({
            "Student ID": student.studentId || student._id,
            "First Name": student.firstName,
            "Last Name": student.lastName,
            "Full Name": `${student.firstName} ${student.lastName}`,
            "Class": student.class,
            "Section": student.section,
            "Gender": student.gender,
            "Email": student.email,
            "Phone": student.phone,
            "Date of Birth": formatDate(student.dob),
            "Enroll Date": formatDate(student.enrollDate),
            "Expected Graduation": formatDate(student.expectedGraduation),
            "Guardian Name": student.guardian?.guardianName || student.parents?.[0]?.firstName || "",
            "Guardian Relation": student.guardian?.guardianRelation || "",
            "Guardian Phone": student.guardian?.guardianPhone || student.parents?.[0]?.phone || "",
            "Guardian Email": student.guardian?.guardianEmail || student.parents?.[0]?.email || "",
            "Guardian Profession": student.guardian?.guardianProfession || "",
            "Honor Rolls": student.honorRolls ? "Yes" : "No",
            "Athletics": student.athletics ? "Yes" : "No",
            "Clubs": student.clubs || "",
            "Lunch": student.lunch || "",
            "Nationality": student.nationality || "",
            "Address": student.address || "",
          }))
          break

        case "teacher":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers${queryParams ? `?${queryParams}` : ""}`
          const teachersRes = await axios.get(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const teachersData = teachersRes.data?.data || teachersRes.data || []
          exportData = teachersData.map((teacher: any) => ({
            "Employee ID": teacher.employeeId || teacher._id,
            "First Name": teacher.firstName,
            "Last Name": teacher.lastName,
            "Full Name": `${teacher.firstName} ${teacher.lastName}`,
            "Gender": teacher.gender,
            "Email": teacher.email,
            "Phone": teacher.phone,
            "Address": teacher.address || "",
            "Qualification": teacher.qualification || "",
            "Specialization": teacher.specialization || "",
            "Joining Date": formatDate(teacher.joiningDate),
          }))
          break

        case "grade":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/getStudentGrades${queryParams ? `?${queryParams}` : ""}`
          const gradesRes = await axios.get(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const gradesData = gradesRes.data?.grades || gradesRes.data?.data || gradesRes.data || []
          exportData = gradesData.map((grade: any) => ({
            "Student ID": grade.studentId?.studentId || grade.studentId?._id || "",
            "Student Name": grade.studentId?.firstName && grade.studentId?.lastName 
              ? `${grade.studentId.firstName} ${grade.studentId.lastName}`
              : grade.studentName || "",
            "Course": grade.courseId?.courseName || grade.courseName || "",
            "Course Code": grade.courseId?.courseCode || grade.courseCode || "",
            "Class": grade.className || grade.class || "",
            "Section": grade.section || "",
            "Marking Type": grade.markingType || "",
            "Term": grade.term || "",
            "Total Marks": grade.totalMarks || grade.maxMarks || "",
            "Marks Obtained": grade.marksObtained || grade.obtainedMarks || grade.score || "",
            "Percentage": grade.percentage || "",
            "Grade": grade.grade || "",
            "Date": formatDate(grade.date || grade.createdAt),
          }))
          break

        case "attendance":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/attendance${queryParams ? `?${queryParams}` : ""}`
          const attRes = await axios.get(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const attData = attRes.data?.data || attRes.data || []
          exportData = attData.map((att: any) => ({
            "Student ID": att.studentId?.studentId || att.studentId?._id || "",
            "Student Name": att.studentId?.firstName && att.studentId?.lastName
              ? `${att.studentId.firstName} ${att.studentId.lastName}`
              : att.studentName || "",
            "Course": att.courseName || att.courseId?.courseName || "",
            "Date": formatDate(att.date || att.attendanceDate),
            "Status": att.status || att.attendanceStatus || "",
            "Attendance Percentage": att.attendancePercentage || "",
          }))
          break

        case "behavior":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/behavior${queryParams ? `?${queryParams}` : ""}`
          const behaviorRes = await axios.get(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const behaviorData = behaviorRes.data?.data || behaviorRes.data || []
          exportData = behaviorData.map((behavior: any) => ({
            "Student ID": behavior.studentId?.studentId || behavior.studentId?._id || "",
            "Student Name": behavior.studentId?.firstName && behavior.studentId?.lastName
              ? `${behavior.studentId.firstName} ${behavior.studentId.lastName}`
              : behavior.studentName || "",
            "Type": behavior.type || behavior.behaviorType || "",
            "Description": behavior.description || behavior.notes || "",
            "Date": formatDate(behavior.date || behavior.createdAt),
            "Recorded By": behavior.recordedBy?.firstName && behavior.recordedBy?.lastName
              ? `${behavior.recordedBy.firstName} ${behavior.recordedBy.lastName}`
              : behavior.recordedBy || "",
          }))
          break

        case "club":
          apiUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs${queryParams ? `?${queryParams}` : ""}`
          const clubsRes = await axios.get(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const clubsData = clubsRes.data?.clubs || clubsRes.data?.data || clubsRes.data || []
          exportData = clubsData.map((club: any) => ({
            "Club Name": club.name || "",
            "Type": club.type || "",
            "Description": club.description || "",
            "Advisor": club.advisorId?.firstName && club.advisorId?.lastName
              ? `${club.advisorId.firstName} ${club.advisorId.lastName}`
              : club.advisor || "",
            "Max Members": club.maxMembers || "",
            "Current Members": club.memberCount || "",
            "Location": club.location || "",
            "Status": club.status || club.isActive ? "Active" : "Inactive",
          }))
          break

        default:
          throw new Error("Invalid report type")
      }

      if (!exportData || exportData.length === 0) {
        throw new Error("No data available to export")
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report")

      // Generate filename
      const reportName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)}_Report_${new Date().toISOString().split('T')[0]}`

      // Export file
      if (format === 'csv') {
        XLSX.writeFile(workbook, `${reportName}.csv`, { bookType: 'csv' })
      } else {
        XLSX.writeFile(workbook, `${reportName}.xlsx`)
      }

      toast.success(`Report exported successfully as ${format.toUpperCase()}`)
      setIsExportModalOpen(false)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to export data"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setExportLoading(false)
    }
  }

  const handleApplyFilters = () => {
    fetchData(1)
  }

  const filteredData = data.filter((item: any) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    const searchableFields = Object.values(item).join(" ").toLowerCase()
    return searchableFields.includes(searchLower)
  })

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (e) {
      return dateString
    }
  }

  const getTableHeaders = () => {
    switch (reportType) {
      case "student":
        return [
          "Student ID", "Name", "Class", "Section", "Gender", "Email", "Phone",
          "Enroll Date", "Guardian Name", "Guardian Phone", "Guardian Email"
        ]
      case "teacher":
        return ["Employee ID", "Name", "Gender", "Email", "Phone", "Address", "Qualification"]
      case "grade":
        return ["Student Name", "Course", "Marking Type", "Total Marks", "Marks Obtained", "Percentage", "Grade"]
      case "attendance":
        return ["Student Name", "Course", "Date", "Status", "Attendance %"]
      case "behavior":
        return ["Student Name", "Type", "Description", "Date", "Recorded By"]
      case "club":
        return ["Club Name", "Type", "Advisor", "Members", "Status"]
      default:
        return []
    }
  }

  const renderTableRow = (item: any) => {
    switch (reportType) {
      case "student":
        return (
          <TableRow key={item._id}>
            <TableCell className="font-medium">{item.studentId || item._id}</TableCell>
            <TableCell>{`${item.firstName || ""} ${item.lastName || ""}`}</TableCell>
            <TableCell>{item.class || ""}</TableCell>
            <TableCell>{item.section || ""}</TableCell>
            <TableCell>{item.gender || ""}</TableCell>
            <TableCell>{item.email || ""}</TableCell>
            <TableCell>{item.phone || ""}</TableCell>
            <TableCell>{formatDate(item.enrollDate)}</TableCell>
            <TableCell>{item.guardian?.guardianName || item.parents?.[0]?.firstName || ""}</TableCell>
            <TableCell>{item.guardian?.guardianPhone || item.parents?.[0]?.phone || ""}</TableCell>
            <TableCell>{item.guardian?.guardianEmail || item.parents?.[0]?.email || ""}</TableCell>
          </TableRow>
        )
      case "teacher":
        return (
          <TableRow key={item._id}>
            <TableCell className="font-medium">{item.employeeId || item._id}</TableCell>
            <TableCell>{`${item.firstName || ""} ${item.lastName || ""}`}</TableCell>
            <TableCell>{item.gender || ""}</TableCell>
            <TableCell>{item.email || ""}</TableCell>
            <TableCell>{item.phone || ""}</TableCell>
            <TableCell>{item.address || ""}</TableCell>
            <TableCell>{item.qualification || ""}</TableCell>
          </TableRow>
        )
      case "grade":
        return (
          <TableRow key={item._id}>
            <TableCell>
              {item.studentId?.firstName && item.studentId?.lastName
                ? `${item.studentId.firstName} ${item.studentId.lastName}`
                : item.studentName || ""}
            </TableCell>
            <TableCell>{item.courseId?.courseName || item.courseName || ""}</TableCell>
            <TableCell>{item.markingType || ""}</TableCell>
            <TableCell>{item.totalMarks || item.maxMarks || ""}</TableCell>
            <TableCell>{item.marksObtained || item.obtainedMarks || item.score || ""}</TableCell>
            <TableCell>{item.percentage || ""}</TableCell>
            <TableCell>{item.grade || ""}</TableCell>
          </TableRow>
        )
      case "attendance":
        return (
          <TableRow key={item._id}>
            <TableCell>
              {item.studentId?.firstName && item.studentId?.lastName
                ? `${item.studentId.firstName} ${item.studentId.lastName}`
                : item.studentName || ""}
            </TableCell>
            <TableCell>{item.courseName || item.courseId?.courseName || ""}</TableCell>
            <TableCell>{formatDate(item.date || item.attendanceDate)}</TableCell>
            <TableCell>
              <Badge variant={item.status === 'Present' || item.status === 'present' ? 'default' : 'destructive'}>
                {item.status || item.attendanceStatus || ""}
              </Badge>
            </TableCell>
            <TableCell>{item.attendancePercentage || ""}%</TableCell>
          </TableRow>
        )
      case "behavior":
        return (
          <TableRow key={item._id}>
            <TableCell>
              {item.studentId?.firstName && item.studentId?.lastName
                ? `${item.studentId.firstName} ${item.studentId.lastName}`
                : item.studentName || ""}
            </TableCell>
            <TableCell>
              <Badge variant={item.type === 'positive' || item.behaviorType === 'positive' ? 'default' : 'destructive'}>
                {item.type || item.behaviorType || ""}
              </Badge>
            </TableCell>
            <TableCell>{item.description || item.notes || ""}</TableCell>
            <TableCell>{formatDate(item.date || item.createdAt)}</TableCell>
            <TableCell>
              {item.recordedBy?.firstName && item.recordedBy?.lastName
                ? `${item.recordedBy.firstName} ${item.recordedBy.lastName}`
                : item.recordedBy || ""}
            </TableCell>
          </TableRow>
        )
      case "club":
        return (
          <TableRow key={item._id}>
            <TableCell className="font-medium">{item.name || ""}</TableCell>
            <TableCell>{item.type || ""}</TableCell>
            <TableCell>
              {item.advisorId?.firstName && item.advisorId?.lastName
                ? `${item.advisorId.firstName} ${item.advisorId.lastName}`
                : item.advisor || ""}
            </TableCell>
            <TableCell>{item.memberCount || 0} / {item.maxMembers || "N/A"}</TableCell>
            <TableCell>
              <Badge variant={item.status === 'active' || item.isActive ? 'default' : 'secondary'}>
                {item.status || (item.isActive ? 'Active' : 'Inactive')}
              </Badge>
            </TableCell>
          </TableRow>
        )
      default:
        return null
    }
  }

  const currentReportType = REPORT_TYPES.find(r => r.value === reportType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Generate Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and export detailed reports in CSV or Excel format
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setIsExportModalOpen(true)}
            disabled={!hasAppliedFilters || data.length === 0 || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Filters */}
          <Card className="lg:col-span-4 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-indigo-600" />
                Report Filters
              </CardTitle>
              <CardDescription>Configure your report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => {
                    setReportType(value)
                    setHasAppliedFilters(false)
                    setData([])
                    setError(null)
                    setGradeLevel("")
                    setCourseId("")
                    setSection("")
                    setClubId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(reportType === "student" || reportType === "grade") && (
                <div className="space-y-2">
                  <Label>Grade Level</Label>
                  <Select
                    value={gradeLevel || "all"}
                    onValueChange={(value) => setGradeLevel(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(reportType === "student" || reportType === "grade") && (
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={section || "all"}
                    onValueChange={(value) => setSection(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>
                          Section {section}
                        </SelectItem>
                      ))}
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportType === "grade" && (
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select 
                    value={courseId || "all"} 
                    onValueChange={(value) => setCourseId(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.courseName || course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportType === "club" && (
                <div className="space-y-2">
                  <Label>Club</Label>
                  <Select 
                    value={clubId || "all"} 
                    onValueChange={(value) => setClubId(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      {clubs.map((club) => (
                        <SelectItem key={club._id} value={club._id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Date Range (Optional)</Label>
                <div className="grid gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="lg:col-span-8 border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentReportType?.icon} {currentReportType?.label} Preview
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {hasAppliedFilters && data.length > 0
                      ? `Showing ${filteredData.length} of ${pagination.totalRecords} records`
                      : "Apply filters to generate report preview"}
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search in preview..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!hasAppliedFilters || data.length === 0}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button variant="outline" size="sm" onClick={() => fetchData(1)}>
                        Try Again
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : !hasAppliedFilters ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-12 text-center">
                  <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Select Filters to Generate Report</h3>
                  <p className="text-sm text-gray-500">
                    Choose your report type and apply filters to preview the report here.
                  </p>
                </div>
              ) : loading ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
                  <h3 className="text-lg font-semibold mb-2">Loading Report Data</h3>
                  <p className="text-sm text-gray-500">Please wait while we fetch the report data...</p>
                </div>
              ) : data.length === 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Data Found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    No records match your current filters. Try adjusting your search criteria.
                  </p>
                  <Button variant="outline" onClick={handleApplyFilters}>
                    Refresh Data
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {getTableHeaders().map((header) => (
                            <TableHead key={header} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.length > 0 ? (
                          filteredData.map((item) => renderTableRow(item))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={getTableHeaders().length} className="text-center py-8 text-gray-500">
                              No results found for your search
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchData(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1 || loading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchData(pagination.currentPage + 1)}
                          disabled={pagination.currentPage >= pagination.totalPages || loading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Select export format and record limit. The data will be downloaded as a file.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => exportData(1000, 'xlsx')}
                  disabled={exportLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel (XLSX)
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => exportData(1000, 'csv')}
                  disabled={exportLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="limit">Record Limit</Label>
                <span className="text-sm font-medium">{1000} records</span>
              </div>
              <Slider
                id="limit"
                min={100}
                max={10000}
                step={100}
                value={[1000]}
                className="w-full"
                disabled
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100</span>
                <span>5000</span>
                <span>10000</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="font-medium mb-2">Current filters:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Report Type: {currentReportType?.label}</li>
                {gradeLevel && <li>Grade Level: {gradeLevel}</li>}
                {section && <li>Section: {section}</li>}
                {courseId && <li>Course: {courses.find(c => c._id === courseId)?.courseName || courseId}</li>}
                {clubId && <li>Club: {clubs.find(c => c._id === clubId)?.name || clubId}</li>}
                {startDate && <li>Start Date: {startDate}</li>}
                {endDate && <li>End Date: {endDate}</li>}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)} disabled={exportLoading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
