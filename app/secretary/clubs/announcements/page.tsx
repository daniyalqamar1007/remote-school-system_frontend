'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Bell,
  Plus,
  Edit,
  Trash2,
  Send,
  Search,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Club {
  _id: string;
  name: string;
  type: string;
  memberCount?: number;
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  clubId: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  targetAudience: 'members' | 'parents' | 'both';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isActive: boolean;
  scheduledFor?: string;
  createdAt: string;
  sentAt?: string;
  recipientCount?: number;
}

const ClubAnnouncementsPage = () => {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [announcementToSend, setAnnouncementToSend] = useState<Announcement | null>(null);
  const [backDialogOpen, setBackDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    clubId: '',
    targetAudience: '' as '' | 'members' | 'parents' | 'both',
    priority: '' as '' | 'low' | 'normal' | 'high' | 'urgent',
    scheduledFor: '',
    sendImmediately: true
  });

  const [formErrors, setFormErrors] = useState<{
    title?: string;
    message?: string;
    clubId?: string;
    targetAudience?: string;
    priority?: string;
  }>({});

  useEffect(() => {
    fetchClubs();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAnnouncements = useCallback(async () => {
    if (clubs.length === 0) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      setIsAnnouncementsLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      if (selectedClub !== 'all') {
        params.append('clubId', selectedClub);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/announcements?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch announcements');
      }

      const json = await res.json();
      const list = Array.isArray(json.announcements)
        ? json.announcements
        : Array.isArray(json.data)
          ? json.data
          : [];
      const { total, page, totalPages } = json;

      // Normalize the data to match the expected format
      const normalized = list.map((ann: any) => ({
        ...ann,
        clubId: typeof ann.clubId === 'string' ? { _id: ann.clubId, name: 'Loading...' } : ann.clubId,
        createdBy: typeof ann.createdBy === 'string' ? { _id: ann.createdBy, firstName: 'User', lastName: '' } : ann.createdBy
      }));

      setAnnouncements(normalized);
      setCurrentPage(page || 1);
      setTotalPages(totalPages || 1);
      setTotalAnnouncements(total || 0);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load announcements');
    } finally {
      setIsAnnouncementsLoading(false);
    }
  }, [clubs.length, debouncedSearchTerm, selectedClub, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    if (clubs.length > 0) {
      fetchAnnouncements();
    }
  }, [clubs.length, fetchAnnouncements]);

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        const clubsArray = data?.clubs || (Array.isArray(data) ? data : []);
        setClubs(clubsArray);
      } else {
        toast.error('Failed to fetch clubs');
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Error fetching clubs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (statsLoaded) return; // Only fetch once on initial load

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/announcements/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };


  const handleCreateAnnouncement = async () => {
    const errors: typeof formErrors = {};
    if (!newAnnouncement.clubId) errors.clubId = 'Club is required';
    if (!newAnnouncement.title.trim()) errors.title = 'Title is required';
    if (!newAnnouncement.message.trim()) errors.message = 'Message is required';
    if (!newAnnouncement.targetAudience) errors.targetAudience = 'Target audience is required';
    if (!newAnnouncement.priority) errors.priority = 'Priority level is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('accessToken');
      const userInfoStr = localStorage.getItem('userInfo') || localStorage.getItem('user');

      if (!userInfoStr) {
        toast.error('User information not found. Please log in again.');
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      const userId = userInfo._id || userInfo.id || userInfo.userId;

      const announcementData = {
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        priority: newAnnouncement.priority,
        targetAudience: newAnnouncement.targetAudience,
        scheduledFor: newAnnouncement.sendImmediately ? undefined : newAnnouncement.scheduledFor,
        createdBy: userId
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/${newAnnouncement.clubId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(announcementData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create announcement');
      }

      toast.success('Announcement created successfully');
      setIsCreateDialogOpen(false);
      setFormErrors({});
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Error creating announcement');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormErrors({});
    // Normalize priority - it might be in 'type' field or 'priority' field
    // Ensure it's a valid priority value
    const rawPriority = announcement.priority || (announcement as any).type || 'normal';
    const priority = ['low', 'normal', 'high', 'urgent'].includes(rawPriority)
      ? rawPriority
      : 'normal';
    const targetAudience = announcement.targetAudience || 'members';
    setNewAnnouncement({
      title: announcement.title || '',
      message: announcement.message || (announcement as any).content || '',
      clubId: announcement.clubId?._id || '',
      targetAudience: targetAudience as 'members' | 'parents' | 'both',
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
      scheduledFor: announcement.scheduledFor || (announcement as any).eventDate || '',
      sendImmediately: !announcement.scheduledFor && !(announcement as any).eventDate
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement) return;

    const errors: typeof formErrors = {};
    if (!newAnnouncement.title.trim()) errors.title = 'Title is required';
    if (!newAnnouncement.message.trim()) errors.message = 'Message is required';
    if (!newAnnouncement.targetAudience) errors.targetAudience = 'Target audience is required';
    if (!newAnnouncement.priority) errors.priority = 'Priority level is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('accessToken');
      const body = {
        title: newAnnouncement.title,
        content: newAnnouncement.message,
        message: newAnnouncement.message,
        priority: newAnnouncement.priority,
        type: newAnnouncement.priority, // Also send as type for backend compatibility
        targetAudience: newAnnouncement.targetAudience,
        scheduledFor: newAnnouncement.sendImmediately ? undefined : newAnnouncement.scheduledFor,
        eventDate: newAnnouncement.sendImmediately ? undefined : newAnnouncement.scheduledFor,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/announcements/${selectedAnnouncement._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update announcement');
      }

      toast.success('Announcement updated successfully');
      setIsEditDialogOpen(false);
      setSelectedAnnouncement(null);
      setFormErrors({});
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Error updating announcement');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;

    try {
      setDeletingId(announcementToDelete._id);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/announcements/${announcementToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete announcement');
      }
      toast.success('Announcement deleted successfully');
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting announcement');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementToSend) return;

    try {
      setSendingId(announcementToSend._id);
      const token = localStorage.getItem('accessToken');

      // Update announcement to set sentAt and change status to sent
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/announcements/${announcementToSend._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sentAt: new Date().toISOString(),
          status: 'sent'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send announcement');
      }
      toast.success('Announcement sent successfully');
      setSendDialogOpen(false);
      setAnnouncementToSend(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Error sending announcement');
    } finally {
      setSendingId(null);
    }
  };

  const resetAnnouncementForm = () => {
    setNewAnnouncement({
      title: '',
      message: '',
      clubId: '',
      targetAudience: '',
      priority: '',
      scheduledFor: '',
      sendImmediately: true
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors['normal'];
  };

  const getAudienceColor = (audience: string) => {
    const colors: Record<string, string> = {
      members: 'bg-green-100 text-green-800',
      parents: 'bg-purple-100 text-purple-800',
      both: 'bg-indigo-100 text-indigo-800'
    };
    return colors[audience] || colors['members'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Backend handles all filtering, so we use announcements directly


  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setBackDialogOpen(true)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Club Announcements</h1>
            <p className="text-muted-foreground">
              Create and manage announcements for club members and parents
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>
                Send important information to club members and parents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clubSelect">Select Club *</Label>
                <Select value={newAnnouncement.clubId} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, clubId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name} ({club.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-600">*</span></Label>
                <Input
                  id="title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Announcement title"
                />
              </div>
              {formErrors.title && (
                <p className="text-sm text-red-600">{formErrors.title}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message <span className="text-red-600">*</span></Label>
                <Textarea
                  id="message"
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  placeholder="Type your announcement message..."
                  rows={4}
                />
              </div>
              {formErrors.message && (
                <p className="text-sm text-red-600">{formErrors.message}</p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience <span className="text-red-600">*</span></Label>
                  <Select
                    value={newAnnouncement.targetAudience}
                    onValueChange={(value: 'members' | 'parents' | 'both') =>
                      setNewAnnouncement({ ...newAnnouncement, targetAudience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="members">Club Members</SelectItem>
                      {/* <SelectItem value="parents">Parents Only</SelectItem> */}
                      <SelectItem value="both">Members & Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level <span className="text-red-600">*</span></Label>
                  <Select
                    value={newAnnouncement.priority}
                    onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                      setNewAnnouncement({ ...newAnnouncement, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sendImmediately"
                    checked={newAnnouncement.sendImmediately}
                    onCheckedChange={(checked) => setNewAnnouncement({
                      ...newAnnouncement,
                      sendImmediately: checked,
                      scheduledFor: checked ? '' : newAnnouncement.scheduledFor
                    })}
                  />
                  <Label htmlFor="sendImmediately">Send immediately</Label>
                </div>

                {!newAnnouncement.sendImmediately && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledFor">Schedule for later</Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      value={newAnnouncement.scheduledFor}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        scheduledFor: e.target.value
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setFormErrors({});
                resetAnnouncementForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAnnouncement}
                disabled={
                  isCreating ||
                  !newAnnouncement.title ||
                  !newAnnouncement.message ||
                  !newAnnouncement.clubId ||
                  !newAnnouncement.targetAudience ||
                  !newAnnouncement.priority
                }
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {newAnnouncement.sendImmediately ? 'Send Now' : 'Schedule'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>
            Manage club announcements and communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs && clubs.length > 0 ? clubs.map(club => (
                  <SelectItem key={club._id} value={club._id}>
                    {club.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'draft' | 'scheduled') => setStatusFilter(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Announcements Table */}
          {(isLoading || isAnnouncementsLoading) ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading announcements...</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : announcements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{announcement.title || 'NA'}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {announcement.message || 'NA'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{announcement.clubId?.name || 'NA'}</TableCell>
                    <TableCell>
                      <Badge className={getAudienceColor(announcement.targetAudience || 'members')}>
                        {announcement.targetAudience || 'NA'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(announcement.priority || 'normal')}>
                        {announcement.priority || 'NA'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const hasSentAt = announcement.sentAt;
                        const hasScheduledFor = announcement.scheduledFor || (announcement as any).eventDate;
                        const isScheduled = hasScheduledFor && !hasSentAt && new Date(hasScheduledFor) > new Date();
                        
                        return (
                          <Badge variant={hasSentAt ? 'default' :
                            isScheduled ? 'secondary' : 'outline'}>
                            {hasSentAt ? 'Sent' :
                              isScheduled ? 'Scheduled' : 'Draft'}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {announcement.createdAt ? formatDate(announcement.createdAt) : 'NA'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAnnouncement(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!announcement.sentAt && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAnnouncementToSend(announcement);
                              setSendDialogOpen(true);
                            }}
                            disabled={!!sendingId}
                          >
                            {sendingId === announcement._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAnnouncementToDelete(announcement);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={!!deletingId}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deletingId === announcement._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No announcements found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedClub !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first announcement to get started'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                const newSize = Number(value);
                setPageSize(newSize);
                setCurrentPage(1);
              }}>
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isAnnouncementsLoading}
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
                      onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isAnnouncementsLoading}
              >
                Next
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalAnnouncements)} of {totalAnnouncements} announcements
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title <span className="text-red-600">*</span></Label>
              <Input
                id="editTitle"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>
            {formErrors.title && (
              <p className="text-sm text-red-600">{formErrors.title}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="editMessage">Message <span className="text-red-600">*</span></Label>
              <Textarea
                id="editMessage"
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                placeholder="Type your announcement message..."
                rows={4}
              />
            </div>
            {formErrors.message && (
              <p className="text-sm text-red-600">{formErrors.message}</p>
            )}

            {selectedAnnouncement && (
              <div className="space-y-2">
                <Label>Club</Label>
                <Input
                  value={selectedAnnouncement.clubId?.name || 'NA'}
                  disabled
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editAudience">Target Audience <span className="text-red-600">*</span></Label>
                <Select
                  value={newAnnouncement.targetAudience}
                  onValueChange={(value: 'members' | 'parents' | 'both') =>
                    setNewAnnouncement({ ...newAnnouncement, targetAudience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">Club Members</SelectItem>
                    {/* <SelectItem value="parents">Parents Only</SelectItem> */}
                    <SelectItem value="both">Members & Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPriority">Priority Level <span className="text-red-600">*</span></Label>
                <Select
                  value={newAnnouncement.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                    setNewAnnouncement({ ...newAnnouncement, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedAnnouncement(null);
              setFormErrors({});
              resetAnnouncementForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAnnouncement}
              disabled={
                isUpdating ||
                !newAnnouncement.title ||
                !newAnnouncement.message ||
                !newAnnouncement.targetAudience ||
                !newAnnouncement.priority
              }
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Announcement'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {announcementToDelete
                ? `Are you sure you want to delete the announcement "${announcementToDelete.title}"? This action cannot be undone.`
                : 'Are you sure you want to delete this announcement? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAnnouncementToDelete(null);
              }}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAnnouncement}
              disabled={!!deletingId}
            >
              {deletingId === announcementToDelete?._id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              {announcementToSend
                ? `Are you sure you want to send the announcement "${announcementToSend.title}" now?`
                : 'Are you sure you want to send this announcement now?'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSendDialogOpen(false);
                setAnnouncementToSend(null);
              }}
              disabled={!!sendingId}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendAnnouncement}
              disabled={!!sendingId}
            >
              {sendingId === announcementToSend?._id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Back Confirmation Dialog */}
      <Dialog open={backDialogOpen} onOpenChange={setBackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Navigation</DialogTitle>
            <DialogDescription>
              Are you sure you want to go back? Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setBackDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setBackDialogOpen(false);
                router.back();
              }}
            >
              Go Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubAnnouncementsPage;