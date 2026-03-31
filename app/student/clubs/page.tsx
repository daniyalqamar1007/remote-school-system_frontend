'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Calendar, MapPin, Search, Plus, Clock, Award,
  Mail, Phone, CheckCircle, XCircle, AlertCircle, Eye, Loader2,
  ChevronLeft, ChevronRight, Bell, Megaphone
} from 'lucide-react';
import { toast } from 'sonner';
import { clubsApi } from '@/lib/api';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Club {
  _id: string;
  name: string;
  description?: string;
  type: string;
  advisorId?: string;
  advisor?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  location?: string;
  maxMembers?: number;
  requiresApproval: boolean;
  activities: string[];
  contactEmail?: string;
  meetingSchedule?: {
    day: string;
    days?: string[];
    time?: string;
    startTime?: string;
    endTime?: string;
    frequency?: string;
  };
  memberCount?: number;
  status: 'active' | 'inactive';
  allowedGradeLevels?: string[];
  spotsRemaining?: number;
  canJoin?: boolean;
}

interface ClubMembership {
  _id: string;
  clubId: Club;
  studentId: string;
  role: string;
  status: 'active' | 'pending' | 'rejected';
  joinedDate: string;
  requestDate: string;
}

interface MembershipRequest {
  clubId: string;
  reason: string;
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
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const StudentClubsPage = () => {
  const [myClubs, setMyClubs] = useState<ClubMembership[]>([]);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [activeTab, setActiveTab] = useState('my-clubs');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [membershipRequest, setMembershipRequest] = useState<MembershipRequest>({
    clubId: '',
    reason: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalClubs, setTotalClubs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter
  const [typeFilter, setTypeFilter] = useState('all');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchMyClubs();
  }, []);

  useEffect(() => {
    fetchAvailableClubs();
  }, [debouncedSearchTerm, typeFilter, currentPage, pageSize]);

  useEffect(() => {
    if (myClubs.length > 0) {
      fetchAnnouncements();
    } else {
      setAnnouncements([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myClubs.length]); // Fetch when number of clubs changes

  const fetchMyClubs = async () => {
    try {
      const data = await clubsApi.student.getMyClubs();
      setMyClubs(data || []);
    } catch (error) {
      console.error('Error fetching my clubs:', error);
      toast.error('Failed to load your clubs');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setIsLoadingAnnouncements(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
      // Get all active club memberships
      const activeClubs = myClubs.filter(m => m.status === 'active');
      
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
            // If clubId is already an object with name, preserve it
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

      // Filter announcements by target audience - only show members or both (not parents)
      // Show announcements with target audience: "members" or "members and parents" (both)
      // Do NOT show announcements with target audience: "parents" only
      // Also show announcements if targetAudience is missing (backward compatibility for old announcements)
      const filteredAnnouncements = flattenedAnnouncements.filter((announcement) => {
        const targetAudience = announcement.targetAudience?.toLowerCase();
        
        // If targetAudience is not present, show the announcement (backward compatibility for old announcements)
        if (!targetAudience || targetAudience === '') {
          return true;
        }
        
        // Show if target audience is: "members" or "both" (members and parents)
        // Do NOT show if it's only "parents"
        return targetAudience === 'members' || targetAudience === 'both';
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
      toast.error('Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const fetchAvailableClubs = useCallback(async () => {
    try {
      setIsLoadingClubs(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
      const params: any = {
        page: currentPage.toString(),
        limit: pageSize.toString(),
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      if (typeFilter && typeFilter !== 'all') {
        params.type = typeFilter;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/available`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params,
        }
      );

      const clubs = response.data || [];
      setAvailableClubs(Array.isArray(clubs) ? clubs : []);
      setTotalClubs(clubs.length);
      setTotalPages(Math.ceil(clubs.length / pageSize));
    } catch (error) {
      console.error('Error fetching available clubs:', error);
      toast.error('Failed to load available clubs');
      setAvailableClubs([]);
      setTotalClubs(0);
      setTotalPages(1);
    } finally {
      setIsLoadingClubs(false);
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, typeFilter, currentPage, pageSize]);

  const handleRequestMembership = async () => {
    if (!membershipRequest.reason.trim()) {
      toast.error('Please provide a reason for joining');
      return;
    }

    if (!membershipRequest.clubId) {
      toast.error('Club ID is missing. Please try again.');
      return;
    }

    try {
      setIsSubmittingRequest(true);
      const result = await clubsApi.student.requestMembership(membershipRequest);
      toast.success('Membership request submitted successfully');
      setIsRequestDialogOpen(false);
      setMembershipRequest({ clubId: '', reason: '' });
      setSelectedClub(null);
      fetchMyClubs();
      fetchAvailableClubs();
      // Announcements will be fetched automatically when myClubs updates
    } catch (error: any) {
      console.error('Error requesting membership:', error);
      const errorMsg = error.message || 'Failed to submit membership request';
      if (errorMsg.includes('not eligible') || errorMsg.includes('grade')) {
        toast.error('You are not eligible for this club based on grade level requirements');
      } else if (errorMsg.includes('full') || errorMsg.includes('capacity')) {
        toast.error('This club has reached maximum capacity');
      } else if (errorMsg.includes('already a member') || errorMsg.includes('pending request')) {
        toast.error('You are already a member or have a pending request for this club');
      } else if (errorMsg.includes('inactive')) {
        toast.error('This club is currently inactive');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const openRequestDialog = (club: Club) => {
    setSelectedClub(club);
    setMembershipRequest({ clubId: club._id, reason: '' });
    setIsRequestDialogOpen(true);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'President':
      case 'Vice President':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'Secretary':
      case 'Treasurer':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const isAlreadyMember = (clubId: string) => {
    return myClubs.some(membership => {
      const id = membership.clubId?._id || (membership.clubId as any)?._id;
      return id === clubId;
    });
  };

  const clubTypes = ['Academic', 'Sports', 'Arts', 'Service', 'STEM', 'Cultural', 'Language', 'Other'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Clubs</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your club memberships and discover new opportunities
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          // Refresh announcements when switching to announcements tab
          if (value === 'announcements' && myClubs.length > 0) {
            fetchAnnouncements();
          }
        }} 
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-clubs">My Clubs ({myClubs.length})</TabsTrigger>
          <TabsTrigger value="announcements">
            Announcements ({announcements.length})
          </TabsTrigger>
          <TabsTrigger value="available">Available Clubs ({totalClubs})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-clubs" className="space-y-4">
          {myClubs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {myClubs.map((membership) => {
                const club = membership.clubId;
                return (
                  <Card key={membership._id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-xl mb-2">{club.name}</CardTitle>
                          <CardDescription className="text-sm line-clamp-3">
                            {club.description && club.description.trim() ? club.description : 'No description available'}
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
                          {/* <Badge className={getTypeColor(club.type)}>
                            {club.type}
                          </Badge> */}
                          <div className="flex items-center gap-1 text-sm">
                            {getRoleIcon(membership.role)}
                            <span className="font-medium">{membership.role}</span>
                          </div>
                        </div>
                        
                        {club.description && club.description.length > 150 && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {club.description}
                          </p>
                        )}

                        {club.activities && club.activities.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-muted-foreground">Activities:</p>
                            <div className="flex flex-wrap gap-1">
                              {club.activities.slice(0, 3).map((activity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {activity}
                                </Badge>
                              ))}
                              {club.activities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{club.activities.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {club.meetingSchedule && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {club.meetingSchedule.days?.join(', ') || club.meetingSchedule.day}s 
                              {club.meetingSchedule.startTime && club.meetingSchedule.endTime && (
                                <> at {club.meetingSchedule.startTime} - {club.meetingSchedule.endTime}</>
                              )}
                              {club.meetingSchedule.time && <> at {club.meetingSchedule.time}</>}
                            </span>
                          </div>
                        )}
                        
                        {club.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{club.location}</span>
                          </div>
                        )}

                        {club.contactEmail && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{club.contactEmail}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {club.memberCount ?? 0} members
                            {club.maxMembers && ` / ${club.maxMembers} max`}
                          </span>
                        </div>

                        {membership.status === 'pending' && (
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>Awaiting approval</span>
                          </div>
                        )}

                        {membership.status === 'active' && (
                          <div className="text-sm text-muted-foreground">
                            Member since {new Date(membership.joinedDate || membership.requestDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="mt-4 text-lg font-semibold">No Club Memberships</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't joined any clubs yet. Explore available clubs to get started!
                </p>
                <Button onClick={() => setActiveTab('available')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Browse Clubs
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          {isLoadingAnnouncements ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="ml-2 text-muted-foreground">Loading announcements...</span>
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-indigo-500" />
                    Club Announcements
                  </CardTitle>
                  <CardDescription>
                    All announcements from your clubs - immediate, upcoming, and past
                  </CardDescription>
                </CardHeader>
              </Card>

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
            <Card>
              <CardContent className="text-center py-12">
                <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="mt-4 text-lg font-semibold">No Announcements</h3>
                <p className="text-muted-foreground">
                  {myClubs.length === 0
                    ? "You need to be a member of a club to see announcements."
                    : "There are no announcements from your clubs at this time."}
                </p>
                {myClubs.length === 0 && (
                  <Button 
                    onClick={() => setActiveTab('available')}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Browse Clubs
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clubs by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Types" />
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
            </CardContent>
          </Card>

          {/* Available Clubs */}
          {isLoadingClubs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="ml-2 text-muted-foreground">Loading clubs...</span>
            </div>
          ) : availableClubs.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {availableClubs.map((club) => (
                  <Card key={club._id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-xl mb-2">{club.name}</CardTitle>
                          <CardDescription className="text-sm line-clamp-3">
                            {club.description && club.description.trim() ? club.description : 'No description available'}
                          </CardDescription>
                        </div>
                        <Badge className={getTypeColor(club.type)}>
                          {club.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="space-y-3 flex-1">
                        {club.description && club.description.length > 150 && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {club.description}
                          </p>
                        )}

                        {club.activities && club.activities.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-muted-foreground">Activities:</p>
                            <div className="flex flex-wrap gap-1">
                              {club.activities.slice(0, 4).map((activity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {activity}
                                </Badge>
                              ))}
                              {club.activities.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{club.activities.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {club.meetingSchedule && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {club.meetingSchedule.days?.join(', ') || club.meetingSchedule.day}s
                              {club.meetingSchedule.startTime && club.meetingSchedule.endTime && (
                                <> at {club.meetingSchedule.startTime} - {club.meetingSchedule.endTime}</>
                              )}
                              {club.meetingSchedule.time && <> at {club.meetingSchedule.time}</>}
                            </span>
                          </div>
                        )}
                        
                        {club.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{club.location}</span>
                          </div>
                        )}

                        {club.contactEmail && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{club.contactEmail}</span>
                          </div>
                        )}

                        {club.advisor && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              Advisor: {club.advisor.firstName} {club.advisor.lastName}
                            </span>
                          </div>
                        )}

                        {club.allowedGradeLevels && club.allowedGradeLevels.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Grades: {club.allowedGradeLevels.join(', ')}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {club.memberCount ?? 0} members
                              {club.maxMembers && ` / ${club.maxMembers} max`}
                            </span>
                          </div>
                          {club.requiresApproval && (
                            <Badge variant="outline" className="text-xs">
                              Requires Approval
                            </Badge>
                          )}
                        </div>

                        {club.spotsRemaining !== null && club.spotsRemaining !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            {club.spotsRemaining > 0 ? (
                              <span className="text-green-600 dark:text-green-400">
                                {club.spotsRemaining} spots remaining
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">Club is full</span>
                            )}
                          </div>
                        )}

                        <div className="pt-2 mt-auto">
                          {isAlreadyMember(club._id) ? (
                            <Button disabled className="w-full">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Already a Member
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => openRequestDialog(club)} 
                              className="w-full"
                              disabled={!!(club.maxMembers && (club.memberCount || 0) >= club.maxMembers)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {club.maxMembers && (club.memberCount || 0) >= club.maxMembers ? 'Club Full' : 'Request to Join'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalClubs)} of {totalClubs} clubs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isLoadingClubs}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || isLoadingClubs}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="mt-4 text-lg font-semibold">No Clubs Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'No clubs match your search criteria. Try adjusting your filters.' 
                    : 'There are no clubs available to join at this time.'}
                </p>
                {(searchTerm || typeFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Membership Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Club Membership</DialogTitle>
            <DialogDescription>
              Submit a request to join {selectedClub?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedClub && (
              <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                <div className="font-medium">Club Information:</div>
                <div className="text-muted-foreground">
                  <div>Type: {selectedClub.type}</div>
                  {selectedClub.location && <div>Location: {selectedClub.location}</div>}
                  {selectedClub.meetingSchedule && (
                    <div>
                      Meeting: {selectedClub.meetingSchedule.days?.join(', ') || selectedClub.meetingSchedule.day}s
                      {selectedClub.meetingSchedule.startTime && selectedClub.meetingSchedule.endTime && (
                        <> at {selectedClub.meetingSchedule.startTime} - {selectedClub.meetingSchedule.endTime}</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="reason">Why do you want to join this club? *</Label>
              <Textarea
                id="reason"
                value={membershipRequest.reason}
                onChange={(e) => setMembershipRequest({ ...membershipRequest, reason: e.target.value })}
                placeholder="Share your interests, goals, or what you hope to contribute..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRequestDialogOpen(false);
                setMembershipRequest({ clubId: '', reason: '' });
                setSelectedClub(null);
              }}
              disabled={isSubmittingRequest}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestMembership}
              disabled={isSubmittingRequest || !membershipRequest.reason.trim()}
            >
              {isSubmittingRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentClubsPage;
