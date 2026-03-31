'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Calendar, Clock, MapPin, FileText, Bell, CheckCircle, XCircle, Loader2, Play, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { IncidentType, IncidentTypeLabels, ConsequenceType, ConsequenceTypeLabels } from './enums';
import { NotificationDialog, NotificationMethod, CompletionDialog } from './NotificationDialog';

interface DisciplinaryAction {
  _id: string;
  student?: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    class?: string;
    section?: string;
  };
  studentId?: any;
  type?: string;
  actionType?: string;
  description?: string;
  reason?: string;
  location?: string;
  date?: string;
  time?: string;
  assignedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  consequence?: {
    type: string;
    duration: string;
    startDate: string;
    endDate?: string;
    description: string;
  };
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  parentNotified?: boolean;
  conductLetterGenerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  class?: string;
  section?: string;
  email: string;
}

interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TeacherDisciplinePage = () => {
  const [actions, setActions] = useState<DisciplinaryAction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Dialog states
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DisciplinaryAction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states for new action
  const [newAction, setNewAction] = useState({
    studentId: '',
    type: '',
    severity: 'minor',
    description: '',
    location: '',
    date: '',
    time: '',
    consequenceType: '',
    consequenceDuration: '',
    consequenceStartDate: '',
    consequenceDescription: '',
    verificationRequired: false
  });

  useEffect(() => {
    fetchStats();
    fetchStudents();
    fetchDisciplinaryActions(1);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchDisciplinaryActions(currentPage);
  }, [currentPage, statusFilter, pageSize, debouncedSearchTerm]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/courses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const coursesData = response.data?.data || response.data || [];
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const teacherId = localStorage.getItem('userId') || localStorage.getItem('_id') || '';
      if (!teacherId) {
        setStudents([]);
        return;
      }
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/teachers/students/assigned/${teacherId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const list = response.data?.data || response.data || [];
      const studentsArray = Array.isArray(list) ? list : [];
      setStudents(studentsArray.map((s: any) => ({
        _id: s._id || s.studentId,
        firstName: s.firstName || '',
        lastName: s.lastName || '',
        studentId: s.studentId || s._id,
        class: s.class || s.gradeLevel,
        section: s.section || '',
        email: s.email || ''
      })));
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total || 0,
          pending: data.pending || 0,
          inProgress: data.inProgress || 0,
          completed: data.completed || 0,
          cancelled: data.cancelled || 0,
        });
      } else {
        setStats({ total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDisciplinaryActions = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() })
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/actions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let actionsList = [];
        let paginationData = { page: 1, limit: pageSize, total: 0, totalPages: 0 };
        
        if (data?.data && Array.isArray(data.data)) {
          actionsList = data.data;
          paginationData = data.pagination || paginationData;
        } else if (Array.isArray(data)) {
          actionsList = data;
        } else if (data?.actions && Array.isArray(data.actions)) {
          actionsList = data.actions;
          paginationData = data.pagination || paginationData;
        }
        
        setActions(actionsList);
        setPagination(paginationData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to fetch disciplinary actions');
        setActions([]);
      }
    } catch (error) {
      console.error('Error fetching disciplinary actions:', error);
      toast.error('Error fetching disciplinary actions');
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newAction.studentId) newErrors.studentId = 'Student is required';
    if (!newAction.type) newErrors.type = 'Incident type is required';
    if (!newAction.description) newErrors.description = 'Description is required';
    if (!newAction.location) newErrors.location = 'Location is required';
    if (!newAction.date) newErrors.date = 'Date is required';
    if (!newAction.time) newErrors.time = 'Time is required';
    if (!newAction.consequenceType) newErrors.consequenceType = 'Consequence type is required';
    if (!newAction.consequenceDuration) newErrors.consequenceDuration = 'Duration is required';
    if (!newAction.consequenceStartDate) newErrors.consequenceStartDate = 'Start date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setNewAction(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAssignAction = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: newAction.studentId,
          type: newAction.type,
          actionType: newAction.consequenceType,
          reason: newAction.description,
          description: newAction.description,
          location: newAction.location,
          date: newAction.date,
          startDate: newAction.consequenceStartDate,
          time: newAction.time,
          severity: newAction.severity,
          duration: newAction.consequenceDuration,
          consequence: {
            type: newAction.consequenceType,
            duration: newAction.consequenceDuration,
            startDate: newAction.consequenceStartDate,
            description: newAction.consequenceDescription
          },
          verificationRequired: newAction.verificationRequired
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Disciplinary action assigned successfully');      
        setIsAssignDialogOpen(false);
        setNewAction({
          studentId: '',
          type: '',
          severity: 'minor',
          description: '',
          location: '',
          date: '',
          time: '',
          consequenceType: '',
          consequenceDuration: '',
          consequenceStartDate: '',
          consequenceDescription: '',
          verificationRequired: false
        });
        setErrors({});
        fetchDisciplinaryActions(currentPage);
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to assign disciplinary action');
      }
    } catch (error) {
      console.error('Error assigning action:', error);
      toast.error('Error assigning disciplinary action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyParent = async (method: NotificationMethod, notes: string) => {
    if (!selectedAction) return;
    
    try {
      setActionLoading(selectedAction._id);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/actions/${selectedAction._id}/notify-parent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, notes }),
      });

      if (response.ok) {
        toast.success('Parent notified successfully');        
        fetchDisciplinaryActions(currentPage);
      } else {
        toast.error('Failed to notify parent');
      }
    } catch (error) {
      console.error('Error notifying parent:', error);
      toast.error('Error notifying parent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartAction = async (actionId: string) => {
    try {
      setActionLoading(actionId);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/actions/${actionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'in-progress' }),
      });

      if (response.ok) {
        toast.success('Action started successfully');
        fetchDisciplinaryActions(currentPage);
        fetchStats();
      } else {
        toast.error('Failed to start action');
      }
    } catch (error) {
      console.error('Error starting action:', error);
      toast.error('Error starting action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteAction = async (notes: string) => {
    if (!selectedAction) return;
    
    try {
      setActionLoading(selectedAction._id);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/actions/${selectedAction._id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        toast.success('Action completed successfully');
        fetchDisciplinaryActions(currentPage);
        fetchStats();
      } else {
        toast.error('Failed to complete action');
      }
    } catch (error) {
      console.error('Error completing action:', error);
      toast.error('Error completing action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAction = async () => {
    if (!selectedAction) return;
    
    try {
      setActionLoading(selectedAction._id);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/actions/${selectedAction._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        toast.success('Action cancelled successfully');
        setCancelDialogOpen(false);
        setSelectedAction(null);
        fetchDisciplinaryActions(currentPage);
        fetchStats();
      } else {
        toast.error('Failed to cancel action');
      }
    } catch (error) {
      console.error('Error cancelling action:', error);
      toast.error('Error cancelling action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAction = async () => {
    if (!selectedAction) return;
    
    try {
      setActionLoading(selectedAction._id);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/actions/${selectedAction._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Disciplinary action deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedAction(null);
        fetchDisciplinaryActions(currentPage);
        fetchStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete disciplinary action');
      }
    } catch (error) {
      console.error('Error deleting action:', error);
      toast.error('Error deleting disciplinary action');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      'in-progress': "default",
      completed: "secondary",
      cancelled: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace('-', ' ').toUpperCase()}</Badge>;
  };

  const filteredActions = actions;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discipline Management</h1>
          <p className="text-gray-600">Track and manage disciplinary actions for your students</p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
          setIsAssignDialogOpen(open);
          if (open) fetchStudents();
          if (!open) {
            setErrors({});
            setNewAction({
              studentId: '',
              type: '',
              severity: 'minor',
              description: '',
              location: '',
              date: '',
              time: '',
              consequenceType: '',
              consequenceDuration: '',
              consequenceStartDate: '',
              consequenceDescription: '',
              verificationRequired: false
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white">
              <AlertTriangle className="h-4 w-4" />
              Assign Action
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                Assign Disciplinary Action
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Complete the form below to assign a disciplinary action to a student
              </p>
            </DialogHeader>
            <div className="space-y-6 p-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Student & Incident Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student" className="text-sm font-medium text-gray-700">
                      Student <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={newAction.studentId} 
                      onValueChange={(value) => handleFieldChange('studentId', value)}
                    >
                      <SelectTrigger className={`h-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.studentId ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student._id} value={student._id}>
                            {student.firstName} {student.lastName} - {student.studentId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.studentId && <p className="text-sm text-red-500">{errors.studentId}</p>}
                    {students.length === 0 && (
                      <p className="text-sm text-amber-700 mt-1">
                        No students in your assigned courses. Ask admin to assign you to courses (with grade/section) so students appear here.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                      Incident Type <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={newAction.type} 
                      onValueChange={(value) => handleFieldChange('type', value)}
                    >
                      <SelectTrigger className={`h-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.type ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(IncidentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-orange-900 mb-3">Incident Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={newAction.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder="Provide a detailed description of the incident"
                      className={`min-h-[80px] border-gray-300 focus:border-orange-500 focus:ring-orange-500 ${errors.description ? 'border-red-500' : ''}`}
                      rows={3}
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Location <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="location"
                        value={newAction.location}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        placeholder="Classroom A1"
                        className={`border-gray-300 focus:border-orange-500 focus:ring-orange-500 ${errors.location ? 'border-red-500' : ''}`}
                      />
                      {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                        Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={newAction.date}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                        className={`border-gray-300 focus:border-orange-500 focus:ring-orange-500 ${errors.date ? 'border-red-500' : ''}`}
                      />
                      {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm font-medium text-gray-700">
                        Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={newAction.time}
                        onChange={(e) => handleFieldChange('time', e.target.value)}
                        className={`border-gray-300 focus:border-orange-500 focus:ring-orange-500 ${errors.time ? 'border-red-500' : ''}`}
                      />
                      {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-red-900 mb-3">Consequence Assignment</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consequenceType" className="text-sm font-medium text-gray-700">
                        Consequence Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={newAction.consequenceType} 
                        onValueChange={(value) => handleFieldChange('consequenceType', value)}
                      >
                        <SelectTrigger className={`h-10 border-gray-300 focus:border-red-500 focus:ring-red-500 ${errors.consequenceType ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select consequence" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ConsequenceTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.consequenceType && <p className="text-sm text-red-500">{errors.consequenceType}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consequenceDuration" className="text-sm font-medium text-gray-700">
                        Duration <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="consequenceDuration"
                        value={newAction.consequenceDuration}
                        onChange={(e) => handleFieldChange('consequenceDuration', e.target.value)}
                        placeholder="1 day"
                        className={`border-gray-300 focus:border-red-500 focus:ring-red-500 ${errors.consequenceDuration ? 'border-red-500' : ''}`}
                      />
                      {errors.consequenceDuration && <p className="text-sm text-red-500">{errors.consequenceDuration}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consequenceStartDate" className="text-sm font-medium text-gray-700">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="consequenceStartDate"
                        type="date"
                        value={newAction.consequenceStartDate}
                        onChange={(e) => handleFieldChange('consequenceStartDate', e.target.value)}
                        className={`border-gray-300 focus:border-red-500 focus:ring-red-500 ${errors.consequenceStartDate ? 'border-red-500' : ''}`}
                      />
                      {errors.consequenceStartDate && <p className="text-sm text-red-500">{errors.consequenceStartDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Options</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="checkbox"
                          id="verificationRequired"
                          checked={newAction.verificationRequired}
                          onChange={(e) => handleFieldChange('verificationRequired', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="verificationRequired" className="text-sm text-gray-600">
                          Requires verification upon completion
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consequenceDescription" className="text-sm font-medium text-gray-700">Additional Details</Label>
                    <Textarea
                      id="consequenceDescription"
                      value={newAction.consequenceDescription}
                      onChange={(e) => handleFieldChange('consequenceDescription', e.target.value)}
                      placeholder="Describe any specific requirements or conditions"
                      className="min-h-[60px] border-gray-300 focus:border-red-500 focus:ring-red-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setIsAssignDialogOpen(false)}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignAction}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Action'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search by student name, incident type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Disciplinary Actions ({pagination.total})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                Page {currentPage} of {pagination.totalPages || 1}
              </Badge>
              <Badge variant="outline">
                {pageSize} per page
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Incident Type</TableHead>
                  <TableHead className="hidden md:table-cell">Date & Time</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="hidden xl:table-cell">Consequence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                          <span>Loading...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredActions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No disciplinary actions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActions.map((action) => (
                    <TableRow key={action._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {action.student?.firstName || 'Unknown'} {action.student?.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {action.student?.studentId || 'N/A'}
                            {(action.student?.class || action.student?.section) && (
                              <span className="ml-2">
                                {action.student?.class || ''}{action.student?.section ? `-${action.student.section}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">{action.type || action.actionType || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {action.date ? new Date(action.date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {action.location || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm">
                          {action.consequence?.type || action.actionType || 'N/A'}
                          {action.consequence?.duration && (
                            <span className="text-gray-500 ml-1">- {action.consequence.duration}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(action.status)}
                        {action.parentNotified && (
                          <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                            <Bell className="h-3 w-3" />
                            Notified
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground text-sm">Assign only</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
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
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => {
                let pageNum;
                const totalPages = pagination.totalPages || 1;
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
                    onClick={() => handlePageChange(pageNum)}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === (pagination.totalPages || 1) || loading}
            >
              Next
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} actions
          </div>
        </div>
      </Card>

      {/* Notification Dialog */}
      <NotificationDialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
        onSubmit={handleNotifyParent}
      />

      {/* Completion Dialog */}
      <CompletionDialog
        open={completionDialogOpen}
        onOpenChange={(open) => {
          setCompletionDialogOpen(open);
          if (!open) setSelectedAction(null);
        }}
        onSubmit={handleCompleteAction}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this disciplinary action? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCancelDialogOpen(false);
                setSelectedAction(null);
              }}
              disabled={actionLoading === selectedAction?._id}
            >
              No, Keep Action
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelAction}
              disabled={actionLoading === selectedAction?._id}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === selectedAction?._id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Action'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this disciplinary action? This action cannot be undone and will be removed from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedAction(null);
              }}
              disabled={actionLoading === selectedAction?._id}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAction}
              disabled={actionLoading === selectedAction?._id}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === selectedAction?._id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Permanently'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDisciplinePage;
