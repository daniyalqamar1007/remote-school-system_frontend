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
  Save,
  ArrowLeft,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
}

export default function UpdateAttendancePage() {
  const router = useRouter()
  const params = useParams()
  const attendanceId = params.id as string
  const teacherId = getLocalStorageValue("id")
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")

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
        // Set date in YYYY-MM-DD format
        if (response.data.date) {
          const date = new Date(response.data.date)
          setSelectedDate(date.toISOString().split('T')[0])
        }
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

  const updateStudentAttendance = (studentId: string, attendanceStatus: string) => {
    if (!attendance) return
    setAttendance({
      ...attendance,
      students: attendance.students.map(s => 
        s._id === studentId ? { ...s, attendance: attendanceStatus } : s
      )
    })
  }

  const updateStudentNote = (studentId: string, note: string) => {
    if (!attendance) return
    setAttendance({
      ...attendance,
      students: attendance.students.map(s => 
        s._id === studentId ? { ...s, note } : s
      )
    })
  }

  const handleSave = async () => {
    if (!attendance || !selectedDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      
      const payload = {
        students: attendance.students.map(s => ({
          _id: s._id,
          studentId: s.studentId,
          studentName: s.studentName,
          attendance: s.attendance,
          note: s.note || '',
        })),
        date: selectedDate,
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/${attendanceId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success('Attendance updated successfully')
      router.push('/teacher/attendance')
    } catch (error: any) {
      console.error('Error updating attendance:', error)
      toast.error(error.response?.data?.message || 'Failed to update attendance')
    } finally {
      setSaving(false)
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Update Attendance</h1>
        </div>
      </div>

      {/* Attendance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Course</Label>
              <p className="text-lg font-semibold">{attendance.courseId?.courseName || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{attendance.courseId?.courseCode || ''}</p>
            </div>
            <div>
              <Label>Grade - Section</Label>
              <p className="text-lg font-semibold">Grade {attendance.class} - Section {attendance.section}</p>
            </div>
            <div>
              <Label>Total Students</Label>
              <p className="text-lg font-semibold">{attendance.students.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Update Student Attendance</CardTitle>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-32 p-0">
                            <Badge variant={getAttendanceBadgeVariant(student.attendance)}>
                              {student.attendance}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Present')}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Present
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Absent')}>
                            <UserX className="mr-2 h-4 w-4" />
                            Absent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Late')}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Late
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStudentAttendance(student._id, 'Excused')}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Excused
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={student.note || ''}
                        onChange={(e) => updateStudentNote(student._id, e.target.value)}
                        placeholder="Add note (optional)"
                        className="h-8"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Attendance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

