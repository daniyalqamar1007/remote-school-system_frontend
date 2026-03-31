"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Book, 
  ChevronRight, 
  AlertCircle, 
  Loader2, 
  Users, 
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ClassAttendance {
  courseId: string;
  courseName: string;
  attendancePercentage: number;
}

interface ClubAttendanceItem {
  clubId: string;
  clubName: string;
  attendance: Array<{
    _id: string;
    meetingDate: string | Date;
    date?: string;
    status: string;
  }>;
  attendanceRate: number;
  totalMeetings: number;
  presentMeetings: number;
}

interface SportsAttendanceItem {
  _id: string;
  attendanceDate: string;
  status: string;
  sportsProgramId: {
    _id: string;
    name: string;
    sport: string;
  };
  scheduleId: {
    _id: string;
    startTime?: string;
    endTime?: string;
  };
}

export default function AttendanceOverview() {
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
  const [clubAttendance, setClubAttendance] = useState<ClubAttendanceItem[]>([]);
  const [sportsAttendance, setSportsAttendance] = useState<SportsAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("classes");

  useEffect(() => {
    const fetchAllAttendance = async () => {
      try {
        setLoading(true);
        setError(null);

        const studentId = localStorage.getItem("id");
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        if (!studentId || !token) {
          throw new Error("Authentication required. Please log in again.");
        }

        // Fetch all three types of attendance in parallel
        const [classResponse, clubResponse, sportsResponse] = await Promise.allSettled([
          // Class Attendance
          fetch(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/attendance?studentId=${studentId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          ),
          // Club Attendance
          fetch(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/clubs/attendance`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          ),
          // Sports Attendance
          fetch(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/sports/student/my-attendance`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          ),
        ]);

        // Process class attendance
        if (classResponse.status === 'fulfilled' && classResponse.value.ok) {
          const classData = await classResponse.value.json();
          setClassAttendance(Array.isArray(classData) ? classData : []);
        } else {
          console.warn("Failed to fetch class attendance:", classResponse);
          setClassAttendance([]);
        }

        // Process club attendance
        if (clubResponse.status === 'fulfilled' && clubResponse.value.ok) {
          try {
            const clubData = await clubResponse.value.json();
            console.log("Club attendance response:", clubData);
            // Handle different response formats (direct array or wrapped in data property)
            const clubs = Array.isArray(clubData) 
              ? clubData 
              : (clubData?.data && Array.isArray(clubData.data) 
                  ? clubData.data 
                  : []);
            console.log("Processed club attendance:", clubs);
            setClubAttendance(clubs);
          } catch (parseError) {
            console.error("Error parsing club attendance:", parseError);
            setClubAttendance([]);
          }
        } else {
          const errorDetails = clubResponse.status === 'rejected' 
            ? clubResponse.reason 
            : (clubResponse.status === 'fulfilled' && !clubResponse.value.ok
                ? `Status: ${clubResponse.value.status} ${clubResponse.value.statusText}`
                : 'Unknown error');
          console.error("Failed to fetch club attendance:", errorDetails);
          // Try to get error message from response
          if (clubResponse.status === 'fulfilled' && !clubResponse.value.ok) {
            try {
              const errorData = await clubResponse.value.json().catch(() => ({}));
              console.error("Error details:", errorData);
            } catch (e) {
              // Ignore parse errors
            }
          }
          setClubAttendance([]);
        }

        // Process sports attendance
        if (sportsResponse.status === 'fulfilled' && sportsResponse.value.ok) {
          const sportsData = await sportsResponse.value.json();
          // Handle different response formats
          if (sportsData.attendance && Array.isArray(sportsData.attendance)) {
            setSportsAttendance(sportsData.attendance);
          } else if (Array.isArray(sportsData)) {
            setSportsAttendance(sportsData);
          } else {
            setSportsAttendance([]);
          }
        } else {
          console.warn("Failed to fetch sports attendance:", sportsResponse);
          setSportsAttendance([]);
        }

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching attendance data"
        );
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAttendance();
  }, []);

  // Group sports attendance by program
  const groupSportsByProgram = (attendance: SportsAttendanceItem[]) => {
    const grouped: Record<string, {
      program: SportsAttendanceItem['sportsProgramId'];
      records: SportsAttendanceItem[];
    }> = {};

    attendance.forEach((item) => {
      if (item.sportsProgramId) {
        const programId = item.sportsProgramId._id || 'unknown';
        if (!grouped[programId]) {
          grouped[programId] = {
            program: item.sportsProgramId,
            records: [],
          };
        }
        grouped[programId].records.push(item);
      }
    });

    return Object.values(grouped);
  };

  const sportsGrouped = groupSportsByProgram(sportsAttendance);

  // Calculate attendance percentage for sports
  const calculateSportsAttendancePercentage = (records: SportsAttendanceItem[]) => {
    if (records.length === 0) return 0;
    const presentCount = records.filter(r => 
      r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'attended'
    ).length;
    return Math.round((presentCount / records.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-indigo-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading attendance data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-indigo-950 p-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-indigo-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-white">
          Attendance Overview
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              Classes ({classAttendance.length})
            </TabsTrigger>
            <TabsTrigger value="clubs" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clubs ({clubAttendance.length})
            </TabsTrigger>
            <TabsTrigger value="sports" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Sports ({sportsGrouped.length})
            </TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes">
            {classAttendance.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Book className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No class attendance records found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classAttendance.map((subject, index) => (
                  <motion.div
                    key={subject.courseId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/student/attendance/${subject.courseId}`}>
                      <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                              <Book className="w-5 h-5 mr-2 text-indigo-500" />
                              {subject.courseName}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Attendance
                            </span>
                            <span className="font-semibold">
                              {subject.attendancePercentage}%
                            </span>
                          </div>
                          <Progress
                            value={subject.attendancePercentage}
                            className="h-2"
                            style={{
                              background: `linear-gradient(to right, 
                                ${
                                  subject.attendancePercentage < 75
                                    ? "#ef4444"
                                    : "#22c55e"
                                } ${subject.attendancePercentage}%, 
                                #e5e7eb ${subject.attendancePercentage}%)`,
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Clubs Tab */}
          <TabsContent value="clubs">
            {clubAttendance.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No club attendance records found. Join a club to see attendance here.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    If you are a member of a club, make sure attendance has been recorded by your club advisor.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clubAttendance.map((club, index) => {
                  // Ensure we have valid numeric values
                  const totalMeetings = typeof club.totalMeetings === 'number' ? club.totalMeetings : (club.attendance?.length || 0);
                  const presentMeetings = typeof club.presentMeetings === 'number' 
                    ? club.presentMeetings 
                    : (club.attendance?.filter((a: any) => a?.status?.toLowerCase() === 'present').length || 0);
                  const attendancePercentage = totalMeetings > 0 
                    ? Math.round((presentMeetings / totalMeetings) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={club.clubId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                              <Users className="w-5 h-5 mr-2 text-blue-500" />
                              {club.clubName}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Attendance
                            </span>
                            <span className="font-semibold">
                              {attendancePercentage}%
                            </span>
                          </div>
                          <Progress
                            value={attendancePercentage}
                            className="h-2 mb-4"
                            style={{
                              background: `linear-gradient(to right, 
                                ${
                                  attendancePercentage < 75
                                    ? "#ef4444"
                                    : "#22c55e"
                                } ${attendancePercentage}%, 
                                #e5e7eb ${attendancePercentage}%)`,
                            }}
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Total Meetings:</span>
                              <span className="ml-2 font-semibold">{totalMeetings}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Present:</span>
                              <span className="ml-2 font-semibold text-green-600">{presentMeetings}</span>
                            </div>
                          </div>
                          {club.attendance && Array.isArray(club.attendance) && club.attendance.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">Recent Attendance:</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {club.attendance
                                  .slice(0, 5)
                                  .filter((record: any) => record && (record.meetingDate || record.date))
                                  .map((record: any) => {
                                    const meetingDate = record.meetingDate || record.date;
                                    const status = record.status?.toLowerCase() || '';
                                    return (
                                      <div key={record._id || Math.random()} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          {meetingDate ? new Date(meetingDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <Badge 
                                          variant={
                                            status === 'present' 
                                              ? 'default' 
                                              : status === 'excused'
                                              ? 'secondary'
                                              : 'destructive'
                                          }
                                          className="text-xs capitalize"
                                        >
                                          {record.status || 'N/A'}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sports Tab */}
          <TabsContent value="sports">
            {sportsGrouped.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No sports attendance records found. Join a sports program to see attendance here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sportsGrouped.map((group, index) => {
                  const attendancePercentage = calculateSportsAttendancePercentage(group.records);

                  return (
                    <motion.div
                      key={group.program._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                              {group.program.name || group.program.sport}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Attendance
                            </span>
                            <span className="font-semibold">
                              {attendancePercentage}%
                            </span>
                          </div>
                          <Progress
                            value={attendancePercentage}
                            className="h-2 mb-4"
                            style={{
                              background: `linear-gradient(to right, 
                                ${
                                  attendancePercentage < 75
                                    ? "#ef4444"
                                    : "#22c55e"
                                } ${attendancePercentage}%, 
                                #e5e7eb ${attendancePercentage}%)`,
                            }}
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
                              <span className="ml-2 font-semibold">{group.records.length}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Present:</span>
                              <span className="ml-2 font-semibold text-green-600">
                                {group.records.filter(r => 
                                  r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'attended'
                                ).length}
                              </span>
                            </div>
                          </div>
                          {group.records.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">Recent Attendance:</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {group.records.slice(0, 5).map((record) => (
                                  <div key={record._id} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center text-gray-600 dark:text-gray-400">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(record.attendanceDate || record._id).toLocaleDateString()}
                                    </span>
                                    <Badge 
                                      variant={
                                        record.status?.toLowerCase() === 'present' || record.status?.toLowerCase() === 'attended'
                                          ? 'default' 
                                          : 'destructive'
                                      }
                                      className="text-xs flex items-center gap-1"
                                    >
                                      {record.status?.toLowerCase() === 'present' || record.status?.toLowerCase() === 'attended' ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : record.status?.toLowerCase() === 'late' ? (
                                        <Clock className="w-3 h-3" />
                                      ) : (
                                        <XCircle className="w-3 h-3" />
                                      )}
                                      {record.status || 'N/A'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}