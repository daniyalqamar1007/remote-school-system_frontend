"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  // Eye, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  GraduationCap,
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
// import Link from "next/link";

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

export default function StudentResultsPage() {
  const router = useRouter();
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

  // Marking types
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
    "Assessment"
  ];

  // Use all marking types (not just unique ones from records)

  // Fetch courses for filter dropdown
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const studentId = localStorage.getItem("id");
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/student/attendance?studentId=${studentId}`,
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
  }, []);

  // Fetch grade records
  const fetchGradeRecords = useCallback(async () => {
    try {
      setLoadingRecords(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
      const params: any = {
        page: currentPage.toString(),
        limit: pageSize.toString(),
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
  }, [currentPage, pageSize, selectedCourse, selectedMarkingType, debouncedSearchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change (except page and pageSize)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedMarkingType]);

  useEffect(() => {
    fetchGradeRecords();
  }, [currentPage, pageSize, selectedCourse, selectedMarkingType, debouncedSearchTerm, fetchGradeRecords]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Grades</h1>
          <p className="text-muted-foreground mt-1">
            View all your grades and academic performance
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
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
      <Card>
        <CardHeader>
          <CardTitle>Grade Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : gradeRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No grade records found.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Marking Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Total Marks</TableHead>
                      {/* <TableHead className="text-right">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradeRecords.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.courseName || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{record.courseCode || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.markingType || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{record.score || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{record.totalMarks || 0}</span>
                        </TableCell>
                        {/* <TableCell className="text-right">
                          <Link href={`/student/results/${record.courseId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
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
                  <span className="text-sm">
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
    </div>
  );
}
