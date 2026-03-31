"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Brain, Target, BookOpen, Calendar, Clock, Users, 
  FileText, MessageSquare, Download, CheckCircle, AlertCircle,
  TrendingUp, User, Phone, Mail
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import axios from "axios";

interface IEP {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    section: string;
  };
  iepId: string;
  type: string;
  status: string;
  classification: string;
  startDate: string;
  endDate: string;
  reviewDate: string;
  nextReviewDate: string;
  academicYear: string;
  goals: Goal[];
  accommodations: Accommodation[];
  services: Service[];
  teamMembers: TeamMember[];
  caseManager: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

interface Goal {
  id: string;
  subject: string;
  category: string;
  description: string;
  measurableOutcomes: string[];
  timeline: string;
  currentProgress: number;
  responsibleStaff: string[];
  lastUpdated: string;
  status: string;
}

interface Accommodation {
  subject: string;
  type: string;
  description: string;
  frequency: string;
  isActive: boolean;
  implementation: string;
  effectiveness: string;
}

interface Service {
  type: string;
  provider: string;
  frequency: string;
  duration: string;
  location: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description: string;
}

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  responsibilities: string[];
}

interface ServiceLog {
  _id: string;
  serviceType: string;
  serviceDate: string;
  duration: number;
  provider: string;
  sessionNotes: string;
  progressNotes: string;
  studentResponse: string;
  parentFeedback?: string;
}

interface CommunicationMessage {
  _id: string;
  fromUser: {
    firstName: string;
    lastName: string;
    role: string;
  };
  toUser: {
    firstName: string;
    lastName: string;
    role: string;
  };
  subject: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ParentIEPPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [iep, setIEP] = useState<IEP | null>(null);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [communications, setCommunications] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedServiceLog, setSelectedServiceLog] = useState<ServiceLog | null>(null);
  
  // Form states
  const [feedback, setFeedback] = useState("");
  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: "",
    priority: "normal",
    recipientRole: "case-manager"
  });

  const priorityOptions = ["low", "normal", "high", "urgent"];
  const recipientRoles = [
    "case-manager", "teacher", "therapist", "counselor", "administrator"
  ];

  useEffect(() => {
    fetchIEPInformation();
    fetchServiceLogs();
    fetchCommunications();
  }, []);

  const fetchIEPInformation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/iep/parent-view`, {
        withCredentials: true
      });
      setIEP(response.data);
    } catch (error) {
      console.error("Error fetching IEP:", error);
      toast.error("Failed to fetch IEP information");
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/iep/parent-service-logs`, {
        withCredentials: true
      });
      setServiceLogs(response.data);
    } catch (error) {
      console.error("Error fetching service logs:", error);
      toast.error("Failed to fetch service logs");
    }
  };

  const fetchCommunications = async () => {
    try {
      const response = await axios.get(`${API_BASE}/iep/parent-communications`, {
        withCredentials: true
      });
      setCommunications(response.data);
    } catch (error) {
      console.error("Error fetching communications:", error);
      toast.error("Failed to fetch communications");
    }
  };

  const submitParentFeedback = async () => {
    if (!selectedServiceLog) return;
    
    try {
      await axios.post(`${API_BASE}/iep/service-logs/${selectedServiceLog._id}/parent-feedback`, {
        feedback
      }, {
        withCredentials: true
      });
      
      toast.success("Feedback submitted successfully");
      setShowFeedbackDialog(false);
      setFeedback("");
      setSelectedServiceLog(null);
      fetchServiceLogs();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const sendMessage = async () => {
    try {
      await axios.post(`${API_BASE}/iep/communications`, messageForm, {
        withCredentials: true
      });
      
      toast.success("Message sent successfully");
      setMessageForm({
        subject: "",
        message: "",
        priority: "normal",
        recipientRole: "case-manager"
      });
      fetchCommunications();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const downloadIEPDocument = async () => {
    if (!iep) return;
    
    try {
      const response = await axios.get(`${API_BASE}/iep/${iep._id}/document`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${iep.iepId}-document.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("IEP document downloaded successfully");
    } catch (error) {
      console.error("Error downloading IEP document:", error);
      toast.error("Failed to download IEP document");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      case 'draft': return 'bg-yellow-500';
      case 'under_review': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!iep) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No IEP Information Available</h3>
            <p className="text-gray-600">
              Your child does not currently have an active IEP or IIP plan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            IEP Information
          </h1>
          <p className="text-gray-600">
            {iep.studentId.firstName} {iep.studentId.lastName} • {iep.type} • Grade {iep.studentId.gradeLevel}
          </p>
        </div>
        <Button onClick={downloadIEPDocument}>
          <Download className="h-4 w-4 mr-2" />
          Download IEP
        </Button>
      </div>

      {/* IEP Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>IEP Overview</CardTitle>
            <Badge className={getStatusBadgeColor(iep.status)}>
              {iep.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">IEP ID:</span>
              <p className="font-medium">{iep.iepId}</p>
            </div>
            <div>
              <span className="text-gray-600">Classification:</span>
              <p className="font-medium">{iep.classification}</p>
            </div>
            <div>
              <span className="text-gray-600">Start Date:</span>
              <p className="font-medium">{format(new Date(iep.startDate), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <span className="text-gray-600">End Date:</span>
              <p className="font-medium">{format(new Date(iep.endDate), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <span className="text-gray-600">Next Review:</span>
              <p className="font-medium">{format(new Date(iep.nextReviewDate), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <span className="text-gray-600">Case Manager:</span>
              <p className="font-medium">
                {iep.caseManager.firstName} {iep.caseManager.lastName}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Total Goals:</span>
              <p className="font-medium">{iep.goals.length} goals</p>
            </div>
            <div>
              <span className="text-gray-600">Services:</span>
              <p className="font-medium">{iep.services.length} services</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="accommodations">Accommodations</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Goal Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {iep.goals.length > 0 
                    ? Math.round(iep.goals.reduce((sum, goal) => sum + goal.currentProgress, 0) / iep.goals.length)
                    : 0
                  }%
                </div>
                <p className="text-sm text-gray-600">Average completion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Active Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {iep.services.filter(s => s.isActive).length}
                </div>
                <p className="text-sm text-gray-600">Currently receiving</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{iep.teamMembers.length}</div>
                <p className="text-sm text-gray-600">Supporting your child</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Service Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceLogs.slice(0, 3).map((log) => (
                  <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{log.serviceType}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(log.serviceDate), "MMM dd")} • {log.duration} min • {log.provider}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedServiceLog(log);
                        setShowFeedbackDialog(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Feedback
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {iep.goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {goal.subject} - {goal.category}
                    </CardTitle>
                    <Badge variant="outline">{goal.timeline}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{goal.currentProgress}%</span>
                    </div>
                    <Progress value={goal.currentProgress} className="w-full" />
                  </div>

                  {goal.measurableOutcomes && goal.measurableOutcomes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Measurable Outcomes</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {goal.measurableOutcomes.map((outcome, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    Last updated: {format(new Date(goal.lastUpdated), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accommodations" className="space-y-4">
          <div className="grid gap-4">
            {iep.accommodations.map((accommodation, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {accommodation.subject}
                    </CardTitle>
                    <Badge variant={accommodation.isActive ? "default" : "secondary"}>
                      {accommodation.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Type:</span>
                      <p className="font-medium">{accommodation.type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Description:</span>
                      <p>{accommodation.description}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Frequency:</span>
                      <p>{accommodation.frequency}</p>
                    </div>
                    {accommodation.implementation && (
                      <div>
                        <span className="text-sm text-gray-600">Implementation:</span>
                        <p>{accommodation.implementation}</p>
                      </div>
                    )}
                    {accommodation.effectiveness && (
                      <div>
                        <span className="text-sm text-gray-600">Effectiveness:</span>
                        <p>{accommodation.effectiveness}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {iep.services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {service.type}
                    </CardTitle>
                    <Badge variant={service.isActive ? "default" : "secondary"}>
                      {service.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Provider:</span>
                      <p className="font-medium">{service.provider}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Frequency:</span>
                      <p className="font-medium">{service.frequency}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium">{service.duration}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium">{service.location}</p>
                    </div>
                  </div>
                  {service.description && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-600">Description:</span>
                      <p>{service.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4">
            {iep.teamMembers.map((member) => (
              <Card key={member._id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {member.firstName} {member.lastName}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{member.phone}</span>
                    </div>
                    {member.responsibilities && member.responsibilities.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm text-gray-600">Responsibilities:</span>
                        <ul className="text-sm mt-1 space-y-1">
                          {member.responsibilities.map((resp, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-3 w-3 mr-2 mt-1 text-blue-500" />
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Message to IEP Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Recipient</Label>
                    <Select value={messageForm.recipientRole} onValueChange={(value) => setMessageForm({ ...messageForm, recipientRole: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recipientRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.replace('-', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={messageForm.priority} onValueChange={(value) => setMessageForm({ ...messageForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(priority => (
                          <SelectItem key={priority} value={priority}>
                            {priority.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Subject</Label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    placeholder="Message subject..."
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    placeholder="Your message..."
                    rows={4}
                  />
                </div>
                <Button onClick={sendMessage}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communications.map((comm) => (
                  <div key={comm._id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {comm.fromUser.firstName} {comm.fromUser.lastName}
                        </span>
                        <Badge variant="outline">{comm.fromUser.role}</Badge>
                        <Badge className={getPriorityColor(comm.priority)}>
                          {comm.priority}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {format(new Date(comm.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <h4 className="font-medium">{comm.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1">{comm.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Parent Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Parent Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedServiceLog && (
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-medium">{selectedServiceLog.serviceType}</h4>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedServiceLog.serviceDate), "MMM dd, yyyy")} • {selectedServiceLog.provider}
                </p>
              </div>
            )}
            <div>
              <Label>Your Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your observations about how your child responded to this service session..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitParentFeedback}>
                Submit Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
