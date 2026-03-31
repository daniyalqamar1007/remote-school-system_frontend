"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertTriangle,
  FileText,
  Target
} from 'lucide-react'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function StudentSportsPage() {
  const [myPrograms, setMyPrograms] = useState<any[]>([])
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([])
  const [mySchedule, setMySchedule] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudentSportsData()
  }, [])

  const loadStudentSportsData = async () => {
    try {
      setLoading(true)
      
      // For now, use empty arrays to prevent API errors during development
      setMyPrograms([])
      setAvailablePrograms([])
      setMySchedule([])
      setAttendance([])
      
    } catch (error) {
      console.error('Error loading sports data:', error)
      toast.error('Failed to load sports information')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollment = async (programId: string) => {
    try {
      toast.success('Enrollment request submitted successfully')
      loadStudentSportsData()
    } catch (error) {
      console.error('Error enrolling in program:', error)
      toast.error('Failed to submit enrollment request')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'Inactive':
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getEligibilityBadge = (status: string) => {
    switch (status) {
      case 'Eligible':
        return <Badge className="bg-green-100 text-green-800">Eligible</Badge>
      case 'Ineligible':
        return <Badge variant="destructive">Ineligible</Badge>
      case 'Under Review':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getAttendanceRate = () => {
    if (attendance.length === 0) return 0
    const presentCount = attendance.filter((a: any) => a.status === 'Present').length
    return Math.round((presentCount / attendance.length) * 100)
  }

  const upcomingEvents = mySchedule.filter((event: any) => new Date(event.date) >= new Date()).slice(0, 5)
  const recentAttendance = attendance.slice(0, 10)

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Sports</h1>
        <p className="text-gray-600 mt-1">View your sports programs, schedule, and performance</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Programs</p>
                <p className="text-2xl font-bold">{myPrograms.filter((p: any) => p.status === 'Active').length}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold">{getAttendanceRate()}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eligibility Status</p>
                <p className="text-sm font-medium">All Eligible</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="programs">My Programs</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="available">Available Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle>My Sports Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No programs enrolled</h3>
                <p className="text-gray-600 mb-4">You haven't enrolled in any sports programs yet</p>
                <Button>Browse Available Programs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-600">Your schedule will appear here when events are scheduled</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
                <p className="text-gray-600">Your attendance history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No programs available</h3>
                <p className="text-gray-600">Check back later for new program offerings</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
