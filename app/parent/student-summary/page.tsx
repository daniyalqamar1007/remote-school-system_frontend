'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Users,
  BookOpen,
  Award,
  Heart,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '../context/StudentContext';

interface StudentSummary {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    class: string;
    section: string;
    profilePhoto: string;
  };
  academics: {
    currentGPA: number;
    recentGrades: Array<{
      subject: string;
      grade: string;
      percentage: number;
      date: string;
    }>;
    upcomingAssignments: Array<{
      title: string;
      subject: string;
      dueDate: string;
      type: string;
    }>;
  };
  attendance: {
    rate: number;
    daysPresent: number;
    totalDays: number;
    recentAbsences: Array<{
      date: string;
      type: string;
      status: string;
    }>;
  };
  behavior: {
    overallRating: string;
    recentIncidents: Array<{
      date: string;
      type: string;
      severity: string;
      status: string;
    }>;
  };
  extracurriculars: {
    clubs: Array<{
      name: string;
      role: string;
      attendanceRate: number;
    }>;
    sports: Array<{
      name: string;
      position: string;
      season: string;
    }>;
  };
  health: {
    alerts: Array<{
      type: string;
      description: string;
      priority: string;
    }>;
    recentVisits: Array<{
      date: string;
      reason: string;
      outcome: string;
    }>;
  };
}

const ParentDashboardSummaryPage = () => {
  const { selectedStudent } = useStudent();
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentSummary();
    }
  }, [selectedStudent]);

  const fetchStudentSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/parent/student-summary/${selectedStudent?._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        toast.error('Failed to fetch student summary');
      }
    } catch (error) {
      console.error('Error fetching student summary:', error);
      toast.error('Error fetching student summary');
    } finally {
      setLoading(false);
    }
  };

  const downloadFullReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/parent/student-report/${selectedStudent?._id}`, {
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
        a.download = `${selectedStudent?.firstName}_${selectedStudent?.lastName}_Full_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Full report downloaded successfully');
      } else {
        toast.error('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Error downloading report');
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  if (!selectedStudent) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Please select a student to view their summary</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Unable to load student summary</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
            {summary.student.profilePhoto ? (
              <img 
                src={summary.student.profilePhoto} 
                alt={`${summary.student.firstName} ${summary.student.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              `${summary.student.firstName[0]}${summary.student.lastName[0]}`
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {summary.student.firstName} {summary.student.lastName}
            </h1>
            <p className="text-gray-600">
              Student ID: {summary.student.studentId} | Class: {summary.student.class}-{summary.student.section}
            </p>
          </div>
        </div>
        <Button onClick={downloadFullReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Full Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Current GPA</p>
              <p className={`text-2xl font-bold ${getGradeColor(summary.academics.currentGPA * 25)}`}>
                {summary.academics.currentGPA.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className={`text-2xl font-bold ${getGradeColor(summary.attendance.rate)}`}>
                {summary.attendance.rate.toFixed(1)}%
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Behavior Rating</p>
              <p className="text-2xl font-bold text-purple-600">{summary.behavior.overallRating}</p>
            </div>
            <Heart className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Activities</p>
              <p className="text-2xl font-bold text-orange-600">
                {summary.extracurriculars.clubs.length + summary.extracurriculars.sports.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="academics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="academics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recent Grades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.academics.recentGrades.map((grade, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{grade.subject}</h4>
                        <p className="text-sm text-gray-600">{new Date(grade.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getGradeColor(grade.percentage)}`}>{grade.grade}</p>
                        <p className="text-sm text-gray-600">{grade.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upcoming Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.academics.upcomingAssignments.map((assignment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">{assignment.subject} - {assignment.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        <Badge variant={new Date(assignment.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? "destructive" : "outline"}>
                          {Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800">Days Present</h3>
                  <p className="text-2xl font-bold text-green-600">{summary.attendance.daysPresent}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Total Days</h3>
                  <p className="text-2xl font-bold text-blue-600">{summary.attendance.totalDays}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Attendance Rate</h3>
                  <p className="text-2xl font-bold text-purple-600">{summary.attendance.rate.toFixed(1)}%</p>
                </div>
              </div>

              {summary.attendance.recentAbsences.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recent Absences</h4>
                  <div className="space-y-2">
                    {summary.attendance.recentAbsences.map((absence, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(absence.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">{absence.type}</p>
                        </div>
                        <Badge variant={absence.status === 'approved' ? 'secondary' : absence.status === 'pending' ? 'outline' : 'destructive'}>
                          {absence.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Behavior & Conduct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Overall Behavior Rating</h3>
                  <p className="text-3xl font-bold text-purple-600">{summary.behavior.overallRating}</p>
                </div>
              </div>

              {summary.behavior.recentIncidents.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-3">Recent Incidents</h4>
                  <div className="space-y-3">
                    {summary.behavior.recentIncidents.map((incident, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{incident.type}</h5>
                            <p className="text-sm text-gray-600">{new Date(incident.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getSeverityColor(incident.severity)}>
                              {incident.severity}
                            </Badge>
                            <Badge variant={incident.status === 'resolved' ? 'secondary' : 'outline'}>
                              {incident.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-semibold">No recent behavior incidents</p>
                  <p className="text-sm text-gray-600">Keep up the great behavior!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clubs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Club Memberships
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.extracurriculars.clubs.length > 0 ? (
                  <div className="space-y-3">
                    {summary.extracurriculars.clubs.map((club, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{club.name}</h4>
                            <p className="text-sm text-gray-600">Role: {club.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Attendance</p>
                            <p className={`font-bold ${getGradeColor(club.attendanceRate)}`}>
                              {club.attendanceRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No club memberships</p>
                )}
              </CardContent>
            </Card>

            {/* Sports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Sports Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.extracurriculars.sports.length > 0 ? (
                  <div className="space-y-3">
                    {summary.extracurriculars.sports.map((sport, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{sport.name}</h4>
                        <p className="text-sm text-gray-600">Position: {sport.position}</p>
                        <p className="text-sm text-gray-600">Season: {sport.season}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No sports participation</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Health Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Health Alerts */}
                <div>
                  <h4 className="font-semibold mb-3">Health Alerts</h4>
                  {summary.health.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {summary.health.alerts.map((alert, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{alert.type}</h5>
                              <p className="text-sm text-gray-600">{alert.description}</p>
                            </div>
                            <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'default' : 'outline'}>
                              {alert.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No active health alerts</p>
                  )}
                </div>

                {/* Recent Nurse Visits */}
                <div>
                  <h4 className="font-semibold mb-3">Recent Nurse Visits</h4>
                  {summary.health.recentVisits.length > 0 ? (
                    <div className="space-y-3">
                      {summary.health.recentVisits.map((visit, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{visit.reason}</h5>
                              <p className="text-sm text-gray-600">{new Date(visit.date).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm font-medium">{visit.outcome}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recent nurse visits</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParentDashboardSummaryPage;
