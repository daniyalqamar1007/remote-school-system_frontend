"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Book, Calendar, Clock, FileText, CheckCircle, AlertCircle, Loader2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { useStudent } from "../context/StudentContext";
import axios from "axios";

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  assignedDate: string;
  status: "upcoming" | "completed" | "overdue" | "graded";
  type: "homework" | "project" | "quiz" | "test";
  description: string;
  grade?: { score: number; outOf: number; feedback?: string };
}

export default function ParentHomework() {
  const { selectedStudent, isLoading: studentLoading } = useStudent();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter states
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    homework: true,
    project: true,
    quiz: true,
    test: true
  });
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    upcoming: true,
    completed: true,
    overdue: true,
    graded: true
  });

  useEffect(() => {
    if (!selectedStudent) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    fetchAssignments(selectedStudent._id);
  }, [selectedStudent]);

  useEffect(() => {
    filterAssignments();
  }, [assignments, activeTab, typeFilters, statusFilters]);

  const fetchAssignments = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SRS_SERVER}/assignment/by-student/${studentId}`);
      setAssignments(response.data || []);
    } catch (err) {
      setError("Error fetching assignments");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];
    if (activeTab !== "all") filtered = filtered.filter((a) => a.status === activeTab);
    filtered = filtered.filter((a) => typeFilters[a.type]);
    filtered = filtered.filter((a) => statusFilters[a.status]);
    filtered.sort((a, b) => {
      const aDate = parseISO(a.dueDate);
      const bDate = parseISO(b.dueDate);
      const statusPriority: Record<string, number> = { overdue: 0, upcoming: 1, completed: 2, graded: 3 };
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status];
      }
      return isBefore(aDate, bDate) ? -1 : 1;
    });
    setFilteredAssignments(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming": return <Badge variant="outline" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case "completed": return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case "overdue": return <Badge variant="outline" className="bg-red-100 text-red-800">Overdue</Badge>;
      case "graded": return <Badge variant="outline" className="bg-purple-100 text-purple-800">Graded</Badge>;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "homework": return <FileText className="h-5 w-5 text-blue-500" />;
      case "project": return <Book className="h-5 w-5 text-purple-500" />;
      case "quiz": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "test": return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  if (studentLoading) {
    return <div className="min-h-screen p-8 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>;
  }
  if (!selectedStudent) {
    return <div className="min-h-screen p-8"><Alert className="my-8"><AlertDescription>Please select a student to view their assignments.</AlertDescription></Alert></div>;
  }
  if (loading) {
    return <div className="min-h-screen p-8 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>;
  }
  if (error) {
    return <div className="min-h-screen p-8"><Alert className="my-8"><AlertDescription className="text-red-500">{error}</AlertDescription></Alert></div>;
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center text-gray-800 dark:text-white">
          Homework & Assignments
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Track {selectedStudent.firstName}&apos;s assignments, homework, projects, and tests
        </p>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="graded">Graded</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" /> Type
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["homework", "project", "quiz", "test"].map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={typeFilters[type]}
                    onCheckedChange={(checked) => setTypeFilters({ ...typeFilters, [type]: checked })}
                  >{type.charAt(0).toUpperCase() + type.slice(1)}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {filteredAssignments.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-xl font-medium text-gray-600 dark:text-gray-400">No assignments found</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2 text-center">There are no assignments matching your current filters.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <motion.div key={assignment._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className={`
                  border-l-4 hover:shadow-md transition-all duration-200
                  ${assignment.status === "overdue" ? "border-l-red-500"
                    : assignment.status === "upcoming" ? "border-l-blue-500"
                    : assignment.status === "completed" ? "border-l-green-500"
                    : "border-l-purple-500"
                  }`
                }>
                  <CardHeader className="py-4 px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="mt-0.5">{getTypeIcon(assignment.type)}</div>
                        <div>
                          <CardTitle className="text-lg font-medium">{assignment.title}</CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{assignment.subject}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {getStatusBadge(assignment.status)}
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Due: {format(parseISO(assignment.dueDate), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pt-0 pb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Assigned: {format(parseISO(assignment.assignedDate), "MMM d, yyyy")}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(assignment._id)} className="text-gray-500">
                        {expandedId === assignment._id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                    {expandedId === assignment._id && (
                      <motion.div initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Description:</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.description}</p>
                        </div>
                        {assignment.grade && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Grade:</h4>
                            <div className="flex items-center mb-1">
                              <span className="text-lg font-semibold">{assignment.grade.score}/{assignment.grade.outOf}</span>
                              <span className="ml-2 text-sm text-gray-500">({Math.round((assignment.grade.score / assignment.grade.outOf) * 100)}%)</span>
                            </div>
                            {assignment.grade.feedback && (
                              <div className="mt-2">
                                <h5 className="text-xs font-medium mb-1 text-gray-500">Teacher Feedback:</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.grade.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}