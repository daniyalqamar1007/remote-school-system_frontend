'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users, ArrowLeft, Search, Clock, Calendar, UserCheck,
  UserX, FileText, Download, Filter, CheckCircle, XCircle, Loader2, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Club {
  _id: string;
  name: string;
  type: string;
  advisorId: string;
  memberCount: number;
  meetingSchedule?: {
    days: string[];
    startTime?: string;
    endTime?: string;
    frequency?: string;
  };
}

interface ClubMember {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    gradeLevel?: string;
    class?: string;
  };
  role: string;
  status: string;
}

interface AttendanceRecord {
  _id: string;
  clubId: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
  markedBy: string;
}

interface AttendanceSession {
  _id: string;
  clubId: string;
  clubName: string;
  date: string;
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  status: 'open' | 'closed';
}

const ClubAttendancePage = () => {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]); // Clubs for main table filter
  const [dialogClubs, setDialogClubs] = useState<Club[]>([]); // Clubs for Record Attendance dialog
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [currentAttendanceData, setCurrentAttendanceData] = useState<{ [key: string]: boolean }>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const [sessionClubFilter, setSessionClubFilter] = useState<string>('all');
  const [debouncedSessionSearch, setDebouncedSessionSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSession, setEditSession] = useState<AttendanceSession | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewSessionDetails, setViewSessionDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [attendanceType, setAttendanceType] = useState<'event' | 'meeting' | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Super-admin school selection
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [recordAttendanceSchoolId, setRecordAttendanceSchoolId] = useState<string>('');
  const selectedClubObj = dialogClubs.find(c => c._id === selectedClub) || clubs.find(c => c._id === selectedClub);

  // Fetch schools for super-admin
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          const data = await response.json()
          const schoolsList = data?.data?.schools || data?.schools || []
          setSchools(schoolsList)
        }
      } catch (error) {
        console.error('Error fetching schools:', error)
      }
    }
    fetchSchools()
  }, [])

  useEffect(() => {
    // Fetch attendance sessions on mount and when school filter changes
    fetchAttendanceSessions(selectedSchoolId === 'all' ? '' : selectedSchoolId)
    
    if (selectedSchoolId && selectedSchoolId !== 'all' && selectedSchoolId !== '') {
      // Clear clubs first, then fetch only clubs for selected school
      setClubs([])
      fetchClubs(selectedSchoolId, false) // false = for main table, not dialog
    } else {
      setClubs([])
    }
  }, [selectedSchoolId])

  // Reset dialog state when dialog opens
  useEffect(() => {
    if (isNewSessionDialogOpen) {
      // Reset all dialog-specific state when dialog opens
      setRecordAttendanceSchoolId('');
      setSelectedClub('');
      setAttendanceType(null);
      setSelectedEvent('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setCurrentAttendanceData({});
      setClubMembers([]);
      setEvents([]);
      setDialogClubs([]);
    }
  }, [isNewSessionDialogOpen])

  useEffect(() => {
    if (selectedClub) {
      if (attendanceType === 'event') {
        // Reset event selection when club changes
        setSelectedEvent('');
        setCurrentAttendanceData({});
        setClubMembers([]);
        fetchClubEvents(selectedClub);
        // Fetch members immediately for event attendance (they'll be shown after event selection)
        // But we can pre-fetch them so they're ready
      } else if (attendanceType === 'meeting') {
        // For meeting attendance, fetch members immediately
        fetchClubMembers(selectedClub);
      }
    } else {
      // Reset when no club is selected
      setEvents([]);
      setSelectedEvent('');
      setCurrentAttendanceData({});
      setClubMembers([]);
    }
  }, [selectedClub, attendanceType]);

  const fetchClubEvents = async (clubId: string) => {
    try {
      setIsLoadingEvents(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      if (!clubId) {
        console.warn('No club ID provided for fetching events');
        setEvents([]);
        return;
      }

      if (!recordAttendanceSchoolId || recordAttendanceSchoolId === 'all' || recordAttendanceSchoolId === '') {
        console.warn('No school ID provided for fetching events. School ID:', recordAttendanceSchoolId);
        toast.error('Please select a school first');
        setEvents([]);
        return;
      }

      // Validate that the selected club belongs to the selected school
      const club = dialogClubs.find(c => c._id === clubId);
      if (!club) {
        console.error('Selected club not found in dialog clubs list. Club ID:', clubId);
        toast.error('Selected club is not available for this school. Please select a different club.');
        setEvents([]);
        return;
      }

      const params = new URLSearchParams();
      params.append('schoolId', recordAttendanceSchoolId);
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${clubId}/events?${params.toString()}`;
      console.log('Fetching club events with URL:', url, 'schoolId:', recordAttendanceSchoolId, 'clubId:', clubId);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const eventsList = Array.isArray(data) ? data : [];
        console.log('Club events fetched:', eventsList);
        setEvents(eventsList);
        
        if (eventsList.length === 0) {
          toast.info('No events found for this club');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching club events:', errorData);
        const errorMessage = errorData.message || 'Failed to fetch club events';
        toast.error(errorMessage);
        setEvents([]);
        
        // If it's a "club not found" error, reset the club selection
        if (errorMessage.includes('not found') || errorMessage.includes('Club not found')) {
          setSelectedClub('');
          setDialogClubs([]);
          // Re-fetch clubs for the selected school
          if (recordAttendanceSchoolId) {
            fetchClubs(recordAttendanceSchoolId, true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching club events:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch club events');
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (selectedEvent && attendanceType === 'event' && selectedClub) {
      // When event is selected, immediately fetch members for that event
      console.log('Event selected, fetching members for club:', selectedClub, 'Event:', selectedEvent);
      // Fetch members immediately - no delay needed as state is already updated
      fetchClubMembers(selectedClub);
    } else if (attendanceType === 'event' && !selectedEvent && selectedClub) {
      // If event type is selected but no event is chosen yet, clear members
      setClubMembers([]);
      setCurrentAttendanceData({});
    }
  }, [selectedEvent, attendanceType, selectedClub]);

  // Debounce session search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSessionSearch(sessionSearchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [sessionSearchTerm]);

  // Fetch attendance sessions when filters change
  useEffect(() => {
    fetchAttendanceSessions(selectedSchoolId === 'all' ? '' : selectedSchoolId);
    setCurrentPage(1); // Reset to first page when filters change
  }, [debouncedSessionSearch, sessionClubFilter, selectedSchoolId]);

  // Pagination calculations for attendance sessions
  const totalSessions = attendanceSessions.length;
  const totalPagesSessions = Math.ceil(totalSessions / pageSize) || 1;
  const paginatedSessions = attendanceSessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const fetchClubs = async (schoolId?: string, forDialog: boolean = false) => {
    try {
      const token = localStorage.getItem('accessToken');

      // For super-admin, require school selection
      const targetSchoolId = schoolId || (forDialog ? recordAttendanceSchoolId : selectedSchoolId)
      if (!targetSchoolId || targetSchoolId === 'all' || targetSchoolId === '') {
        if (forDialog) {
          setDialogClubs([])
        } else {
          setClubs([])
        }
        return
      }

      const params = new URLSearchParams()
      params.append('page', '1')
      params.append('limit', '1000') // Fetch all clubs for the school
      if (targetSchoolId && targetSchoolId !== 'all' && targetSchoolId !== '') {
        params.append('schoolId', targetSchoolId)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        let clubsArray = data?.clubs || (Array.isArray(data) ? data : [])
        
        // Additional frontend filtering to ensure only clubs from selected school are shown
        // This is a safety measure in case API doesn't filter properly
        if (targetSchoolId && targetSchoolId !== 'all' && targetSchoolId !== '') {
          clubsArray = clubsArray.filter((club: any) => {
            const clubSchoolId = typeof club.schoolId === 'object' 
              ? club.schoolId._id || club.schoolId 
              : club.schoolId;
            return clubSchoolId === targetSchoolId;
          });
        }
        
        if (forDialog) {
          setDialogClubs(clubsArray);
        } else {
          setClubs(clubsArray);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch clubs:', errorData);
        toast.error(errorData.message || 'Failed to fetch clubs');
        if (forDialog) {
          setDialogClubs([])
        } else {
          setClubs([])
        }
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Error fetching clubs');
      if (forDialog) {
        setDialogClubs([])
      } else {
        setClubs([])
      }
    }
  };

  const fetchClubMembers = async (clubId: string) => {
    try {
      if (!clubId) {
        console.warn('No club ID provided for fetching members');
        setClubMembers([]);
        return;
      }

      if (!recordAttendanceSchoolId || recordAttendanceSchoolId === 'all' || recordAttendanceSchoolId === '') {
        console.warn('No school ID provided for fetching members. School ID:', recordAttendanceSchoolId);
        toast.error('Please select a school first');
        setClubMembers([]);
        return;
      }

      // Validate that the selected club belongs to the selected school
      const club = dialogClubs.find(c => c._id === clubId);
      if (!club) {
        console.error('Selected club not found in dialog clubs list. Club ID:', clubId, 'Available clubs:', dialogClubs.map(c => c._id));
        toast.error('Selected club is not available for this school. Please select a different club.');
        setClubMembers([]);
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      params.append('schoolId', recordAttendanceSchoolId);
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance/${clubId}/students?${params.toString()}`;
      console.log('Fetching club members from:', url, 'schoolId:', recordAttendanceSchoolId, 'clubId:', clubId);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Club members response:', data);
        
        const members: ClubMember[] = Array.isArray(data)
          ? data
              .filter((m: any) => m.student != null) // Filter out any null students
              .map((m: any) => ({
                _id: m.membershipId || m._id,
                studentId: m.student || m.studentId,
                role: m.role || 'Member',
                status: m.status || 'approved'
              }))
          : [];
        
        console.log('Processed club members:', members);
        setClubMembers(members);

        // Initialize all as not present (add-only from this screen)
        const initialAttendance: { [key: string]: boolean } = {};
        members.forEach((member: ClubMember) => {
          if (member.studentId && member.studentId._id) {
            initialAttendance[member.studentId._id] = false;
          }
        });
        setCurrentAttendanceData(initialAttendance);

        if (members.length === 0) {
          toast.info('No members found for this club');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch club members:', errorData);
        const errorMessage = errorData.message || 'Failed to fetch club members';
        toast.error(errorMessage);
        setClubMembers([]);
        
        // If it's a "club not found" error, reset the club selection
        if (errorMessage.includes('not found') || errorMessage.includes('Club not found')) {
          setSelectedClub('');
          setDialogClubs([]);
          // Re-fetch clubs for the selected school
          if (recordAttendanceSchoolId) {
            fetchClubs(recordAttendanceSchoolId, true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching club members:', error);
      toast.error(error instanceof Error ? error.message : 'Error fetching club members');
      setClubMembers([]);
    }
  };

  const fetchAttendanceSessions = async (schoolId?: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');

      // For super-admin, empty string means fetch all schools
      const targetSchoolId = schoolId !== undefined ? schoolId : (selectedSchoolId === 'all' ? '' : selectedSchoolId);

      const params = new URLSearchParams({ sessions: 'true' });
      if (targetSchoolId && targetSchoolId !== 'all' && targetSchoolId !== '') {
        params.append('schoolId', targetSchoolId);
      }
      if (sessionClubFilter !== 'all') {
        params.append('clubId', sessionClubFilter);
      }
      if (debouncedSessionSearch) {
        params.append('search', debouncedSessionSearch);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceSessions(Array.isArray(data) ? data : []);
      } else {
        console.log('No attendance sessions found or failed to fetch');
        setAttendanceSessions([]);
      }
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
      setAttendanceSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceDetails = async (clubId: string, date: string, schoolId?: string) => {
    try {
      setIsLoadingDetails(true);
      const token = localStorage.getItem('accessToken');
      
      if (!clubId || !date) {
        toast.error('Club ID and date are required');
        return;
      }
      
      // Get schoolId from session or parameter
      const targetSchoolId = schoolId || (selectedSchoolId === 'all' ? '' : selectedSchoolId);

      // Format date to YYYY-MM-DD (backend expects this exact format)
      let dateStr: string;
      
      // If already in YYYY-MM-DD format, use it directly
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = date;
      } else {
        // Parse and format to YYYY-MM-DD
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          console.error('Invalid date format:', date);
          toast.error('Invalid date format');
          return;
        }
        // Format as YYYY-MM-DD (backend expects this)
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
      
      // Validate the date values
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        console.error('Invalid date values:', { year, month, day });
        toast.error('Invalid date values');
        return;
      }
      
      // Use the date directly in URL - backend expects YYYY-MM-DD format
      const params = new URLSearchParams();
      if (targetSchoolId) {
        params.append('schoolId', targetSchoolId);
      }
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance/${clubId}/${dateStr}?${params.toString()}`;
      console.log('Fetching attendance details - URL:', url, 'Date:', dateStr, 'schoolId:', targetSchoolId);
      console.log('Fetching attendance details from:', url, 'Original date:', date, 'Formatted:', dateStr);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('=== Attendance Details Response ===');
        console.log('Full response:', JSON.stringify(responseData, null, 2));
        
        // Handle different response formats
        const data = responseData.data || responseData;
        
        console.log('Processed data:', data);
        console.log('Students array:', data.students);
        console.log('Students count:', data.students?.length || 0);
        console.log('Is students array?', Array.isArray(data.students));
        console.log('Summary stats from backend:', {
          totalMembers: data.totalMembers,
          presentCount: data.presentCount,
          absentCount: data.absentCount,
          excusedCount: data.excusedCount,
          lateCount: data.lateCount,
          attendanceRate: data.attendanceRate
        });
        
        // Log each student's structure
        if (data.students && Array.isArray(data.students)) {
          console.log(`Found ${data.students.length} students in response`);
          data.students.forEach((item: any, idx: number) => {
            const student = item.student || item.studentId;
            const status = item.attendance?.status || item.status;
            console.log(`Student ${idx + 1}:`, {
              hasStudent: !!item.student,
              hasStudentId: !!item.studentId,
              studentName: student?.firstName || 'N/A',
              role: item.role,
              hasAttendance: !!item.attendance,
              attendanceStatus: item.attendance?.status,
              itemStatus: item.status,
              finalStatus: status
            });
          });
        } else {
          console.error('Students array is missing or not an array!', {
            students: data.students,
            type: typeof data.students,
            isArray: Array.isArray(data.students)
          });
        }
        
        setViewSessionDetails(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        toast.error(errorData.message || 'Failed to fetch attendance details');
        setViewSessionDetails(null);
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch attendance details');
      setViewSessionDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewDetails = (session: AttendanceSession) => {
    setViewSessionDetails(null);
    setIsViewDialogOpen(true);
    // Get schoolId from the session's club or use selectedSchoolId
    const sessionSchoolId = (session as any).schoolId || (selectedSchoolId === 'all' ? '' : selectedSchoolId);
    fetchAttendanceDetails(session.clubId, session.date, sessionSchoolId);
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setCurrentAttendanceData(prev => ({
      ...prev,
      [studentId]: isPresent
    }));
  };

  const handleMarkAllPresent = () => {
    const allPresent: { [key: string]: boolean } = {};
    clubMembers.forEach(member => {
      allPresent[member.studentId._id] = true;
    });
    setCurrentAttendanceData(allPresent);
  };

  const handleMarkAllAbsent = () => {
    const allAbsent: { [key: string]: boolean } = {};
    clubMembers.forEach(member => {
      allAbsent[member.studentId._id] = false;
    });
    setCurrentAttendanceData(allAbsent);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClub || clubMembers.length === 0) {
      toast.error('Please select a club with members');
      return;
    }

    if (attendanceType === 'event' && !selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    if (attendanceType === 'meeting' && !selectedDate) {
      toast.error('Please select a meeting date');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || localStorage.getItem('user') || '{}');
      const markedBy = userInfo._id || userInfo.id || userInfo.userId;

      // Determine the date to use - ALWAYS ensure it's in YYYY-MM-DD format
      let attendanceDate: string;
      
      if (attendanceType === 'event' && selectedEvent) {
        // For event attendance, use event start date
        const event = events.find(e => e._id === selectedEvent);
        if (!event || !event.startDate) {
          toast.error('Event date not found');
          return;
        }
        // Parse event date and format as YYYY-MM-DD
        const eventDate = new Date(event.startDate);
        if (isNaN(eventDate.getTime())) {
          toast.error('Invalid event date format');
          return;
        }
        // Format as YYYY-MM-DD (this is what backend expects)
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        attendanceDate = `${year}-${month}-${day}`;
      } else if (attendanceType === 'meeting') {
        // For meeting attendance, use selected date from calendar
        if (!selectedDate) {
          toast.error('Please select a meeting date');
          return;
        }
        // Calendar input already provides YYYY-MM-DD format, but ensure it's correct
        if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          attendanceDate = selectedDate;
        } else {
          // Parse and format to YYYY-MM-DD if not already in correct format
          const parsedDate = new Date(selectedDate);
          if (isNaN(parsedDate.getTime())) {
            toast.error('Invalid date format. Please select a valid date.');
            return;
          }
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          attendanceDate = `${year}-${month}-${day}`;
        }
      } else {
        toast.error('Please select attendance type');
        return;
      }

      // Final validation - ensure date is exactly YYYY-MM-DD
      if (!attendanceDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        toast.error('Invalid date format. Expected: YYYY-MM-DD');
        return;
      }
      
      console.log('Using attendance date:', attendanceDate, 'Type:', attendanceType);

      // One request per student using club attendance endpoint (add/upsert per backend rules)
      for (const member of clubMembers) {
        const studentId = member.studentId._id;
        const status = currentAttendanceData[studentId] ? 'present' : 'absent';
        const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            clubId: selectedClub,
            attendance: [{
              studentId,
              status,
              notes: ''
            }],
            date: attendanceDate,
            schoolId: recordAttendanceSchoolId,
            eventId: attendanceType === 'event' ? selectedEvent : undefined
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to record one or more attendance entries');
        }
      }

      toast.success('Attendance recorded successfully');
      setIsNewSessionDialogOpen(false);
      fetchAttendanceSessions(selectedSchoolId === 'all' ? '' : selectedSchoolId);

      // Reset form
      setRecordAttendanceSchoolId('');
      setSelectedClub('');
      setAttendanceType(null);
      setSelectedEvent('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      const resetAttendance: { [key: string]: boolean } = {};
      clubMembers.forEach(member => {
        if (member.studentId?._id) {
          resetAttendance[member.studentId._id] = false;
        }
      });
      setCurrentAttendanceData(resetAttendance);
      setClubMembers([]);
      setEvents([]);
      setDialogClubs([]);
    } catch (error) {
      console.error('Error recording attendance:', error);
      const message = error instanceof Error ? error.message : 'Error recording attendance';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = clubMembers.filter(member =>
    `${member.studentId.firstName} ${member.studentId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.studentId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.studentId.gradeLevel && member.studentId.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'President': 'bg-red-100 text-red-800',
      'Vice President': 'bg-orange-100 text-orange-800',
      'Secretary': 'bg-blue-100 text-blue-800',
      'Treasurer': 'bg-green-100 text-green-800',
      'Member': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors['Member'];
  };

  const getAttendanceRate = () => {
    const presentCount = Object.values(currentAttendanceData).filter(Boolean).length;
    return clubMembers.length > 0 ? Math.round((presentCount / clubMembers.length) * 100) : 0;
  };

  const openEditSession = async (session: AttendanceSession) => {
    try {
      setEditSession(session);
      setIsEditDialogOpen(true);
      setIsEditLoading(true);

      const token = localStorage.getItem('accessToken');
      
      // Get schoolId from session
      const sessionSchoolId = (session as any).schoolId || (selectedSchoolId === 'all' ? '' : selectedSchoolId);
      
      // Set recordAttendanceSchoolId for member fetching
      if (sessionSchoolId && sessionSchoolId !== 'all' && sessionSchoolId !== '') {
        setRecordAttendanceSchoolId(sessionSchoolId);
      }

      // Load members for this club - pass schoolId as query parameter
      const params = new URLSearchParams();
      if (sessionSchoolId && sessionSchoolId !== 'all' && sessionSchoolId !== '') {
        params.append('schoolId', sessionSchoolId);
      }
      const membersUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance/${session.clubId}/students?${params.toString()}`;
      console.log('Loading members for edit session:', membersUrl, 'schoolId:', sessionSchoolId);
      
      const membersRes = await fetch(membersUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let members: ClubMember[] = [];
      if (membersRes.ok) {
        const raw = await membersRes.json();
        members = Array.isArray(raw)
          ? raw
              .filter((m: any) => m.student != null) // Filter out any null students
              .map((m: any) => ({
                _id: m.membershipId || m._id,
                studentId: m.student || m.studentId,
                role: m.role || 'Member',
                status: m.status || 'approved'
              }))
          : [];
        setClubMembers(members);
      } else {
        const errorData = await membersRes.json().catch(() => ({}));
        console.error('Failed to fetch members for edit:', errorData);
        toast.error(errorData.message || 'Failed to fetch club members');
        setClubMembers([]);
      }

      // Load existing attendance for that date - use correct endpoint
      const attendanceParams = new URLSearchParams();
      attendanceParams.append('date', session.date);
      if (sessionSchoolId && sessionSchoolId !== 'all' && sessionSchoolId !== '') {
        attendanceParams.append('schoolId', sessionSchoolId);
      }
      const attendanceUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance/${session.clubId}/${session.date}?${attendanceParams.toString()}`;
      console.log('Loading attendance details for edit:', attendanceUrl);

      const attendanceRes = await fetch(attendanceUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const attendance = attendanceRes.ok ? await attendanceRes.json() : null;
      const statusMap = new Map<string, string>();
      
      // Handle the new response format from getAttendanceSessionDetails
      if (attendance && attendance.students && Array.isArray(attendance.students)) {
        attendance.students.forEach((studentData: any) => {
          const studentId = studentData.student?._id || studentData.studentId?._id;
          const status = studentData.attendance?.status || studentData.status;
          if (studentId && status) {
            statusMap.set(String(studentId), status);
          }
        });
      } else if (Array.isArray(attendance)) {
        // Fallback to old format if needed
        attendance.forEach((rec: any) => {
          const sid = typeof rec.studentId === 'object' && rec.studentId
            ? rec.studentId._id
            : rec.studentId;
          if (sid) statusMap.set(String(sid), rec.status);
        });
      }

      const initial: { [key: string]: boolean } = {};
      members.forEach(member => {
        const sid = member.studentId?._id;
        if (sid) {
          const status = statusMap.get(String(sid));
          initial[sid] = status === 'present';
        }
      });
      setCurrentAttendanceData(initial);
      setSelectedClub(session.clubId);
      setSelectedDate(session.date);
    } catch (error) {
      console.error('Error loading session for edit:', error);
      toast.error('Failed to load attendance session for editing');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleUpdateSessionAttendance = async () => {
    if (!editSession || clubMembers.length === 0) {
      toast.error('No session or members to update');
      return;
    }

    try {
      setIsUpdatingSession(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Get schoolId from session or selectedSchoolId
      const sessionSchoolId = (editSession as any).schoolId || recordAttendanceSchoolId || (selectedSchoolId === 'all' ? '' : selectedSchoolId);
      
      if (!sessionSchoolId || sessionSchoolId === 'all' || sessionSchoolId === '') {
        toast.error('School ID is required to update attendance');
        return;
      }

      // First, fetch existing attendance records to get their IDs - use correct endpoint
      const attendanceParams = new URLSearchParams();
      attendanceParams.append('date', editSession.date);
      if (sessionSchoolId) {
        attendanceParams.append('schoolId', sessionSchoolId);
      }
      const attendanceUrl = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance/${editSession.clubId}/${editSession.date}?${attendanceParams.toString()}`;
      console.log('Fetching existing attendance for update:', attendanceUrl);

      const attendanceRes = await fetch(attendanceUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const attendanceDetails = attendanceRes.ok ? await attendanceRes.json() : null;
      const attendanceMap = new Map();

      // Handle the new response format from getAttendanceSessionDetails
      if (attendanceDetails && attendanceDetails.students && Array.isArray(attendanceDetails.students)) {
        attendanceDetails.students.forEach((studentData: any) => {
          const studentId = studentData.student?._id || studentData.studentId?._id;
          const attendanceId = studentData.attendance?._id;
          if (studentId && attendanceId) {
            attendanceMap.set(String(studentId), attendanceId);
          }
        });
      } else if (Array.isArray(attendanceDetails)) {
        // Fallback to old format if needed
        attendanceDetails.forEach((rec: any) => {
          const sid = typeof rec.studentId === 'object' ? rec.studentId._id : rec.studentId;
          if (sid) attendanceMap.set(String(sid), rec._id);
        });
      }
      
      // Prepare the update payload with attendance record IDs
      const attendancePayload = {
        clubId: editSession.clubId,
        date: editSession.date,
        schoolId: sessionSchoolId,
        attendance: clubMembers.map(member => {
          const studentId = member.studentId?._id;
          if (!studentId) return null;
          return {
            _id: attendanceMap.get(String(studentId)),
            studentId: studentId,
            status: currentAttendanceData[studentId] ? 'present' : 'absent',
            notes: ''
          };
        }).filter(Boolean) // Remove any null entries
      };

      console.log('Updating attendance with payload:', attendancePayload);

      // Use PUT for updates to be more RESTful
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/attendance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendancePayload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update attendance');
      }

      toast.success('Attendance updated successfully');
      setIsEditDialogOpen(false);
      setEditSession(null);
      setRecordAttendanceSchoolId(''); // Reset
      fetchAttendanceSessions(selectedSchoolId === 'all' ? '' : selectedSchoolId);
    } catch (error) {
      console.error('Error updating attendance:', error);
      const message = error instanceof Error ? error.message : 'Error updating attendance';
      toast.error(message);
    } finally {
      setIsUpdatingSession(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Club Attendance Management</h1>
            <p className="text-muted-foreground">
              Track and manage club meeting attendance
            </p>
          </div>
        </div>
        <Dialog open={isNewSessionDialogOpen} onOpenChange={(open) => {
          setIsNewSessionDialogOpen(open);
          // Reset dialog state when closing
          if (!open) {
            setRecordAttendanceSchoolId('');
            setSelectedClub('');
            setAttendanceType(null);
            setSelectedEvent('');
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setCurrentAttendanceData({});
            setClubMembers([]);
            setEvents([]);
            setDialogClubs([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Clock className="mr-2 h-4 w-4" />
              Record Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Record Club Attendance</DialogTitle>
              <DialogDescription>
                Mark attendance for club events or meetings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Step 1: Select School */}
              {!recordAttendanceSchoolId && (
                <div className="space-y-2">
                  <Label>Select School <span className="text-red-600">*</span></Label>
                  <Select 
                    value={recordAttendanceSchoolId} 
                    onValueChange={(value) => {
                      console.log('School selected in dialog:', value);
                      setRecordAttendanceSchoolId(value)
                      setSelectedClub('')
                      setAttendanceType(null)
                      setSelectedEvent('')
                      setCurrentAttendanceData({})
                      setClubMembers([])
                      setEvents([])
                      // Clear clubs first, then fetch only clubs for selected school
                      setDialogClubs([])
                      // Fetch clubs specifically for the dialog
                      if (value && value !== 'all' && value !== '') {
                        fetchClubs(value, true)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Please Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Step 2: Select Club */}
              {recordAttendanceSchoolId && !selectedClub && (
                <div className="space-y-2">
                  <Label>Select Club <span className="text-red-600">*</span></Label>
                  {dialogClubs.length > 0 ? (
                    <Select 
                      value={selectedClub} 
                      onValueChange={(value) => {
                        console.log('Club selected in dialog:', value, 'for school:', recordAttendanceSchoolId);
                        setSelectedClub(value)
                        setAttendanceType(null)
                        setSelectedEvent('')
                        setCurrentAttendanceData({})
                        setClubMembers([])
                        setEvents([])
                      }}
                      disabled={!recordAttendanceSchoolId || recordAttendanceSchoolId === 'all' || recordAttendanceSchoolId === ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={recordAttendanceSchoolId ? "Choose a club" : "Please select a school first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dialogClubs.map(club => (
                          <SelectItem key={club._id} value={club._id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground border rounded-md">
                      <p>No clubs found for this school</p>
                      <p className="text-xs mt-1">Please select a different school or create a club first</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Select Attendance Type */}
              {selectedClub && !attendanceType && (
                <div className="space-y-4">
                  <Label>Select Attendance Type <span className="text-red-600">*</span></Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={async () => {
                        setAttendanceType('event');
                        setSelectedEvent('');
                        setCurrentAttendanceData({});
                        setClubMembers([]);
                        await fetchClubEvents(selectedClub);
                      }}
                    >
                      <Calendar className="h-6 w-6" />
                      <span className="font-semibold">Event Attendance</span>
                      <span className="text-xs text-muted-foreground">Mark attendance for club events</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        setAttendanceType('meeting');
                        fetchClubMembers(selectedClub);
                      }}
                    >
                      <Clock className="h-6 w-6" />
                      <span className="font-semibold">Meeting Attendance</span>
                      <span className="text-xs text-muted-foreground">Mark attendance for regular meetings</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3a: Event Selection (for Event Attendance) */}
              {selectedClub && attendanceType === 'event' && !selectedEvent && (
                <div className="space-y-2">
                  <Label>Select Event <span className="text-red-600">*</span></Label>
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Loading events...</span>
                    </div>
                  ) : events.length > 0 ? (
                    <Select 
                      value={selectedEvent} 
                      onValueChange={async (value) => {
                        console.log('Event selection changed to:', value);
                        setSelectedEvent(value);
                        // Immediately fetch members when event is selected
                        if (selectedClub) {
                          console.log('Fetching members for club:', selectedClub, 'after event selection');
                          // Use setTimeout to ensure state is updated
                          setTimeout(() => {
                            fetchClubMembers(selectedClub);
                          }, 50);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map(event => (
                          <SelectItem key={event._id} value={event._id}>
                            {event.name} ({new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No events found for this club
                    </div>
                  )}
                </div>
              )}

              {/* Step 3b: Date Selection (for Meeting Attendance) */}
              {selectedClub && attendanceType === 'meeting' && (
                <div className="space-y-2">
                  <Label>Meeting Date <span className="text-red-600">*</span></Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const dateValue = e.target.value; // This is already in YYYY-MM-DD format from date input
                      if (dateValue && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        setSelectedDate(dateValue); // Calendar input already provides YYYY-MM-DD format
                        // Fetch members when date is selected
                        if (selectedClub) {
                          fetchClubMembers(selectedClub);
                        }
                      }
                    }}
                  />
                  {selectedClubObj?.meetingSchedule?.days && (
                    <p className="text-xs text-muted-foreground">
                      Regular meeting days: {selectedClubObj.meetingSchedule.days.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Back Button */}
              {(attendanceType || selectedEvent) && (
                <div className="flex gap-2">
                  {selectedEvent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent('');
                        setCurrentAttendanceData({});
                        setClubMembers([]);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Events
                    </Button>
                  )}
                  {attendanceType && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAttendanceType(null);
                        setSelectedEvent('');
                        setCurrentAttendanceData({});
                        setClubMembers([]);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Type Selection
                    </Button>
                  )}
                  {selectedClub && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClub('');
                        setAttendanceType(null);
                        setSelectedEvent('');
                        setCurrentAttendanceData({});
                        setClubMembers([]);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Club Selection
                    </Button>
                  )}
                  {recordAttendanceSchoolId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRecordAttendanceSchoolId('');
                        setSelectedClub('');
                        setAttendanceType(null);
                        setSelectedEvent('');
                        setCurrentAttendanceData({});
                        setClubMembers([]);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to School Selection
                    </Button>
                  )}
                </div>
              )}

              {/* Attendance Summary */}
              {clubMembers.length > 0 && ((attendanceType === 'event' && selectedEvent) || (attendanceType === 'meeting' && selectedDate)) && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      Attendance Summary{selectedClubObj ? ` • ${selectedClubObj.name}` : ''}
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleMarkAllPresent}>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        All Present
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleMarkAllAbsent}>
                        <XCircle className="mr-1 h-4 w-4" />
                        All Absent
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Total Members: <span className="font-semibold">{clubMembers.length}</span></div>
                    <div>Present: <span className="font-semibold text-green-600">
                      {Object.values(currentAttendanceData).filter(Boolean).length}
                    </span></div>
                    <div>Attendance Rate: <span className="font-semibold">{getAttendanceRate()}%</span></div>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Members List */}
              {((attendanceType === 'event' && selectedEvent && clubMembers.length > 0) || (attendanceType === 'meeting' && selectedDate && clubMembers.length > 0)) && filteredMembers.length > 0 ? (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Present</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member._id}>
                          <TableCell>
                            <Checkbox
                              checked={currentAttendanceData[member.studentId._id] || false}
                              onCheckedChange={(checked) =>
                                handleAttendanceChange(member.studentId._id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.studentId.firstName} {member.studentId.lastName}
                          </TableCell>
                          <TableCell>
                            {member.studentId.class || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{member.studentId.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No members found</h3>
                  <p className="text-muted-foreground">
                    {selectedClub ? 'No members match your search criteria' : 'Please select a club first'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsNewSessionDialogOpen(false);
                // Reset dialog state when closing
                setRecordAttendanceSchoolId('');
                setSelectedClub('');
                setAttendanceType(null);
                setSelectedEvent('');
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setCurrentAttendanceData({});
                setClubMembers([]);
                setEvents([]);
                setDialogClubs([]);
              }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitAttendance} 
                disabled={
                  clubMembers.length === 0 || 
                  isSubmitting || 
                  !selectedClub ||
                  (attendanceType === 'event' && !selectedEvent) ||
                  (attendanceType === 'meeting' && !selectedDate)
                }
              >
                {isSubmitting ? (
                  <>
                    <UserCheck className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Record / Update Attendance
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* School Selection Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="schoolFilter" className="whitespace-nowrap">Filter by School:</Label>
            <Select 
              value={selectedSchoolId} 
              onValueChange={(value) => {
                setSelectedSchoolId(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school._id} value={school._id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Previous attendance sessions and records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by club name..."
                value={sessionSearchTerm}
                onChange={(e) => setSessionSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {/* <Select 
              value={sessionClubFilter} 
              onValueChange={setSessionClubFilter}
              disabled={selectedSchoolId === 'all' || selectedSchoolId === ''}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map(club => (
                  <SelectItem key={club._id} value={club._id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Members</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  {/* <TableHead>Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading attendance history...</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : totalSessions > 0 ? (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Members</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  {/* <TableHead>Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((session) => {
                  // Get school name from session data or lookup
                  const sessionSchoolId = (session as any).schoolId;
                  const sessionSchoolName = (session as any).schoolName;
                  const school = sessionSchoolId ? schools.find(s => s._id === sessionSchoolId) : null;
                  const displaySchoolName = sessionSchoolName || school?.name || 'N/A';
                  
                  return (
                  <TableRow key={session._id}>
                    <TableCell className="font-medium">
                      {session.clubName}
                    </TableCell>
                    <TableCell>
                      {displaySchoolName}
                    </TableCell>
                    <TableCell>
                      {new Date(session.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{session.totalMembers}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-600">
                        <UserCheck className="h-4 w-4" />
                        {session.presentCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-red-600">
                        <UserX className="h-4 w-4" />
                        {session.absentCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${session.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{session.attendanceRate}%</span>
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(session)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell> */}
                  </TableRow>
                )
                })}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPagesSessions) }, (_, i) => {
                    let pageNum;
                    if (totalPagesSessions <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPagesSessions - 2) {
                      pageNum = totalPagesSessions - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPagesSessions}
                >
                  Next
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSessions)} of {totalSessions} sessions
              </div>
            </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No attendance records
              </h3>
              <p className="text-muted-foreground">
                Start recording attendance for club meetings to see history here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Attendance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>
              {editSession
                ? `Update attendance for ${editSession.clubName} on ${new Date(
                  editSession.date
                ).toLocaleDateString()}`
                : 'Update attendance for this session.'}
            </DialogDescription>
          </DialogHeader>
          {isEditLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5 animate-spin" />
                <span>Loading attendance...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {clubMembers.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Attendance Summary</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleMarkAllPresent}>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        All Present
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleMarkAllAbsent}>
                        <XCircle className="mr-1 h-4 w-4" />
                        All Absent
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>Total Members: <span className="font-semibold">{clubMembers.length}</span></div>
                    <div>Present: <span className="font-semibold text-green-600">
                      {Object.values(currentAttendanceData).filter(Boolean).length}
                    </span></div>
                    <div>Attendance Rate: <span className="font-semibold">{getAttendanceRate()}%</span></div>
                  </div>
                </div>
              )}

              {clubMembers.length > 0 ? (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Present</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clubMembers.map(member => (
                        <TableRow key={member._id}>
                          <TableCell>
                            <Checkbox
                              checked={currentAttendanceData[member.studentId._id] || false}
                              onCheckedChange={(checked) =>
                                handleAttendanceChange(member.studentId._id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.studentId.firstName} {member.studentId.lastName}
                          </TableCell>
                          <TableCell>{member.studentId.class || member.studentId.class || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No members found</h3>
                  <p className="text-muted-foreground">No members were found for this club.</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditSession(null);
              }}
              disabled={isUpdatingSession}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSessionAttendance}
              disabled={isUpdatingSession || clubMembers.length === 0}
            >
              {isUpdatingSession ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Update Attendance
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Attendance Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {viewSessionDetails?.club?.name && viewSessionDetails?.date
                ? `Attendance details for ${viewSessionDetails.club.name} on ${new Date(viewSessionDetails.date).toLocaleDateString()}`
                : 'View attendance details'}
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading details...</span>
              </div>
            </div>
          ) : viewSessionDetails ? (
            <div className="space-y-6 py-4">
              {/* Club Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Club Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Club Name:</span>
                    <span className="ml-2 font-medium">{viewSessionDetails.club?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Club Type:</span>
                    <span className="ml-2 font-medium">{viewSessionDetails.club?.type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Meeting Date:</span>
                    <span className="ml-2 font-medium">
                      {viewSessionDetails.date ? new Date(viewSessionDetails.date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {viewSessionDetails.club?.advisor && (
                    <div>
                      <span className="text-muted-foreground">Advisor:</span>
                      <span className="ml-2 font-medium">
                        {viewSessionDetails.club.advisor.firstName} {viewSessionDetails.club.advisor.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {(() => {
                // Always calculate stats from students array to ensure accuracy
                const students = Array.isArray(viewSessionDetails.students) ? viewSessionDetails.students : [];
                console.log('=== Summary Calculation ===');
                console.log('Students array:', students);
                console.log('Students array length:', students.length);
                
                if (students.length === 0) {
                  console.warn('No students found in response!');
                  console.log('Full viewSessionDetails:', viewSessionDetails);
                }
                
                // Calculate from students array - check both attendance.status and item.status
                const presentCount = students.filter((item: any) => {
                  // Backend sets item.status to attendance.status or 'not_recorded'
                  const status = item.attendance?.status || item.status || '';
                  const isPresent = status === 'present';
                  if (isPresent) {
                    console.log('Found present student:', item.student?.firstName || item.studentId?.firstName);
                  }
                  return isPresent;
                }).length;
                
                const absentCount = students.filter((item: any) => {
                  const status = item.attendance?.status || item.status || '';
                  return status === 'absent';
                }).length;
                
                const excusedCount = students.filter((item: any) => {
                  const status = item.attendance?.status || item.status || '';
                  return status === 'excused';
                }).length;
                
                const lateCount = students.filter((item: any) => {
                  const status = item.attendance?.status || item.status || '';
                  return status === 'late';
                }).length;
                
                const notRecordedCount = students.filter((item: any) => {
                  const status = item.attendance?.status || item.status || '';
                  return !status || status === 'not_recorded';
                }).length;
                
                const totalMembers = students.length || viewSessionDetails.totalMembers || 0;
                const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;
                
                console.log('=== Calculated Summary Stats ===');
                console.log({
                  totalMembers,
                  presentCount,
                  absentCount,
                  excusedCount,
                  lateCount,
                  notRecordedCount,
                  attendanceRate,
                  studentsArrayLength: students.length
                });
                
                // Log each student's status for debugging
                students.forEach((item: any, idx: number) => {
                  const status = item.attendance?.status || item.status || 'not_recorded';
                  console.log(`Student ${idx + 1}:`, {
                    name: item.student?.firstName || item.studentId?.firstName || 'Unknown',
                    status,
                    hasAttendance: !!item.attendance,
                    attendanceStatus: item.attendance?.status,
                    itemStatus: item.status
                  });
                });
                
                return (
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total Members</div>
                        <div className="text-2xl font-bold">{totalMembers}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Present</div>
                        <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Absent</div>
                        <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Attendance Rate</div>
                        <div className="text-2xl font-bold">{attendanceRate}%</div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* Students List */}
              <div>
                <h3 className="font-semibold mb-3">
                  Student Attendance 
                  {viewSessionDetails.students && Array.isArray(viewSessionDetails.students) && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({viewSessionDetails.students.length} {viewSessionDetails.students.length === 1 ? 'student' : 'students'})
                    </span>
                  )}
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Grade/Class</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewSessionDetails.students && Array.isArray(viewSessionDetails.students) && viewSessionDetails.students.length > 0 ? (
                        viewSessionDetails.students.map((item: any, index: number) => {
                          // Handle different possible structures
                          const student = item.student || item.studentId || (typeof item === 'object' && item.firstName ? item : null);
                          const attendance = item.attendance;
                          
                          // Get status from attendance object first, then fallback to item.status
                          // Backend sets status to 'not_recorded' if no attendance exists
                          const status = attendance?.status || item.status || 'not_recorded';
                          
                          console.log('Rendering student row:', {
                            item,
                            student,
                            attendance,
                            status,
                            studentName: student?.firstName || 'N/A'
                          });
                          
                          // Skip if student data is missing
                          if (!student || (!student.firstName && !student.lastName)) {
                            console.warn('Skipping student with missing data:', item);
                            return null;
                          }
                          
                          return (
                            <TableRow key={item.student?._id || item.studentId?._id || index}>
                              <TableCell className="font-medium">
                                {student.firstName || ''} {student.lastName || ''}
                              </TableCell>
                              <TableCell>{student.studentId || 'N/A'}</TableCell>
                              <TableCell>{student.gradeLevel || student.class || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.role || 'Member'}</Badge>
                              </TableCell>
                              <TableCell>
                                {status === 'present' && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Present
                                  </Badge>
                                )}
                                {status === 'absent' && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <UserX className="h-3 w-3 mr-1" />
                                    Absent
                                  </Badge>
                                )}
                                {status === 'excused' && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    Excused
                                  </Badge>
                                )}
                                {status === 'late' && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    Late
                                  </Badge>
                                )}
                                {(status === 'not_recorded' || !status) && (
                                  <Badge variant="outline">Not Recorded</Badge>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {attendance?.notes || item.notes || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        }).filter(Boolean) // Remove any null entries
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {viewSessionDetails.students === undefined || viewSessionDetails.students === null
                              ? 'Loading student data...'
                              : viewSessionDetails.students.length === 0
                              ? 'No students found for this club'
                              : 'No students found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No details available
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubAttendancePage;