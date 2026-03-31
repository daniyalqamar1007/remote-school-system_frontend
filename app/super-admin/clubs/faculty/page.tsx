'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, UserPlus, Search, Settings, Shield, Award,
  Edit, Trash2, Eye, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface Club {
  _id: string;
  name: string;
  description?: string;
  type: string;
  advisorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  schoolId: string;
  status: 'active' | 'inactive';
  memberCount?: number;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  subject?: string;
}

const AdminClubsFacultyPage = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_SRS_SERVER;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterClubs();
  }, [clubs, searchTerm, filterType]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const [clubsResponse, teachersResponse] = await Promise.all([
        axios.get(`${API_BASE}/clubs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/admin/teachers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const clubsData = clubsResponse.data || [];
      const teachersData = teachersResponse.data?.data || teachersResponse.data?.teachers || teachersResponse.data || [];

      setClubs(Array.isArray(clubsData) ? clubsData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load clubs and teachers data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterClubs = () => {
    let filtered = clubs;

    if (searchTerm) {
      filtered = filtered.filter(club => 
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.advisorId?.firstName + ' ' + club.advisorId?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      if (filterType === 'no-advisor') {
        filtered = filtered.filter(club => !club.advisorId);
      } else {
        filtered = filtered.filter(club => club.type === filterType);
      }
    }

    setFilteredClubs(filtered);
  };

  const handleAssignAdvisor = async () => {
    if (!selectedClub || !selectedTeacher) {
      toast.error('Please select both club and teacher');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      await axios.patch(`${API_BASE}/clubs/${selectedClub._id}`, {
        advisorId: selectedTeacher
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success('Club advisor assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedClub(null);
      setSelectedTeacher('');
      fetchData();
    } catch (error) {
      console.error('Error assigning advisor:', error);
      toast.error('Failed to assign club advisor');
    }
  };

  const handleRemoveAdvisor = async (clubId: string) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      await axios.patch(`${API_BASE}/clubs/${clubId}`, {
        advisorId: null
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success('Club advisor removed successfully');
      fetchData();
    } catch (error) {
      console.error('Error removing advisor:', error);
      toast.error('Failed to remove club advisor');
    }
  };

  const openAssignDialog = (club: Club) => {
    setSelectedClub(club);
    setSelectedTeacher(club.advisorId?._id || '');
    setIsAssignDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Club Faculty Management</h1>
          <p className="text-gray-600 mt-1">Assign and manage faculty advisors for clubs</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Advisors</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clubs.filter(club => club.advisorId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Advisors</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {clubs.filter(club => !club.advisorId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Teachers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Clubs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clubs or advisors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                <SelectItem value="no-advisor">No Advisor Assigned</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="STEM">STEM</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clubs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Club Faculty Assignments</CardTitle>
          <CardDescription>
            Showing {filteredClubs.length} of {clubs.length} clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Current Advisor</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClubs.map((club) => (
                <TableRow key={club._id}>
                  <TableCell className="font-medium">
                    {club.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{club.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {club.advisorId ? (
                      <div>
                        <div className="font-medium">
                          {club.advisorId.firstName} {club.advisorId.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {club.advisorId.email}
                        </div>
                        {club.advisorId.department && (
                          <div className="text-xs text-gray-400">
                            {club.advisorId.department}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="destructive">No Advisor</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {club.memberCount || 0} members
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={club.status === 'active' ? 'default' : 'secondary'}>
                      {club.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignDialog(club)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {club.advisorId ? 'Change' : 'Assign'}
                      </Button>
                      {club.advisorId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAdvisor(club._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Advisor Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedClub?.advisorId ? 'Change' : 'Assign'} Club Advisor
            </DialogTitle>
            <DialogDescription>
              Select a teacher to serve as advisor for {selectedClub?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="teacher">Select Teacher</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      <div>
                        <div>{teacher.firstName} {teacher.lastName}</div>
                        <div className="text-sm text-gray-500">
                          {teacher.email} {teacher.department && `• ${teacher.department}`}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignAdvisor}>
                {selectedClub?.advisorId ? 'Change' : 'Assign'} Advisor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClubsFacultyPage;