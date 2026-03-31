'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, ArrowLeft, Search, UserPlus, UserMinus, 
  Mail, BookOpen, Award, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  phoneNumber?: string;
  isActive: boolean;
}

interface Club {
  _id: string;
  name: string;
  type: string;
  advisorId: string;
  advisor?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isActive: boolean;
}

interface FacultyAssignment {
  clubId: string;
  clubName: string;
  advisorId: string;
  advisorName: string;
  advisorEmail: string;
  clubType: string;
  assignedDate: string;
}

const ClubFacultyAssignmentPage = () => {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<FacultyAssignment[]>([]);
  const [unassignedClubs, setUnassignedClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchClubs();
  }, []);

  useEffect(() => {
    if (clubs.length > 0 && teachers.length > 0) {
      processAssignments();
    }
  }, [clubs, teachers]);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm]);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeachers(data.filter((teacher: Teacher) => teacher.isActive));
      } else {
        toast.error('Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Error fetching teachers');
    }
  };

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      } else {
        toast.error('Failed to fetch clubs');
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Error fetching clubs');
    } finally {
      setIsLoading(false);
    }
  };

  const processAssignments = () => {
    const assignedClubs: FacultyAssignment[] = [];
    const unassigned: Club[] = [];

    clubs.forEach(club => {
      if (club.advisorId) {
        // Check if advisorId is populated (object) or just an ID (string)
        if (typeof club.advisorId === 'object' && club.advisorId !== null && 'firstName' in club.advisorId && 'lastName' in club.advisorId && 'email' in club.advisorId) {
          const advisor = club.advisorId as { _id?: string; firstName: string; lastName: string; email: string };
          assignedClubs.push({
            clubId: club._id,
            clubName: club.name,
            advisorId: advisor._id || club.advisorId,
            advisorName: `${advisor.firstName} ${advisor.lastName}`,
            advisorEmail: advisor.email,
            clubType: club.type,
            assignedDate: new Date().toISOString() // This would come from actual assignment date
          });
        } else {
          // Advisor is not populated, find from teachers list
          const advisor = teachers.find(t => t._id === club.advisorId);
          if (advisor) {
            assignedClubs.push({
              clubId: club._id,
              clubName: club.name,
              advisorId: club.advisorId,
              advisorName: `${advisor.firstName} ${advisor.lastName}`,
              advisorEmail: advisor.email,
              clubType: club.type,
              assignedDate: new Date().toISOString() // This would come from actual assignment date
            });
          } else {
            unassigned.push(club);
          }
        }
      } else {
        unassigned.push(club);
      }
    });

    setAssignments(assignedClubs);
    setUnassignedClubs(unassigned);
  };

  const filterAssignments = () => {
    let filtered = assignments;

    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.advisorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.clubType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssignments(filtered);
  };

  const handleAssignAdvisor = async () => {
    if (!selectedClub || !selectedTeacher) {
      toast.error('Please select both a club and a teacher');
      return;
    }

    // Debug logging
    console.log('🔧 [DEBUG] Faculty Assignment Started:', {
      clubId: selectedClub,
      teacherId: selectedTeacher,
      timestamp: new Date().toISOString()
    });

    // Get selected club and teacher details for debugging
    const selectedClubData = unassignedClubs.find(c => c._id === selectedClub);
    const selectedTeacherData = teachers.find(t => t._id === selectedTeacher);
    
    console.log('🔧 [DEBUG] Assignment Details:', {
      club: {
        id: selectedClubData?._id,
        name: selectedClubData?.name,
        type: selectedClubData?.type,
        currentAdvisorId: selectedClubData?.advisorId
      },
      teacher: {
        id: selectedTeacherData?._id,
        name: `${selectedTeacherData?.firstName} ${selectedTeacherData?.lastName}`,
        email: selectedTeacherData?.email
      }
    });

    try {
      const token = localStorage.getItem('accessToken');
      const requestBody = { advisorId: selectedTeacher };
      
      console.log('🔧 [DEBUG] API Request:', {
        url: `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${selectedClub}`,
        method: 'PUT',
        body: requestBody,
        hasToken: !!token
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${selectedClub}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔧 [DEBUG] API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('🔧 [DEBUG] Assignment Success:', responseData);
        
        toast.success('Faculty advisor assigned successfully');
        setIsAssignDialogOpen(false);
        setSelectedClub('');
        setSelectedTeacher('');
        
        console.log('🔧 [DEBUG] Refreshing clubs data...');
        fetchClubs(); // Refresh the data
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔧 [DEBUG] Assignment Failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        toast.error('Failed to assign faculty advisor');
      }
    } catch (error) {
      console.error('🔧 [DEBUG] Assignment Error:', error);
      toast.error('Error assigning faculty advisor');
    }
  };

  const handleRemoveAdvisor = async (clubId: string) => {
    // Debug logging
    const clubToRemove = assignments.find(a => a.clubId === clubId);
    console.log('🔧 [DEBUG] Faculty Removal Started:', {
      clubId,
      clubName: clubToRemove?.clubName,
      currentAdvisor: clubToRemove?.advisorName,
      timestamp: new Date().toISOString()
    });

    try {
      const token = localStorage.getItem('accessToken');
      const requestBody = { advisorId: null };
      
      console.log('🔧 [DEBUG] Remove API Request:', {
        url: `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${clubId}`,
        method: 'PUT',
        body: requestBody,
        hasToken: !!token
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs/${clubId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔧 [DEBUG] Remove API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('🔧 [DEBUG] Removal Success:', responseData);
        
        toast.success('Faculty advisor removed successfully');
        console.log('🔧 [DEBUG] Refreshing clubs data after removal...');
        fetchClubs(); // Refresh the data
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔧 [DEBUG] Removal Failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        toast.error('Failed to remove faculty advisor');
      }
    } catch (error) {
      console.error('🔧 [DEBUG] Removal Error:', error);
      toast.error('Error removing faculty advisor');
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">Faculty Assignment</h1>
            <p className="text-muted-foreground">
              Manage faculty advisors for school clubs
            </p>
          </div>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Advisor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Faculty Advisor</DialogTitle>
              <DialogDescription>
                Select a club and teacher to create a new advisor assignment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="club">Select Club</Label>
                <Select value={selectedClub} onValueChange={setSelectedClub}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedClubs.map(club => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name} ({club.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Select Teacher</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName} - {teacher.email}
                        {teacher.department && ` (${teacher.department})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignAdvisor}>
                Assign Advisor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Clubs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Clubs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedClubs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Faculty Assignments</CardTitle>
          <CardDescription>
            Active advisor assignments for school clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {filteredAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club Name</TableHead>
                  <TableHead>Club Type</TableHead>
                  <TableHead>Faculty Advisor</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.clubId}>
                    <TableCell className="font-medium">
                      {assignment.clubName}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(assignment.clubType)}>
                        {assignment.clubType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {assignment.advisorName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {assignment.advisorEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveAdvisor(assignment.clubId)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No assignments found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'No assignments match your search criteria'
                  : 'No faculty advisors have been assigned yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Clubs */}
      {unassignedClubs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Clubs</CardTitle>
            <CardDescription>
              Clubs that need faculty advisor assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unassignedClubs.map((club) => (
                <div key={club._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{club.name}</h4>
                    <Badge className={getTypeColor(club.type)}>
                      {club.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <AlertCircle className="h-4 w-4" />
                    No advisor assigned
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSelectedClub(club._id);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign Advisor
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClubFacultyAssignmentPage;