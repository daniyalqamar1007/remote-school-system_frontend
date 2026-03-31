'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Eye,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Club {
  _id: string;
  name: string;
  type: string;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface Event {
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
  timeSlots?: TimeSlot[];
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

const ClubEventsPage = () => {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEvents, setTotalEvents] = useState(0);

  const [eventForm, setEventForm] = useState({
    name: '',
    clubId: '',
    startDate: '',
    endDate: '',
    description: '',
    timeSlots: [] as TimeSlot[]
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    clubId?: string;
    startDate?: string;
    endDate?: string;
    timeSlots?: string;
  }>({});

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedClub]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (clubs.length > 0) {
      fetchEvents();
    }
  }, [debouncedSearchTerm, selectedClub, currentPage, pageSize, clubs.length]);

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
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      setIsEventsLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      if (selectedClub && selectedClub !== 'all') {
        params.append('clubId', selectedClub);
      }

      const url = `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/events?${params.toString()}`;
      console.log('Fetching events with URL:', url);

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch events');
      }

      const json = await res.json();
      console.log('Events response:', json);
      const list = Array.isArray(json.events) ? json.events : [];
      const { total, page, totalPages } = json;

      setEvents(list);
      setCurrentPage(page || 1);
      setTotalPages(totalPages || 1);
      setTotalEvents(total || 0);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setIsEventsLoading(false);
    }
  }, [debouncedSearchTerm, selectedClub, currentPage, pageSize]);

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    let hasErrors = false;

    if (!eventForm.name.trim()) {
      errors.name = 'Event name is required';
      hasErrors = true;
    }

    if (!eventForm.clubId) {
      errors.clubId = 'Club is required';
      hasErrors = true;
    }

    if (!eventForm.startDate) {
      errors.startDate = 'Start date is required';
      hasErrors = true;
    }

    if (!eventForm.endDate) {
      errors.endDate = 'End date is required';
      hasErrors = true;
    }

    if (eventForm.startDate && eventForm.endDate) {
      const start = new Date(eventForm.startDate);
      const end = new Date(eventForm.endDate);
      if (end < start) {
        errors.endDate = 'End date cannot be before start date';
        hasErrors = true;
      }
    }

    // Validate time slots
    if (eventForm.timeSlots.length > 0) {
      const slotErrors: string[] = [];
      eventForm.timeSlots.forEach((slot, index) => {
        if (!slot.date || !slot.startTime || !slot.endTime) {
          slotErrors.push(`Time slot ${index + 1} is incomplete`);
        } else {
          const slotDate = new Date(slot.date);
          const startDate = new Date(eventForm.startDate);
          const endDate = new Date(eventForm.endDate);

          if (slotDate < startDate || slotDate > endDate) {
            slotErrors.push(`Time slot ${index + 1} date must be between start and end date`);
          }

          // Check time format and overlap
          const startTime = parseTime(slot.startTime);
          const endTime = parseTime(slot.endTime);

          if (!startTime || !endTime) {
            slotErrors.push(`Time slot ${index + 1} has invalid time format`);
          } else if (endTime <= startTime) {
            slotErrors.push(`Time slot ${index + 1} end time must be after start time`);
          }
        }
      });

      // Check for overlaps
      const slotsByDate = new Map<string, TimeSlot[]>();
      eventForm.timeSlots.forEach(slot => {
        const dateKey = slot.date;
        if (!slotsByDate.has(dateKey)) {
          slotsByDate.set(dateKey, []);
        }
        slotsByDate.get(dateKey)!.push(slot);
      });

      slotsByDate.forEach((dateSlots, date) => {
        const sorted = [...dateSlots].sort((a, b) => {
          const aStart = parseTime(a.startTime);
          const bStart = parseTime(b.startTime);
          return (aStart || 0) - (bStart || 0);
        });

        for (let i = 0; i < sorted.length - 1; i++) {
          const aEnd = parseTime(sorted[i].endTime);
          const bStart = parseTime(sorted[i + 1].startTime);
          if (aEnd && bStart && aEnd > bStart) {
            slotErrors.push(`Overlapping time slots detected on ${date}`);
          }
        }
      });

      if (slotErrors.length > 0) {
        errors.timeSlots = slotErrors.join('; ');
        hasErrors = true;
      }
    }

    setFormErrors(errors);
    return !hasErrors;
  };

  const parseTime = (timeString: string): number | null => {
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('accessToken');

      const eventData = {
        ...eventForm,
        timeSlots: eventForm.timeSlots.map(slot => ({
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          description: slot.description || ''
        }))
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create event');
      }

      toast.success('Event created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEventForm({
      name: event.name,
      clubId: event.clubId?._id || '',
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      description: event.description || '',
      timeSlots: event.timeSlots?.map(slot => ({
        date: new Date(slot.date).toISOString().split('T')[0],
        startTime: slot.startTime,
        endTime: slot.endTime,
        description: slot.description || ''
      })) || []
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('accessToken');

      const updateData = {
        ...eventForm,
        timeSlots: eventForm.timeSlots.map(slot => ({
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          description: slot.description || ''
        }))
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/events/${selectedEvent._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update event');
      }

      toast.success('Event updated successfully');
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      setDeletingId(eventToDelete._id);
      const token = localStorage.getItem('accessToken');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/events/${eventToDelete._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete event');
      }

      toast.success('Event deleted successfully');
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewEvent = (event: Event) => {
    router.push(`/secretary/clubs/events/${event._id}`);
  };

  const addTimeSlot = () => {
    setEventForm({
      ...eventForm,
      timeSlots: [
        ...eventForm.timeSlots,
        { date: eventForm.startDate || '', startTime: '', endTime: '', description: '' }
      ]
    });
  };

  const removeTimeSlot = (index: number) => {
    setEventForm({
      ...eventForm,
      timeSlots: eventForm.timeSlots.filter((_, i) => i !== index)
    });
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = [...eventForm.timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setEventForm({ ...eventForm, timeSlots: updated });
  };

  const resetForm = () => {
    setEventForm({
      name: '',
      clubId: '',
      startDate: '',
      endDate: '',
      description: '',
      timeSlots: []
    });
    setFormErrors({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/clubs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Club Events</h1>
            <p className="text-muted-foreground">
              Manage club events and schedules
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>
                Create a new event for a club
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Event Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  value={eventForm.name}
                  onChange={(e) => {
                    setEventForm({ ...eventForm, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  placeholder="Enter event name"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clubId">
                  Club <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={eventForm.clubId}
                  onValueChange={(value) => {
                    setEventForm({ ...eventForm, clubId: value });
                    if (formErrors.clubId) setFormErrors({ ...formErrors, clubId: undefined });
                  }}
                >
                  <SelectTrigger className={formErrors.clubId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.clubId && <p className="text-sm text-red-600">{formErrors.clubId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => {
                      setEventForm({ ...eventForm, startDate: e.target.value });
                      if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: undefined });
                    }}
                    className={formErrors.startDate ? 'border-red-500' : ''}
                  />
                  {formErrors.startDate && <p className="text-sm text-red-600">{formErrors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => {
                      setEventForm({ ...eventForm, endDate: e.target.value });
                      if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: undefined });
                    }}
                    min={eventForm.startDate}
                    className={formErrors.endDate ? 'border-red-500' : ''}
                  />
                  {formErrors.endDate && <p className="text-sm text-red-600">{formErrors.endDate}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Enter event description (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Time Slots (Optional)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addTimeSlot}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Time Slot
                  </Button>
                </div>
                {formErrors.timeSlots && (
                  <p className="text-sm text-red-600">{formErrors.timeSlots}</p>
                )}
                <div className="space-y-3">
                  {eventForm.timeSlots.map((slot, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Time Slot {index + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTimeSlot(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={slot.date}
                            onChange={(e) => updateTimeSlot(index, 'date', e.target.value)}
                            min={eventForm.startDate}
                            max={eventForm.endDate}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                            placeholder="10:00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                            placeholder="11:00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description (Optional)</Label>
                        <Input
                          value={slot.description}
                          onChange={(e) => updateTimeSlot(index, 'description', e.target.value)}
                          placeholder="Slot description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
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
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            List of all club events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isLoading || isEventsLoading) ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Time Slots</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading events...</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : events.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Time Slots</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.clubId?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(event.startDate)}</TableCell>
                      <TableCell>{formatDate(event.endDate)}</TableCell>
                      <TableCell>
                        {event.timeSlots && event.timeSlots.length > 0
                          ? `${event.timeSlots.length} slot(s)`
                          : 'No slots'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEvent(event)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEventToDelete(event);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={deletingId === event._id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deletingId === event._id ? (
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
                    disabled={currentPage === 1 || isEventsLoading}
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
                    disabled={currentPage === totalPages || isEventsLoading}
                  >
                    Next
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEvents)} of {totalEvents} events
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No events found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedClub !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first event to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">
                Event Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="editName"
                value={eventForm.name}
                onChange={(e) => {
                  setEventForm({ ...eventForm, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                }}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editClubId">
                Club <span className="text-red-600">*</span>
              </Label>
              <Select
                value={eventForm.clubId}
                onValueChange={(value) => {
                  setEventForm({ ...eventForm, clubId: value });
                  if (formErrors.clubId) setFormErrors({ ...formErrors, clubId: undefined });
                }}
                disabled
              >
                <SelectTrigger className={formErrors.clubId ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club._id} value={club._id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.clubId && <p className="text-sm text-red-600">{formErrors.clubId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">
                  Start Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => {
                    setEventForm({ ...eventForm, startDate: e.target.value });
                    if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: undefined });
                  }}
                  className={formErrors.startDate ? 'border-red-500' : ''}
                />
                {formErrors.startDate && <p className="text-sm text-red-600">{formErrors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEndDate">
                  End Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => {
                    setEventForm({ ...eventForm, endDate: e.target.value });
                    if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: undefined });
                  }}
                  min={eventForm.startDate}
                  className={formErrors.endDate ? 'border-red-500' : ''}
                />
                {formErrors.endDate && <p className="text-sm text-red-600">{formErrors.endDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Time Slots (Optional)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addTimeSlot}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time Slot
                </Button>
              </div>
              {formErrors.timeSlots && (
                <p className="text-sm text-red-600">{formErrors.timeSlots}</p>
              )}
              <div className="space-y-3">
                {eventForm.timeSlots.map((slot, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Time Slot {index + 1}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={slot.date}
                          onChange={(e) => updateTimeSlot(index, 'date', e.target.value)}
                          min={eventForm.startDate}
                          max={eventForm.endDate}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (Optional)</Label>
                      <Input
                        value={slot.description}
                        onChange={(e) => updateTimeSlot(index, 'description', e.target.value)}
                        placeholder="Slot description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEvent} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Event
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {eventToDelete
                ? `Are you sure you want to delete the event "${eventToDelete.name}"? This action cannot be undone.`
                : 'Are you sure you want to delete this event?'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubEventsPage;

