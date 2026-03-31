'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Calendar, Clock, MapPin, Building2, Users, Activity,
  Loader2, CheckCircle, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { sportsApi } from '@/lib/api';
import { toast } from 'sonner';

interface SportsSchedule {
  _id: string;
  title: string;
  eventType: string;
  startDate: string | Date;
  endDate: string | Date;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  opponent?: string;
  venue?: string;
  timeSlots?: Array<{
    date: string | Date;
    startTime: string;
    endTime: string;
    description?: string;
  }>;
  sportsProgramId?: {
    _id: string;
    name: string;
    type: string;
    season: string;
    schoolId?: {
      _id: string;
      name: string;
    };
  };
  schoolId?: {
    _id: string;
    name: string;
    address?: string;
  };
  isRecurring?: boolean;
  recurringPattern?: string;
  requiresTransportation?: boolean;
  maxAttendees?: number;
  specialInstructions?: string;
  createdAt?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

const SportsScheduleViewPage = () => {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<SportsSchedule | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleDetails();
    }
  }, [scheduleId]);

  const fetchScheduleDetails = async () => {
    try {
      setIsLoading(true);
      const response = await sportsApi.schedule.getById(scheduleId);
      
      let scheduleData: any = null;
      if (response?.data) {
        scheduleData = response.data;
      } else if (response?.success && response?.data) {
        scheduleData = response.data;
      } else if (response) {
        scheduleData = response;
      }

      if (!scheduleData) {
        toast.error('Schedule not found');
        router.push('/super-admin/sports/schedule');
        return;
      }

      setSchedule(scheduleData);

      // Fetch school info if available
      const schoolId = scheduleData.schoolId?._id || scheduleData.schoolId;
      if (schoolId) {
        try {
          const token = localStorage.getItem('accessToken');
          const schoolResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools/${schoolId}`, {
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
    } catch (error: any) {
      console.error('Error fetching schedule:', error);
      toast.error(error?.message || 'Failed to load schedule details');
      router.push('/super-admin/sports/schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'game':
      case 'match':
        return 'bg-gray-900 text-white';
      case 'practice':
      case 'training':
        return 'bg-green-600 text-white';
      case 'tournament':
        return 'bg-purple-600 text-white';
      case 'meeting':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-800 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading schedule details...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Schedule not found</h1>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const program = schedule.sportsProgramId || schedule.program;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/sports/schedule">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{schedule.title || 'Schedule Event'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getEventTypeColor(schedule.eventType)}>
              {schedule.eventType ? schedule.eventType.charAt(0).toUpperCase() + schedule.eventType.slice(1) : 'Event'}
            </Badge>
          </div>
        </div>
      </div>

      {/* School Information */}
      {/* {schoolInfo && (
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
                <p className="font-medium">{program.school.name || 'N/A'}</p>
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
      )} */}

      {/* Sport Program Information */}
      {program && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sport Program Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Program Name</Label>
                <p className="font-medium">{program.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium">{program.type || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Season</Label>
                <p className="font-medium">{program.season || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Event Title</Label>
              <p className="font-medium text-lg">{schedule.title || 'N/A'}</p>
            </div>
            {schedule.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-gray-700">{schedule.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium">{formatDate(schedule.startDate)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">End Date</Label>
                <p className="font-medium">{formatDate(schedule.endDate || schedule.startDate)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Time
                </Label>
                <p className="font-medium">{formatTime(schedule.startTime)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Time
                </Label>
                <p className="font-medium">{formatTime(schedule.endTime || schedule.startTime)}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <p className="font-medium">{schedule.location || schedule.venue || 'TBD'}</p>
            </div>
            {schedule.opponent && (
              <div>
                <Label className="text-muted-foreground">Opponent</Label>
                <p className="font-medium">{schedule.opponent}</p>
              </div>
            )}
            {schedule.venue && schedule.venue !== schedule.location && (
              <div>
                <Label className="text-muted-foreground">Venue Type</Label>
                <p className="font-medium capitalize">{schedule.venue}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule.isRecurring && (
              <div>
                <Label className="text-muted-foreground">Recurring Pattern</Label>
                <p className="font-medium capitalize">{schedule.recurringPattern || 'N/A'}</p>
              </div>
            )}
            {schedule.maxAttendees && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Max Attendees
                </Label>
                <p className="font-medium">{schedule.maxAttendees}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Requires Transportation</Label>
              <p className="font-medium">
                {schedule.requiresTransportation ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-gray-600">
                    <XCircle className="h-4 w-4" />
                    No
                  </span>
                )}
              </p>
            </div>
            {schedule.specialInstructions && (
              <div>
                <Label className="text-muted-foreground">Special Instructions</Label>
                <p className="mt-1 text-gray-700">{schedule.specialInstructions}</p>
              </div>
            )}
            {schedule.createdBy && (
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <p className="font-medium">
                  {schedule.createdBy.firstName} {schedule.createdBy.lastName}
                </p>
              </div>
            )}
            {schedule.createdAt && (
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="font-medium">{formatDate(schedule.createdAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Slots */}
      {schedule.timeSlots && schedule.timeSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Slots
            </CardTitle>
            <CardDescription>
              Detailed time slots for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.timeSlots.map((slot, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-gray-800">
                      {formatDate(slot.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                  </div>
                  {slot.description && (
                    <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Link href={`/super-admin/sports/schedule/${scheduleId}/edit`}>
          <Button variant="outline">
            Edit Event
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SportsScheduleViewPage;

