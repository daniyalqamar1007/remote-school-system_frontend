"use client";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import axios from "axios";

interface AttendanceRecord {
  date: string;
  status: "Present" | "Absent" | "Late";
}

interface CourseInfo {
  courseCode: string;
}

export default function AttendanceDetail() {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [courseCode, setCourseCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();

  const currentStudentId = localStorage.getItem("id");

  useEffect(() => {
    const fetchSingleCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error("Course ID is required");
        }

        if (!currentStudentId) {
          throw new Error("Student ID not found in localStorage");
        }

        // console.log("Student ID:", currentStudentId);
        // console.log("Course ID:", id);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/course?studentId=${currentStudentId}&courseCode=${id}`
        );

        // console.log("API Response:", response.data);

        if (response.status === 200) {
          const data = response.data;

          // Extract courseCode from the first object
          const courseInfo = data.find(
            (item: any) => item.courseCode && !item.date
          );
          if (courseInfo) {
            setCourseCode(courseInfo.courseCode);
          }

          // Filter out attendance records (objects with date property)
          const records = data.filter((item: any) => item.date);
          setAttendanceRecords(records);
        } else {
          throw new Error("Failed to fetch course data");
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            setError("Course not found");
          } else if (error.response?.status === 400) {
            setError("Invalid student ID or course code");
          } else {
            setError(
              `Failed to fetch course data: ${
                error.response?.status || "Network Error"
              }`
            );
          }
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSingleCourseData();
  }, [id, currentStudentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-indigo-950 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/student/attendance"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Link>
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
        <div className="max-w-4xl mx-auto">
          <Link
            href="/student/attendance"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Calculate attendance statistics
  const presentDays = attendanceRecords.filter(
    (record) => record.status === "Present"
  ).length;
  const lateDays = attendanceRecords.filter(
    (record) => record.status === "Late"
  ).length;
  const absentDays = attendanceRecords.filter(
    (record) => record.status === "Absent"
  ).length;
  const totalDays = attendanceRecords.length;

  // Count "Late" as present for attendance percentage
  const effectivePresentDays = presentDays + lateDays;
  const attendancePercentage =
    totalDays !== 0 ? (effectivePresentDays / totalDays) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-indigo-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Link
          href="/student/attendance"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Link>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Course Attendance</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Course Code: {courseCode}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Overall Attendance
              </span>
              <span
                className={`font-semibold ${
                  attendancePercentage < 75
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {attendancePercentage.toFixed(2)}%
              </span>
            </div>
            <Progress
              value={attendancePercentage}
              className="h-2"
              style={{
                background: `linear-gradient(to right, 
                  ${
                    attendancePercentage < 75 ? "#ef4444" : "#22c55e"
                  } ${attendancePercentage}%, 
                  #e5e7eb ${attendancePercentage}%)`,
              }}
            />
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  {presentDays}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Present</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  {lateDays}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Late</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 font-semibold">
                  {absentDays}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Absent</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Total Days: {totalDays}
            </div>
            {attendancePercentage < 75 && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                ⚠️ Below minimum attendance requirement (75%)
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No attendance records found
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((record, index) => (
                      <motion.tr
                        key={`${record.date}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell className="font-medium">
                          <Calendar className="w-4 h-4 inline-block mr-2" />
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          {record.status === "Present" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <Check className="w-3 h-3 mr-1" /> Present
                            </span>
                          ) : record.status === "Late" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <Clock className="w-3 h-3 mr-1" /> Late
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <X className="w-3 h-3 mr-1" /> Absent
                            </span>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
