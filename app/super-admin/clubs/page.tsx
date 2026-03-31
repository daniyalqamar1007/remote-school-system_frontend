'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, Calendar, MapPin, Eye, Edit, Trash2, Plus,
  Search, Download, Settings, Loader2, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TeacherSelect } from '@/components/sports/TeacherSelect';
import { StudentSelect } from '@/components/sports/StudentSelect';
import { TagInput } from '@/components/sports/TagInput';

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
  };
  schoolId: string;
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
  };
  memberCount?: number;
  isActive: boolean;
  createdAt: string;
  participationRate?: number;
  attendanceRate?: number;
  studentRoles?: {
    studentId: string | {
      _id?: string;
      firstName: string;
      lastName: string;
      email?: string;
      gradeLevel?: string;
      studentId?: string;
    };
    role: string;
  }[];
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
}

const AdminClubsPage = () => {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [clubTypes, setClubTypes] = useState<string[]>([]);
  const [studentRoles, setStudentRoles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClubs, setTotalClubs] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Super-admin school selection
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  // School selection for create dialog (separate from filter)
  const [createDialogSchoolId, setCreateDialogSchoolId] = useState<string>('');
  // School ID for edit dialog (extracted from selected club)
  const [editDialogSchoolId, setEditDialogSchoolId] = useState<string>('');

  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    type: '',
    advisorId: '',
    location: '',
    maxMembers: '',
    requiresApproval: true,
    activities: [] as string[],
    contactEmail: '',
    meetingDays: [] as { day: string; startTime: string; endTime: string; description: string }[],
    meetingFrequency: 'Weekly'
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    type?: string;
    advisorId?: string;
    contactEmail?: string;
    meetingDays?: string;
    [key: string]: string | undefined;
  }>({});

  // Fetch schools for super-admin
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          const schoolsList = data?.data?.schools || data?.schools || [];
          setSchools(schoolsList);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchClubTypes();
    fetchStudentRoles();
    // Fetch all clubs by default on mount
    fetchClubs(searchTerm, filterType, currentPage, pageSize);
  }, []);

  const fetchClubTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/types`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const types = Array.isArray(data) ? data.map((t: any) => t.name) : [];
        setClubTypes(types.length > 0 ? types : ['Academic', 'Sports', 'Arts', 'Service', 'STEM', 'Cultural', 'Language', 'Other']);
      } else {
        // Fallback to default types if API fails
        setClubTypes(['Academic', 'Sports', 'Arts', 'Service', 'STEM', 'Cultural', 'Language', 'Other']);
      }
    } catch (error) {
      console.error('Error fetching club types:', error);
      // Fallback to default types
      setClubTypes(['Academic', 'Sports', 'Arts', 'Service', 'STEM', 'Cultural', 'Language', 'Other']);
    }
  };

  const fetchStudentRoles = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/student-roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const roles = Array.isArray(data) ? data.map((r: any) => r.name) : [];
        setStudentRoles(roles.length > 0 ? roles : ['President', 'Vice President', 'Secretary', 'Treasurer', 'Member']);
      } else {
        // Fallback to default roles if API fails
        setStudentRoles(['President', 'Vice President', 'Secretary', 'Treasurer', 'Member']);
      }
    } catch (error) {
      console.error('Error fetching student roles:', error);
      // Fallback to default roles
      setStudentRoles(['President', 'Vice President', 'Secretary', 'Treasurer', 'Member']);
    }
  };

  useEffect(() => {
    filterAndSortClubs();
  }, [clubs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, selectedSchoolId]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchClubs(searchTerm, filterType, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchClubs(searchTerm, filterType, 1, newSize);
  };

  const fetchClubs = async (search: string = '', type: string = 'all', page: number = 1, limit: number = 10) => {
    try {
      setIsTableLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        router.push('/super-admin/login');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (type && type !== 'all') params.append('type', type);
      // Only add schoolId if a specific school is selected (not 'all')
      if (selectedSchoolId && selectedSchoolId !== 'all' && selectedSchoolId !== '') {
        params.append('schoolId', selectedSchoolId);
      }
      // If 'all' is selected, don't add schoolId - backend will return all clubs

      const queryString = params.toString();
      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs?${queryString}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        if (data.clubs) {
          setClubs(data.clubs);
          setTotalClubs(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.page || 1);
        } else {
          // Fallback for non-paginated response
          const clubsList = Array.isArray(data) ? data : [];
          setClubs(clubsList);
          setTotalClubs(clubsList.length);
          setTotalPages(1);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to fetch clubs');
        setClubs([]);
        setTotalClubs(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Error fetching clubs. Please try again.');
      setClubs([]);
      setTotalClubs(0);
      setTotalPages(1);
    } finally {
      setIsTableLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClubs(searchTerm, filterType, currentPage, pageSize);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filterType, currentPage, pageSize, selectedSchoolId]);

  const filterAndSortClubs = () => {
    // For server-side pagination, just set filtered clubs to the fetched clubs
    setFilteredClubs(clubs);
  };


  const handleCreateClub = async () => {
    // Clear previous errors
    setFormErrors({});

    const errors: typeof formErrors = {};
    let hasErrors = false;

    // Super-admin validation: school selection is required for creating clubs
    if (!createDialogSchoolId || createDialogSchoolId === 'all' || createDialogSchoolId === '') {
      toast.error('Please choose a school before creating a club');
      hasErrors = true;
    }

    // Validation
    if (!clubForm.name.trim()) {
      errors.name = 'Club name is required';
      hasErrors = true;
    }
    if (!clubForm.type) {
      errors.type = 'Club type is required';
      hasErrors = true;
    }
    if (!clubForm.advisorId) {
      errors.advisorId = 'Club advisor is required';
      hasErrors = true;
    }

    // Validate email format if provided
    if (clubForm.contactEmail && clubForm.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clubForm.contactEmail.trim())) {
        errors.contactEmail = 'Please enter a valid email address';
        hasErrors = true;
      }
    }

    if (clubForm.meetingDays.length === 0) {
      errors.meetingDays = 'Please select at least one meeting day';
      hasErrors = true;
    } else {
      // Validate that all selected days have times and descriptions
      const daysWithoutTimes = clubForm.meetingDays.filter(md => !md.startTime || !md.endTime);
      if (daysWithoutTimes.length > 0) {
        errors.meetingDays = `Please set start and end times for ${daysWithoutTimes.map(md => md.day).join(', ')}`;
        hasErrors = true;
      } else {
        const daysWithoutDescription = clubForm.meetingDays.filter(md => !md.description || !md.description.trim());
        if (daysWithoutDescription.length > 0) {
          errors.meetingDays = `Please provide meeting description/motive for ${daysWithoutDescription.map(md => md.day).join(', ')}`;
          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      setFormErrors(errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');
      const userInfoStr = localStorage.getItem('userInfo') || localStorage.getItem('user');

      if (!userInfoStr) {
        toast.error('User information not found. Please log in again.');
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      const userId = userInfo._id || userInfo.id || userInfo.userId;
      // For super-admin, use createDialogSchoolId
      const schoolId = createDialogSchoolId && createDialogSchoolId !== 'all' && createDialogSchoolId !== '' ? createDialogSchoolId : null;

      if (!userId) {
        toast.error('User ID not found. Please log in again.');
        return;
      }

      if (!schoolId || schoolId === 'all' || schoolId === '') {
        toast.error('Please choose a school before creating a club.');
        return;
      }

      const clubData = {
        name: clubForm.name.trim(),
        clubName: clubForm.name.trim(),
        description: clubForm.description.trim(),
        type: clubForm.type,
        advisorId: clubForm.advisorId,
        schoolId: schoolId,
        createdBy: userId,
        location: clubForm.location.trim() || undefined,
        maxMembers: clubForm.maxMembers ? parseInt(clubForm.maxMembers) : undefined,
        requiresApproval: clubForm.requiresApproval,
        activities: clubForm.activities,
        contactEmail: clubForm.contactEmail.trim() || undefined,
        meetingSchedule: clubForm.meetingDays.length > 0 ? {
          days: clubForm.meetingDays.map(md => md.day),
          startTime: clubForm.meetingDays[0]?.startTime || '',
          endTime: clubForm.meetingDays[0]?.endTime || '',
          frequency: clubForm.meetingFrequency,
          dayTimes: clubForm.meetingDays.reduce((acc, md) => {
            acc[md.day] = { startTime: md.startTime, endTime: md.endTime, description: md.description };
            return acc;
          }, {} as Record<string, { startTime: string; endTime: string; description: string }>)
        } : undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clubData)
      });

      let responseData: any = {};
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Error parsing response:', e);
      }

      if (response.ok && response.status >= 200 && response.status < 300) {
        // Verify that we got a valid response (club object or success message)
        if (responseData._id || responseData.id || responseData.message) {
          toast.success(responseData.message || 'Club created successfully');
          setIsCreateDialogOpen(false);
          setFormErrors({});
          setCreateDialogSchoolId('');
          resetForm();
          // Wait a bit before fetching to ensure backend has processed
          setTimeout(() => {
            fetchClubs(searchTerm, filterType, currentPage, pageSize);
          }, 500);
        } else {
          console.error('Unexpected response format:', responseData);
          toast.error('Club creation response was invalid. Please check if the club was created.');
        }
      } else {
        // Show backend error message
        const errorMessage = responseData.message || responseData.error || `Failed to create club (${response.status}). Please try again.`;
        toast.error(errorMessage);

        // Set field-specific errors if provided by backend
        if (responseData.errors) {
          setFormErrors(responseData.errors);
        } else if (response.status === 400) {
          if (errorMessage.includes('name') || errorMessage.includes('duplicate')) {
            setFormErrors({ name: errorMessage });
          }
        }
      }
    } catch (error) {
      console.error('Error creating club:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while creating the club.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClub = async (club: Club) => {
    setSelectedClub(club);
    setIsLoading(true);
    
    // Extract schoolId from club for edit dialog
    const clubSchoolId = typeof club.schoolId === 'object' ? club.schoolId._id || club.schoolId : club.schoolId;
    setEditDialogSchoolId(clubSchoolId || '');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${club._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const clubData = responseData.club; // Extract club object from response

        // Extract schoolId from clubData for edit dialog
        const clubSchoolId = typeof clubData.schoolId === 'object' 
          ? clubData.schoolId._id || clubData.schoolId 
          : clubData.schoolId || club.schoolId;
        setEditDialogSchoolId(clubSchoolId || '');

        // Map meeting days with descriptions from API response
        const meetingDays = clubData.meetingSchedule?.days ? clubData.meetingSchedule.days.map((day: string) => {
          const dayTimes = clubData.meetingSchedule?.dayTimes?.[day];

          return {
            day,
            startTime: dayTimes?.startTime || clubData.meetingSchedule?.startTime || '',
            endTime: dayTimes?.endTime || clubData.meetingSchedule?.endTime || '',
            description: dayTimes?.description || ''
          };
        }) : [];

        setClubForm({
          name: clubData.name,
          description: clubData.description || '',
          type: clubData.type,
          advisorId: typeof clubData.advisorId === 'object' ? clubData.advisorId._id || '' : clubData.advisorId,
          location: clubData.location || '',
          maxMembers: clubData.maxMembers?.toString() || '',
          requiresApproval: clubData.requiresApproval,
          activities: clubData.activities || [],
          contactEmail: clubData.contactEmail || '',
          meetingDays: meetingDays,
          meetingFrequency: clubData.meetingSchedule?.frequency || 'Weekly'
        });
      } else {
        // Fallback to original club data if API call fails
        const meetingDays = club.meetingSchedule?.days ? club.meetingSchedule.days.map(day => ({
          day,
          startTime: (club.meetingSchedule as any)?.dayTimes?.[day]?.startTime || club.meetingSchedule?.startTime || '',
          endTime: (club.meetingSchedule as any)?.dayTimes?.[day]?.endTime || club.meetingSchedule?.endTime || '',
          description: (club.meetingSchedule as any)?.dayTimes?.[day]?.description || (club.meetingSchedule as any)?.dayDescriptions?.[day] || ''
        })) : [];

        setClubForm({
          name: club.name,
          description: club.description || '',
          type: club.type,
          advisorId: typeof club.advisorId === 'object' ? club.advisorId._id || '' : club.advisorId,
          location: club.location || '',
          maxMembers: club.maxMembers?.toString() || '',
          requiresApproval: club.requiresApproval,
          activities: club.activities || [],
          contactEmail: club.contactEmail || '',
          meetingDays: meetingDays,
          meetingFrequency: club.meetingSchedule?.frequency || 'Weekly'
        });
      }
    } catch (error) {
      console.error('Error fetching club details:', error);
      toast.error('Failed to load club details');
      // Fallback to original club data
      const meetingDays = club.meetingSchedule?.days ? club.meetingSchedule.days.map(day => ({
        day,
        startTime: (club.meetingSchedule as any)?.dayTimes?.[day]?.startTime || club.meetingSchedule?.startTime || '',
        endTime: (club.meetingSchedule as any)?.dayTimes?.[day]?.endTime || club.meetingSchedule?.endTime || '',
        description: (club.meetingSchedule as any)?.dayTimes?.[day]?.description || (club.meetingSchedule as any)?.dayDescriptions?.[day] || ''
      })) : [];

      setClubForm({
        name: club.name,
        description: club.description || '',
        type: club.type,
        advisorId: typeof club.advisorId === 'object' ? club.advisorId._id || '' : club.advisorId,
        location: club.location || '',
        maxMembers: club.maxMembers?.toString() || '',
        requiresApproval: club.requiresApproval,
        activities: club.activities || [],
        contactEmail: club.contactEmail || '',
        meetingDays: meetingDays,
        meetingFrequency: club.meetingSchedule?.frequency || 'Weekly'
      });
    } finally {
      setIsLoading(false);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateClub = async () => {
    if (!selectedClub) return;

    // Clear previous errors
    setFormErrors({});

    const errors: typeof formErrors = {};
    let hasErrors = false;

    // Validation
    if (!clubForm.name.trim()) {
      errors.name = 'Club name is required';
      hasErrors = true;
    }
    if (!clubForm.type) {
      errors.type = 'Club type is required';
      hasErrors = true;
    }
    if (!clubForm.advisorId) {
      errors.advisorId = 'Club advisor is required';
      hasErrors = true;
    }

    // Validate email format if provided
    if (clubForm.contactEmail && clubForm.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clubForm.contactEmail.trim())) {
        errors.contactEmail = 'Please enter a valid email address';
        hasErrors = true;
      }
    }

    if (clubForm.meetingDays.length === 0) {
      errors.meetingDays = 'Please select at least one meeting day';
      hasErrors = true;
    } else {
      // Validate that all selected days have times and descriptions
      const daysWithoutTimes = clubForm.meetingDays.filter(md => !md.startTime || !md.endTime);
      if (daysWithoutTimes.length > 0) {
        errors.meetingDays = `Please set start and end times for ${daysWithoutTimes.map(md => md.day).join(', ')}`;
        hasErrors = true;
      } else {
        const daysWithoutDescription = clubForm.meetingDays.filter(md => !md.description || !md.description.trim());
        if (daysWithoutDescription.length > 0) {
          errors.meetingDays = `Please provide meeting description/motive for ${daysWithoutDescription.map(md => md.day).join(', ')}`;
          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      setFormErrors(errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');

      const updateData = {
        name: clubForm.name.trim(),
        description: clubForm.description.trim(),
        type: clubForm.type,
        advisorId: clubForm.advisorId,
        location: clubForm.location.trim() || undefined,
        maxMembers: clubForm.maxMembers ? parseInt(clubForm.maxMembers) : undefined,
        requiresApproval: clubForm.requiresApproval,
        activities: clubForm.activities,
        contactEmail: clubForm.contactEmail.trim() || undefined,
        meetingSchedule: clubForm.meetingDays.length > 0 ? {
          days: clubForm.meetingDays.map(md => md.day),
          startTime: clubForm.meetingDays[0]?.startTime || '',
          endTime: clubForm.meetingDays[0]?.endTime || '',
          frequency: clubForm.meetingFrequency,
          dayTimes: clubForm.meetingDays.reduce((acc, md) => {
            acc[md.day] = { startTime: md.startTime, endTime: md.endTime, description: md.description };
            return acc;
          }, {} as Record<string, { startTime: string; endTime: string; description: string }>)
        } : undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${selectedClub._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      let responseData: any = {};
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Error parsing response:', e);
      }

      if (response.ok && response.status >= 200 && response.status < 300) {
        // Verify that we got a valid response
        if (responseData._id || responseData.id || responseData.message || response.status === 200) {
          toast.success(responseData.message || 'Club updated successfully');
          setIsEditDialogOpen(false);
          setSelectedClub(null);
          setFormErrors({});
          resetForm();
          // Wait a bit before fetching to ensure backend has processed
          setTimeout(() => {
            fetchClubs();
          }, 500);
        } else {
          console.error('Unexpected response format:', responseData);
          toast.error('Club update response was invalid. Please check if the club was updated.');
        }
      } else {
        // Show backend error message
        const errorMessage = responseData.message || responseData.error || `Failed to update club (${response.status}). Please try again.`;
        toast.error(errorMessage);

        // Set field-specific errors if provided by backend
        if (responseData.errors) {
          setFormErrors(responseData.errors);
        } else if (response.status === 400) {
          if (errorMessage.includes('name') || errorMessage.includes('duplicate')) {
            setFormErrors({ name: errorMessage });
          }
        }
      }
    } catch (error) {
      console.error('Error updating club:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while updating the club.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!selectedClub) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${selectedClub._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(responseData.message || 'Club deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedClub(null);
        fetchClubs();
      } else {
        const errorMessage = responseData.message || responseData.error || 'Failed to delete club. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while deleting the club.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setClubForm({
      name: '',
      description: '',
      type: '',
      advisorId: '',
      location: '',
      maxMembers: '',
      requiresApproval: true,
      activities: [],
      contactEmail: '',
      meetingDays: [],
      meetingFrequency: 'Weekly'
    });
    setFormErrors({});
    setCreateDialogSchoolId('');
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

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clubs Directory</h1>
          <p className="text-muted-foreground">
            Manage and monitor all school club activities
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            if (open) {
              resetForm();
              setFormErrors({});
              setCreateDialogSchoolId('');
            } else {
              resetForm();
              setFormErrors({});
              setCreateDialogSchoolId('');
            }
            setIsCreateDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Club
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
                <DialogDescription>
                  Add a new club to the school&apos;s extracurricular activities
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolId">School <span className="text-red-600">*</span></Label>
                  <Select
                    value={createDialogSchoolId}
                    onValueChange={(value) => {
                      setCreateDialogSchoolId(value);
                      // Reset advisor when school changes
                      setClubForm({ ...clubForm, advisorId: '' });
                    }}
                  >
                    <SelectTrigger className={!createDialogSchoolId || createDialogSchoolId === 'all' || createDialogSchoolId === '' ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Please choose a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!createDialogSchoolId || createDialogSchoolId === 'all' || createDialogSchoolId === '') && (
                    <p className="text-sm text-red-600">Please choose a school to create a club</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Club Name <span className="text-red-600">*</span></Label>
                    <Input
                      id="name"
                      value={clubForm.name}
                      onChange={(e) => {
                        setClubForm({ ...clubForm, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                      }}
                      placeholder="Enter club name"
                      className={formErrors.name ? 'border-red-500' : ''}
                      disabled={!createDialogSchoolId || createDialogSchoolId === 'all' || createDialogSchoolId === ''}
                    />
                    {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Club Type <span className="text-red-600">*</span></Label>
                    <Select
                      value={clubForm.type}
                      onValueChange={(value) => {
                        setClubForm({ ...clubForm, type: value });
                        if (formErrors.type) setFormErrors({ ...formErrors, type: undefined });
                      }}
                    >
                      <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.type && <p className="text-sm text-red-600">{formErrors.type}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={clubForm.description}
                    onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                    placeholder="Describe the club's purpose and activities"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advisorId">Club Advisor <span className="text-red-600">*</span></Label>
                  <div className={formErrors.advisorId ? 'border border-red-500 rounded-md' : ''}>
                    <TeacherSelect
                      value={clubForm.advisorId}
                      onValueChange={(value) => {
                        setClubForm({ ...clubForm, advisorId: value });
                        if (formErrors.advisorId) setFormErrors({ ...formErrors, advisorId: undefined });
                      }}
                      placeholder={!createDialogSchoolId || createDialogSchoolId === 'all' || createDialogSchoolId === '' ? "Please choose a school first" : "Select advisor"}
                      disabled={!createDialogSchoolId || createDialogSchoolId === 'all' || createDialogSchoolId === ''}
                      schoolId={createDialogSchoolId && createDialogSchoolId !== 'all' && createDialogSchoolId !== '' ? createDialogSchoolId : undefined}
                    />
                  </div>
                  {formErrors.advisorId && <p className="text-sm text-red-600">{formErrors.advisorId}</p>}
                  {(!createDialogSchoolId || createDialogSchoolId === 'all' || createDialogSchoolId === '') && (
                    <p className="text-sm text-gray-500">Please select a school first to see teachers from that school</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={clubForm.location}
                    onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                    placeholder="Meeting location"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meeting Days & Times <span className="text-red-600">*</span></Label>
                  <div className={`space-y-3 border rounded-md p-3 ${formErrors.meetingDays ? 'border-red-500' : ''}`}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const daySchedule = clubForm.meetingDays.find(md => md.day === day);
                      const isSelected = !!daySchedule;

                      return (
                        <div key={day} className="space-y-2 p-3 border rounded hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`meetingDay-${day}`}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setClubForm({
                                    ...clubForm,
                                    meetingDays: [...clubForm.meetingDays, { day, startTime: '', endTime: '', description: '' }]
                                  });
                                } else {
                                  setClubForm({
                                    ...clubForm,
                                    meetingDays: clubForm.meetingDays.filter(md => md.day !== day)
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`meetingDay-${day}`} className="text-sm font-medium cursor-pointer flex-1">
                              {day}
                            </Label>
                          </div>
                          {isSelected && (
                            <div className="space-y-2 pl-7">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label htmlFor={`startTime-${day}`} className="text-xs">Start Time <span className="text-red-600">*</span></Label>
                                  <Input
                                    id={`startTime-${day}`}
                                    type="time"
                                    value={daySchedule.startTime}
                                    onChange={(e) => {
                                      setClubForm({
                                        ...clubForm,
                                        meetingDays: clubForm.meetingDays.map(md =>
                                          md.day === day ? { ...md, startTime: e.target.value } : md
                                        )
                                      });
                                      if (formErrors.meetingDays) setFormErrors({ ...formErrors, meetingDays: undefined });
                                    }}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`endTime-${day}`} className="text-xs">End Time <span className="text-red-600">*</span></Label>
                                  <Input
                                    id={`endTime-${day}`}
                                    type="time"
                                    value={daySchedule.endTime}
                                    onChange={(e) => {
                                      setClubForm({
                                        ...clubForm,
                                        meetingDays: clubForm.meetingDays.map(md =>
                                          md.day === day ? { ...md, endTime: e.target.value } : md
                                        )
                                      });
                                      if (formErrors.meetingDays) setFormErrors({ ...formErrors, meetingDays: undefined });
                                    }}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`description-${day}`} className="text-xs">Meeting Description/Motive <span className="text-red-600">*</span></Label>
                                <Textarea
                                  id={`description-${day}`}
                                  value={daySchedule.description}
                                  onChange={(e) => {
                                    setClubForm({
                                      ...clubForm,
                                      meetingDays: clubForm.meetingDays.map(md =>
                                        md.day === day ? { ...md, description: e.target.value } : md
                                      )
                                    });
                                    if (formErrors.meetingDays) setFormErrors({ ...formErrors, meetingDays: undefined });
                                  }}
                                  placeholder="What will happen in this meeting? (e.g., Practice session, Planning discussion, etc.)"
                                  className="min-h-[60px]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {formErrors.meetingDays && (
                    <p className="text-sm text-red-600 mt-2">{formErrors.meetingDays}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Max Members</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      value={clubForm.maxMembers}
                      onChange={(e) => setClubForm({ ...clubForm, maxMembers: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meetingFrequency">Frequency</Label>
                    <Select
                      value={clubForm.meetingFrequency}
                      onValueChange={(value) => setClubForm({ ...clubForm, meetingFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <TagInput
                    tags={clubForm.activities}
                    onTagsChange={(tags) => setClubForm({ ...clubForm, activities: tags })}
                    placeholder="Enter activity and press Enter or click Add"
                    label="Activities"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={clubForm.requiresApproval}
                    onChange={(e) => setClubForm({ ...clubForm, requiresApproval: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="requiresApproval">Requires approval for membership</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                  setCreateDialogSchoolId('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClub} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Club'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Club Directory</CardTitle>
          <CardDescription>
            Browse and manage all school clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Select
                value={selectedSchoolId}
                onValueChange={(value) => {
                  setSelectedSchoolId(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by school" />
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
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search clubs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {clubTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Club Name</TableHead>
                  <TableHead className="min-w-[150px]">School</TableHead>
                  <TableHead className="min-w-[150px]">Type</TableHead>
                  <TableHead className="min-w-[150px]">Advisor</TableHead>
                  <TableHead className="min-w-[100px]">Members</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isTableLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>Loading clubs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No clubs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClubs.map((club) => {
                    return (
                      <TableRow key={club._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{club.name}</div>
                            {club.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {club.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {(() => {
                              const schoolId = typeof club.schoolId === 'object' && club.schoolId && '_id' in club.schoolId 
                                ? (club.schoolId as any)._id 
                                : club.schoolId;
                              const school = schools.find(s => s._id === schoolId);
                              return school ? school.name : 'N/A';
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(club.type)}>
                            {club.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            {club.advisorId && typeof club.advisorId === 'object' ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {club.advisorId.firstName} {club.advisorId.lastName}
                                </div>
                                <div className="text-muted-foreground">
                                  {club.advisorId.email}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No advisor assigned
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {typeof club.memberCount === 'number' ? club.memberCount : 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={club.isActive ? 'default' : 'secondary'}>
                            {club.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/super-admin/clubs/${club._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClub(club)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedClub(club);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
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
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
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
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalClubs)} of {totalClubs} clubs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Update club information
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading club details...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Club Name <span className="text-red-600">*</span></Label>
                  <Input
                    id="editName"
                    value={clubForm.name}
                    onChange={(e) => {
                      setClubForm({ ...clubForm, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                    }}
                    placeholder="Enter club name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editType">Club Type <span className="text-red-600">*</span></Label>
                  <Select
                    value={clubForm.type}
                    onValueChange={(value) => {
                      setClubForm({ ...clubForm, type: value });
                      if (formErrors.type) setFormErrors({ ...formErrors, type: undefined });
                    }}
                  >
                    <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clubTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.type && <p className="text-sm text-red-600">{formErrors.type}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  placeholder="Describe the club's purpose and activities"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editAdvisorId">Club Advisor <span className="text-red-600">*</span></Label>
                <div className={formErrors.advisorId ? 'border border-red-500 rounded-md' : ''}>
                  <TeacherSelect
                    value={clubForm.advisorId}
                    onValueChange={(value) => {
                      setClubForm({ ...clubForm, advisorId: value });
                      if (formErrors.advisorId) setFormErrors({ ...formErrors, advisorId: undefined });
                    }}
                    placeholder="Select advisor"
                    schoolId={editDialogSchoolId || undefined}
                  />
                </div>
                {formErrors.advisorId && <p className="text-sm text-red-600">{formErrors.advisorId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editLocation">Location</Label>
                <Input
                  id="editLocation"
                  value={clubForm.location}
                  onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                  placeholder="Meeting location"
                />
              </div>

              <div className="space-y-2">
                <Label>Meeting Days & Times <span className="text-red-600">*</span></Label>
                <div className={`space-y-3 border rounded-md p-3 ${formErrors.meetingDays ? 'border-red-500' : ''}`}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const daySchedule = clubForm.meetingDays.find(md => md.day === day);
                    const isSelected = !!daySchedule;

                    return (
                      <div key={day} className="space-y-2 p-3 border rounded hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`editMeetingDay-${day}`}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setClubForm({
                                  ...clubForm,
                                  meetingDays: [...clubForm.meetingDays, { day, startTime: '', endTime: '', description: '' }]
                                });
                              } else {
                                setClubForm({
                                  ...clubForm,
                                  meetingDays: clubForm.meetingDays.filter(md => md.day !== day)
                                });
                              }
                              if (formErrors.meetingDays) setFormErrors({ ...formErrors, meetingDays: undefined });
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`editMeetingDay-${day}`} className="text-sm font-medium cursor-pointer flex-1">
                            {day}
                          </Label>
                        </div>
                        {isSelected && (
                          <div className="space-y-2 pl-7">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor={`editStartTime-${day}`} className="text-xs">Start Time <span className="text-red-600">*</span></Label>
                                <Input
                                  id={`editStartTime-${day}`}
                                  type="time"
                                  value={daySchedule.startTime}
                                  onChange={(e) => {
                                    setClubForm({
                                      ...clubForm,
                                      meetingDays: clubForm.meetingDays.map(md =>
                                        md.day === day ? { ...md, startTime: e.target.value } : md
                                      )
                                    });
                                    if (formErrors.meetingDays) setFormErrors({ ...formErrors, meetingDays: undefined });
                                  }}
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`editEndTime-${day}`} className="text-xs">End Time <span className="text-red-600">*</span></Label>
                                <Input
                                  id={`editEndTime-${day}`}
                                  type="time"
                                  value={daySchedule.endTime}
                                  onChange={(e) => {
                                    setClubForm({
                                      ...clubForm,
                                      meetingDays: clubForm.meetingDays.map(md =>
                                        md.day === day ? { ...md, endTime: e.target.value } : md
                                      )
                                    });
                                    if (formErrors.meetingDays) setFormErrors({ ...formErrors, meetingDays: undefined });
                                  }}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`editDescription-${day}`} className="text-xs">Meeting Description/Motive <span className="text-red-600">*</span></Label>
                              <Textarea
                                id={`editDescription-${day}`}
                                value={daySchedule.description}
                                onChange={(e) => {
                                  setClubForm({
                                    ...clubForm,
                                    meetingDays: clubForm.meetingDays.map(md =>
                                      md.day === day ? { ...md, description: e.target.value } : md
                                    )
                                  });
                                  if (formErrors.meetingDays) setFormErrors({ ...formErrors, meetingDays: undefined });
                                }}
                                placeholder="What will happen in this meeting? (e.g., Practice session, Planning discussion, etc.)"
                                className="min-h-[60px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {formErrors.meetingDays && (
                  <p className="text-sm text-red-600 mt-2">{formErrors.meetingDays}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editMaxMembers">Max Members</Label>
                  <Input
                    id="editMaxMembers"
                    type="number"
                    value={clubForm.maxMembers}
                    onChange={(e) => setClubForm({ ...clubForm, maxMembers: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editMeetingFrequency">Frequency</Label>
                  <Select
                    value={clubForm.meetingFrequency}
                    onValueChange={(value) => setClubForm({ ...clubForm, meetingFrequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <TagInput
                  tags={clubForm.activities}
                  onTagsChange={(tags) => setClubForm({ ...clubForm, activities: tags })}
                  placeholder="Enter activity and press Enter or click Add"
                  label="Activities"
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="editContactEmail">Contact Email</Label>
                <Input
                  id="editContactEmail"
                  type="email"
                  value={clubForm.contactEmail}
                  onChange={(e) => {
                    setClubForm({ ...clubForm, contactEmail: e.target.value });
                    if (formErrors.contactEmail) setFormErrors({ ...formErrors, contactEmail: undefined });
                  }}
                  placeholder="Club contact email"
                  className={formErrors.contactEmail || (clubForm.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clubForm.contactEmail)) ? 'border-red-500' : ''}
                />
                {formErrors.contactEmail && (
                  <p className="text-sm text-red-600">{formErrors.contactEmail}</p>
                )}
                {!formErrors.contactEmail && clubForm.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clubForm.contactEmail) && (
                  <p className="text-xs text-red-500">Please enter a valid email address</p>
                )}
              </div> */}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editRequiresApproval"
                  checked={clubForm.requiresApproval}
                  onChange={(e) => setClubForm({ ...clubForm, requiresApproval: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="editRequiresApproval">Requires approval for membership</Label>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedClub(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClub} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Club'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedClub?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setSelectedClub(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClub}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClubsPage;
