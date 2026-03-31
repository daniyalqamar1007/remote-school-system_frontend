'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Calendar, MapPin, Clock, Mail, Phone, Search, Filter,
  UserPlus, UserMinus, CheckCircle, AlertCircle, Trophy, Award,
  Activity, TrendingUp, Target, Bell, Settings, Eye, MessageSquare,
  Edit, Trash2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  studentId: string;
  profilePicture?: string;
  membershipId?: string;
  role?: string;
  joinedAt?: string;
}

interface Club {
  _id: string;
  name: string;
  description?: string;
  type: string;
  advisorId: string;
  schoolId: string;
  location?: string;
  maxMembers?: number;
  requiresApproval: boolean;
  activities: string[];
  contactEmail?: string;
  meetingSchedule?: {
    day: string;
    time: string;
    frequency: string;
  };
  memberCount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  members?: Student[];
  pendingRequests?: MembershipRequest[];
}

interface MembershipRequest {
  _id: string;
  studentId: Student;
  clubId: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface ClubAnnouncement {
  _id: string;
  title: string;
  content?: string;
  message?: string;
  clubId: string;
  authorId?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  priority: 'low' | 'medium' | 'high' | 'normal' | 'urgent';
  targetAudience: 'members' | 'parents' | 'all' | 'both';
  scheduledAt?: string;
  scheduledFor?: string;
  sentAt?: string;
  status?: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
}

const TeacherClubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  
  // Dialog states
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isEditAnnouncementDialogOpen, setIsEditAnnouncementDialogOpen] = useState(false);
  const [isRequestDetailDialogOpen, setIsRequestDetailDialogOpen] = useState(false);
  const [isMemberDetailDialogOpen, setIsMemberDetailDialogOpen] = useState(false);
  const [isDeleteAnnouncementDialogOpen, setIsDeleteAnnouncementDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null);
  const [selectedMember, setSelectedMember] = useState<Student | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<ClubAnnouncement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<ClubAnnouncement | null>(null);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [isUpdatingAnnouncement, setIsUpdatingAnnouncement] = useState(false);
  const [isDeletingAnnouncement, setIsDeletingAnnouncement] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // New announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetAudience: 'members' as 'members' | 'parents' | 'all',
    scheduledAt: ''
  });

  const selectedClubIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchTeacherClubs();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoize fetchClubDetails to prevent infinite loops
  const fetchClubDetails = useCallback(async (clubId: string, search?: string) => {
    // Prevent duplicate calls
    if (isFetchingRef.current && selectedClubIdRef.current === clubId) {
      return;
    }
    
    isFetchingRef.current = true;
    selectedClubIdRef.current = clubId;
    
    try {
      const token = localStorage.getItem('accessToken');
      setIsMembersLoading(true);
      
      // Fetch club members with search filter (only for members tab)
      const membersUrl = activeTab === 'members' && search
        ? `${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${clubId}/members?search=${encodeURIComponent(search)}`
        : `${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${clubId}/members`;
      
      const membersResponse = await fetch(membersUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch membership requests
      const requestsResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${clubId}/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch announcements
      const announcementsResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${clubId}/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setSelectedClub(prev => prev ? { ...prev, members: membersData } : null);
      } else {
        const errorData = await membersResponse.json().catch(() => ({}));
        console.error('Error fetching members:', errorData);
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setMembershipRequests(requestsData);
      }

      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json();
        // Ensure announcements is an array
        const announcementsArray = Array.isArray(announcementsData) ? announcementsData : [];
        console.log('Fetched announcements:', announcementsArray);
        setAnnouncements(announcementsArray);
      } else {
        const errorData = await announcementsResponse.json().catch(() => ({}));
        console.error('Error fetching announcements:', errorData);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching club details:', error);
      toast.error('Error fetching club details');
    } finally {
      setIsMembersLoading(false);
      isFetchingRef.current = false;
    }
  }, [activeTab]);

  // Fetch club details when selectedClub changes (only once)
  useEffect(() => {
    if (selectedClub?._id && selectedClubIdRef.current !== selectedClub._id) {
      fetchClubDetails(selectedClub._id);
    }
  }, [selectedClub?._id, fetchClubDetails]);

  // Refetch members when search term changes (only for members tab)
  useEffect(() => {
    if (selectedClub?._id && activeTab === 'members' && debouncedSearchTerm !== undefined) {
      fetchClubDetails(selectedClub._id, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, activeTab, selectedClub?._id, fetchClubDetails]);

  const fetchTeacherClubs = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/my-clubs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClubs(data);
        if (data.length > 0) {
          setSelectedClub(data[0]);
        }
      } else {
        toast.error('Failed to fetch your clubs');
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Error fetching clubs');
    } finally {
      setIsLoading(false);
    }
  };


  const handleApproveRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Membership request approved successfully');
        if (selectedClub) {
          fetchClubDetails(selectedClub._id);
        }
      } else {
        toast.error('Failed to approve membership request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error approving membership request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Membership request rejected');
        if (selectedClub) {
          fetchClubDetails(selectedClub._id);
        }
      } else {
        toast.error('Failed to reject membership request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error rejecting membership request');
    }
  };

  const handleRemoveMember = async (member: Student) => {
    if (!member.membershipId && !member._id) {
      toast.error('Cannot remove member: membership ID not found');
      return;
    }
    
    try {
      setRemovingMemberId(member._id);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${selectedClub?._id}/members/${member._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Member removed successfully');
        if (selectedClub) {
          fetchClubDetails(selectedClub._id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Error removing member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreatingAnnouncement(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const announcementData = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        message: newAnnouncement.content,
        priority: newAnnouncement.priority,
        targetAudience: newAnnouncement.targetAudience,
        scheduledAt: newAnnouncement.scheduledAt || undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${selectedClub?._id}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(announcementData)
      });

      if (response.ok) {
        toast.success('Announcement created successfully');
        setIsAnnouncementDialogOpen(false);
        setNewAnnouncement({
          title: '',
          content: '',
          priority: 'medium',
          targetAudience: 'members',
          scheduledAt: ''
        });
        if (selectedClub) {
          fetchClubDetails(selectedClub._id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Error creating announcement');
    } finally {
      setIsCreatingAnnouncement(false);
    }
  };

  const handleEditAnnouncement = (announcement: ClubAnnouncement) => {
    setSelectedAnnouncement(announcement);
    
    // Map priority values correctly
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (announcement.priority) {
      const priorityLower = announcement.priority.toLowerCase();
      if (priorityLower === 'low') {
        priority = 'low';
      } else if (priorityLower === 'high' || priorityLower === 'urgent') {
        priority = 'high';
      } else {
        priority = 'medium'; // default for 'normal', 'medium', or any other value
      }
    }
    
    // Map target audience
    let targetAudience: 'members' | 'parents' | 'all' = 'members';
    if (announcement.targetAudience) {
      const audienceLower = announcement.targetAudience.toLowerCase();
      if (audienceLower === 'parents') {
        targetAudience = 'parents';
      } else if (audienceLower === 'all' || audienceLower === 'both') {
        targetAudience = 'all';
      } else {
        targetAudience = 'members';
      }
    }
    
    // Format scheduled date for datetime-local input (YYYY-MM-DDTHH:mm)
    let scheduledAt = '';
    const scheduledDate = announcement.scheduledAt || announcement.scheduledFor;
    if (scheduledDate) {
      try {
        const date = new Date(scheduledDate);
        if (!isNaN(date.getTime())) {
          // Convert to local datetime string in format YYYY-MM-DDTHH:mm
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          scheduledAt = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
      } catch (error) {
        console.error('Error parsing scheduled date:', error);
      }
    }
    
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content || announcement.message || '',
      priority: priority,
      targetAudience: targetAudience,
      scheduledAt: scheduledAt
    });
    setIsEditAnnouncementDialogOpen(true);
  };

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement || !newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsUpdatingAnnouncement(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const announcementData = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        message: newAnnouncement.content,
        priority: newAnnouncement.priority,
        targetAudience: newAnnouncement.targetAudience,
        scheduledAt: newAnnouncement.scheduledAt || undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${selectedClub?._id}/announcements/${selectedAnnouncement._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(announcementData)
      });

      if (response.ok) {
        toast.success('Announcement updated successfully');
        setIsEditAnnouncementDialogOpen(false);
        setSelectedAnnouncement(null);
        setNewAnnouncement({
          title: '',
          content: '',
          priority: 'medium',
          targetAudience: 'members',
          scheduledAt: ''
        });
        if (selectedClub) {
          fetchClubDetails(selectedClub._id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Error updating announcement');
    } finally {
      setIsUpdatingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;

    try {
      setIsDeletingAnnouncement(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/teacher/clubs/${selectedClub?._id}/announcements/${announcementToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Announcement deleted successfully');
        setIsDeleteAnnouncementDialogOpen(false);
        setAnnouncementToDelete(null);
        if (selectedClub) {
          fetchClubDetails(selectedClub._id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Error deleting announcement');
    } finally {
      setIsDeletingAnnouncement(false);
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-red-600'
    };
    return colors[priority] || colors['medium'];
  };

  // Members are now filtered on backend, so use them directly
  const filteredMembers = selectedClub?.members || [];

  const filteredRequests = membershipRequests.filter(request => {
    const searchMatch = searchTerm === '' || 
      `${request.studentId.firstName} ${request.studentId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    
    return searchMatch && statusMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No clubs assigned</h3>
          <p className="text-muted-foreground">
            You are not currently assigned as an advisor to any clubs. Contact your administrator to get assigned to clubs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Clubs</h1>
          <p className="text-muted-foreground">
            Manage your club memberships, requests, and announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAnnouncementDialogOpen(true)}
            disabled={!selectedClub}
          >
            <Bell className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Club Selector */}
      {clubs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Club</CardTitle>
            <CardDescription>
              Choose which club you want to manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedClub?._id || ''} 
              onValueChange={(value) => {
                const club = clubs.find(c => c._id === value);
                setSelectedClub(club || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a club" />
              </SelectTrigger>
              <SelectContent>
                {clubs.map(club => (
                  <SelectItem key={club._id} value={club._id}>
                    {club.name} - {club.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedClub && (
        <>
          {/* Club Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedClub.name}
                    <Badge className={getTypeColor(selectedClub.type)}>
                      {selectedClub.type}
                    </Badge>
                  </CardTitle>
                  {selectedClub.description && (
                    <CardDescription className="mt-2">
                      {selectedClub.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={selectedClub.status === 'active' ? 'default' : 'secondary'}>
                  {selectedClub.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedClub.members?.length || 0} members
                    {selectedClub.maxMembers && ` / ${selectedClub.maxMembers} max`}
                  </span>
                </div>
                {selectedClub.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedClub.location}</span>
                  </div>
                )}
                {selectedClub.meetingSchedule && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedClub.meetingSchedule.day} at {selectedClub.meetingSchedule.time}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">Members ({selectedClub?.members?.length || 0})</TabsTrigger>
              <TabsTrigger value="requests">
                Membership Requests ({membershipRequests.filter(r => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="announcements">Announcements ({announcements.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Club Members</CardTitle>
                  <CardDescription>
                    Manage current members of {selectedClub?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  {isMembersLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading members...</p>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {filteredMembers.map((member) => (
                      <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.studentId} • Grade {member.grade} • {member.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsMemberDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (!confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName} from this club?`)) return;
                              handleRemoveMember(member);
                            }}
                            disabled={removingMemberId === member._id}
                          >
                            {removingMemberId === member._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserMinus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}

                  {!isMembersLoading && filteredMembers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No members found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No members match your search criteria' : 'This club has no members yet'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Membership Requests</CardTitle>
                  <CardDescription>
                    Review and approve membership requests for {selectedClub?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search requests..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <TooltipProvider>
                    <div className="space-y-4">
                      {filteredRequests.map((request) => (
                        <div key={request._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {request.studentId.firstName[0]}{request.studentId.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium">
                                {request.studentId.firstName} {request.studentId.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {request.studentId.studentId} • Grade {request.studentId.grade}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Requested on {new Date(request.requestedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                request.status === 'approved' ? 'default' : 
                                request.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {request.status}
                            </Badge>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleApproveRequest(request._id)}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approve Request</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleRejectRequest(request._id)}
                                    >
                                      <AlertCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reject Request</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setIsRequestDetailDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TooltipProvider>

                  {filteredRequests.length === 0 && (
                    <div className="text-center py-8">
                      <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'No requests match your search criteria' 
                          : 'No membership requests yet'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Club Announcements</CardTitle>
                  <CardDescription>
                    View and manage announcements for {selectedClub?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{announcement.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={getPriorityColor(announcement.priority)}
                              variant="outline"
                            >
                              {announcement.priority}
                            </Badge>
                            {announcement.status && (
                              <Badge variant="outline">
                                {announcement.status}
                              </Badge>
                            )}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditAnnouncement(announcement)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setAnnouncementToDelete(announcement);
                                  setIsDeleteAnnouncementDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {announcement.content || announcement.message}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Created on {new Date(announcement.createdAt).toLocaleDateString()} • 
                          Target: {announcement.targetAudience}
                          {(announcement.scheduledAt || announcement.scheduledFor) && (
                            ` • Scheduled for ${new Date(announcement.scheduledAt || announcement.scheduledFor).toLocaleString()}`
                          )}
                          {announcement.sentAt && ` • Sent on ${new Date(announcement.sentAt).toLocaleDateString()}`}
                          {announcement.createdBy && ` • By ${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`}
                        </div>
                      </div>
                    ))}
                  </div>

                  {announcements.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No announcements</h3>
                      <p className="text-muted-foreground">
                        Create your first announcement to communicate with club members
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Create Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Send an announcement to {selectedClub?.name} members and parents
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                placeholder="Write your announcement here..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newAnnouncement.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setNewAnnouncement({ ...newAnnouncement, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select 
                  value={newAnnouncement.targetAudience} 
                  onValueChange={(value: 'members' | 'parents' | 'all') => 
                    setNewAnnouncement({ ...newAnnouncement, targetAudience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">Members Only</SelectItem>
                    {/* <SelectItem value="parents">Parents Only</SelectItem> */}
                    <SelectItem value="all">Members & Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule for Later (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={newAnnouncement.scheduledAt}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduledAt: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAnnouncement} 
              disabled={!newAnnouncement.title || !newAnnouncement.content || isCreatingAnnouncement}
            >
              {isCreatingAnnouncement ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                newAnnouncement.scheduledAt ? 'Schedule Announcement' : 'Send Announcement'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={isRequestDetailDialogOpen} onOpenChange={setIsRequestDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Membership Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Student Information</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.studentId.firstName} {selectedRequest.studentId.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.studentId.studentId} • Grade {selectedRequest.studentId.grade}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.studentId.email}
                </p>
              </div>
              
              {selectedRequest.reason && (
                <div>
                  <h4 className="font-medium">Reason for Joining</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.reason}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium">Request Details</h4>
                <p className="text-sm text-muted-foreground">
                  Requested on: {new Date(selectedRequest.requestedAt).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {selectedRequest.status}
                </p>
                {selectedRequest.reviewedAt && (
                  <p className="text-sm text-muted-foreground">
                    Reviewed on: {new Date(selectedRequest.reviewedAt).toLocaleString()}
                  </p>
                )}
              </div>
              
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      handleApproveRequest(selectedRequest._id);
                      setIsRequestDetailDialogOpen(false);
                    }}
                  >
                    Approve Request
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleRejectRequest(selectedRequest._id);
                      setIsRequestDetailDialogOpen(false);
                    }}
                  >
                    Reject Request
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog open={isMemberDetailDialogOpen} onOpenChange={setIsMemberDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              Complete information about the club member
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                  <p className="text-sm font-semibold">{selectedMember.firstName} {selectedMember.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Student ID</Label>
                  <p className="text-sm font-semibold">{selectedMember.studentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Grade</Label>
                  <p className="text-sm font-semibold">Grade {selectedMember.grade}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm font-semibold">{selectedMember.email}</p>
                </div>
                {selectedMember.role && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Role in Club</Label>
                    <p className="text-sm font-semibold">{selectedMember.role}</p>
                  </div>
                )}
                {selectedMember.joinedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Joined Date</Label>
                    <p className="text-sm font-semibold">{new Date(selectedMember.joinedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditAnnouncementDialogOpen} onOpenChange={setIsEditAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                placeholder="Write your announcement here..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select 
                  value={newAnnouncement.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setNewAnnouncement({ ...newAnnouncement, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-audience">Target Audience</Label>
                <Select 
                  value={newAnnouncement.targetAudience} 
                  onValueChange={(value: 'members' | 'parents' | 'all') => 
                    setNewAnnouncement({ ...newAnnouncement, targetAudience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">Members Only</SelectItem>
                    {/* <SelectItem value="parents">Parents Only</SelectItem> */}
                    <SelectItem value="all">Members & Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-scheduledAt">Schedule for Later (Optional)</Label>
              <Input
                id="edit-scheduledAt"
                type="datetime-local"
                value={newAnnouncement.scheduledAt}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduledAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditAnnouncementDialogOpen(false);
              setSelectedAnnouncement(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAnnouncement} 
              disabled={!newAnnouncement.title || !newAnnouncement.content || isUpdatingAnnouncement}
            >
              {isUpdatingAnnouncement ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Announcement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Announcement Confirmation Dialog */}
      <Dialog open={isDeleteAnnouncementDialogOpen} onOpenChange={setIsDeleteAnnouncementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {announcementToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium">{announcementToDelete.title}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteAnnouncementDialogOpen(false);
              setAnnouncementToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAnnouncement}
              disabled={isDeletingAnnouncement}
            >
              {isDeletingAnnouncement ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherClubs;