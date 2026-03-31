"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function ProgramDetailsPage() {
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
      console.log('Program details response:', response) // Debug log
      
      // Backend returns the program directly, not wrapped in data
      setProgram(response)
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
      const response = await sportsApi.assignments.getAll({ sportsProgramId: programId })
      console.log('Assignments response:', response) // Debug log
      
      // Handle backend response format: { assignments: [...], total: number }
      const assignmentsData = response.assignments || response.data || []
      setAssignments(assignmentsData)
    } catch (error) {
      console.error('Error loading assignments:', error)
      setAssignments([])
    }
  }

  const loadProgramSchedules = async () => {
    try {
      const programId = Array.isArray(params.id) ? params.id[0] : params.id
      const response = await sportsApi.schedule.getAll({ sportsProgramId: programId })
      console.log('Schedules response:', response) // Debug log
      
      // Handle backend response format: { schedules: [...], total: number }
      const schedulesData = response.schedules || response.data || []
      setSchedules(schedulesData)
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules([])
    }
  }

  const loadProgramAttendance = async () => {
    try {
      const programId = Array.isArray(params.id) ? params.id[0] : params.id
      const response = await sportsApi.attendance.getAll({ sportsProgramId: programId })
      console.log('Attendance response:', response) // Debug log
      
      // Handle backend response format: { attendance: [...], total: number }
      const attendanceData = response.attendance || response.data || []
      setAttendance(attendanceData)
    } catch (error) {
      console.error('Error loading attendance:', error)
      setAttendance([])
    }
  }

  const handleDeleteProgram = async () => {
    if (window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      try {
        await sportsApi.programs.delete(Array.isArray(params.id) ? params.id[0] : params.id)
        toast.success('Program deleted successfully')
        router.push('/secretary/sports')
      } catch (error) {
        console.error('Error deleting program:', error)
        toast.error('Failed to delete program')
      }
    }
  }

  const getStatusBadge = (status: any) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'Inactive':
        return <Badge variant="destructive">Inactive</Badge>
      case 'Scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'Completed':
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSeasonBadge = (season: any) => {
    switch (season) {
      case 'Fall':
        return <Badge className="bg-orange-100 text-orange-800">Fall</Badge>
      case 'Winter':
        return <Badge className="bg-blue-100 text-blue-800">Winter</Badge>
      case 'Spring':
        return <Badge className="bg-green-100 text-green-800">Spring</Badge>
      case 'Summer':
        return <Badge className="bg-yellow-100 text-yellow-800">Summer</Badge>
      default:
        return <Badge variant="outline">{season}</Badge>
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
          <Link href="/secretary/sports">
            <Button>Back to Sports</Button>
          </Link>
        </div>
      </div>
    )
  }

  const activeStudents = assignments.filter((a: any) => a.status === 'active').length
  const upcomingEvents = schedules.filter((s: any) => new Date(s.startDate) > new Date()).length
  const recentAttendance = attendance.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/secretary/sports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(program.isActive ? 'Active' : 'Inactive')}
              {getSeasonBadge(program.season ? program.season.charAt(0).toUpperCase() + program.season.slice(1) : 'Not Set')}
              <Badge variant="outline">{program.type ? program.type.charAt(0).toUpperCase() + program.type.slice(1) : 'Not Set'}</Badge>
              <Badge variant="outline">{program.allowedGradeLevels?.join(', ') || 'All Grades'}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/secretary/sports/programs/${program._id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          {/* <Button variant="destructive" onClick={handleDeleteProgram}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button> */}
        </div>
      </div>

      {/* Program Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coaches</p>
                <p className="text-lg font-semibold">
                  {program.coaches?.length || program.assistantCoaches?.length 
                    ? `${(program.coaches?.length || 0) + (program.assistantCoaches?.length || 0)} Coach${((program.coaches?.length || 0) + (program.assistantCoaches?.length || 0)) > 1 ? 'es' : ''}` 
                    : 'Not Assigned'}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
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
                  {program.requiresPhysicalExam && <Badge variant="outline">Physical Exam Required</Badge>}
                  {program.requiresMedicalClearance && <Badge variant="outline">Medical Clearance Required</Badge>}
                  {program.requiresConsentForm && <Badge variant="outline">Consent Form Required</Badge>}
                  {!program.requiresPhysicalExam && !program.requiresMedicalClearance && !program.requiresConsentForm && 
                    <span className="text-gray-500 text-sm">No special requirements</span>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Coaches</label>
                <div className="mt-1 space-y-2">
                  {/* Head Coach - first element in coaches array */}
                  {program.coaches && program.coaches.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Head Coach:</p>
                      <div className="space-y-1">
                        {program.coaches.slice(0, 1).map((coach: any, index: number) => (
                          <div key={index} className="text-sm">
                            {typeof coach === 'object' && coach.firstName 
                              ? (
                                <>
                                  {`${coach.firstName} ${coach.lastName || ''}`.trim()}
                                  {coach.email && (
                                    <span className="text-gray-500 ml-2">({coach.email})</span>
                                  )}
                                </>
                              )
                              : 'Coach ID: ' + (coach._id || coach)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Assistant Coaches - all from assistantCoaches array (coaches array should only have head coach) */}
                  {program.assistantCoaches && program.assistantCoaches.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assistant Coaches ({program.assistantCoaches.length}):</p>
                      <div className="space-y-1">
                        {program.assistantCoaches.map((coach: any, index: number) => (
                          <div key={index} className="text-sm">
                            {typeof coach === 'object' && coach.firstName 
                              ? (
                                <>
                                  {`${coach.firstName} ${coach.lastName || ''}`.trim()}
                                  {coach.email && (
                                    <span className="text-gray-500 ml-2">({coach.email})</span>
                                  )}
                                </>
                              )
                              : 'Coach ID: ' + (coach._id || coach)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!program.coaches || program.coaches.length === 0) && (!program.assistantCoaches || program.assistantCoaches.length === 0) && (
                    <span className="text-gray-500 text-sm">No coaches assigned</span>
                  )}
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
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                          <p className="text-sm text-gray-600">{assignment.role || 'Player'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                        <Badge variant={assignment.isEligible ? 'default' : 'destructive'}>
                          {assignment.isEligible ? 'Eligible' : 'Not Eligible'}
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
              <CardTitle>Program Schedule</CardTitle>
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
                            {new Date(schedule.startDate).toLocaleDateString()} at {schedule.startTime}
                            <MapPin className="w-4 h-4 ml-2" />
                            {schedule.location}
                          </div>
                        </div>
                      </div>
                      <Badge variant={schedule.eventType === 'Game' ? 'default' : 'secondary'}>
                        {schedule.eventType}
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
                            {new Date(record.attendanceDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Program Status</p>
                    <p className="text-sm text-gray-600">Current status of the program</p>
                  </div>
                  {getStatusBadge(program.isActive ? 'Active' : 'Inactive')}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Maximum Participants</p>
                    <p className="text-sm text-gray-600">Maximum number of students</p>
                  </div>
                  <Badge variant="outline">{program.maxParticipants > 0 ? program.maxParticipants : 'Unlimited'}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Eligibility Tracking</p>
                    <p className="text-sm text-gray-600">Track student eligibility</p>
                  </div>
                  <Badge variant={program.eligibilityTrackingEnabled ? 'default' : 'secondary'}>
                    {program.eligibilityTrackingEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
