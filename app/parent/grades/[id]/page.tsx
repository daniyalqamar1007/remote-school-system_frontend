"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Book,
  FileText,
  Loader2,
  AlertTriangle,
  BadgeCheck,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { useStudent } from "../../context/StudentContext";
import axios from "axios";

function getGradeColor(grade: number) {
  if (grade >= 90) return "text-green-600 dark:text-green-400";
  if (grade >= 80) return "text-blue-600 dark:text-blue-400";
  if (grade >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "graded":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Graded</Badge>;
    case "submitted":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Submitted</Badge>;
    case "missing":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Missing</Badge>;
    case "late":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Late</Badge>;
    case "upcoming":
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">Upcoming</Badge>;
    default:
      return null;
  }
}

function getScoreColor(score: number, total: number) {
  const percentage = (score / total) * 100;
  if (percentage >= 90) return "text-green-600 dark:text-green-400";
  if (percentage >= 80) return "text-blue-600 dark:text-blue-400";
  if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default function CourseDetail({ params }: { params: { id: string } }) {
  const { selectedStudent, isLoading } = useStudent();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (!selectedStudent) {
      setCourseData(null);
      setLoading(false);
      return;
    }

    // Get full grade details for the selected course
    axios.get(
      `/api/grade/student-course?courseId=${params.id}&studentId=${selectedStudent._id}`
    )
      .then((res) => setCourseData(res.data))
      .catch(() => setCourseData(null))
      .finally(() => setLoading(false));
  }, [selectedStudent, params.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg text-gray-600 dark:text-gray-400">Loading course details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/parent/grades" className="inline-flex items-center text-blue-600 mb-6 hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grades
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-red-600 mb-2">No data for this course</p>
              <p className="text-gray-600">There is no course data for this student or course.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <Link href="/parent/grades" className="inline-flex items-center text-blue-600 mb-6 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Grades
        </Link>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center">
                <Book className="h-6 w-6 mr-3 text-blue-500" />
                <CardTitle className="text-2xl">{courseData.courseName}</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="text-lg px-3 py-1">
                  Grade: {courseData.letterGrade}
                </Badge>
                <span className={`text-2xl font-bold ${getGradeColor(courseData.currentGrade)}`}>
                  {courseData.currentGrade}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Course Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Course:</span> {courseData.courseName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <BadgeCheck className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Teacher:</span> {courseData.teacherName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Email:</span> {courseData.teacherEmail}
                    </span>
                  </div>
                  {courseData.syllabus && (
                    <div className="pt-2">
                      <a href={courseData.syllabus} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View Syllabus
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Grade Breakdown</h3>
                <div className="space-y-3">
                  {courseData.gradeBreakdown.map((category: any) => (
                    <div key={category.category}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{category.category}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {category.weight}%
                          </Badge>
                        </div>
                        <span className="text-sm">
                          {category.earned}/{category.possible} ({Math.round((category.earned / category.possible) * 100)}%)
                        </span>
                      </div>
                      <Progress 
                        value={(category.earned / category.possible) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-6 w-6 text-blue-500" />
              Assignments & Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="graded">Graded</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="missing">Missing/Late</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <AssignmentsTable assignments={courseData.assignments} />
              </TabsContent>
              
              <TabsContent value="graded">
                <AssignmentsTable 
                  assignments={courseData.assignments.filter((a: any) => a.status === "graded")} 
                />
              </TabsContent>
              
              <TabsContent value="upcoming">
                <AssignmentsTable 
                  assignments={courseData.assignments.filter((a: any) => a.status === "upcoming")} 
                />
              </TabsContent>
              
              <TabsContent value="missing">
                <AssignmentsTable 
                  assignments={courseData.assignments.filter((a: any) => a.status === "missing" || a.status === "late")} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function AssignmentsTable({ assignments }: { assignments: any[] }) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No assignments in this category</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assignment</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment: any) => (
            <TableRow key={assignment.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <TableCell className="font-medium">{assignment.title}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {assignment.type}
                </Badge>
              </TableCell>
              <TableCell>{assignment.dueDate}</TableCell>
              <TableCell>{getStatusBadge(assignment.status)}</TableCell>
              <TableCell className="text-right">
                {(assignment.status === "graded" || assignment.status === "late") && assignment.score != null ? (
                  <span className={getScoreColor(assignment.score, assignment.totalPoints)}>
                    {assignment.score}/{assignment.totalPoints} 
                    <span className="text-xs ml-1">
                      ({Math.round((assignment.score / assignment.totalPoints) * 100)}%)
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-500">--/{assignment.totalPoints}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}