"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  AlertCircle, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
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
import axios from "axios";
import { useStudent } from "../context/StudentContext";
// Format date helper
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
};

interface Alert {
  _id: string;
  title: string;
  description: string;
  read: boolean;
  studentId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  gradeId?: {
    _id: string;
    score: number;
    totalMarks: number;
    markingType: string;
    courseId?: any;
  };
  alertType?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ParentAlertsPage() {
  const { selectedStudent } = useStudent();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      if (selectedStudent?._id) {
        params.append('studentId', selectedStudent._id);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/parent/alerts?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data?.success) {
        const result = response.data.data;
        setAlerts(result.data || []);
        setTotalAlerts(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedStudent]);

  // Mark all alerts as read when page opens
  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!token) return;

        const params: any = {};
        if (selectedStudent?._id) {
          params.studentId = selectedStudent._id;
        }

        await axios.patch(
          `${process.env.NEXT_PUBLIC_SRS_SERVER}/parent/alerts/mark-read`,
          params,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Refresh alerts after marking as read
        fetchAlerts();
      } catch (error: any) {
        console.error('Error marking alerts as read:', error);
      }
    };

    markAllAsRead();
  }, [selectedStudent?._id]); // Only when student changes

  // Fetch alerts when dependencies change
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);



  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-gray-600 mt-1">
            {selectedStudent 
              ? `Alerts for ${selectedStudent.firstName} ${selectedStudent.lastName}`
              : 'All your alerts'}
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search alerts by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alerts ({totalAlerts})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No alerts found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert._id} className={alert.read ? '' : 'bg-blue-50'}>
                        <TableCell>
                          {alert.read ? (
                            <Badge variant="outline" className="bg-gray-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Read
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-blue-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Unread
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{alert.title}</TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {alert.description}
                            </p>
                            {alert.gradeId && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <BookOpen className="h-3 w-3" />
                                <span>
                                  {alert.gradeId.markingType}: {alert.gradeId.score}/{alert.gradeId.totalMarks}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(alert.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  {totalAlerts > 0 ? (
                    <>
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalAlerts)} of {totalAlerts} records
                      <span className="ml-2 text-gray-500">({pageSize} per page)</span>
                    </>
                  ) : (
                    'No records found'
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages || 1}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading || totalPages === 0}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
