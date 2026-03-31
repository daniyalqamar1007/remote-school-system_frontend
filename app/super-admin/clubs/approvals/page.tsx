'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, ArrowLeft, Search, CheckCircle, XCircle, 
  Calendar, Mail, User, AlertCircle, Clock, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingRequest {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    grade?: string;
    section?: string;
  };
  clubId: {
    _id: string;
    name: string;
    type: string;
  };
  status: 'pending';
  requestedAt: string;
  requestReason?: string;
}

interface Club {
  _id: string;
  name: string;
  type: string;
  requiresApproval: boolean;
}

const MembershipApprovalsPage = () => {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PendingRequest[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  useEffect(() => {
    fetchClubsAndRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [pendingRequests, searchTerm]);

  const fetchClubsAndRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }
      
      // First, fetch all clubs
      const clubsResponse = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        setClubs(clubsData);
        
        // Now fetch pending requests for each club
        const allPendingRequests: PendingRequest[] = [];

        for (const club of clubsData) {
          try {
            const requestsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/${club._id}/membership/pending`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );

            if (requestsResponse.ok) {
              const requests = await requestsResponse.json();
              // Add club information to each request
              const requestsWithClubInfo = requests.map((request: any) => ({
                ...request,
                clubId: {
                  _id: club._id,
                  name: club.name,
                  type: club.type
                },
                requestedAt: request.joinedDate || request.requestDate || new Date().toISOString()
              }));
              allPendingRequests.push(...requestsWithClubInfo);
            }
          } catch (error) {
            console.error(`Error fetching requests for club ${club.name}:`, error);
          }
        }

        setPendingRequests(allPendingRequests);
      } else {
        const errorData = await clubsResponse.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to fetch clubs');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error fetching membership requests');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = pendingRequests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        `${request.studentId.firstName} ${request.studentId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.studentId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.clubId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.clubId.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApproveRequest = async (request: PendingRequest) => {
    try {
      const token = localStorage.getItem('accessToken');
      const userInfoStr = localStorage.getItem('userInfo') || localStorage.getItem('user');
      
      if (!userInfoStr) {
        toast.error('User information not found. Please log in again.');
        return;
      }
      
      const userInfo = JSON.parse(userInfoStr);
      const userId = userInfo._id || userInfo.id || userInfo.userId;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/${request.clubId._id}/membership/${request._id}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            approvedBy: userId
          })
        }
      );

      if (response.ok) {
        toast.success(`Approved ${request.studentId.firstName} ${request.studentId.lastName} for ${request.clubId.name}`);
        // Remove the approved request from the list
        setPendingRequests(prev => prev.filter(req => req._id !== request._id));
        filterRequests();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to approve membership request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error approving membership request');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const userInfoStr = localStorage.getItem('userInfo') || localStorage.getItem('user');
      
      if (!userInfoStr) {
        toast.error('User information not found. Please log in again.');
        return;
      }
      
      const userInfo = JSON.parse(userInfoStr);
      const userId = userInfo._id || userInfo.id || userInfo.userId;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/clubs/${selectedRequest.clubId._id}/membership/${selectedRequest._id}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            rejectedBy: userId,
            reason: rejectionReason
          })
        }
      );

      if (response.ok) {
        toast.success(`Rejected ${selectedRequest.studentId.firstName} ${selectedRequest.studentId.lastName} for ${selectedRequest.clubId.name}`);
        // Remove the rejected request from the list
        setPendingRequests(prev => prev.filter(req => req._id !== selectedRequest._id));
        setIsRejectDialogOpen(false);
        setSelectedRequest(null);
        setRejectionReason('');
        filterRequests();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to reject membership request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error rejecting membership request');
    }
  };

  const openRejectDialog = (request: PendingRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
    setRejectionReason('');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Sports': 'bg-green-100 text-green-800',
      'Arts': 'bg-purple-100 text-purple-800',
      'Service': 'bg-yellow-100 text-yellow-800',
      'STEM': 'bg-indigo-100 text-indigo-800',
      'Cultural': 'bg-pink-100 text-pink-800',
      'Language': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Membership Approvals</h1>
            <p className="text-muted-foreground">
              Review and manage pending club membership requests
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Membership Requests</CardTitle>
          <CardDescription>
            Review student requests to join clubs that require approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, email, or club..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading requests...</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : filteredRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {request.studentId.firstName} {request.studentId.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {request.studentId.email}
                        </div>
                        {(request.studentId.grade || request.studentId.section) && (
                          <div className="text-sm text-muted-foreground">
                            {request.studentId.grade && `Grade ${request.studentId.grade}`}
                            {request.studentId.grade && request.studentId.section && ' - '}
                            {request.studentId.section && `Section ${request.studentId.section}`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="font-medium">{request.clubId.name}</div>
                        <Badge className={getTypeColor(request.clubId.type)}>
                          {request.clubId.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{formatDate(request.requestedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[200px] truncate">
                        {request.requestReason || 'No reason provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRejectDialog(request)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No pending requests</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'No requests match your search criteria'
                  : 'All membership requests have been processed or no clubs require approval'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Membership Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  You are about to reject {selectedRequest.studentId.firstName} {selectedRequest.studentId.lastName}&apos;s 
                  request to join {selectedRequest.clubId.name}. Please provide a reason.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this request is being rejected..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectRequest}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembershipApprovalsPage;