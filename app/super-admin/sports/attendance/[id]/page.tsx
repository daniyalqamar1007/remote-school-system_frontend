'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, UserCheck, UserX, Calendar, Clock, Building, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function AttendanceViewPage() {
  const params = useParams()
  const attendanceId = params.id as string
  const [attendance, setAttendance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (attendanceId) {
      fetchAttendanceDetails()
    }
  }, [attendanceId])

  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true)
      const result = await sportsApi.attendance.getById(attendanceId)
      
      if (result?.data || result) {
        setAttendance(result?.data || result)
      } else {
        toast.error('Attendance record not found')
      }
    } catch (error: any) {
      console.error('Error fetching attendance details:', error)
      toast.error(error?.message || 'Failed to load attendance details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'late':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'excused':
        return <UserCheck className="w-5 h-5 text-gray-600" />
      default:
        return <UserX className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present':
        return 'default'
      case 'absent':
        return 'destructive'
      case 'late':
        return 'secondary'
      case 'excused':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string | Date) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading attendance details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!attendance) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Attendance record not found</p>
          <Link href="/super-admin/sports/attendance">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const student = attendance.student || (attendance.studentId && typeof attendance.studentId === 'object' ? attendance.studentId : null)
  const program = attendance.schedule?.program || attendance.program || attendance.sportsProgramId
  const schedule = attendance.schedule || attendance.scheduleId
  const attendanceDate = attendance.attendanceDate || attendance.markedAt || attendance.createdAt

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/sports/attendance">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Details</h1>
            <p className="text-gray-600 mt-1">View detailed attendance information</p>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="font-medium text-black">
                {student?.firstName || 'Unknown'} {student?.lastName || 'Student'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Student ID</p>
              <p className="font-medium text-black">{student?.studentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Grade</p>
              <p className="font-medium text-black">{student?.gradeLevel || student?.class || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Information */}
      <Card>
        <CardHeader>
          <CardTitle>Program Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Sports Program</p>
              <p className="font-medium text-black">{program?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Season</p>
              <p className="font-medium text-black">{program?.season || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">School</p>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-black">
                  {program?.schoolId?.name || program?.school?.name || attendance.schoolId?.name || attendance.school?.name || 'N/A'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Event/Schedule</p>
              <p className="font-medium text-black">{schedule?.title || schedule?.type || attendance.eventType || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(attendance.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(attendance.status)}
                    <span className="capitalize">{attendance.status || 'N/A'}</span>
                  </div>
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-black">{formatDate(attendanceDate)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-black">{formatTime(attendanceDate)}</span>
              </div>
            </div>
            {attendance.markedBy && (
              <div>
                <p className="text-sm text-gray-500">Marked By</p>
                <p className="font-medium text-black">
                  {attendance.markedBy?.firstName || ''} {attendance.markedBy?.lastName || attendance.markedBy || 'N/A'}
                </p>
              </div>
            )}
          </div>
          {attendance.notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Notes</p>
              <p className="text-black bg-gray-50 p-3 rounded-md">{attendance.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

