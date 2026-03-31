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
  AlertCircle,
  FileText,
  Target,
  Activity,
  Loader2
} from 'lucide-react'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

interface SportsStats {
  activePrograms: number
  upcomingEvents: number
  totalPrograms: number
  eligiblePrograms: number
  programsBySeason: Record<string, number>
}

interface SportsProgram {
  _id: string
  sportsProgramId?: {
    _id: string
    name: string
    description?: string
    season?: string
    type?: string
    startDate?: string
    endDate?: string
    location?: string
    maxParticipants?: number
  }
  status?: string
  playerRole?: string
  enrollmentDate?: string
  isEligible?: boolean
}

interface ScheduleEvent {
  _id: string
  title?: string
  eventType?: string
  startDate?: string
  startTime?: string
  endTime?: string
  location?: string
  status?: string
  sportsProgramId?: {
    _id: string
    name: string
  }
}

export default function StudentSportsPage() {
  const [stats, setStats] = useState<SportsStats>({
    activePrograms: 0,
    upcomingEvents: 0,
    totalPrograms: 0,
    eligiblePrograms: 0,
    programsBySeason: {}
  })
  const [myPrograms, setMyPrograms] = useState<SportsProgram[]>([])
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([])
  const [mySchedule, setMySchedule] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [programsLoading, setProgramsLoading] = useState(false)
  const [scheduleLoading, setScheduleLoading] = useState(false)

  useEffect(() => {
    // loadStats() // Commented out - stats not needed
    loadStudentSportsData()
  }, [])

  // Load stats separately on page load
  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const response = await sportsApi.student.getMyStats()
      
      if (response?.success && response?.data) {
        setStats(response.data)
      } else if (response?.data) {
        // Handle direct data response
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      // Keep default stats on error
    } finally {
      setStatsLoading(false)
    }
  }

  // Load programs and schedule data
  const loadStudentSportsData = async () => {
    try {
      setLoading(true)
      
      // Fetch student's sports programs and schedule in parallel
      const [programsRes, scheduleRes] = await Promise.all([
        sportsApi.student.getMySports().catch(() => ({ programs: [] })),
        sportsApi.student.getMySchedule().catch(() => ({ schedule: [] }))
      ])
      
      const programs = programsRes?.programs || programsRes || []
      setMyPrograms(Array.isArray(programs) ? programs : [])
      
      const schedule = scheduleRes?.schedule || scheduleRes || []
      setMySchedule(Array.isArray(schedule) ? schedule : [])
      
      // Fetch available programs from school
      await loadAvailablePrograms(programs)
      
    } catch (error) {
      console.error('Error loading sports data:', error)
      toast.error('Failed to load sports information')
    } finally {
      setLoading(false)
    }
  }

  // Load available programs (ones student isn't enrolled in)
  const loadAvailablePrograms = async (enrolledPrograms: SportsProgram[]) => {
    try {
      setProgramsLoading(true)
      
      const allProgramsRes = await sportsApi.programs.getAll({ 
        page: '1', 
        limit: '100',
        isActive: 'true'
      }).catch(() => ({ data: { programs: [] } }))
      
      const allPrograms = allProgramsRes?.data?.programs || 
                         allProgramsRes?.programs || 
                         (Array.isArray(allProgramsRes?.data) ? allProgramsRes.data : []) ||
                         []
      
      // Get enrolled program IDs
      const enrolledProgramIds = enrolledPrograms.map((p: SportsProgram) => 
        p.sportsProgramId?._id || p._id
      ).filter(Boolean)
      
      // Filter to get available programs (ones student isn't enrolled in)
      const available = allPrograms.filter((p: any) => 
        !enrolledProgramIds.includes(p._id)
      )
      
      setAvailablePrograms(available)
      
    } catch (error) {
      console.error('Error loading available programs:', error)
    } finally {
      setProgramsLoading(false)
    }
  }

  const loadSchedule = async () => {
    try {
      setScheduleLoading(true)
      const scheduleRes = await sportsApi.student.getMySchedule().catch(() => ({ schedule: [] }))
      const schedule = scheduleRes?.schedule || scheduleRes || []
      setMySchedule(Array.isArray(schedule) ? schedule : [])
    } catch (error) {
      console.error('Error loading schedule:', error)
      toast.error('Failed to load schedule')
    } finally {
      setScheduleLoading(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case 'inactive':
        return <Badge variant="destructive">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Check if we should show separate tabs or combine
  const hasMyPrograms = myPrograms.length > 0
  const hasAvailablePrograms = availablePrograms.length > 0
  const shouldShowSeparateTabs = hasMyPrograms && hasAvailablePrograms && myPrograms.length !== availablePrograms.length

  // Filter upcoming events
  const upcomingEvents = mySchedule
    .filter((event: ScheduleEvent) => {
      if (!event.startDate) return false
      const eventDate = new Date(event.startDate)
      return eventDate >= new Date()
    })
    .slice(0, 5)

  if (loading && statsLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Sports</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          View your sports programs and schedule
        </p>
      </div>

      {/* Statistics Cards - Commented out as not needed */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Programs</p>
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mt-2 text-gray-400" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activePrograms}</p>
                )}
              </div>
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</p>
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mt-2 text-gray-400" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingEvents}</p>
                )}
              </div>
              <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Programs</p>
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mt-2 text-gray-400" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPrograms}</p>
                )}
              </div>
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eligible Programs</p>
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mt-2 text-gray-400" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.eligiblePrograms}</p>
                )}
              </div>
              <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Main Content Tabs */}
      <Tabs defaultValue={hasMyPrograms ? "programs" : (hasAvailablePrograms ? "available" : "schedule")} className="space-y-4">
        <TabsList className={`grid w-full ${hasAvailablePrograms ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="programs">My Programs</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          {hasAvailablePrograms && (
            <TabsTrigger value="available">Available Programs</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle>My Sports Programs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading || programsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">Loading programs...</p>
                </div>
              ) : myPrograms.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No programs enrolled</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You haven't enrolled in any sports programs yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPrograms.map((program: SportsProgram) => {
                    const programInfo = program.sportsProgramId || {}
                    return (
                      <div 
                        key={program._id || programInfo._id} 
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow dark:border-gray-700"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {programInfo.name || 'Sports Program'}
                          </h3>
                          {getStatusBadge(program.status)}
                        </div>
                        {programInfo.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {programInfo.description}
                          </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {program.playerRole && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Role:</span>
                              <p className="font-medium text-gray-900 dark:text-white capitalize">
                                {program.playerRole}
                              </p>
                            </div>
                          )}
                          {programInfo.season && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Season:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{programInfo.season}</p>
                            </div>
                          )}
                          {program.enrollmentDate && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Enrolled:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(program.enrollmentDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Eligible:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {program.isEligible !== false ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">Loading schedule...</p>
                </div>
              ) : mySchedule.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming events</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your schedule will appear here when events are scheduled
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event: ScheduleEvent) => (
                      <div 
                        key={event._id} 
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow dark:border-gray-700"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {event.title || event.eventType || 'Sports Event'}
                          </h3>
                          {event.status && (
                            <Badge variant="outline">{event.status}</Badge>
                          )}
                        </div>
                        {event.sportsProgramId && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {event.sportsProgramId.name}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          {event.startDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {new Date(event.startDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {(event.startTime || event.endTime) && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Time:</span>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {event.startTime} {event.endTime ? `- ${event.endTime}` : ''}
                                </p>
                              </div>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Location:</span>
                                <p className="font-medium text-gray-900 dark:text-white">{event.location}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">No upcoming events scheduled</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasAvailablePrograms && (
          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Available Programs</CardTitle>
              </CardHeader>
              <CardContent>
                {programsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Loading available programs...</p>
                  </div>
                ) : availablePrograms.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No programs available</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Check back later for new program offerings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availablePrograms.map((program: any) => (
                      <div 
                        key={program._id} 
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow dark:border-gray-700"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {program.name || 'Sports Program'}
                          </h3>
                          {program.season && (
                            <Badge variant="outline">{program.season}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {program.type && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Type:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{program.type}</p>
                            </div>
                          )}
                          {program.season && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Season:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{program.season}</p>
                            </div>
                          )}
                          {program.maxParticipants && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Max Participants:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {program.maxParticipants}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
