'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, GraduationCap, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '../context/StudentContext';

interface ReportCard {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    class: string;
    section: string;
  };
  academicYear: string;
  markingPeriod: string;
  semester: string;
  grades: Array<{
    subject: string;
    grade: string;
    percentage: number;
    teacher: string;
    teacherComments?: string;
  }>;
  overallGPA: number;
  attendance: {
    daysPresent: number;
    totalDays: number;
    attendanceRate: number;
  };
  behaviorGrade: string;
  effortGrade: string;
  principalComments?: string;
  teacherComments?: string;
  parentSignatureRequired: boolean;
  parentSignedDate?: string;
  issuedDate: string;
  status: 'draft' | 'issued' | 'signed';
  downloadUrl?: string;
}

const ReportCardsPage = () => {
  const { selectedStudent } = useStudent();
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudent) {
      fetchReportCards();
    }
  }, [selectedStudent]);

  const fetchReportCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grade/report-cards/student/${selectedStudent?._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportCards(data);
      } else {
        toast.error('Failed to fetch report cards');
      }
    } catch (error) {
      console.error('Error fetching report cards:', error);
      toast.error('Error fetching report cards');
    } finally {
      setLoading(false);
    }
  };

  const downloadReportCard = async (reportCardId: string, studentName: string, markingPeriod: string) => {
    setDownloading(reportCardId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grade/report-cards/${reportCardId}/download`, {
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
        a.download = `${studentName}_Report_Card_${markingPeriod}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Report card downloaded successfully');
      } else {
        toast.error('Failed to download report card');
      }
    } catch (error) {
      console.error('Error downloading report card:', error);
      toast.error('Error downloading report card');
    } finally {
      setDownloading(null);
    }
  };

  const signReportCard = async (reportCardId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grade/report-cards/${reportCardId}/sign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Report card signed successfully');
        fetchReportCards(); // Refresh the list
      } else {
        toast.error('Failed to sign report card');
      }
    } catch (error) {
      console.error('Error signing report card:', error);
      toast.error('Error signing report card');
    }
  };

  const getStatusBadge = (status: string, parentSignatureRequired: boolean, parentSignedDate?: string) => {
    if (status === 'draft') {
      return <Badge variant="outline">Draft</Badge>;
    }
    
    if (status === 'issued' && parentSignatureRequired && !parentSignedDate) {
      return <Badge variant="destructive">Signature Required</Badge>;
    }
    
    if (status === 'issued' && parentSignedDate) {
      return <Badge variant="secondary">Signed</Badge>;
    }
    
    return <Badge variant="default">Issued</Badge>;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 font-semibold';
    if (percentage >= 80) return 'text-blue-600 font-semibold';
    if (percentage >= 70) return 'text-yellow-600 font-semibold';
    if (percentage >= 60) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  if (!selectedStudent) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Please select a student to view report cards</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report Cards</h1>
        <p className="text-gray-600">
          Download and view report cards for {selectedStudent.firstName} {selectedStudent.lastName}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reportCards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No report cards available</p>
            <p className="text-sm text-gray-400 mt-2">Report cards will appear here once they are issued by the school</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reportCards.map((reportCard) => (
            <Card key={reportCard._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <GraduationCap className="h-6 w-6" />
                      {reportCard.markingPeriod} - {reportCard.academicYear}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(reportCard.status, reportCard.parentSignatureRequired, reportCard.parentSignedDate)}
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Issued: {new Date(reportCard.issuedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => downloadReportCard(
                        reportCard._id,
                        `${selectedStudent.firstName}_${selectedStudent.lastName}`,
                        reportCard.markingPeriod
                      )}
                      disabled={downloading === reportCard._id}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {downloading === reportCard._id ? 'Downloading...' : 'Download PDF'}
                    </Button>
                    
                    {reportCard.parentSignatureRequired && !reportCard.parentSignedDate && (
                      <Button
                        variant="outline"
                        onClick={() => signReportCard(reportCard._id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Sign Report Card
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Academic Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Overall GPA</h3>
                    <p className={`text-2xl font-bold ${getGradeColor(reportCard.overallGPA * 25)}`}>
                      {reportCard.overallGPA.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800">Attendance Rate</h3>
                    <p className={`text-2xl font-bold ${getGradeColor(reportCard.attendance.attendanceRate)}`}>
                      {reportCard.attendance.attendanceRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {reportCard.attendance.daysPresent}/{reportCard.attendance.totalDays} days
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Behavior Grade</h3>
                    <p className="text-2xl font-bold text-purple-600">{reportCard.behaviorGrade}</p>
                    <p className="text-sm text-gray-600">Effort: {reportCard.effortGrade}</p>
                  </div>
                </div>

                {/* Subject Grades */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Subject Grades</h3>
                  <div className="grid gap-3">
                    {reportCard.grades.map((grade, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{grade.subject}</h4>
                          <p className="text-sm text-gray-600">Teacher: {grade.teacher}</p>
                          {grade.teacherComments && (
                            <p className="text-xs text-gray-500 mt-1">"{grade.teacherComments}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getGradeColor(grade.percentage)}`}>
                            {grade.grade}
                          </p>
                          <p className="text-sm text-gray-600">{grade.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                {(reportCard.principalComments || reportCard.teacherComments) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Comments</h3>
                    
                    {reportCard.principalComments && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Principal's Comments:</h4>
                        <p className="text-sm">{reportCard.principalComments}</p>
                      </div>
                    )}
                    
                    {reportCard.teacherComments && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Teacher's Comments:</h4>
                        <p className="text-sm">{reportCard.teacherComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Signature Status */}
                {reportCard.parentSignedDate && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Parent Signature:</strong> Signed on {new Date(reportCard.parentSignedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportCardsPage;
