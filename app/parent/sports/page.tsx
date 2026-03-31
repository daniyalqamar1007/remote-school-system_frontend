"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Calendar, 
  Activity, 
  User,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Download,
  Mail,
  TrendingUp,
  Award,
  Target,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  class: string;
  section: string;
}

interface SportsProgram {
  _id: string;
  studentId: string;
  studentName: string;
  studentInfo: {
    studentId: string;
    class: string;
    section: string;
  };
  sportsProgramId: string;
  program: {
    _id: string;
    name: string;
    description?: string;
    season?: string;
    type?: string;
    location?: string;
    maxParticipants?: number;
  };
  status: string;
  playerRole: string;
  enrollmentDate: string;
  isEligible: boolean;
}

interface ScheduleEvent {
  _id: string;
  title: string;
  eventType: string;
  sportsProgramId: string;
  program: {
    _id: string;
    name: string;
    season?: string;
    type?: string;
  };
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  status?: string;
  students: Array<{
    studentId: string;
    studentName: string;
  }>;
}

interface AttendanceRecord {
  _id: string;
  studentId: string;
  studentName: string;
  studentInfo: {
    studentId: string;
    class: string;
    section: string;
  };
  sportsProgramId: string;
  program: {
    _id: string;
    name: string;
    season?: string;
    type?: string;
  };
  scheduleId?: string;
  schedule?: {
    _id: string;
    title?: string;
    eventType?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  };
  attendanceDate: string;
  status: string;
  notes?: string;
  parentNotified: boolean;
}

export default function ParentSportsPage() {
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [children, setChildren] = useState<Student[]>([]);
  const [sportsPrograms, setSportsPrograms] = useState<SportsProgram[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSports, setLoadingSports] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      fetchSports();
      fetchSchedule();
      fetchAttendance();
    }
  }, [selectedChild, children]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      // Fetch parent profile to get children
      const profileResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/parent/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const childrenData = profileResponse.data?.children || [];
      setChildren(childrenData);
      
      if (childrenData.length > 0) {
        await Promise.all([
          fetchSports(),
          fetchSchedule(),
          fetchAttendance(),
        ]);
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSports = async () => {
    try {
      setLoadingSports(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/sports/parent/children-sports`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data?.data || response.data || [];
      let programs = Array.isArray(data) ? data : [];

      // Filter by selected child if not 'all'
      if (selectedChild !== 'all') {
        programs = programs.filter((p: SportsProgram) => p.studentId === selectedChild);
      }

      setSportsPrograms(programs);
    } catch (error: any) {
      console.error('Error fetching sports:', error);
      toast.error('Failed to load sports programs');
    } finally {
      setLoadingSports(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/sports/parent/children-schedule`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data?.data || response.data || [];
      let events = Array.isArray(data) ? data : [];

      // Filter by selected child if not 'all'
      if (selectedChild !== 'all') {
        events = events.filter((e: ScheduleEvent) => 
          e.students.some((s: any) => s.studentId === selectedChild)
        );
      }

      // Sort by date
      events.sort((a: ScheduleEvent, b: ScheduleEvent) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateA - dateB;
      });

      setSchedule(events);
    } catch (error: any) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/sports/parent/children-attendance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data?.data || response.data || [];
      let records = Array.isArray(data) ? data : [];

      // Filter by selected child if not 'all'
      if (selectedChild !== 'all') {
        records = records.filter((r: AttendanceRecord) => r.studentId === selectedChild);
      }

      // Sort by date (newest first)
      records.sort((a: AttendanceRecord, b: AttendanceRecord) => {
        const dateA = new Date(a.attendanceDate).getTime();
        const dateB = new Date(b.attendanceDate).getTime();
        return dateB - dateA;
      });

      setAttendance(records);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'eligible':
      case 'present':
      case 'attended':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
      case 'ineligible':
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
      case 'under review':
      case 'excused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
      case 'attended':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'excused':
      case 'late':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const calculateAttendanceRate = (programId: string, studentId?: string) => {
    const programAttendance = studentId
      ? attendance.filter(a => a.sportsProgramId === programId && a.studentId === studentId)
      : attendance.filter(a => a.sportsProgramId === programId);
    
    if (programAttendance.length === 0) return 0;
    
    const presentCount = programAttendance.filter(a => 
      a.status?.toLowerCase() === 'present' || a.status?.toLowerCase() === 'attended'
    ).length;
    
    return Math.round((presentCount / programAttendance.length) * 100);
  };

  const filteredSports = selectedChild === 'all' 
    ? sportsPrograms 
    : sportsPrograms.filter(p => p.studentId === selectedChild);

  const filteredSchedule = selectedChild === 'all'
    ? schedule
    : schedule.filter(e => e.students.some((s: any) => s.studentId === selectedChild));

  const filteredAttendance = selectedChild === 'all'
    ? attendance
    : attendance.filter(a => a.studentId === selectedChild);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
            Sports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your children's sports programs, attendance, and events
          </p>
        </div>
        
        {/* Child Filter */}
        {children.length > 0 && (
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((child) => (
                <SelectItem key={child._id} value={child._id}>
                  {child.firstName} {child.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sports Programs Overview */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Sports Programs
          </CardTitle>
          <CardDescription className="text-purple-100">
            Active sports programs your children are enrolled in
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingSports ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading sports programs...</p>
            </div>
          ) : filteredSports.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Sports Programs</h3>
              <p className="text-gray-600 dark:text-gray-400">Your children are not currently enrolled in any sports programs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSports.map((sport) => {
                const attendanceRate = calculateAttendanceRate(sport.sportsProgramId, sport.studentId);
                return (
                  <motion.div
                    key={sport._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                            {sport.program?.name || 'Sports Program'}
                          </CardTitle>
                          <Badge variant="outline" className={getStatusColor(sport.status)}>
                            {sport.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {sport.studentName} • Grade {sport.studentInfo?.class} - Section {sport.studentInfo?.section}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          {sport.program?.season && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Season:</span>
                              <span className="font-medium">{sport.program.season}</span>
                            </div>
                          )}
                          {sport.playerRole && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Role:</span>
                              <span className="font-medium capitalize">{sport.playerRole}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Attendance:</span>
                            <span className="font-medium">{attendanceRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Eligible:</span>
                            <Badge variant={sport.isEligible ? 'default' : 'destructive'} className="text-xs">
                              {sport.isEligible ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                        {attendanceRate > 0 && (
                          <Progress value={attendanceRate} className="h-2" />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      {filteredSports.length > 0 && (
        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule & Events</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upcoming Schedule & Events</CardTitle>
                  {/* <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Calendar
                  </Button> */}
                </div>
              </CardHeader>
              <CardContent>
                {loadingSchedule ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Loading schedule...</p>
                  </div>
                ) : filteredSchedule.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Upcoming Events</h3>
                    <p className="text-gray-600 dark:text-gray-400">Your children's schedule will appear here when events are scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSchedule.map((event) => (
                      <motion.div
                        key={event._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={event.eventType === 'Game' || event.eventType === 'Match' ? 'default' : 'secondary'}>
                                {event.eventType || 'Event'}
                              </Badge>
                              <span className="font-semibold text-gray-900 dark:text-white">{event.title}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">• {event.program?.name}</span>
                            </div>
                            {event.students && event.students.length > 0 && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Students: {event.students.map((s: any) => s.studentName).join(', ')}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{event.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {event.startDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                                <p className="font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )}
                          {(event.startTime || event.endTime) && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Time:</span>
                                <p className="font-medium">
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
                                <p className="font-medium">{event.location}</p>
                              </div>
                            </div>
                          )}
                          {event.status && (
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <Badge variant="outline" className="ml-1">{event.status}</Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Attendance History</CardTitle>
                  {/* <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button> */}
                </div>
              </CardHeader>
              <CardContent>
                {loadingAttendance ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Loading attendance...</p>
                  </div>
                ) : filteredAttendance.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Attendance Records</h3>
                    <p className="text-gray-600 dark:text-gray-400">Attendance records will appear here once they are recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAttendance.map((record) => (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {getAttendanceIcon(record.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-white">{record.program?.name || 'Sports Program'}</span>
                              <Badge variant="outline" className="text-xs">
                                {record.schedule?.eventType || 'Practice'}
                              </Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                • {record.studentName} (Grade {record.studentInfo?.class} - {record.studentInfo?.section})
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(record.attendanceDate).toLocaleDateString()} 
                              {record.schedule?.startTime && ` • ${record.schedule.startTime}`}
                              {record.schedule?.location && ` • ${record.schedule.location}`}
                            </div>
                            {record.notes && (
                              <div className="text-sm text-yellow-600 dark:text-yellow-400 italic mt-1">
                                Note: {record.notes}
                              </div>
                            )}
                            {record.parentNotified && (
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ You were notified
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Programs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredSports.length}</p>
                    </div>
                    <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {filteredSchedule.filter(e => new Date(e.startDate) >= new Date()).length}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Attendance Records</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAttendance.length}</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average Attendance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {filteredSports.length > 0
                          ? Math.round(
                              filteredSports.reduce((sum, sport) => 
                                sum + calculateAttendanceRate(sport.sportsProgramId, sport.studentId), 0
                              ) / filteredSports.length
                            )
                          : 0}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
