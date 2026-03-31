"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  Loader2,
  ArrowLeft,
  UserCheck,
  UserX,
  AlertCircle,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import axios from "axios"
import { getLocalStorageValue } from "@/lib/utils"

interface AttendanceRecord {
  _id: string
  courseId: {
    _id: string
    courseName: string
    courseCode: string
  }
  class: string
  section: string
  date: string
  students: {
    _id: string
    studentId: string
    studentName: string
    attendance: string
    note?: string
  }[]
  attendanceReport?: {
    status: string
    percentage: number
    count: number
    students: string[]
  }[]
  createdAt: string
}

export default function ViewAttendancePage() {
  const router = useRouter()
  const params = useParams()
  const attendanceId = params.id as string
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/${attendanceId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        setAttendance(response.data)
      } catch (error: any) {
        console.error('Error fetching attendance:', error)
        toast.error('Failed to load attendance record')
        router.push('/teacher/attendance')
      } finally {
        setLoading(false)
      }
    }

    if (attendanceId) {
      fetchAttendance()
    }
  }, [attendanceId, router])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getAttendanceBadgeVariant = (status: string) => {
    switch (status) {
      case 'Present':
        return 'default'
      case 'Absent':
        return 'destructive'
      case 'Late':
        return 'outline'
      case 'Excused':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <UserCheck className="h-4 w-4" />
      case 'Absent':
        return <UserX className="h-4 w-4" />
      case 'Late':
        return <AlertCircle className="h-4 w-4" />
      case 'Excused':
        return <Calendar className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!attendance) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Attendance record not found</p>
          <Button className="mt-4" onClick={() => router.push('/teacher/attendance')}>
            Back to Attendance
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/teacher/attendance')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">View Attendance</h1>
        </div>
        <Button onClick={() => router.push(`/teacher/attendance/update/${attendanceId}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Attendance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <p className="text-lg font-semibold">{formatDate(attendance.date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Course</label>
              <p className="text-lg font-semibold">{attendance.courseId?.courseName || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{attendance.courseId?.courseCode || ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Grade - Section</label>
              <p className="text-lg font-semibold">Grade {attendance.class} - Section {attendance.section}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Students</label>
              <p className="text-lg font-semibold">{attendance.students.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      {attendance.attendanceReport && attendance.attendanceReport.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {attendance.attendanceReport.map((report) => (
            <Card key={report.status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{report.status}</CardTitle>
                {getAttendanceIcon(report.status)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.percentage}%</div>
                <p className="text-xs text-muted-foreground">{report.count} students</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">
                      {student.studentName}
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      <Badge variant={getAttendanceBadgeVariant(student.attendance)}>
                        {student.attendance}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.note || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

