"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Award,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Activity,
  GraduationCap,
  Target,
  ArrowRight,
  Trophy,
  Heart,
  Bell,
  BarChart3,
  PieChart,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { studentsApi, clubsApi } from '@/lib/api';
import axios from "axios";
import Link from "next/link";

interface DashboardStats {
  totalGrades: number;
  averageGrade: number;
  totalClubs: number;
  totalSports: number;
  attendanceRate: number;
  totalClasses: number;
  upcomingClasses: number;
  recentGrades: any[];
  upcomingSchedule: any[];
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalGrades: 0,
    averageGrade: 0,
    totalClubs: 0,
    totalSports: 0,
    attendanceRate: 0,
    totalClasses: 0,
    upcomingClasses: 0,
    recentGrades: [],
    upcomingSchedule: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch student profile
      const profileResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const userData = profileResponse.data?.user;
      if (userData) {
        setStudentInfo(userData);
      }

      // Fetch grades
      let gradesData: any[] = [];
      try {
        const gradesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/student/records?page=1&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        gradesData = gradesResponse.data?.data || gradesResponse.data || [];
      } catch (error) {
        console.error('Error fetching grades:', error);
      }

      // Calculate average grade
      const validGrades = gradesData
        .filter((g: any) => g.score !== undefined && g.score !== null)
        .map((g: any) => parseFloat(g.score));
      const avgGrade = validGrades.length > 0
        ? validGrades.reduce((a: number, b: number) => a + b, 0) / validGrades.length
        : 0;

      // Fetch clubs
      let clubsData: any[] = [];
      try {
        clubsData = await clubsApi.student.getMyClubs();
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }

      // Fetch schedule
      let scheduleData: any[] = [];
      try {
        if (userData?._id) {
          const scheduleResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/schedule/for-student/${userData._id}/week`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          scheduleData = scheduleResponse.data || [];
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }

      // Get today's classes
      const today = new Date();
      const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedule = scheduleData.filter((item: any) => item.day === todayDay);
      
      // Get upcoming classes (next 3 days)
      const upcomingSchedule = scheduleData
        .filter((item: any) => {
          const itemDay = item.day;
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const todayIndex = days.indexOf(todayDay);
          const itemIndex = days.indexOf(itemDay);
          return itemIndex >= todayIndex && itemIndex < todayIndex + 3;
        })
        .slice(0, 5);

      // Fetch attendance (if available)
      let attendanceRate = 0;
      try {
        if (userData?._id) {
          const attendanceResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/student/${userData._id}/stats`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          attendanceRate = attendanceResponse.data?.attendanceRate || 0;
        }
      } catch (error) {
        // Attendance API might not exist, that's okay
        console.log('Attendance stats not available');
      }

      setStats({
        totalGrades: gradesData.length,
        averageGrade: Math.round(avgGrade * 10) / 10,
        totalClubs: clubsData.length,
        totalSports: 0, // Will be fetched separately if needed
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        totalClasses: scheduleData.length,
        upcomingClasses: todaySchedule.length,
        recentGrades: gradesData.slice(0, 5),
        upcomingSchedule: upcomingSchedule,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600 dark:text-green-400";
    if (grade >= 80) return "text-blue-600 dark:text-blue-400";
    if (grade >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 dark:text-green-400";
    if (rate >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const quickLinks = [
    {
      name: "View Grades",
      href: "/student/results",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
      description: "Check your academic performance",
    },
    {
      name: "My Schedule",
      href: "/student/schedule",
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
      description: "View your class timetable",
    },
    {
      name: "My Clubs",
      href: "/student/clubs",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      description: "Manage club memberships",
    },
    {
      name: "My Profile",
      href: "/student/profile",
      icon: GraduationCap,
      color: "from-orange-500 to-red-500",
      description: "Update your information",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Welcome Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {studentInfo?.firstName || "Student"}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Here's an overview of your academic journey
              </p>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Average Grade */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white/90 text-sm font-medium">Average Grade</CardTitle>
                    <Award className="w-5 h-5 text-white/80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.averageGrade > 0 ? `${stats.averageGrade}%` : "N/A"}
                  </div>
                  <p className="text-white/70 text-xs">
                    {stats.totalGrades} {stats.totalGrades === 1 ? 'grade' : 'grades'} recorded
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Clubs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white/90 text-sm font-medium">My Clubs</CardTitle>
                    <Users className="w-5 h-5 text-white/80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.totalClubs}
                  </div>
                  <p className="text-white/70 text-xs">
                    {stats.totalClubs === 1 ? 'Active club' : 'Active clubs'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Today's Classes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-pink-500 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white/90 text-sm font-medium">Today's Classes</CardTitle>
                    <Calendar className="w-5 h-5 text-white/80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.upcomingClasses}
                  </div>
                  <p className="text-white/70 text-xs">
                    {stats.upcomingClasses === 1 ? 'Class scheduled' : 'Classes scheduled'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <Link href={link.href}>
                        <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 group">
                          <CardContent className="p-6">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                              <link.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {link.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {link.description}
                            </p>
                            <ArrowRight className="w-4 h-4 text-gray-400 mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Grades & Upcoming Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Grades */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Recent Grades
                  </CardTitle>
                  <Link href="/student/results">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {stats.recentGrades.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentGrades.map((grade: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {grade.courseName || grade.courseId?.courseName || "Unknown Course"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {grade.markingType || "Grade"}
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${getGradeColor(parseFloat(grade.score || 0))}`}>
                            {grade.score ? `${grade.score}%` : "N/A"}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No grades available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Schedule */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Upcoming Classes
                  </CardTitle>
                  <Link href="/student/schedule">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {stats.upcomingSchedule.length > 0 ? (
                    <div className="space-y-3">
                      {stats.upcomingSchedule.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.courseName || "Class"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {item.day} • {item.startTime} - {item.endTime}
                            </div>
                          </div>
                          {item.teacherName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                              {item.teacherName}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming classes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Performance Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                      {stats.totalGrades}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Grades</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {stats.totalClubs}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Clubs</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      {stats.totalClasses}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Classes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

