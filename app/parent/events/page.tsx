"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarDays, MapPin, Clock, Users, Search, Filter,
  CheckCircle, XCircle, AlertCircle, Calendar, Download,
  Bell, Star, Heart, Coffee, Music, GraduationCap
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
  status: string;
  isPublic: boolean;
  createdAt: string;
}

interface EventRSVP {
  _id: string;
  eventId: string;
  participantId: string;
  rsvpStatus: string;
  rsvpDate: string;
  notes: string;
  attendeeCount: number;
  specialRequests: string;
}

interface MyEventParticipation {
  event: SchoolEvent;
  rsvp: EventRSVP;
  canModify: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ParentEventsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [myEvents, setMyEvents] = useState<MyEventParticipation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

  // RSVP Form
  const [rsvpForm, setRSVPForm] = useState({
    status: "yes",
    attendeeCount: 1,
    notes: "",
    specialRequests: ""
  });

  const eventTypes = [
    "academic", "sports", "cultural", "parent-meeting", 
    "workshop", "ceremony", "fundraising", "social"
  ];

  const eventCategories = [
    "general", "urgent", "meeting", "workshop", 
    "ceremony", "competition", "fundraising", "social"
  ];

  const rsvpStatuses = [
    { value: "yes", label: "Yes, I'll attend", icon: CheckCircle, color: "text-green-600" },
    { value: "no", label: "No, I can't attend", icon: XCircle, color: "text-red-600" },
    { value: "maybe", label: "Maybe, I'm unsure", icon: AlertCircle, color: "text-yellow-600" }
  ];

  useEffect(() => {
    fetchUpcomingEvents();
    fetchMyEvents();
  }, [filterType, filterCategory]);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/calendar/parent-events`, {
        params: { 
          type: filterType !== "all" ? filterType : undefined, 
          category: filterCategory !== "all" ? filterCategory : undefined,
          status: "active",
          audience: "parents"
        },
        withCredentials: true
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/calendar/my-events`, {
        withCredentials: true
      });
      setMyEvents(response.data);
    } catch (error) {
      console.error("Error fetching my events:", error);
      toast.error("Failed to fetch your events");
    }
  };

  const submitRSVP = async () => {
    if (!selectedEvent) return;
    
    try {
      await axios.post(`${API_BASE}/calendar/events/${selectedEvent._id}/rsvp`, rsvpForm, {
        withCredentials: true
      });
      
      toast.success("RSVP submitted successfully");
      setShowRSVPDialog(false);
      setSelectedEvent(null);
      setRSVPForm({
        status: "yes",
        attendeeCount: 1,
        notes: "",
        specialRequests: ""
      });
      fetchUpcomingEvents();
      fetchMyEvents();
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      toast.error("Failed to submit RSVP");
    }
  };

  const updateRSVP = async (eventId: string, newStatus: string) => {
    try {
      await axios.put(`${API_BASE}/calendar/events/${eventId}/rsvp`, {
        status: newStatus
      }, {
        withCredentials: true
      });
      
      toast.success("RSVP updated successfully");
      fetchMyEvents();
    } catch (error) {
      console.error("Error updating RSVP:", error);
      toast.error("Failed to update RSVP");
    }
  };

  const downloadEventDetails = async (eventId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/calendar/events/${eventId}/details`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-details-${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Event details downloaded");
    } catch (error) {
      console.error("Error downloading event details:", error);
      toast.error("Failed to download event details");
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return GraduationCap;
      case 'sports': return Star;
      case 'cultural': return Music;
      case 'parent-meeting': return Users;
      case 'social': return Coffee;
      default: return Calendar;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-500';
      case 'sports': return 'bg-green-500';
      case 'cultural': return 'bg-purple-500';
      case 'parent-meeting': return 'bg-orange-500';
      case 'social': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'yes': return 'bg-green-500';
      case 'no': return 'bg-red-500';
      case 'maybe': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const openRSVPDialog = (event: SchoolEvent) => {
    setSelectedEvent(event);
    setShowRSVPDialog(true);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.startDate) >= new Date()
  );

  const pastEvents = myEvents.filter(participation => 
    new Date(participation.event.endDate) < new Date()
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-blue-500" />
            School Events & Activities
          </h1>
          <p className="text-gray-600">Stay updated with school events and manage your participation</p>
        </div>
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
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {eventCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="registered">My Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {upcomingEvents.map((event) => {
              const EventIcon = getEventTypeIcon(event.type);
              const isRSVPRequired = event.requiresRSVP;
              const isFull = event.maxParticipants && event.currentParticipants >= event.maxParticipants;
              
              return (
                <Card key={event._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <EventIcon className="h-5 w-5" />
                          {event.title}
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type.replace('-', ' ')}
                          </Badge>
                          {event.category !== 'general' && (
                            <Badge variant="outline">{event.category}</Badge>
                          )}
                          {isRSVPRequired && <Badge variant="outline">RSVP Required</Badge>}
                          {isFull && <Badge variant="destructive">Full</Badge>}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {isRSVPRequired && !isFull && (
                          <Button onClick={() => openRSVPDialog(event)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            RSVP
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadEventDetails(event._id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        <span>
                          {format(new Date(event.startDate), "MMM dd")}
                          {event.startDate !== event.endDate && 
                            ` - ${format(new Date(event.endDate), "MMM dd")}`
                          }
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
              );
            })}
          </div>

          {upcomingEvents.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
                <p className="text-gray-600">No events match your current filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="registered" className="space-y-4">
          <div className="grid gap-4">
            {myEvents.filter(p => new Date(p.event.endDate) >= new Date()).map((participation) => {
              const event = participation.event;
              const rsvp = participation.rsvp;
              const EventIcon = getEventTypeIcon(event.type);
              
              return (
                <Card key={participation.event._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <EventIcon className="h-5 w-5" />
                          {event.title}
                          <Badge className={getRSVPStatusColor(rsvp.rsvpStatus)}>
                            {rsvp.rsvpStatus.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {participation.canModify && (
                          <div className="flex gap-1">
                            {rsvpStatuses.map(status => {
                              const StatusIcon = status.icon;
                              return (
                                <Button
                                  key={status.value}
                                  variant={rsvp.rsvpStatus === status.value ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => updateRSVP(event._id, status.value)}
                                >
                                  <StatusIcon className="h-4 w-4 mr-1" />
                                  {status.value.toUpperCase()}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        <span>{format(new Date(event.startDate), "MMM dd, yyyy")}</span>
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
                        <span>{rsvp.attendeeCount} attendee(s)</span>
                      </div>
                    </div>
                    
                    {rsvp.notes && (
                      <div className="mt-3">
                        <span className="text-sm text-gray-600">Your Notes: </span>
                        <p className="text-sm">{rsvp.notes}</p>
                      </div>
                    )}
                    
                    {rsvp.specialRequests && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Special Requests: </span>
                        <p className="text-sm">{rsvp.specialRequests}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {myEvents.filter(p => new Date(p.event.endDate) >= new Date()).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Registered Events</h3>
                <p className="text-gray-600">You haven't registered for any upcoming events yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <div className="grid gap-4">
            {pastEvents.map((participation) => {
              const event = participation.event;
              const rsvp = participation.rsvp;
              const EventIcon = getEventTypeIcon(event.type);
              
              return (
                <Card key={participation.event._id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <EventIcon className="h-5 w-5" />
                          {event.title}
                          <Badge variant="secondary">Past Event</Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        <span>{format(new Date(event.startDate), "MMM dd, yyyy")}</span>
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
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Attended</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {pastEvents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Past Events</h3>
                <p className="text-gray-600">No past event participation to display.</p>
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
                <p className="text-gray-600">Interactive calendar view coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* RSVP Dialog */}
      <Dialog open={showRSVPDialog} onOpenChange={setShowRSVPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RSVP for Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-medium">{selectedEvent.title}</h4>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedEvent.startDate), "MMM dd, yyyy")} • {selectedEvent.startTime} - {selectedEvent.endTime}
                </p>
                <p className="text-sm text-gray-600">{selectedEvent.location}</p>
              </div>
              
              <div>
                <Label>Will you attend?</Label>
                <Select value={rsvpForm.status} onValueChange={(value) => setRSVPForm({ ...rsvpForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rsvpStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {rsvpForm.status === "yes" && (
                <div>
                  <Label>Number of Attendees</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={rsvpForm.attendeeCount}
                    onChange={(e) => setRSVPForm({ ...rsvpForm, attendeeCount: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={rsvpForm.notes}
                  onChange={(e) => setRSVPForm({ ...rsvpForm, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Special Requests (Optional)</Label>
                <Textarea
                  value={rsvpForm.specialRequests}
                  onChange={(e) => setRSVPForm({ ...rsvpForm, specialRequests: e.target.value })}
                  placeholder="Accessibility needs, dietary restrictions, etc."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRSVPDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={submitRSVP}>
                  Submit RSVP
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
