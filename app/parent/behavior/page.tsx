"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  CheckCircle,
  XCircle,
  Eye,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useStudent } from "../context/StudentContext";
import axios from "axios";
import { toast } from "sonner";

interface DisciplinaryAction {
  _id: string;
  student?: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    class?: string;
    section?: string;
  };
  studentId?: any;
  type?: string;
  actionType?: string;
  description?: string;
  reason?: string;
  location?: string;
  date?: string;
  time?: string;
  assignedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
  };
  consequence?: {
    type: string;
    duration: string;
    startDate: string;
    endDate?: string;
    description: string;
  };
  status: "pending" | "in-progress" | "completed" | "cancelled";
  severity?: string;
  conductLetterGenerated?: boolean;
  conductLetterUrl?: string;
  conductLetterGeneratedDate?: string;
  parentNotified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ParentBehaviorPage() {
  const { selectedStudent, isLoading: studentLoading } = useStudent();
  const [actions, setActions] = useState<DisciplinaryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAction, setSelectedAction] = useState<DisciplinaryAction | null>(null);
  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);
  const prevDebouncedSearchRef = useRef<string>("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when debounced search term changes (only if it actually changed)
  useEffect(() => {
    if (prevDebouncedSearchRef.current !== debouncedSearchTerm && debouncedSearchTerm !== undefined) {
      prevDebouncedSearchRef.current = debouncedSearchTerm;
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Initial load when student is selected
  useEffect(() => {
    if (!selectedStudent) return;
    setCurrentPage(1);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    fetchDisciplinaryActions(1);
  }, [selectedStudent]);

  // Fetch actions when filters or pagination changes
  useEffect(() => {
    if (!selectedStudent) return;
    fetchDisciplinaryActions(currentPage);
  }, [currentPage, pageSize, statusFilter, debouncedSearchTerm, selectedStudent]);

  const fetchDisciplinaryActions = async (page: number = 1) => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        studentId: selectedStudent._id,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() }),
      });

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/discipline/parent/actions?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data) {
        const data = response.data;
        let actionsList = [];
        let paginationData = { page: currentPage, limit: pageSize, total: 0, totalPages: 0 };

        // Handle different response structures
        if (data?.data) {
          if (Array.isArray(data.data)) {
            actionsList = data.data;
          } else if (data.data?.data && Array.isArray(data.data.data)) {
            actionsList = data.data.data;
          }
          
          // Extract pagination from various possible locations
          if (data.pagination) {
            paginationData = {
              page: data.pagination.page || currentPage,
              limit: data.pagination.limit || pageSize,
              total: data.pagination.total || data.pagination.totalCount || 0,
              totalPages: data.pagination.totalPages || data.pagination.totalPage || 0,
            };
          } else if (data.data?.pagination) {
            paginationData = {
              page: data.data.pagination.page || currentPage,
              limit: data.data.pagination.limit || pageSize,
              total: data.data.pagination.total || data.data.pagination.totalCount || 0,
              totalPages: data.data.pagination.totalPages || data.data.pagination.totalPage || 0,
            };
          }
        } else if (Array.isArray(data)) {
          actionsList = data;
          // If no pagination data, calculate from array length
          paginationData = {
            page: currentPage,
            limit: pageSize,
            total: data.length,
            totalPages: Math.ceil(data.length / pageSize),
          };
        }

        // If we have actions but no pagination total, set it from actions length
        if (actionsList.length > 0 && paginationData.total === 0) {
          paginationData.total = actionsList.length;
          paginationData.totalPages = Math.ceil(actionsList.length / pageSize);
        }

        // Ensure totalPages is calculated if we have total but not totalPages
        if (paginationData.total > 0 && paginationData.totalPages === 0) {
          paginationData.totalPages = Math.ceil(paginationData.total / paginationData.limit);
        }

        console.log('Pagination data:', paginationData);
        console.log('Actions count:', actionsList.length);

        setActions(actionsList);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error("Error fetching disciplinary actions:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load disciplinary actions"
      );
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      pending: "outline",
      "in-progress": "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("-", " ").toUpperCase()}
      </Badge>
    );
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    const colors: { [key: string]: string } = {
      minor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      major: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      severe: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };
    return (
      <Badge className={colors[severity] || colors.minor}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const handleViewLetter = (action: DisciplinaryAction) => {
    setSelectedAction(action);
    setIsLetterDialogOpen(true);
  };

  const handleDownloadLetter = (action: DisciplinaryAction) => {
    if (action.conductLetterUrl) {
      window.open(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}${action.conductLetterUrl}`,
        "_blank"
      );
    } else {
      toast.error("Conduct letter not available");
    }
  };

  if (studentLoading || !selectedStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">
          {studentLoading ? "Loading student data..." : "Please select a student"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center text-gray-800 dark:text-white">
            Disciplinary Actions
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Viewing disciplinary actions for{" "}
            <span className="font-semibold">
              {selectedStudent.firstName} {selectedStudent.lastName}
            </span>
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by description, location, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions List */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600">Loading disciplinary actions...</span>
              </div>
            </CardContent>
          </Card>
        ) : actions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                No disciplinary actions found
              </p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "There are no disciplinary actions to display at this time."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {actions.map((action, index) => (
                <motion.div
                  key={action._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <CardTitle className="text-lg">
                              {action.type || action.actionType || "Disciplinary Action"}
                            </CardTitle>
                            {getSeverityBadge(action.severity)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {action.date
                                  ? format(new Date(action.date), "MMMM d, yyyy")
                                  : "N/A"}
                              </span>
                              {action.time && (
                                <span className="ml-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {action.time}
                                </span>
                              )}
                            </div>
                            {action.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{action.location}</span>
                              </div>
                            )}
                            {action.assignedBy && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>
                                  Assigned by: {action.assignedBy.firstName}{" "}
                                  {action.assignedBy.lastName}
                                  {action.assignedBy.role && ` (${action.assignedBy.role})`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(action.status)}
                          {action.conductLetterGenerated && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <FileText className="h-3 w-3 mr-1" />
                              Letter Generated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {action.description && (
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Description:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {action.description}
                            </p>
                          </div>
                        )}
                        {action.consequence && (
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Consequence:</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                              <p className="text-sm font-medium">
                                {action.consequence.type} - {action.consequence.duration}
                              </p>
                              {action.consequence.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {action.consequence.description}
                                </p>
                              )}
                              {action.consequence.startDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Start:{" "}
                                  {format(
                                    new Date(action.consequence.startDate),
                                    "MMMM d, yyyy"
                                  )}
                                  {action.consequence.endDate &&
                                    ` - End: ${format(
                                      new Date(action.consequence.endDate),
                                      "MMMM d, yyyy"
                                    )}`}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {action.conductLetterGenerated && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewLetter(action)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Letter
                            </Button>
                            {action.conductLetterUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadLetter(action)}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination - Always show when we have actions */}
            {actions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show</span>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>

                    {/* Show pagination controls - always visible when we have data */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                          }
                        }}
                        disabled={currentPage === 1 || loading}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      {/* Page numbers - show if we have totalPages info */}
                      {pagination.totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, pagination.totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (pagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
                        </div>
                      )}

                      {/* Show current page info if we have pagination but only one page or no totalPages */}
                      {(pagination.totalPages === 1 || (pagination.totalPages === 0 && pagination.total > 0)) && (
                        <div className="text-sm text-gray-600 px-2">
                          Page {currentPage}
                          {pagination.totalPages > 0 && ` of ${pagination.totalPages}`}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (pagination.totalPages > 0) {
                            // We have pagination info, use it
                            if (currentPage < pagination.totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          } else {
                            // No pagination info, but if we have full page, try next page
                            if (actions.length >= pageSize) {
                              setCurrentPage(currentPage + 1);
                            }
                          }
                        }}
                        disabled={
                          (pagination.totalPages > 0 && currentPage >= pagination.totalPages) || 
                          (pagination.totalPages === 0 && (actions.length < pageSize || loading)) ||
                          loading
                        }
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-gray-600">
                      {pagination.total > 0 ? (
                        <>
                          Showing {((currentPage - 1) * pageSize) + 1} to{" "}
                          {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                          {pagination.total} {pagination.total === 1 ? "action" : "actions"}
                        </>
                      ) : (
                        <>
                          Showing {actions.length} {actions.length === 1 ? "action" : "actions"}
                          {actions.length >= pageSize && " (more may be available)"}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Conduct Letter Dialog */}
        <Dialog open={isLetterDialogOpen} onOpenChange={setIsLetterDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Conduct Letter</DialogTitle>
              <DialogDescription>
                Disciplinary action conduct letter for{" "}
                {selectedStudent.firstName} {selectedStudent.lastName}
              </DialogDescription>
            </DialogHeader>
            {selectedAction && (
              <div className="space-y-4">
                <div className="border rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Conduct Letter</h2>
                    <p className="text-gray-600">
                      {format(new Date(), "MMMM d, yyyy")}
                    </p>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">To:</p>
                      <p className="font-semibold">
                        Parent/Guardian of {selectedStudent.firstName}{" "}
                        {selectedStudent.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Student ID: {selectedStudent.studentId}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Subject:</p>
                      <p className="font-semibold">
                        Disciplinary Action - {selectedAction.type || "Incident"}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-2">Dear Parent/Guardian,</p>
                      <p className="mb-4">
                        This letter is to inform you about a disciplinary action
                        taken regarding your child, {selectedStudent.firstName}{" "}
                        {selectedStudent.lastName}.
                      </p>

                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="font-semibold mb-1">Incident Details:</p>
                          <p className="text-sm text-gray-700">
                            <strong>Date:</strong>{" "}
                            {selectedAction.date
                              ? format(new Date(selectedAction.date), "MMMM d, yyyy")
                              : "N/A"}
                            {selectedAction.time && ` at ${selectedAction.time}`}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>Location:</strong> {selectedAction.location || "N/A"}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>Type:</strong>{" "}
                            {selectedAction.type || selectedAction.actionType || "N/A"}
                          </p>
                        </div>

                        {selectedAction.description && (
                          <div>
                            <p className="font-semibold mb-1">Description:</p>
                            <p className="text-sm text-gray-700">
                              {selectedAction.description}
                            </p>
                          </div>
                        )}

                        {selectedAction.consequence && (
                          <div>
                            <p className="font-semibold mb-1">Consequence:</p>
                            <p className="text-sm text-gray-700">
                              {selectedAction.consequence.type} -{" "}
                              {selectedAction.consequence.duration}
                            </p>
                            {selectedAction.consequence.description && (
                              <p className="text-sm text-gray-700 mt-1">
                                {selectedAction.consequence.description}
                              </p>
                            )}
                          </div>
                        )}

                        {selectedAction.assignedBy && (
                          <div>
                            <p className="font-semibold mb-1">Assigned By:</p>
                            <p className="text-sm text-gray-700">
                              {selectedAction.assignedBy.firstName}{" "}
                              {selectedAction.assignedBy.lastName}
                              {selectedAction.assignedBy.role &&
                                ` (${selectedAction.assignedBy.role})`}
                            </p>
                            {selectedAction.assignedBy.email && (
                              <p className="text-sm text-gray-500">
                                {selectedAction.assignedBy.email}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="mb-2">
                        If you have any questions or concerns, please contact the
                        school administration.
                      </p>

                      <p className="mt-4">Sincerely,</p>
                      <p className="font-semibold">School Administration</p>
                      {selectedAction.assignedBy && (
                        <p className="text-sm text-gray-600">
                          {selectedAction.assignedBy.firstName}{" "}
                          {selectedAction.assignedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {selectedAction.conductLetterUrl && (
                    <Button
                      onClick={() => handleDownloadLetter(selectedAction)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsLetterDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
