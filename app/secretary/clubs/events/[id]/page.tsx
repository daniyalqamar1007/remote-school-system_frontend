'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  User,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Event {
  _id: string;
  name: string;
  clubId?: {
    _id: string;
    name: string;
    type: string;
    advisorId?: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
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
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

const EventDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/events/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Event not found');
          router.push('/secretary/clubs/events');
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch event details');
      }

      const eventData = await res.json();
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load event details');
      router.push('/secretary/clubs/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/events/${event._id}`,
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
      router.push('/secretary/clubs/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Event not found</p>
              <Button
                variant="outline"
                onClick={() => router.push('/secretary/clubs/events')}
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/secretary/clubs/events')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              Event Details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
              <CardDescription>Basic details about the event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Event Name</Label>
                  <p className="font-semibold text-lg">{event.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Club</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {event.clubId?.name || 'N/A'}
                    </Badge>
                    <Badge variant="secondary">{event.clubId?.type || 'N/A'}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <p className="font-medium">{formatDate(event.startDate)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </Label>
                  <p className="font-medium">{formatDate(event.endDate)}</p>
                </div>
              </div>

              {event.description && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Slots */}
          {event.timeSlots && event.timeSlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Slots
                </CardTitle>
                <CardDescription>
                  Scheduled time slots for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.timeSlots.map((slot, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {formatDate(slot.date)}
                            </span>
                          </div>
                          <div className="ml-6">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{slot.startTime}</span> - <span className="font-medium">{slot.endTime}</span>
                            </p>
                            {slot.description && (
                              <p className="text-sm text-muted-foreground mt-2">{slot.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Club Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Club Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Club Name</Label>
                <p className="font-medium">{event.clubId?.name || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Club Type</Label>
                <Badge>{event.clubId?.type || 'N/A'}</Badge>
              </div>
              {event.clubId?.advisorId && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Advisor
                  </Label>
                  <p className="font-medium">
                    {event.clubId.advisorId?.firstName || ''} {event.clubId.advisorId?.lastName || ''}
                  </p>
                  {event.clubId.advisorId?.email && (
                    <p className="text-sm text-muted-foreground">{event.clubId.advisorId.email}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Event Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.createdBy && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Created By</Label>
                  <p className="font-medium">
                    {event.createdBy?.firstName || ''} {event.createdBy?.lastName || ''}
                  </p>
                </div>
              )}
              {event.updatedBy && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Last Updated By</Label>
                  <p className="font-medium">
                    {event.updatedBy?.firstName || ''} {event.updatedBy?.lastName || ''}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm">{formatDateTime(event.createdAt)}</p>
              </div>
              {event.updatedAt && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{formatDateTime(event.updatedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the event &quot;{event.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
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

export default EventDetailPage;

