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
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, FileText, Users, Calendar as CalendarIcon, Target, 
  BookOpen, Settings, AlertCircle, TrendingUp, Clock,
  Edit, Eye, Download, CheckCircle, XCircle 
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
  teamMembers: string[];
  caseManager: string;
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
}

interface Accommodation {
  subject: string;
  type: string;
  description: string;
  frequency: string;
  isActive: boolean;
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
}

interface ServiceLog {
  _id: string;
  studentId: {
    firstName: string;
    lastName: string;
  };
  serviceType: string;
  serviceDate: string;
  duration: number;
  provider: string;
  sessionNotes: string;
  progressNotes: string;
  studentResponse: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function IEPManagement() {
  const [activeTab, setActiveTab] = useState("ieps");
  const [ieps, setIEPs] = useState<IEP[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showIEPDialog, setShowIEPDialog] = useState(false);
  const [showServiceLogDialog, setShowServiceLogDialog] = useState(false);
  const [selectedIEP, setSelectedIEP] = useState<IEP | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    classification: "",
    academicYear: "2024-2025"
  });

  // Form states
  const [iepForm, setIEPForm] = useState({
    studentId: "",
    type: "IEP",
    classification: "",
    startDate: new Date(),
    endDate: new Date(),
    reviewDate: new Date(),
    academicYear: "2024-2025",
    disabilities: [] as string[],
    teamMembers: [] as string[],
    caseManager: "",
    currentPerformance: {
      academic: "",
      functional: "",
      behavioral: ""
    }
  });

  const [goalForm, setGoalForm] = useState({
    subject: "",
    category: "academic",
    description: "",
    measurableOutcomes: [""],
    timeline: "",
    responsibleStaff: [] as string[]
  });

  const [serviceLogForm, setServiceLogForm] = useState({
    iepId: "",
    studentId: "",
    serviceType: "",
    serviceDate: new Date(),
    duration: 30,
    provider: "",
    location: "",
    sessionNotes: "",
    progressNotes: "",
    studentResponse: "",
    goalsAddressed: [] as string[]
  });

  const iepTypes = ["IEP", "IIP", "504"];
  const classifications = [
    "Autism", "ADHD", "SLD", "Intellectual Disability", 
    "Speech/Language Impairment", "Other Health Impairment",
    "Multiple Disabilities", "Emotional Disturbance"
  ];
  const serviceTypes = [
    "Speech Therapy", "Occupational Therapy", "Physical Therapy",
    "Counseling", "Resource Room", "Behavioral Support",
    "Assistive Technology", "Transportation"
  ];
  const goalCategories = ["academic", "behavioral", "functional", "social"];

  useEffect(() => {
    fetchIEPs();
    fetchServiceLogs();
  }, [filters]);

  const fetchIEPs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/iep`, {
        params: filters,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setIEPs(response.data);
    } catch (error) {
      console.error("Error fetching IEPs:", error);
      toast.error("Failed to fetch IEPs");
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/iep/service-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setServiceLogs(response.data);
    } catch (error) {
      console.error("Error fetching service logs:", error);
      toast.error("Failed to fetch service logs");
    }
  };

  const createIEP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/iep`, iepForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      toast.success("IEP created successfully");
      setShowIEPDialog(false);
      resetIEPForm();
      fetchIEPs();
    } catch (error) {
      console.error("Error creating IEP:", error);
      toast.error("Failed to create IEP");
    }
  };

  const addGoal = async () => {
    if (!selectedIEP) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/iep/${selectedIEP._id}/goals`, goalForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      toast.success("Goal added successfully");
      setShowGoalDialog(false);
      resetGoalForm();
      fetchIEPs();
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Failed to add goal");
    }
  };

  const createServiceLog = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/iep/service-logs`, serviceLogForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      toast.success("Service log created successfully");
      setShowServiceLogDialog(false);
      resetServiceLogForm();
      fetchServiceLogs();
    } catch (error) {
      console.error("Error creating service log:", error);
      toast.error("Failed to create service log");
    }
  };

  const updateGoalProgress = async (iepId: string, goalId: string, progress: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/iep/${iepId}/goals/${goalId}/progress`, {
        progress
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      toast.success("Goal progress updated");
      fetchIEPs();
    } catch (error) {
      console.error("Error updating goal progress:", error);
      toast.error("Failed to update goal progress");
    }
  };

  const resetIEPForm = () => {
    setIEPForm({
      studentId: "",
      type: "IEP",
      classification: "",
      startDate: new Date(),
      endDate: new Date(),
      reviewDate: new Date(),
      academicYear: "2024-2025",
      disabilities: [],
      teamMembers: [],
      caseManager: "",
      currentPerformance: {
        academic: "",
        functional: "",
        behavioral: ""
      }
    });
  };

  const resetGoalForm = () => {
    setGoalForm({
      subject: "",
      category: "academic",
      description: "",
      measurableOutcomes: [""],
      timeline: "",
      responsibleStaff: []
    });
  };

  const resetServiceLogForm = () => {
    setServiceLogForm({
      iepId: "",
      studentId: "",
      serviceType: "",
      serviceDate: new Date(),
      duration: 30,
      provider: "",
      location: "",
      sessionNotes: "",
      progressNotes: "",
      studentResponse: "",
      goalsAddressed: []
    });
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'IEP': return 'bg-blue-500';
      case 'IIP': return 'bg-purple-500';
      case '504': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const addMeasurableOutcome = () => {
    setGoalForm({
      ...goalForm,
      measurableOutcomes: [...goalForm.measurableOutcomes, ""]
    });
  };

  const updateMeasurableOutcome = (index: number, value: string) => {
    const updated = [...goalForm.measurableOutcomes];
    updated[index] = value;
    setGoalForm({ ...goalForm, measurableOutcomes: updated });
  };

  const removeMeasurableOutcome = (index: number) => {
    const updated = goalForm.measurableOutcomes.filter((_, i) => i !== index);
    setGoalForm({ ...goalForm, measurableOutcomes: updated });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IEP/IIP Management</h1>
          <p className="text-gray-600">Manage Individualized Education and Intervention Plans</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showServiceLogDialog} onOpenChange={setShowServiceLogDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Log Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Service Log</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Service Type</Label>
                    <Select value={serviceLogForm.serviceType} onValueChange={(value) => setServiceLogForm({ ...serviceLogForm, serviceType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={serviceLogForm.duration}
                      onChange={(e) => setServiceLogForm({ ...serviceLogForm, duration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={serviceLogForm.provider}
                      onChange={(e) => setServiceLogForm({ ...serviceLogForm, provider: e.target.value })}
                      placeholder="Service provider name"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={serviceLogForm.location}
                      onChange={(e) => setServiceLogForm({ ...serviceLogForm, location: e.target.value })}
                      placeholder="Session location"
                    />
                  </div>
                </div>

                <div>
                  <Label>Session Notes</Label>
                  <Textarea
                    value={serviceLogForm.sessionNotes}
                    onChange={(e) => setServiceLogForm({ ...serviceLogForm, sessionNotes: e.target.value })}
                    placeholder="What happened during this session..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Progress Notes</Label>
                  <Textarea
                    value={serviceLogForm.progressNotes}
                    onChange={(e) => setServiceLogForm({ ...serviceLogForm, progressNotes: e.target.value })}
                    placeholder="Student progress towards goals..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Student Response</Label>
                  <Textarea
                    value={serviceLogForm.studentResponse}
                    onChange={(e) => setServiceLogForm({ ...serviceLogForm, studentResponse: e.target.value })}
                    placeholder="How did the student respond..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowServiceLogDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createServiceLog}>
                    Create Service Log
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showIEPDialog} onOpenChange={setShowIEPDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create IEP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New IEP/IIP</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={iepForm.type} onValueChange={(value) => setIEPForm({ ...iepForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iepTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Classification</Label>
                    <Select value={iepForm.classification} onValueChange={(value) => setIEPForm({ ...iepForm, classification: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent>
                        {classifications.map(classification => (
                          <SelectItem key={classification} value={classification}>{classification}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {iepForm.startDate ? format(iepForm.startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={iepForm.startDate}
                          onSelect={(date) => date && setIEPForm({ ...iepForm, startDate: date })}
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
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {iepForm.endDate ? format(iepForm.endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={iepForm.endDate}
                          onSelect={(date) => date && setIEPForm({ ...iepForm, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Review Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {iepForm.reviewDate ? format(iepForm.reviewDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={iepForm.reviewDate}
                          onSelect={(date) => date && setIEPForm({ ...iepForm, reviewDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label>Academic Performance</Label>
                  <Textarea
                    value={iepForm.currentPerformance.academic}
                    onChange={(e) => setIEPForm({
                      ...iepForm,
                      currentPerformance: {
                        ...iepForm.currentPerformance,
                        academic: e.target.value
                      }
                    })}
                    placeholder="Current academic performance level..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Functional Performance</Label>
                    <Textarea
                      value={iepForm.currentPerformance.functional}
                      onChange={(e) => setIEPForm({
                        ...iepForm,
                        currentPerformance: {
                          ...iepForm.currentPerformance,
                          functional: e.target.value
                        }
                      })}
                      placeholder="Current functional performance..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Behavioral Performance</Label>
                    <Textarea
                      value={iepForm.currentPerformance.behavioral}
                      onChange={(e) => setIEPForm({
                        ...iepForm,
                        currentPerformance: {
                          ...iepForm.currentPerformance,
                          behavioral: e.target.value
                        }
                      })}
                      placeholder="Current behavioral performance..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowIEPDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createIEP}>
                    Create IEP
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {iepTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select value={filters.classification} onValueChange={(value) => setFilters({ ...filters, classification: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All classifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classifications</SelectItem>
                  {classifications.map(classification => (
                    <SelectItem key={classification} value={classification}>{classification}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ieps">IEPs/IIPs</TabsTrigger>
          <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
          <TabsTrigger value="services">Service Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="ieps" className="space-y-4">
          <div className="grid gap-4">
            {ieps.map((iep) => (
              <Card key={iep._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {iep.studentId.firstName} {iep.studentId.lastName}
                        <Badge className={getTypeBadgeColor(iep.type)}>
                          {iep.type}
                        </Badge>
                        <Badge className={getStatusBadgeColor(iep.status)}>
                          {iep.status}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {iep.iepId} • Grade {iep.studentId.gradeLevel} • {iep.classification}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIEP(iep);
                          setShowGoalDialog(true);
                        }}
                      >
                        <Target className="h-4 w-4 mr-1" />
                        Add Goal
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium">{format(new Date(iep.startDate), "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">End Date:</span>
                      <p className="font-medium">{format(new Date(iep.endDate), "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Goals:</span>
                      <p className="font-medium">{iep.goals?.length || 0} goals</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Services:</span>
                      <p className="font-medium">{iep.services?.length || 0} services</p>
                    </div>
                  </div>
                  
                  {iep.goals && iep.goals.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Recent Goals</h4>
                      <div className="space-y-2">
                        {iep.goals.slice(0, 2).map((goal) => (
                          <div key={goal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{goal.subject} - {goal.category}</p>
                              <p className="text-xs text-gray-600 truncate">{goal.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={goal.currentProgress} className="w-20" />
                              <span className="text-xs text-gray-600">{goal.currentProgress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {ieps.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No IEPs Found</h3>
                <p className="text-gray-600 mb-4">Create your first IEP to get started.</p>
                <Button onClick={() => setShowIEPDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create IEP
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {ieps.map((iep) => (
              <div key={iep._id}>
                {iep.goals && iep.goals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{iep.studentId.firstName} {iep.studentId.lastName} - Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {iep.goals.map((goal) => (
                          <div key={goal.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{goal.subject} - {goal.category}</h4>
                                <p className="text-sm text-gray-600">{goal.description}</p>
                              </div>
                              <Badge variant="outline">{goal.timeline}</Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Progress</span>
                                <span className="text-sm font-medium">{goal.currentProgress}%</span>
                              </div>
                              <Progress value={goal.currentProgress} />
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  Last updated: {format(new Date(goal.lastUpdated), "MMM dd, yyyy")}
                                </span>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-20 h-8"
                                    placeholder="Progress"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        const value = parseInt(e.currentTarget.value);
                                        if (value >= 0 && value <= 100) {
                                          updateGoalProgress(iep._id, goal.id, value);
                                          e.currentTarget.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <Button size="sm" variant="outline">
                                    Update
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {goal.measurableOutcomes && goal.measurableOutcomes.length > 0 && (
                              <div className="mt-3">
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
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">
                        {log.studentId.firstName} {log.studentId.lastName}
                      </TableCell>
                      <TableCell>{log.serviceType}</TableCell>
                      <TableCell>{format(new Date(log.serviceDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{log.duration} min</TableCell>
                      <TableCell>{log.provider}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.sessionNotes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Total IEPs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ieps.length}</div>
                <p className="text-sm text-gray-600">Active students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Total Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {ieps.reduce((sum, iep) => sum + (iep.goals?.length || 0), 0)}
                </div>
                <p className="text-sm text-gray-600">Across all IEPs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Service Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{serviceLogs.length}</div>
                <p className="text-sm text-gray-600">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Avg Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {ieps.length > 0 
                    ? Math.round(ieps.reduce((sum, iep) => {
                        const goalCount = iep.goals?.length || 0;
                        const goalProgress = iep.goals?.reduce((gSum, goal) => gSum + goal.currentProgress, 0) || 0;
                        return sum + (goalCount > 0 ? goalProgress / goalCount : 0);
                      }, 0) / ieps.length)
                    : 0
                  }%
                </div>
                <p className="text-sm text-gray-600">Goal completion</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Goal to IEP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject</Label>
                <Input
                  value={goalForm.subject}
                  onChange={(e) => setGoalForm({ ...goalForm, subject: e.target.value })}
                  placeholder="Mathematics, Reading, etc."
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={goalForm.category} onValueChange={(value) => setGoalForm({ ...goalForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Goal Description</Label>
              <Textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                placeholder="By the end of the IEP year, when given..."
                rows={3}
              />
            </div>

            <div>
              <Label>Timeline</Label>
              <Input
                value={goalForm.timeline}
                onChange={(e) => setGoalForm({ ...goalForm, timeline: e.target.value })}
                placeholder="By end of semester, quarterly, etc."
              />
            </div>

            <div>
              <Label>Measurable Outcomes</Label>
              <div className="space-y-2">
                {goalForm.measurableOutcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={outcome}
                      onChange={(e) => updateMeasurableOutcome(index, e.target.value)}
                      placeholder="Student will..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMeasurableOutcome(index)}
                      disabled={goalForm.measurableOutcomes.length === 1}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addMeasurableOutcome}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Outcome
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addGoal}>
                Add Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
