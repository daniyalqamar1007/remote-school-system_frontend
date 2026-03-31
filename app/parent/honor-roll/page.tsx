"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Award, 
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Calendar,
  GraduationCap,
  Target,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { useStudent } from "../context/StudentContext";

interface HonorRollStatus {
  hasHonorRoll: boolean;
  status: string | null;
  message: string;
  details: {
    academicYear?: string;
    markingPeriod?: string;
    averageGrade?: number;
    attendancePercentage?: number;
    sportsCount?: number;
    criteriaName?: string;
    criteriaDescription?: string;
    awardedDate?: string;
    reasons?: string[];
    message?: string;
    currentStats?: {
      averageGrade: number;
      attendancePercentage: number;
      sportsCount: number;
    };
    missingCriteria?: string[];
  };
}

export default function ParentHonorRollPage() {
  const { selectedStudent } = useStudent();
  const [honorRollStatus, setHonorRollStatus] = useState<HonorRollStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudent?._id) {
      fetchHonorRollStatus();
    } else {
      setLoading(false);
      setError('Please select a student to view honor roll status');
    }
  }, [selectedStudent]);

  const fetchHonorRollStatus = async () => {
    if (!selectedStudent?._id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('📤 [Frontend] Fetching honor roll status for child:', selectedStudent._id);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/honor-roll/parent/child/${selectedStudent._id}/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [Frontend] Honor roll status response:', response.data);
      
      if (response.data) {
        setHonorRollStatus(response.data);
      } else {
        console.warn('⚠️ [Frontend] Empty response from API');
        setError('No data received from server');
      }
    } catch (err: any) {
      console.error('❌ [Frontend] Error fetching honor roll status:', err);
      console.error('❌ [Frontend] Error response:', err.response?.data);
      console.error('❌ [Frontend] Error status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Failed to load honor roll status';
      
      setError(errorMessage);
      
      // Set default no honor roll status if it's a 404 or similar
      if (err.response?.status === 404 || err.response?.status === 401) {
        setHonorRollStatus({
          hasHonorRoll: false,
          status: null,
          message: 'No honor roll status',
          details: {
            message: 'Unable to fetch honor roll status. Please try again later.'
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'gold':
        return <Trophy className="w-8 h-8 text-yellow-600" />;
      case 'silver':
        return <Award className="w-8 h-8 text-gray-600" />;
      case 'bronze':
        return <Star className="w-8 h-8 text-orange-600" />;
      default:
        return <Trophy className="w-8 h-8 text-gray-400" />;
    }
  };

  if (!selectedStudent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please select a student from the dropdown to view their honor roll status.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading honor roll status for {selectedStudent.firstName}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !honorRollStatus) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Honor Roll - {selectedStudent.firstName} {selectedStudent.lastName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Academic achievement status for your child
          </p>
        </div>
      </div>

      {/* Main Status Card */}
      {honorRollStatus?.hasHonorRoll ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    {getStatusIcon(honorRollStatus.status)}
                    {honorRollStatus.status} Honor Roll
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {honorRollStatus.message}
                  </CardDescription>
                </div>
                <Badge 
                  className={`text-lg px-4 py-2 ${getStatusColor(honorRollStatus.status)}`}
                >
                  {honorRollStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Details */}
              {honorRollStatus.details.academicYear && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {honorRollStatus.details.academicYear && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Academic Year</p>
                        <p className="font-semibold">{honorRollStatus.details.academicYear}</p>
                      </div>
                    </div>
                  )}
                  {honorRollStatus.details.markingPeriod && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Target className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Marking Period</p>
                        <p className="font-semibold">{honorRollStatus.details.markingPeriod}</p>
                      </div>
                    </div>
                  )}
                  {honorRollStatus.details.averageGrade !== undefined && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Average Grade</p>
                        <p className="font-semibold">{honorRollStatus.details.averageGrade.toFixed(2)}%</p>
                      </div>
                    </div>
                  )}
                  {honorRollStatus.details.attendancePercentage !== undefined && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Attendance</p>
                        <p className="font-semibold">{honorRollStatus.details.attendancePercentage}%</p>
                      </div>
                    </div>
                  )}
                  {honorRollStatus.details.sportsCount !== undefined && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Trophy className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sports Programs</p>
                        <p className="font-semibold">{honorRollStatus.details.sportsCount}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Criteria Info */}
              {honorRollStatus.details.criteriaName && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Criteria
                  </h3>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="font-semibold text-primary mb-2">
                      {honorRollStatus.details.criteriaName}
                    </p>
                    {honorRollStatus.details.criteriaDescription && (
                      <p className="text-sm text-muted-foreground">
                        {honorRollStatus.details.criteriaDescription}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Reasons */}
              {honorRollStatus.details.reasons && honorRollStatus.details.reasons.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Achievement Details
                  </h3>
                  <ul className="space-y-2">
                    {honorRollStatus.details.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Award Date */}
              {honorRollStatus.details.awardedDate && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Awarded on: {new Date(honorRollStatus.details.awardedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Trophy className="w-8 h-8 text-muted-foreground" />
                No Honor Roll Status
              </CardTitle>
              <CardDescription className="mt-2">
                {honorRollStatus?.message || `${selectedStudent.firstName} does not currently meet the honor roll criteria.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {honorRollStatus?.details?.message || 
                    'Keep working hard! Focus on maintaining good grades, attendance, and participating in sports activities to qualify for honor roll.'}
                </AlertDescription>
              </Alert>
              
              {/* Current Stats */}
              {honorRollStatus.details.currentStats && (
                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">Current Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Average Grade</p>
                      <p className="text-lg font-bold">{honorRollStatus.details.currentStats.averageGrade.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <p className="text-lg font-bold">{honorRollStatus.details.currentStats.attendancePercentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sports Programs</p>
                      <p className="text-lg font-bold">{honorRollStatus.details.currentStats.sportsCount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Missing Criteria */}
              {honorRollStatus.details.missingCriteria && honorRollStatus.details.missingCriteria.length > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold mb-3 text-orange-900 dark:text-orange-100">To qualify for Honor Roll:</h3>
                  <ul className="space-y-2 text-sm">
                    {honorRollStatus.details.missingCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2 text-orange-800 dark:text-orange-200">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* General Guidelines */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-3">Honor Roll Criteria:</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Gold Honor Roll</p>
                    <p className="text-muted-foreground">Average Grade ≥ 90%, Attendance ≥ 95%, Sports ≥ 1</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Silver Honor Roll</p>
                    <p className="text-muted-foreground">Average Grade ≥ 85%, Attendance ≥ 90%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Bronze Honor Roll</p>
                    <p className="text-muted-foreground">Average Grade ≥ 80%, Attendance ≥ 85%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
