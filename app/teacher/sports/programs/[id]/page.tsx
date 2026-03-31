"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function TeacherProgramDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [program, setProgram] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadProgramDetails()
      loadProgramAssignments()
      loadProgramSchedules()
      loadProgramAttendance()
    }
  }, [params.id])

  const loadProgramDetails = async () => {
    try {
      setLoading(true)
      const response = await sportsApi.programs.getById(Array.isArray(params.id) ? params.id[0] : params.id)
      
      // Handle different response structures
      let programData = null
      if (response) {
        if (response.success && response.data) {
          programData = response.data
        } else if (response._id) {
          programData = response
        } else if (response.data && response.data._id) {
          programData = response.data
        }
      }
      
      setProgram(programData)
    } catch (error) {
      console.error('Error loading program:', error)
      toast.error('Failed to load program details')
    } finally {
      setLoading(false)
    }
  }

  const loadProgramAssignments = async () => {
    try {
      const programId = Array.isArray(params.id) ? params.id[0] : params.id
      const response = await sportsApi.assignments.getAll({ sportsProgramId: programId, limit: '1000' })
      
      let assignmentsData: any[] = []
      if (response?.data?.assignments) {
        assignmentsData = Array.isArray(response.data.assignments) ? response.data.assignments : []
      } else if (Array.isArray(response?.assignments)) {
        assignmentsData = response.assignments
      } else if (Array.isArray(response?.data)) {
        assignmentsData = response.data
      } else if (Array.isArray(response)) {
        assignmentsData = response
      }
      
      setAssignments(assignmentsData)
    } catch (error) {
      console.error('Error loading assignments:', error)
      setAssignments([])
    }
  }

  const loadProgramSchedules = async () => {
    try {
      const programId = Array.isArray(params.id) ? params.id[0] : params.id
      const response = await sportsApi.schedule.getAll({ sportsProgramId: programId, limit: '1000' })
      
      let schedulesData: any[] = []
      if (response?.data?.schedules) {
        schedulesData = Array.isArray(response.data.schedules) ? response.data.schedules : []
      } else if (Array.isArray(response?.schedules)) {
        schedulesData = response.schedules
      } else if (Array.isArray(response?.data)) {
        schedulesData = response.data
      } else if (Array.isArray(response)) {
        schedulesData = response
      }
      
      setSchedules(schedulesData)
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules([])
    }
  }

  const loadProgramAttendance = async () => {
    try {
      const programId = Array.isArray(params.id) ? params.id[0] : params.id
      const response = await sportsApi.attendance.getAll({ sportsProgramId: programId, limit: '1000' })
      
      let attendanceData: any[] = []
      if (response?.data?.attendance) {
        attendanceData = Array.isArray(response.data.attendance) ? response.data.attendance : []
      } else if (Array.isArray(response?.attendance)) {
        attendanceData = response.attendance
      } else if (Array.isArray(response?.data)) {
        attendanceData = response.data
      } else if (Array.isArray(response)) {
        attendanceData = response
      }
      
      setAttendance(attendanceData)
    } catch (error) {
      console.error('Error loading attendance:', error)
      setAttendance([])
    }
  }

  const getStatusBadge = (status: any) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'Inactive':
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSeasonBadge = (season: any) => {
    switch (season?.toLowerCase()) {
      case 'fall':
        return <Badge className="bg-orange-100 text-orange-800">Fall</Badge>
      case 'winter':
        return <Badge className="bg-blue-100 text-blue-800">Winter</Badge>
      case 'spring':
        return <Badge className="bg-green-100 text-green-800">Spring</Badge>
      case 'summer':
        return <Badge className="bg-yellow-100 text-yellow-800">Summer</Badge>
      default:
        return <Badge variant="outline">{season || 'Not Set'}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Program not found</h3>
          <p className="text-gray-600 mb-4">The requested sports program could not be found.</p>
          <Link href="/teacher/sports/programs">
            <Button>Back to Programs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const activeStudents = assignments.filter((a: any) => a.status === 'active' || !a.status).length
  const upcomingEvents = schedules.filter((s: any) => {
    const scheduleDate = new Date(s.startDate || s.date)
    return scheduleDate > new Date()
  }).length
  const recentAttendance = attendance.slice(0, 5)

  // Get school name
  const schoolName = program.schoolId?.name || program.school?.name || 'N/A'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/sports/programs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(program.isActive ? 'Active' : 'Inactive')}
              {getSeasonBadge(program.season)}
              <Badge variant="outline">{program.type ? program.type.charAt(0).toUpperCase() + program.type.slice(1) : 'Not Set'}</Badge>
              <Badge variant="outline">{program.allowedGradeLevels?.join(', ') || 'All Grades'}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Program Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-2xl font-bold">{activeStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold">{upcomingEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        {/* <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">School</p>
                <p className="text-lg font-semibold">{schoolName}</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card> */}
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Venue</p>
                <p className="text-sm font-medium">{program.venue?.join(', ') || 'TBD'}</p>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="mt-1 text-sm">{program.description || 'No description provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Required Equipment</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {program.requiredEquipment && program.requiredEquipment.length > 0 ? (
                    program.requiredEquipment.map((item: any, index: number) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">None specified</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <p className="mt-1 text-sm">{program.type ? program.type.charAt(0).toUpperCase() + program.type.slice(1) : 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Medical Requirements</label>
                <div className="mt-1 space-y-1">
                  {program.requiresPhysicalExam && <Badge variant="outline" className="mx-3">Physical Exam Required</Badge>}
                  {program.requiresMedicalClearance && <Badge variant="outline" className="mx-3">Medical Clearance Required</Badge>}
                  {program.requiresConsentForm && <Badge variant="outline" className="mx-3">Consent Form Required</Badge>}
                  {!program.requiresPhysicalExam && !program.requiresMedicalClearance && !program.requiresConsentForm && 
                    <span className="text-gray-500 text-sm">No special requirements</span>}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Maximum Participants</label>
                <p className="mt-1 text-sm">{program.maxParticipants > 0 ? program.maxParticipants : 'Unlimited'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Grade Levels</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {program.allowedGradeLevels && program.allowedGradeLevels.length > 0 ? (
                    program.allowedGradeLevels.map((grade: any) => (
                      <Badge key={grade} variant="outline">{grade}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">All grades</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Venues</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {program.venue && program.venue.length > 0 ? (
                    program.venue.map((venue: any, index: number) => (
                      <Badge key={index} variant="outline">{venue}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No venues specified</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Eligibility Tracking</label>
                <Badge variant={program.eligibilityTrackingEnabled ? 'default' : 'secondary'} className="mt-1 mx-3">
                  {program.eligibilityTrackingEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students ({assignments.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule ({schedules.length})</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Students</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No students assigned to this program yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment: any) => (
                    <div key={assignment._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {assignment.studentId?.firstName} {assignment.studentId?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {assignment.studentId?.studentId || 'N/A'} • {assignment.role || 'Player'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                          {assignment.status?.charAt(0).toUpperCase() + assignment.status?.slice(1) || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Program Schedule</CardTitle>
                <Link href="/teacher/sports/schedule/new">
                  <Button size="sm">
                    New Event
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No scheduled events for this program</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule: any) => (
                    <div key={schedule._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{schedule.title || schedule.eventType}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {new Date(schedule.startDate || schedule.date).toLocaleDateString()} at {schedule.startTime || schedule.time || 'TBD'}
                            <MapPin className="w-4 h-4 ml-2" />
                            {schedule.location || schedule.venue || 'TBD'}
                          </div>
                        </div>
                      </div>
                      <Badge variant={schedule.eventType === 'Game' ? 'default' : 'secondary'}>
                        {schedule.eventType || 'Event'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attendance records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttendance.map((record: any) => (
                    <div key={record._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {record.studentId?.firstName} {record.studentId?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(record.attendanceDate || record.markedAt || record.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                        {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

