"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  User,
  BookOpen,
  Trophy,
  Activity,
  Bell,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useStudent } from "../context/StudentContext";
import { clubsApi } from '@/lib/api';
import axios from "axios";

interface ClubMembership {
  _id: string;
  clubId: {
    _id: string;
    name: string;
    description?: string;
    type: string;
    location?: string;
    meetingSchedule?: {
      day: string;
      days?: string[];
      time?: string;
      startTime?: string;
      endTime?: string;
    };
    memberCount?: number;
    maxMembers?: number;
  };
  role: string;
  status: 'active' | 'pending' | 'rejected';
  joinedDate: string;
  requestDate: string;
}

interface ClubAttendanceItem {
  clubId: string;
  clubName: string;
  attendance: Array<{
    _id: string;
    meetingDate: string | Date;
    date?: string;
    status: string;
  }>;
  attendanceRate: number;
  totalMeetings: number;
  presentMeetings: number;
}

interface ClubEvent {
  _id: string;
  name: string;
  clubId?: {
    _id: string;
    name: string;
    type: string;
  } | null;
  startDate: string;
  endDate: string;
  description?: string;
  timeSlots?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
  }>;
  createdAt: string;
}

interface ClubAnnouncement {
  _id: string;
  title: string;
  content?: string;
  message?: string;
  clubId: string | {
    _id: string;
    name: string;
  };
  priority?: 'low' | 'medium' | 'high' | 'normal' | 'urgent';
  targetAudience?: 'members' | 'parents' | 'all' | 'both';
  scheduledAt?: string;
  scheduledFor?: string;
  eventDate?: string;
  createdAt: string;
  sentAt?: string;
  status?: 'draft' | 'scheduled' | 'sent';
  notifyParents?: boolean;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export default function ParentClubsActivitiesPage() {
  const { selectedStudent, isLoading: isStudentLoading } = useStudent();
  const [myClubs, setMyClubs] = useState<ClubMembership[]>([]);
  const [clubAttendance, setClubAttendance] = useState<ClubAttendanceItem[]>([]);
  const [clubEvents, setClubEvents] = useState<ClubEvent[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudent) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [selectedStudent]);

  const fetchAllData = async () => {
    if (!selectedStudent) {
      setError("Please select a student to view their clubs and activities.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // First fetch clubs to get club IDs
      const clubsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/my-clubs?studentId=${selectedStudent._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      ).catch(err => {
        console.error('Error fetching clubs:', err);
        return { data: [] };
      });

      const fetchedClubs = clubsResponse.data || [];
      setMyClubs(fetchedClubs);

      // Get student's club IDs for filtering - handle multiple formats
      const studentClubIds = fetchedClubs.map((m: ClubMembership) => {
        // Handle different clubId formats
        let clubId: any = m.clubId;
        
        // If clubId is an object with _id
        if (clubId && typeof clubId === 'object') {
          clubId = clubId._id || clubId.id || clubId;
        }
        
        // Convert to string
        if (clubId) {
          return clubId.toString();
        }
        return null;
      }).filter(Boolean) as string[];

      console.log('Student club IDs:', studentClubIds);
      console.log('Fetched clubs:', fetchedClubs);

      // Fetch attendance, events, and announcements in parallel
      const [attendanceResponse, eventsResponse] = await Promise.allSettled([
        // Fetch club attendance
        axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/attendance?studentId=${selectedStudent._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        ),
        // Fetch club events for student's clubs
        axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/events?studentId=${selectedStudent._id}&page=1&limit=1000`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        ),
      ]);

      // Process attendance
      if (attendanceResponse.status === 'fulfilled') {
        const attendanceData = attendanceResponse.value.data;
        const clubs = Array.isArray(attendanceData)
          ? attendanceData
          : (attendanceData?.data && Array.isArray(attendanceData.data)
              ? attendanceData.data
              : []);
        setClubAttendance(clubs);
      } else {
        console.error('Error fetching attendance:', attendanceResponse.reason);
        setClubAttendance([]);
      }

      // Process events - backend already filters by student's clubs
      if (eventsResponse.status === 'fulfilled') {
        const eventsData = eventsResponse.value.data;
        const events = eventsData?.events || (Array.isArray(eventsData) ? eventsData : []);
        
        console.log('Events fetched for student:', events.length);
        if (events.length > 0) {
          console.log('Sample event:', events[0]);
        }
        
        setClubEvents(events);
      } else {
        const errorReason = eventsResponse.status === 'rejected' 
          ? eventsResponse.reason 
          : (eventsResponse.status === 'fulfilled' && !eventsResponse.value?.status ? 'Unknown error' : eventsResponse.value);
        console.error('Error fetching events:', errorReason);
        if (eventsResponse.status === 'rejected' && eventsResponse.reason?.response) {
          console.error('Error response data:', eventsResponse.reason.response.data);
          console.error('Error response status:', eventsResponse.reason.response.status);
        }
        setClubEvents([]);
      }

      // Fetch announcements for parent
      if (studentClubIds.length > 0) {
        fetchAnnouncements(studentClubIds, fetchedClubs);
      } else {
        setAnnouncements([]);
      }
    } catch (err: any) {
      console.error("Error fetching clubs and activities:", err);
      setError(err.message || "An error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async (clubIds: string[], clubs: ClubMembership[]) => {
    try {
      setIsLoadingAnnouncements(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
      if (!token) {
        return;
      }

      // Get active club memberships
      const activeClubs = clubs.filter(m => m.status === 'active');
      
      if (activeClubs.length === 0) {
        setAnnouncements([]);
        setIsLoadingAnnouncements(false);
        return;
      }

      // Fetch announcements for each club
      const announcementPromises = activeClubs.map(async (membership) => {
        const clubId = typeof membership.clubId === 'object' && membership.clubId?._id 
          ? membership.clubId._id 
          : membership.clubId;
        
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/${clubId}/announcements`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          const clubAnnouncements = Array.isArray(response.data) ? response.data : [];
          
          // Add club name to each announcement
          const clubName = typeof membership.clubId === 'object' && membership.clubId?.name 
            ? membership.clubId.name 
            : 'Unknown Club';
          
          // Map announcements and preserve clubId structure if it already exists
          return clubAnnouncements.map((announcement: any) => {
            const existingClubId = announcement.clubId;
            const finalClubId = (typeof existingClubId === 'object' && existingClubId?.name)
              ? existingClubId
              : {
                  _id: clubId,
                  name: clubName
                };
            
            return {
              ...announcement,
              clubId: finalClubId
            };
          });
        } catch (error) {
          console.error(`Error fetching announcements for club ${clubId}:`, error);
          return [];
        }
      });

      const allAnnouncements = await Promise.all(announcementPromises);
      const flattenedAnnouncements = allAnnouncements.flat();

      // Filter announcements for parents - show if notifyParents is true OR targetAudience is parents/both
      const filteredAnnouncements = flattenedAnnouncements.filter((announcement) => {
        const notifyParents = announcement.notifyParents === true;
        const targetAudience = announcement.targetAudience?.toLowerCase();
        
        // Show if notifyParents is true OR targetAudience is "parents" or "both"
        return notifyParents || 
               targetAudience === 'parents' || 
               targetAudience === 'both';
      });

      // Get today's date for sorting
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Categorize and sort announcements:
      // 1. Immediate (sent immediately - status === 'sent' or no scheduled date)
      // 2. Upcoming (has scheduled date > today)
      // 3. Past (has scheduled date < today or created < today)
      const immediate: ClubAnnouncement[] = [];
      const upcoming: ClubAnnouncement[] = [];
      const past: ClubAnnouncement[] = [];

      filteredAnnouncements.forEach((announcement) => {
        const scheduledDate = announcement.eventDate || 
                              announcement.scheduledAt || 
                              announcement.scheduledFor;
        const createdAt = announcement.createdAt;
        const status = announcement.status?.toLowerCase();

        // Show all announcements: draft, scheduled, sent, or no status
        // Categorize based on dates and status
        
        // If it has a scheduled date (eventDate, scheduledAt, scheduledFor)
        if (scheduledDate) {
          const scheduled = new Date(scheduledDate);
          scheduled.setHours(0, 0, 0, 0);
          
          if (scheduled >= today) {
            // Future scheduled date - upcoming
            upcoming.push(announcement);
          } else {
            // Past scheduled date - past
            past.push(announcement);
          }
        } else {
          // No scheduled date - check status and created date
          if (status === 'scheduled') {
            // Scheduled but no date - treat as upcoming
            upcoming.push(announcement);
          } else if (status === 'draft') {
            // Draft - show as immediate (can be edited/sent)
            immediate.push(announcement);
          } else if (status === 'sent' || !status) {
            // Sent or no status - check created date
            if (createdAt) {
              const created = new Date(createdAt);
              created.setHours(0, 0, 0, 0);
              
              if (created >= today) {
                // Created today or future - immediate
                immediate.push(announcement);
              } else {
                // Created in past - past
                past.push(announcement);
              }
            } else {
              // No date info - treat as immediate
              immediate.push(announcement);
            }
          } else {
            // Other status or no status - check created date
            if (createdAt) {
              const created = new Date(createdAt);
              created.setHours(0, 0, 0, 0);
              
              if (created >= today) {
                immediate.push(announcement);
              } else {
                past.push(announcement);
              }
            } else {
              immediate.push(announcement);
            }
          }
        }
      });

      // Sort each category
      immediate.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.sentAt || 0);
        const dateB = new Date(b.createdAt || b.sentAt || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

      upcoming.sort((a, b) => {
        const dateA = new Date(a.eventDate || a.scheduledAt || a.scheduledFor || a.createdAt);
        const dateB = new Date(b.eventDate || b.scheduledAt || b.scheduledFor || b.createdAt);
        return dateA.getTime() - dateB.getTime(); // Earliest first
      });

      past.sort((a, b) => {
        const dateA = new Date(a.eventDate || a.scheduledAt || a.scheduledFor || a.createdAt);
        const dateB = new Date(b.eventDate || b.scheduledAt || b.scheduledFor || b.createdAt);
        return dateB.getTime() - dateA.getTime(); // Newest first (most recent past first)
      });

      // Combine: immediate first, then upcoming, then past
      const sortedAnnouncements = [...immediate, ...upcoming, ...past];

      setAnnouncements(sortedAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Academic': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Sports': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Arts': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Service': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'STEM': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'Cultural': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'Language': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[type] || colors['Other'];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (isStudentLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading clubs and activities...</p>
        </div>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Please select a student to view their clubs and activities</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && myClubs.length === 0 && clubAttendance.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchAllData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Clubs & Activities
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Viewing clubs and activities for <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </p>
            </motion.div>
          </div>

          {/* My Clubs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  My Clubs ({myClubs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myClubs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {myClubs.map((membership, index) => {
                      const club = membership.clubId;
                      return (
                        <motion.div
                          key={membership._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                        >
                          <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg sm:text-xl mb-2">{club.name}</CardTitle>
                                  <CardDescription className="text-sm line-clamp-2">
                                    {club.description || 'No description available'}
                                  </CardDescription>
                                </div>
                                <Badge className={getStatusColor(membership.status)}>
                                  {membership.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getTypeColor(club.type)}>
                                    {club.type}
                                  </Badge>
                                  {membership.role && membership.role !== 'Member' && (
                                    <Badge variant="outline" className="text-xs">
                                      <Award className="w-3 h-3 mr-1" />
                                      {membership.role}
                                    </Badge>
                                  )}
                                </div>

                                {club.meetingSchedule && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">
                                      {club.meetingSchedule.days?.join(', ') || club.meetingSchedule.day}s
                                      {club.meetingSchedule.startTime && club.meetingSchedule.endTime && (
                                        <> • {club.meetingSchedule.startTime} - {club.meetingSchedule.endTime}</>
                                      )}
                                      {club.meetingSchedule.time && <> • {club.meetingSchedule.time}</>}
                                    </span>
                                  </div>
                                )}

                                {club.location && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{club.location}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <span>
                                    {club.memberCount || 0} members
                                    {club.maxMembers && ` / ${club.maxMembers} max`}
                                  </span>
                                </div>

                                {membership.status === 'active' && membership.joinedDate && (
                                  <div className="text-sm text-muted-foreground">
                                    Member since {new Date(membership.joinedDate || membership.requestDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Club Memberships</p>
                    <p className="text-sm">The student is not currently a member of any clubs.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Club Attendance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Club Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clubAttendance.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {clubAttendance.map((club, index) => {
                      const totalMeetings = typeof club.totalMeetings === 'number' ? club.totalMeetings : (club.attendance?.length || 0);
                      const presentMeetings = typeof club.presentMeetings === 'number'
                        ? club.presentMeetings
                        : (club.attendance?.filter((a: any) => a?.status?.toLowerCase() === 'present').length || 0);
                      const attendancePercentage = totalMeetings > 0
                        ? Math.round((presentMeetings / totalMeetings) * 100)
                        : 0;

                      return (
                        <motion.div
                          key={club.clubId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center">
                                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                                  {club.clubName}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Attendance
                                </span>
                                <span className="font-semibold text-lg">
                                  {attendancePercentage}%
                                </span>
                              </div>
                              <Progress
                                value={attendancePercentage}
                                className="h-2 mb-4"
                                style={{
                                  background: `linear-gradient(to right,
                                    ${
                                      attendancePercentage < 75
                                        ? "#ef4444"
                                        : "#22c55e"
                                    } ${attendancePercentage}%,
                                    #e5e7eb ${attendancePercentage}%)`,
                                }}
                              />
                              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Total Meetings:</span>
                                  <span className="ml-2 font-semibold">{totalMeetings}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Present:</span>
                                  <span className="ml-2 font-semibold text-green-600">{presentMeetings}</span>
                                </div>
                              </div>
                              {club.attendance && Array.isArray(club.attendance) && club.attendance.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                  <p className="text-sm font-medium mb-2">Recent Attendance:</p>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {club.attendance
                                      .slice(0, 5)
                                      .filter((record: any) => record && (record.meetingDate || record.date))
                                      .map((record: any) => {
                                        const meetingDate = record.meetingDate || record.date;
                                        const status = record.status?.toLowerCase() || '';
                                        return (
                                          <div key={record._id || Math.random()} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">
                                              {meetingDate ? new Date(meetingDate).toLocaleDateString() : 'N/A'}
                                            </span>
                                            <Badge
                                              variant={
                                                status === 'present'
                                                  ? 'default'
                                                  : status === 'excused'
                                                  ? 'secondary'
                                                  : 'destructive'
                                              }
                                              className="text-xs capitalize"
                                            >
                                              {status === 'present' ? (
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                              ) : status === 'absent' ? (
                                                <XCircle className="w-3 h-3 mr-1" />
                                              ) : (
                                                <Clock className="w-3 h-3 mr-1" />
                                              )}
                                              {record.status || 'N/A'}
                                            </Badge>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Club Attendance Records</p>
                    <p className="text-sm">Club attendance will appear here once recorded by the club advisor.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Club Events Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Club Events ({clubEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clubEvents.length > 0 ? (
                  <div className="space-y-4">
                    {clubEvents
                      .sort((a, b) => {
                        const dateA = new Date(a.startDate).getTime();
                        const dateB = new Date(b.startDate).getTime();
                        return dateB - dateA; // Newest first
                      })
                      .map((event, index) => (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                        >
                          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <CardTitle className="text-lg sm:text-xl mb-2">{event.name}</CardTitle>
                                  {event.clubId && (
                                    <Badge variant="outline" className="mb-2">
                                      {event.clubId.name}
                                    </Badge>
                                  )}
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(event.startDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                    {event.endDate && event.endDate !== event.startDate && (
                                      <> - {new Date(event.endDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}</>
                                    )}
                                  </span>
                                </div>
                                {event.timeSlots && event.timeSlots.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{event.timeSlots.length} time slot{event.timeSlots.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                              {event.timeSlots && event.timeSlots.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                  <p className="text-sm font-medium mb-2">Time Slots:</p>
                                  <div className="space-y-2">
                                    {event.timeSlots.map((slot, slotIndex) => (
                                      <div key={slotIndex} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-indigo-500" />
                                          <span className="font-medium">
                                            {new Date(slot.date).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                          <Clock className="w-4 h-4 text-indigo-500 ml-2" />
                                          <span>
                                            {slot.startTime} - {slot.endTime}
                                          </span>
                                        </div>
                                        {slot.description && (
                                          <p className="text-xs text-muted-foreground mt-1 ml-6">{slot.description}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Club Events</p>
                    <p className="text-sm">There are no upcoming events for the clubs your child is a member of.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Club Announcements Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Club Announcements ({announcements.length})
                </CardTitle>
                <CardDescription>
                  Announcements from your child's clubs - immediate, upcoming, and past
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnnouncements ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    <span className="ml-2 text-muted-foreground">Loading announcements...</span>
                  </div>
                ) : announcements.length > 0 ? (
                  <div className="space-y-6">
                    {(() => {
                      // Categorize announcements for display
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      const immediate: ClubAnnouncement[] = [];
                      const upcoming: ClubAnnouncement[] = [];
                      const past: ClubAnnouncement[] = [];

                      announcements.forEach((announcement) => {
                        const scheduledDate = announcement.eventDate || 
                                             announcement.scheduledAt || 
                                             announcement.scheduledFor;
                        const createdAt = announcement.createdAt;
                        const status = announcement.status?.toLowerCase();

                        // Use same logic as fetch function to categorize
                        if (scheduledDate) {
                          const scheduled = new Date(scheduledDate);
                          scheduled.setHours(0, 0, 0, 0);
                          
                          if (scheduled >= today) {
                            upcoming.push(announcement);
                          } else {
                            past.push(announcement);
                          }
                        } else {
                          if (status === 'scheduled') {
                            upcoming.push(announcement);
                          } else if (status === 'draft') {
                            immediate.push(announcement);
                          } else if (status === 'sent' || !status) {
                            if (createdAt) {
                              const created = new Date(createdAt);
                              created.setHours(0, 0, 0, 0);
                              
                              if (created >= today) {
                                immediate.push(announcement);
                              } else {
                                past.push(announcement);
                              }
                            } else {
                              immediate.push(announcement);
                            }
                          } else {
                            if (createdAt) {
                              const created = new Date(createdAt);
                              created.setHours(0, 0, 0, 0);
                              
                              if (created >= today) {
                                immediate.push(announcement);
                              } else {
                                past.push(announcement);
                              }
                            } else {
                              immediate.push(announcement);
                            }
                          }
                        }
                      });

                      const getPriorityColor = (priority: string) => {
                        // Match admin page priority colors
                        const colors: Record<string, string> = {
                          low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
                          normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                          high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                          urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                          medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' // Support medium as normal
                        };
                        const normalizedPriority = priority?.toLowerCase() || 'normal';
                        return colors[normalizedPriority] || colors['normal'];
                      };

                      const renderAnnouncement = (announcement: ClubAnnouncement) => {
                        const clubName = typeof announcement.clubId === 'object' && announcement.clubId?.name
                          ? announcement.clubId.name
                          : 'Unknown Club';
                        
                        const announcementDate = announcement.eventDate || 
                                                 announcement.scheduledAt || 
                                                 announcement.scheduledFor ||
                                                 announcement.createdAt;
                        
                        const date = announcementDate ? new Date(announcementDate) : null;
                        
                        // Get priority - check both priority and type fields (for backend compatibility)
                        const rawPriority = announcement.priority || (announcement as any).type || 'normal';
                        const priority = ['low', 'normal', 'high', 'urgent'].includes(rawPriority?.toLowerCase())
                          ? rawPriority.toLowerCase()
                          : 'normal';

                        return (
                          <Card key={announcement._id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-lg leading-tight line-clamp-2">
                                  {announcement.title}
                                </CardTitle>
                                {priority && (
                                  <Badge className={`${getPriorityColor(priority)} text-xs shrink-0`}>
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {clubName}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="text-sm text-muted-foreground line-clamp-3">
                                {announcement.content || announcement.message || 'No content available'}
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                {date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                      {date.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                )}
                                {announcement.createdBy && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="truncate">
                                      {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      };

                      return (
                        <>
                          {immediate.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <Megaphone className="h-5 w-5 text-green-600" />
                                  Immediate Announcements
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {immediate.length}
                                </Badge>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {immediate.map(renderAnnouncement)}
                              </div>
                            </div>
                          )}

                          {upcoming.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                  Upcoming Announcements
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {upcoming.length}
                                </Badge>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {upcoming.map(renderAnnouncement)}
                              </div>
                            </div>
                          )}

                          {past.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-gray-600" />
                                  Past Announcements
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {past.length}
                                </Badge>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {past.map(renderAnnouncement)}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Announcements</p>
                    <p className="text-sm">There are no announcements from your child's clubs at this time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

