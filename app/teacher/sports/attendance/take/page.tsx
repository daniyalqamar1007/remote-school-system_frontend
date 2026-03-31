"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  UserCheck, 
  UserX, 
  Users, 
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function TeacherTakeAttendancePage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    if (selectedProgram) {
      fetchSchedules()
      fetchStudents()
      // Reset selected schedule when program changes
      setSelectedSchedule('')
    } else {
      setSchedules([])
      setSelectedSchedule('')
    }
  }, [selectedProgram])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const response = await sportsApi.programs.getMyCoachPrograms()
      let programsData: any[] = []
      if (response) {
        if (response.success && response.data) {
          programsData = Array.isArray(response.data) ? response.data : (Array.isArray(response.data.programs) ? response.data.programs : [])
        } else if (Array.isArray(response.data)) {
          programsData = response.data
        } else if (Array.isArray(response.programs)) {
          programsData = response.programs
        } else if (Array.isArray(response)) {
          programsData = response
        }
      }
      setPrograms(Array.isArray(programsData) ? programsData : [])
    } catch (error: any) {
      console.error('Error fetching programs:', error)
      toast.error(error?.message || 'Failed to load sports programs')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      if (!selectedProgram) {
        setSchedules([])
        return
      }
      
      const response = await sportsApi.schedule.getAll({ sportsProgramId: selectedProgram, limit: '100' })
      let schedulesList: any[] = []
      if (response?.data?.schedules) {
        schedulesList = Array.isArray(response.data.schedules) ? response.data.schedules : []
      } else if (Array.isArray(response?.schedules)) {
        schedulesList = response.schedules
      } else if (Array.isArray(response?.data)) {
        schedulesList = response.data
      } else if (Array.isArray(response)) {
        schedulesList = response
      }
      
      setSchedules(Array.isArray(schedulesList) ? schedulesList : [])
    } catch (error: any) {
      console.error('Error fetching schedules:', error)
      toast.error(error?.message || 'Failed to load schedules')
      setSchedules([])
    }
  }

  const fetchStudents = async () => {
    try {
      if (!selectedProgram) {
        setStudents([])
        setAttendanceRecords([])
        return
      }
      
      const response = await sportsApi.assignments.getByProgram(selectedProgram)
      let assignmentsList: any[] = []
      if (response?.data?.assignments) {
        assignmentsList = Array.isArray(response.data.assignments) ? response.data.assignments : []
      } else if (Array.isArray(response?.assignments)) {
        assignmentsList = response.assignments
      } else if (Array.isArray(response?.data)) {
        assignmentsList = response.data
      } else if (Array.isArray(response)) {
        assignmentsList = response
      }
      
      setStudents(Array.isArray(assignmentsList) ? assignmentsList : [])
      
      // Initialize attendance records
      const initialRecords = (Array.isArray(assignmentsList) ? assignmentsList : []).map((assignment: any) => {
        const student = assignment.student || (assignment.studentId && typeof assignment.studentId === 'object' && !assignment.studentId._bsontype ? assignment.studentId : null)
        
        // Get the actual studentId string/ObjectId
        let studentId: string | null = null
        if (student && student._id) {
          studentId = typeof student._id === 'string' ? student._id : student._id.toString()
        } else if (assignment.studentId) {
          if (typeof assignment.studentId === 'string') {
            studentId = assignment.studentId
          } else if (assignment.studentId._id) {
            studentId = typeof assignment.studentId._id === 'string' ? assignment.studentId._id : assignment.studentId._id.toString()
          } else {
            studentId = assignment.studentId.toString()
          }
        }
        
        // Extract student name
        let studentName = 'Unknown Student'
        if (student) {
          if (student.firstName && student.lastName) {
            studentName = `${student.firstName} ${student.lastName}`
          } else if (student.firstName) {
            studentName = student.firstName
          } else if (student.lastName) {
            studentName = student.lastName
          } else if (student.name) {
            studentName = student.name
          }
        } else if (assignment.studentName) {
          studentName = assignment.studentName
        }
        
        return {
          studentId: studentId,
          studentName: studentName,
          status: 'present',
          absenceType: 'unexcused',
          notes: ''
        }
      }).filter((record: any) => record.studentId && record.studentId !== 'null' && record.studentId !== 'undefined')
      setAttendanceRecords(initialRecords)
    } catch (error: any) {
      console.error('Error fetching students:', error)
      toast.error(error?.message || 'Failed to load students')
    }
  }

  const updateAttendanceStatus = (studentId: string, status: string) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.studentId === studentId 
        ? { ...record, status }
        : record
    ))
  }

  const updateAttendanceNotes = (studentId: string, notes: string) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.studentId === studentId 
        ? { ...record, notes }
        : record
    ))
  }

  const handleSaveAttendance = async () => {
    if (!selectedSchedule) {
      toast.error('Please select a schedule first')
      return
    }

    // Validate that all records have studentId
    const invalidRecords = attendanceRecords.filter((record: any) => !record.studentId || record.studentId === 'null' || record.studentId === 'undefined')
    if (invalidRecords.length > 0) {
      toast.error(`Some records are missing student ID. Please refresh and try again.`)
      console.error('Invalid records:', invalidRecords)
      return
    }

    try {
      setSaving(true)
      
      // Get schoolId from selected program
      const program = programs.find((p: any) => p._id === selectedProgram)
      let schoolId = null
      if (program?.schoolId) {
        if (typeof program.schoolId === 'object' && program.schoolId._id) {
          schoolId = program.schoolId._id
        } else if (typeof program.schoolId === 'string') {
          schoolId = program.schoolId
        }
      }
      
      // Ensure all studentIds are strings (not objects)
      const cleanedRecords = attendanceRecords.map((record: any) => ({
        ...record,
        studentId: typeof record.studentId === 'string' 
          ? record.studentId 
          : (record.studentId?.toString() || record.studentId)
      }))
      
      const attendanceData = {
        scheduleId: selectedSchedule,
        programId: selectedProgram,
        schoolId: schoolId,
        date: new Date().toISOString(),
        attendanceRecords: cleanedRecords
      }

      const result = await sportsApi.attendance.createBulk(attendanceData)
      if (result?.success || result?.statusCode === 201 || result?.data) {
        toast.success(result?.message || `Attendance recorded successfully for ${result?.data?.total || attendanceRecords.length} students`)
      } else {
        toast.success('Attendance recorded successfully')
      }
      
      // Reset form
      setSelectedProgram('')
      setSelectedSchedule('')
      setAttendanceRecords([])
      
    } catch (error: any) {
      console.error('Error saving attendance:', error)
      toast.error(error?.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'absent':
        return <UserX className="w-4 h-4 text-red-600" />
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'excused':
        return <UserCheck className="w-4 h-4 text-gray-600" />
      default:
        return <UserCheck className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/sports/attendance">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Attendance
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Take Attendance</h1>
          <p className="text-gray-600 mt-1">Record attendance for sports activities</p>
        </div>
      </div>

      {/* Selection Form */}
      <Card>
        <CardHeader>
          <CardTitle>Select Program and Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Sports Program <span className="text-red-500">*</span>
              </label>
              <Select 
                value={selectedProgram} 
                onValueChange={setSelectedProgram}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No programs found</div>
                  ) : (
                    programs.map((program: any) => (
                      <SelectItem key={program._id} value={program._id}>
                        {program.name} - {program.season || 'N/A'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Schedule/Event <span className="text-red-500">*</span>
              </label>
              <Select 
                value={selectedSchedule} 
                onValueChange={setSelectedSchedule}
                disabled={!selectedProgram}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedProgram ? "Select a schedule" : "Select program first"} />
                </SelectTrigger>
                <SelectContent>
                  {schedules.length === 0 && selectedProgram ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No events found for this program</div>
                  ) : (
                    schedules.map((schedule: any) => (
                      <SelectItem key={schedule._id} value={schedule._id}>
                        {schedule.eventType || schedule.title || 'Event'} - {new Date(schedule.date || schedule.startDate).toLocaleDateString()} {schedule.time || schedule.startTime || ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      {selectedProgram && attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Student Attendance
              <Button 
                onClick={handleSaveAttendance}
                disabled={saving || !selectedSchedule}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceRecords.map((record: any, index: number) => (
                <div key={record.studentId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-gray-600">Student #{index + 1}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Select 
                      value={record.status}
                      onValueChange={(value) => updateAttendanceStatus(record.studentId, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center">
                      {getStatusIcon(record.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedProgram && attendanceRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">There are no students assigned to this program.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

