'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '../context/StudentContext';

interface AbsenceNote {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  absenceDate: string;
  reason: string;
  description: string;
  supportingDocument?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  reviewedBy?: {
    name: string;
    role: string;
  };
  reviewDate?: string;
  reviewNotes?: string;
}

const AbsenceNotePage = () => {
  const { selectedStudent } = useStudent();
  const [absenceNotes, setAbsenceNotes] = useState<AbsenceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    absenceDate: '',
    reason: '',
    description: '',
    supportingDocument: null as File | null
  });

  const absenceReasons = [
    'Illness/Medical',
    'Medical Appointment',
    'Family Emergency',
    'Religious Observance',
    'Educational Trip',
    'Bereavement',
    'Other'
  ];

  useEffect(() => {
    if (selectedStudent) {
      fetchAbsenceNotes();
    }
  }, [selectedStudent]);

  const fetchAbsenceNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/absence/student/${selectedStudent?._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAbsenceNotes(data);
      } else {
        toast.error('Failed to fetch absence notes');
      }
    } catch (error) {
      console.error('Error fetching absence notes:', error);
      toast.error('Error fetching absence notes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/document/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload document');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    if (!formData.absenceDate || !formData.reason || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      let documentUrl = null;
      
      // Upload document if provided
      if (formData.supportingDocument) {
        documentUrl = await handleFileUpload(formData.supportingDocument);
        if (!documentUrl) {
          setSubmitting(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/absence/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent._id,
          absenceDate: formData.absenceDate,
          reason: formData.reason,
          description: formData.description,
          supportingDocument: documentUrl
        }),
      });

      if (response.ok) {
        toast.success('Absence note submitted successfully');
        setFormData({
          absenceDate: '',
          reason: '',
          description: '',
          supportingDocument: null
        });
        fetchAbsenceNotes();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit absence note');
      }
    } catch (error) {
      console.error('Error submitting absence note:', error);
      toast.error('Error submitting absence note');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      approved: "secondary",
      rejected: "destructive"
    };
    
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      approved: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <X className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!selectedStudent) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Please select a student to manage absence notes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Absence Notes</h1>
        <p className="text-gray-600">
          Submit absence notes for {selectedStudent.firstName} {selectedStudent.lastName}
        </p>
      </div>

      {/* Submit New Absence Note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit Absence Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="absenceDate">Absence Date *</Label>
                <Input
                  id="absenceDate"
                  type="date"
                  value={formData.absenceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, absenceDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason for absence" />
                  </SelectTrigger>
                  <SelectContent>
                    {absenceReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about the absence..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Supporting Document (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="document"
                  type="file"
                  onChange={(e) => setFormData(prev => ({ ...prev, supportingDocument: e.target.files?.[0] || null }))}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {formData.supportingDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, supportingDocument: null }))}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={submitting || uploadingFile}
              className="w-full md:w-auto"
            >
              {submitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Absence Note
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Absence Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Absence Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : absenceNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No absence notes submitted yet
            </div>
          ) : (
            <div className="space-y-4">
              {absenceNotes.map((note) => (
                <div key={note._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {new Date(note.absenceDate).toLocaleDateString()}
                        </h3>
                        {getStatusBadge(note.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Reason:</strong> {note.reason}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Description:</strong> {note.description}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Submitted: {new Date(note.submittedDate).toLocaleDateString()}
                      </div>
                      {note.reviewDate && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Reviewed: {new Date(note.reviewDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {note.supportingDocument && (
                    <div className="mb-3">
                      <a
                        href={note.supportingDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        View Supporting Document
                      </a>
                    </div>
                  )}

                  {note.reviewNotes && (
                    <div className="mt-3 p-3 bg-gray-100 rounded">
                      <p className="text-sm">
                        <strong>Review Notes:</strong> {note.reviewNotes}
                      </p>
                      {note.reviewedBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reviewed by: {note.reviewedBy.name} ({note.reviewedBy.role})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AbsenceNotePage;
