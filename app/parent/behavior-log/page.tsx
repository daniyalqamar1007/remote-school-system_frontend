'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, AlertTriangle, FileText, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '../context/StudentContext';

interface BehaviorIncident {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  type: string;
  description: string;
  location: string;
  date: string;
  time: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: {
    firstName: string;
    lastName: string;
    role: string;
  };
  action: string;
  consequence?: {
    type: string;
    duration: string;
    startDate: string;
    endDate?: string;
    description: string;
  };
  status: 'pending' | 'resolved' | 'ongoing';
  parentNotified: boolean;
  parentContact?: {
    method: string;
    date: string;
    contactedBy: string;
    notes: string;
  };
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
}

const BehaviorIncidentLogPage = () => {
  const { selectedStudent } = useStudent();
  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<BehaviorIncident | null>(null);

  useEffect(() => {
    if (selectedStudent) {
      fetchBehaviorIncidents();
    }
  }, [selectedStudent]);

  const fetchBehaviorIncidents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/behavior/student/${selectedStudent?._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      } else {
        toast.error('Failed to fetch behavior incidents');
      }
    } catch (error) {
      console.error('Error fetching behavior incidents:', error);
      toast.error('Error fetching behavior incidents');
    } finally {
      setLoading(false);
    }
  };

  const downloadIncidentLetter = async (incidentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/behavior/incident/${incidentId}/letter`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `incident_letter_${incidentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Incident letter downloaded successfully');
      } else {
        toast.error('Failed to download incident letter');
      }
    } catch (error) {
      console.error('Error downloading incident letter:', error);
      toast.error('Error downloading incident letter');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      low: "outline",
      medium: "default",
      high: "secondary",
      critical: "destructive"
    };
    
    const colors = {
      low: "text-green-700 bg-green-100",
      medium: "text-yellow-700 bg-yellow-100",
      high: "text-orange-700 bg-orange-100",
      critical: "text-red-700 bg-red-100"
    };

    return (
      <Badge variant={variants[severity] || "outline"} className={colors[severity as keyof typeof colors]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      resolved: "secondary",
      ongoing: "default"
    };
    
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  if (!selectedStudent) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Please select a student to view behavior incidents</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Behavior Incident Log</h1>
        <p className="text-gray-600">
          Behavior incidents for {selectedStudent.firstName} {selectedStudent.lastName}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No behavior incidents recorded</p>
            <p className="text-sm text-gray-400 mt-2">Great job maintaining good behavior!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{incident.type}</h3>
                      {getSeverityBadge(incident.severity)}
                      {getStatusBadge(incident.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(incident.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {incident.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {incident.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {incident.reportedBy.firstName} {incident.reportedBy.lastName} ({incident.reportedBy.role})
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedIncident(selectedIncident?._id === incident._id ? null : incident)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedIncident?._id === incident._id ? 'Hide Details' : 'View Details'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => downloadIncidentLetter(incident._id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Letter
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Description:</h4>
                    <p className="text-sm">{incident.description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Action Taken:</h4>
                    <p className="text-sm">{incident.action}</p>
                  </div>

                  {incident.consequence && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Consequence:</h4>
                      <p className="text-sm">
                        {incident.consequence.type} - {incident.consequence.duration}
                        {incident.consequence.startDate && (
                          <span className="text-gray-500 ml-2">
                            (Starting: {new Date(incident.consequence.startDate).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                      {incident.consequence.description && (
                        <p className="text-xs text-gray-600 mt-1">{incident.consequence.description}</p>
                      )}
                    </div>
                  )}

                  {incident.parentNotified && incident.parentContact && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-blue-800 mb-1">Parent Contact Information:</h4>
                      <div className="text-sm text-blue-700">
                        <p>Method: {incident.parentContact.method}</p>
                        <p>Date: {new Date(incident.parentContact.date).toLocaleDateString()}</p>
                        <p>Contacted by: {incident.parentContact.contactedBy}</p>
                        {incident.parentContact.notes && (
                          <p className="mt-1">Notes: {incident.parentContact.notes}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedIncident?._id === incident._id && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <div className="text-xs text-gray-500">
                        <p>Incident ID: {incident._id}</p>
                        <p>Created: {new Date(incident.createdAt).toLocaleString()}</p>
                        {incident.followUpRequired && incident.followUpDate && (
                          <p>Follow-up Required: {new Date(incident.followUpDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BehaviorIncidentLogPage;
