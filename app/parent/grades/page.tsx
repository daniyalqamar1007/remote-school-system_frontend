"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  GraduationCap,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useStudent } from "../context/StudentContext";

interface GradeRecord {
  _id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  markingType: string;
  term: string;
  class: string;
  section: string;
  score: number;
  totalMarks: number;
  overAll: number;
  quiz?: any;
  midTerm?: any;
  project?: any;
  finalTerm?: any;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
}

export default function ParentGradesPage() {
  const { selectedStudent, isLoading: isStudentLoading } = useStudent();
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedMarkingType, setSelectedMarkingType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Marking types (comprehensive list)
  const markingTypes = [
    "Test",
    "Quiz",
    "Exam",
    "Assignment",
    "Project",
    "Lab Work",
    "Presentation",
    "Participation",
    "Homework",
    "Mid-Term",
    "Final Exam",
    "Practical",
    "Oral Exam",
    "Coursework",
    "Assessment",
    "Class Test",
    "Unit Test",
    "Chapter Test",
    "Pop Quiz",
    "Weekly Test",
    "Monthly Test",
    "Formative Assessment",
    "Summative Assessment",
    "Diagnostic Test",
    "Placement Test",
    "Standardized Test",
    "Essay",
    "Research Paper",
    "Report",
    "Portfolio",
    "Field Work",
    "Observation",
    "Performance Task",
    "Group Work",
    "Individual Work",
    "Peer Assessment",
    "Self Assessment",
    "Reflection",
    "Journal",
    "Notebook",
    "Classwork",
    "Seatwork",
    "Exercise",
    "Worksheet",
    "Drill",
    "Practice Test",
    "Mock Exam",
    "Preliminary Exam",
    "Board Exam",
    "Entrance Exam",
    "Exit Exam",
    "Comprehensive Exam",
    "Thesis",
    "Dissertation",
    "Capstone Project",
    "Internship",
    "Clinical",
    "Workshop",
    "Seminar",
    "Case Study",
    "Problem Solving",
    "Critical Thinking",
    "Creative Task",
    "Art Project",
    "Science Fair",
    "Math Olympiad",
    "Spelling Bee",
    "Debate",
    "Speech",
    "Recitation",
    "Reading Comprehension",
    "Writing Sample",
    "Grammar Test",
    "Vocabulary Test",
    "Listening Test",
    "Speaking Test",
    "Lab Report",
    "Experiment",
    "Demonstration",
    "Simulation",
    "Role Play",
    "Drama",
    "Music Performance",
    "Physical Education",
    "Sports Assessment",
    "Health Check",
    "Behavioral Assessment",
    "Attendance",
    "Punctuality",
    "Effort",
    "Progress Report",
    "Report Card",
    "Continuous Assessment",
    "Term Assessment",
    "Year-End Assessment"
  ];

  // Fetch courses for filter dropdown
  const fetchCourses = useCallback(async () => {
    if (!selectedStudent) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/attendance?studentId=${selectedStudent._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        const courseList = response.data.map((item: any) => ({
          courseId: item.courseId,
          courseName: item.courseName,
          courseCode: item.courseCode || '',
        }));
        setCourses(courseList);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  // Fetch grade records - using the same endpoint as student portal
  const fetchGradeRecords = useCallback(async () => {
    if (!selectedStudent) {
      setGradeRecords([]);
      setTotalRecords(0);
      setTotalPages(1);
      return;
    }

    try {
      setLoadingRecords(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
      // Use the same endpoint as student portal but with studentId parameter
      const params: any = {
        page: currentPage.toString(),
        limit: pageSize.toString(),
        studentId: selectedStudent._id, // Add studentId for parent portal
      };

      if (selectedCourse) params.courseId = selectedCourse;
      if (selectedMarkingType) params.markingType = selectedMarkingType;
      if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/grade/student/records`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params,
        }
      );

      if (response.data) {
        setGradeRecords(response.data.data || []);
        setTotalRecords(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching grade records:', error);
      toast.error('Failed to load grade records');
      setGradeRecords([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedStudent, currentPage, pageSize, selectedCourse, selectedMarkingType, debouncedSearchTerm]);

  useEffect(() => {
    if (selectedStudent) {
      fetchCourses();
    }
  }, [selectedStudent, fetchCourses]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedMarkingType]);

  useEffect(() => {
    if (selectedStudent) {
      fetchGradeRecords();
    }
  }, [currentPage, pageSize, selectedCourse, selectedMarkingType, debouncedSearchTerm, selectedStudent, fetchGradeRecords]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  if (isStudentLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading grades...</p>
        </div>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Please select a student to view grades</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              Grades & Reports
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {selectedStudent && (
                <>Viewing grades for <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span></>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by course name, code..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select 
                  value={selectedCourse || "all"} 
                  onValueChange={(value) => {
                    const courseValue = value === "all" ? "" : value;
                    setSelectedCourse(courseValue);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.courseId} value={course.courseId}>
                        {course.courseName} ({course.courseCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Marking Type</label>
                <Select 
                  value={selectedMarkingType || "all"} 
                  onValueChange={(value) => {
                    const markingTypeValue = value === "all" ? "" : value;
                    setSelectedMarkingType(markingTypeValue);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Marking Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Marking Types</SelectItem>
                    {markingTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Records Table */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Grade Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecords ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="ml-2 text-muted-foreground">Loading grades...</span>
              </div>
            ) : gradeRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No grade records found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="font-semibold">Course</TableHead>
                        <TableHead className="font-semibold">Marking Type</TableHead>
                        <TableHead className="font-semibold">Score</TableHead>
                        <TableHead className="font-semibold">Total Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradeRecords.map((record) => (
                        <TableRow key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {record.courseName || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.courseCode || ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {record.markingType || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                              {record.score || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {record.totalMarks || 0}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loadingRecords}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loadingRecords}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
