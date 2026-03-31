"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, CalendarDays, MapPin, Clock, Users, Edit, Trash2, 
  Download, Upload, Filter, Search, Bell, CheckCircle 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import axios from "axios";

interface SchoolEvent {
  _id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  targetAudience: string[];
  maxParticipants?: number;
  currentParticipants: number;
  requiresRSVP: boolean;
  isRecurring: boolean;
  recurrencePattern?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  isPublic: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface EventParticipant {
  _id: string;
  eventId: string;
  participantId: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
  rsvpStatus: string;
  rsvpDate: string;
  notes: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CalendarManagement() {
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form states
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    type: "academic",
    category: "general",
    startDate: new Date(),
    endDate: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    targetAudience: [] as string[],
    maxParticipants: 0,
    requiresRSVP: false,
    isRecurring: false,
    recurrencePattern: "weekly",
    isPublic: true
  });

  const eventTypes = [
    "academic", "sports", "cultural", "administrative", 
    "parent-meeting", "professional-development", "holiday", "other"
  ];

  const eventCategories = [
    "general", "urgent", "announcement", "meeting", 
    "workshop", "ceremony", "competition", "fundraising"
  ];

  const targetAudiences = [
    "all", "parents", "students", "teachers", "staff", 
    "grade-6", "grade-7", "grade-8", "grade-9", "grade-10", "grade-11", "grade-12"
  ];

  const recurrencePatterns = [
    "daily", "weekly", "bi-weekly", "monthly", "quarterly", "annually"
  ];

  useEffect(() => {
    fetchEvents();
  }, [filterType, filterStatus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/calendar/events`, {
        params: { type: filterType !== "all" ? filterType : undefined, status: filterStatus !== "all" ? filterStatus : undefined },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const fetchEventParticipants = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/calendar/events/${eventId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setParticipants(response.data);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to fetch participants");
    }
  };

  const createEvent = async () => {
    try {
      const eventData = {
        ...eventForm,
        startDate: eventForm.startDate.toISOString(),
        endDate: eventForm.endDate.toISOString(),
        maxParticipants: eventForm.maxParticipants > 0 ? eventForm.maxParticipants : undefined
      };
      
      await axios.post(`${API_BASE}/calendar/events`, eventData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success("Event created successfully");
      setShowEventDialog(false);
      resetEventForm();
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    }
  };

  const updateEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const eventData = {
        ...eventForm,
        startDate: eventForm.startDate.toISOString(),
        endDate: eventForm.endDate.toISOString(),
        maxParticipants: eventForm.maxParticipants > 0 ? eventForm.maxParticipants : undefined
      };
      
      await axios.put(`${API_BASE}/calendar/events/${selectedEvent._id}`, eventData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success("Event updated successfully");
      setShowEventDialog(false);
      setSelectedEvent(null);
      resetEventForm();
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await axios.delete(`${API_BASE}/calendar/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const sendEventNotification = async (eventId: string) => {
    try {
      await axios.post(`${API_BASE}/calendar/events/${eventId}/notify`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success("Notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      type: "academic",
      category: "general",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      targetAudience: [],
      maxParticipants: 0,
      requiresRSVP: false,
      isRecurring: false,
      recurrencePattern: "weekly",
      isPublic: true
    });
  };

  const openEditDialog = (event: SchoolEvent) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      type: event.type,
      category: event.category,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      targetAudience: event.targetAudience,
      maxParticipants: event.maxParticipants || 0,
      requiresRSVP: event.requiresRSVP,
      isRecurring: event.isRecurring,
      recurrencePattern: event.recurrencePattern || "weekly",
      isPublic: event.isPublic
    });
    setShowEventDialog(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-500';
      case 'sports': return 'bg-green-500';
      case 'cultural': return 'bg-purple-500';
      case 'parent-meeting': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar Management</h1>
          <p className="text-gray-600">Manage school events and activities</p>
        </div>
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedEvent(null); resetEventForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Annual Science Fair"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="School Auditorium"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <Select value={eventForm.type} onValueChange={(value) => setEventForm({ ...eventForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('-', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={eventForm.category} onValueChange={(value) => setEventForm({ ...eventForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('-', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {eventForm.startDate ? format(eventForm.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventForm.startDate}
                        onSelect={(date) => date && setEventForm({ ...eventForm, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {eventForm.endDate ? format(eventForm.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventForm.endDate}
                        onSelect={(date) => date && setEventForm({ ...eventForm, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Target Audience</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {targetAudiences.map(audience => (
                    <label key={audience} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={eventForm.targetAudience.includes(audience)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEventForm({
                              ...eventForm,
                              targetAudience: [...eventForm.targetAudience, audience]
                            });
                          } else {
                            setEventForm({
                              ...eventForm,
                              targetAudience: eventForm.targetAudience.filter(a => a !== audience)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{audience.replace('-', ' ').toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxParticipants">Max Participants (0 = unlimited)</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="0"
                    value={eventForm.maxParticipants}
                    onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresRSVP"
                      checked={eventForm.requiresRSVP}
                      onChange={(e) => setEventForm({ ...eventForm, requiresRSVP: e.target.checked })}
                    />
                    <Label htmlFor="requiresRSVP">Requires RSVP</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={eventForm.isPublic}
                      onChange={(e) => setEventForm({ ...eventForm, isPublic: e.target.checked })}
                    />
                    <Label htmlFor="isPublic">Public Event</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={eventForm.isRecurring}
                      onChange={(e) => setEventForm({ ...eventForm, isRecurring: e.target.checked })}
                    />
                    <Label htmlFor="isRecurring">Recurring Event</Label>
                  </div>
                </div>
              </div>

              {eventForm.isRecurring && (
                <div>
                  <Label>Recurrence Pattern</Label>
                  <Select value={eventForm.recurrencePattern} onValueChange={(value) => setEventForm({ ...eventForm, recurrencePattern: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrencePatterns.map(pattern => (
                        <SelectItem key={pattern} value={pattern}>
                          {pattern.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={selectedEvent ? updateEvent : createEvent}>
                  {selectedEvent ? "Update Event" : "Create Event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Search Events</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('-', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <Card key={event._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        {event.title}
                        <Badge className={getTypeBadgeColor(event.type)}>
                          {event.type}
                        </Badge>
                        <Badge className={getStatusBadgeColor(event.status)}>
                          {event.status}
                        </Badge>
                        {event.requiresRSVP && <Badge variant="outline">RSVP Required</Badge>}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendEventNotification(event._id)}
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Notify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(event)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEvent(event._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                      <span>
                        {format(new Date(event.startDate), "MMM dd")} - {format(new Date(event.endDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>
                        {event.currentParticipants}
                        {event.maxParticipants ? `/${event.maxParticipants}` : ""} participants
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-sm text-gray-600">Target Audience: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {event.targetAudience.map(audience => (
                        <Badge key={audience} variant="outline" className="text-xs">
                          {audience.replace('-', ' ').toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600 mb-4">Create your first event to get started.</p>
                <Button onClick={() => setShowEventDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Calendar view integration coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select an event to view participants...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Total Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{events.length}</div>
                <p className="text-sm text-gray-600">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Active Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {events.filter(e => e.status === 'active').length}
                </div>
                <p className="text-sm text-gray-600">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Total Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {events.reduce((sum, event) => sum + event.currentParticipants, 0)}
                </div>
                <p className="text-sm text-gray-600">Across all events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  RSVP Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {events.filter(e => e.requiresRSVP).length}
                </div>
                <p className="text-sm text-gray-600">Require RSVP</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
