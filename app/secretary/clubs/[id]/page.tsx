'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  Users, Calendar, MapPin, ArrowLeft, Clock, User, Mail, Building2,
  Activity, Bell, Award, TrendingUp, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Club {
  _id: string;
  name: string;
  description?: string;
  type: string;
  advisorId: string | {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  schoolId: string | {
    _id?: string;
    name?: string;
  };
  location?: string;
  maxMembers?: number;
  requiresApproval: boolean;
  activities?: string[];
  contactEmail?: string;
  meetingSchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    frequency: string;
    dayTimes?: Record<string, { startTime: string; endTime: string; description: string }>;
  };
  memberCount?: number;
  createdAt: string;
  isActive: boolean;
}

interface ClubMember {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    gradeLevel?: string;
    studentId?: string;
    class?: string;
  };
  role: string;
  status: string;
  joinedDate: string;
}

interface ClubEvent {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  timeSlots?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
  }>;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  eventDate?: string;
  scheduledFor?: string;
}

interface AttendanceStats {
  totalSessions: number;
  averageAttendance: number;
  recentSessions: Array<{
    date: string;
    presentCount: number;
    totalMembers: number;
    attendanceRate: number;
  }>;
}

const ClubDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check if string is a valid ObjectId
  const isValidObjectId = (id: string) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  useEffect(() => {
    if (!isValidObjectId(clubId)) {
      router.push('/secretary/clubs');
      toast.error('Invalid club ID');
      return;
    }
    fetchAllClubData();
  }, [clubId, router]);

  const fetchAllClubData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Fetch club details
      const clubResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (clubResponse.ok) {
        const clubData = await clubResponse.json();
        const clubInfo = clubData.club || clubData;
        setClub(clubInfo);

        // Fetch school info if schoolId is available
        if (clubInfo.schoolId) {
          const schoolId = typeof clubInfo.schoolId === 'object' ? clubInfo.schoolId._id : clubInfo.schoolId;
          if (schoolId) {
            try {
              const schoolResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/schools/${schoolId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (schoolResponse.ok) {
                const schoolData = await schoolResponse.json();
                setSchoolInfo(schoolData.school || schoolData);
              }
            } catch (e) {
              console.log('Could not fetch school info:', e);
            }
          }
        }
      }

      // Fetch members
      try {
        const membersResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/${clubId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(Array.isArray(membersData) ? membersData : []);
        }
      } catch (e) {
        console.error('Error fetching members:', e);
      }

      // Fetch events
      try {
        const eventsResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${clubId}/events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(Array.isArray(eventsData) ? eventsData : (eventsData.events || []));
        }
      } catch (e) {
        console.error('Error fetching events:', e);
      }

      // Fetch announcements
      try {
        const announcementsResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/announcements?clubId=${clubId}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (announcementsResponse.ok) {
          const announcementsData = await announcementsResponse.json();
          const annList = announcementsData.announcements || announcementsData.data || [];
          setAnnouncements(Array.isArray(annList) ? annList : []);
        }
      } catch (e) {
        console.error('Error fetching announcements:', e);
      }

      // Fetch attendance stats
      try {
        const attendanceResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance?clubId=${clubId}&sessions=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          const sessions = Array.isArray(attendanceData) ? attendanceData : [];
          
          if (sessions.length > 0) {
            const totalSessions = sessions.length;
            const totalAttendance = sessions.reduce((sum: number, s: any) => sum + (s.attendanceRate || 0), 0);
            const averageAttendance = Math.round(totalAttendance / totalSessions);
            
            setAttendanceStats({
              totalSessions,
              averageAttendance,
              recentSessions: sessions.slice(0, 5).map((s: any) => ({
                date: s.date,
                presentCount: s.presentCount || 0,
                totalMembers: s.totalMembers || 0,
                attendanceRate: s.attendanceRate || 0
              }))
            });
          }
        }
      } catch (e) {
        console.error('Error fetching attendance:', e);
      }

    } catch (error) {
      console.error('Error fetching club data:', error);
      toast.error('Error fetching club details');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Sports': 'bg-green-100 text-green-800',
      'Arts': 'bg-purple-100 text-purple-800',
      'Service': 'bg-yellow-100 text-yellow-800',
      'STEM': 'bg-indigo-100 text-indigo-800',
      'Cultural': 'bg-pink-100 text-pink-800',
      'Language': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading club details...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Club not found</h1>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{club.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getTypeColor(club.type)}>
              {club.type}
            </Badge>
            <Badge variant={club.isActive ? 'default' : 'secondary'}>
              {club.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* School Information */}
      {schoolInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">School Name</Label>
                <p className="font-medium">{schoolInfo.name || 'N/A'}</p>
              </div>
              {schoolInfo.address && (
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{schoolInfo.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Club Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Club Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="mt-1 text-gray-700">
                {club.description || 'No description available'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </Label>
                <p className="font-medium mt-1">
                  {members.length || club.memberCount || 0}{club.maxMembers ? ` / ${club.maxMembers}` : ''}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <p className="font-medium mt-1">
                  {club.location || 'Not specified'}
                </p>
              </div>
            </div>
            {club.advisorId && typeof club.advisorId === 'object' && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Advisor
                </Label>
                <p className="font-medium mt-1">
                  {club.advisorId.firstName} {club.advisorId.lastName}
                </p>
                {club.advisorId.email && (
                  <p className="text-sm text-muted-foreground mt-1">{club.advisorId.email}</p>
                )}
                {club.advisorId.department && (
                  <p className="text-sm text-muted-foreground">{club.advisorId.department}</p>
                )}
              </div>
            )}
            {club.contactEmail && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Email
                </Label>
                <p className="font-medium mt-1">{club.contactEmail}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Requires Approval</Label>
              <p className="font-medium mt-1">
                {club.requiresApproval ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p className="font-medium mt-1">{formatDate(club.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Meeting Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {club.meetingSchedule ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p className="font-medium mt-1">{club.meetingSchedule.frequency || 'Weekly'}</p>
                </div>
                
                {club.meetingSchedule.days && club.meetingSchedule.days.length > 0 ? (
                  <div className="space-y-3">
                    <Label className="text-muted-foreground">Meeting Days & Times</Label>
                    {club.meetingSchedule.days.map((day: string) => {
                      const dayTimes = club.meetingSchedule?.dayTimes?.[day];
                      const startTime = dayTimes?.startTime || club.meetingSchedule?.startTime || '';
                      const endTime = dayTimes?.endTime || club.meetingSchedule?.endTime || '';
                      const description = dayTimes?.description || '';
                      
                      return (
                        <div key={day} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-gray-800">{day}</span>
                          </div>
                          {startTime && endTime && (
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{startTime} - {endTime}</span>
                            </div>
                          )}
                          {description && (
                            <p className="text-sm text-gray-600 mt-1">{description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No meeting days specified</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No meeting schedule set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activities */}
      {club.activities && club.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Club Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {club.activities.map((activity, index) => (
                <Badge key={index} variant="outline">
                  {activity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Club Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">
                      {member.studentId.firstName} {member.studentId.lastName}
                    </TableCell>
                    <TableCell>{member.studentId.email}</TableCell>
                    <TableCell>{member.studentId.class || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'approved' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.joinedDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No members found</p>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Club Events ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{event.name}</h4>
                    <Badge variant="outline">
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                  )}
                  {event.timeSlots && event.timeSlots.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <Label className="text-sm font-medium">Time Slots:</Label>
                      {event.timeSlots.map((slot, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground pl-4">
                          {formatDate(slot.date)}: {slot.startTime} - {slot.endTime}
                          {slot.description && ` (${slot.description})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No events found</p>
          )}
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Announcements ({announcements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{announcement.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(announcement.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  {announcement.createdBy && (
                    <p className="text-xs text-muted-foreground mt-2">
                      By: {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No announcements found</p>
          )}
        </CardContent>
      </Card>

      {/* Attendance Statistics */}
      {attendanceStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label className="text-muted-foreground">Total Sessions</Label>
                <p className="text-2xl font-bold mt-1">{attendanceStats.totalSessions}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Average Attendance Rate</Label>
                <p className="text-2xl font-bold mt-1">{attendanceStats.averageAttendance}%</p>
              </div>
            </div>
            {attendanceStats.recentSessions.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-3 block">Recent Sessions</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceStats.recentSessions.map((session, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{formatDate(session.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {session.presentCount}
                          </div>
                        </TableCell>
                        <TableCell>{session.totalMembers}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${session.attendanceRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{session.attendanceRate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClubDetailsPage;
