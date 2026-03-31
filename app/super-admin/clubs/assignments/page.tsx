'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users, CheckCircle, XCircle, Clock, Eye, Edit, Trash2, ArrowLeft, UserPlus, UserMinus, Award, GraduationCap, BookOpen, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { StudentSelect } from '@/components/sports/StudentSelect'
import { adminApi } from '@/lib/api'

export default function ClubAssignmentsPage() {
  const router = useRouter()
  const [memberships, setMemberships] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [membershipsLoading, setMembershipsLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterClub, setFilterClub] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [requestRoleFilter, setRequestRoleFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedRole, setSelectedRole] = useState('Member')
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [membershipToDelete, setMembershipToDelete] = useState<any | null>(null)
  const [removingMembershipId, setRemovingMembershipId] = useState<string | null>(null)
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState('memberships')
  // Super-admin school selection
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all') // Default to 'all' to show all records
  const [assignDialogSchoolId, setAssignDialogSchoolId] = useState<string>('')

  const roles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Member']
  const apiBase = process.env.NEXT_PUBLIC_SRS_SERVER

  // Fetch schools for super-admin
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          const data = await response.json()
          const schoolsList = data?.data?.schools || data?.schools || []
          setSchools(schoolsList)
        }
      } catch (error) {
        console.error('Error fetching schools:', error)
      }
    }
    fetchSchools()
  }, [])

  // Students are now loaded by StudentSelect component when school is selected

  const fetchClubs = async (schoolId?: string) => {
    try {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        toast.error('Authentication required')
        setClubs([])
        return
      }

      // For super-admin, require school selection
      const targetSchoolId = schoolId || selectedSchoolId
      if (!targetSchoolId || targetSchoolId === 'all' || targetSchoolId === '') {
        setClubs([])
        return
      }

      const params = new URLSearchParams()
      if (targetSchoolId && targetSchoolId !== 'all' && targetSchoolId !== '') {
        params.append('schoolId', targetSchoolId)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Handle paginated response
        const clubsArray = data?.clubs || (Array.isArray(data) ? data : [])
        setClubs(clubsArray)
      } else {
        console.error('Failed to fetch clubs:', response.status)
        toast.error('Failed to fetch clubs')
        setClubs([])
      }
    } catch (error) {
      console.error('Error fetching clubs:', error)
      toast.error('Error fetching clubs')
      setClubs([])
    }
  }

  const fetchMemberships = useCallback(async () => {
    if (!apiBase) {
      console.error('Server URL is not configured')
      return
    }

    const token = localStorage.getItem('accessToken')

    if (!token) {
      toast.error('Authentication required')
      setMemberships([])
      return
    }

    setMembershipsLoading(true)

    try {
      const params = new URLSearchParams()
      // Add schoolId filter if not 'all'
      if (selectedSchoolId && selectedSchoolId !== 'all' && selectedSchoolId !== '') {
        params.set('schoolId', selectedSchoolId)
      }
      // Add other filters
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filterClub !== 'all') params.set('clubId', filterClub)

      const response = await fetch(`${apiBase}/admin/clubs/memberships/all?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch memberships')
      }

      const data = await response.json()
      const membershipsArray = Array.isArray(data) ? data : []

      setMemberships(membershipsArray)
    } catch (error) {
      console.error('Error fetching memberships:', error)
      toast.error('Failed to fetch memberships')
      setMemberships([])
    } finally {
      setMembershipsLoading(false)
    }
  }, [apiBase, selectedSchoolId, debouncedSearch, filterClub, roleFilter])

  const fetchPendingRequests = useCallback(async () => {
    if (!apiBase) {
      console.error('Server URL is not configured')
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast.error('Authentication required')
      setPendingRequests([])
      return
    }

    setRequestsLoading(true)

    try {
      const params = new URLSearchParams()
      // Add schoolId filter if not 'all'
      if (selectedSchoolId && selectedSchoolId !== 'all' && selectedSchoolId !== '') {
        params.set('schoolId', selectedSchoolId)
      }
      // Add other filters
      if (requestRoleFilter !== 'all') params.set('role', requestRoleFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filterClub !== 'all') params.set('clubId', filterClub)

      const response = await fetch(`${apiBase}/admin/clubs/memberships/pending/all?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pending requests')
      }

      const data = await response.json()
      const requestsArray = Array.isArray(data) ? data : []

      setPendingRequests(requestsArray)
    } catch (error) {
      console.error('Error fetching pending requests:', error)
      toast.error('Failed to fetch pending requests')
      setPendingRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }, [apiBase, selectedSchoolId, debouncedSearch, filterClub, requestRoleFilter])

  // Remove fetchStudents on mount - students will be loaded by StudentSelect component when school is selected

  // Fetch all clubs for super-admin (needed for club filter dropdown)
  useEffect(() => {
    const fetchAllClubs = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const params = new URLSearchParams()
        // If school is selected, filter by school, otherwise get all clubs
        if (selectedSchoolId && selectedSchoolId !== 'all' && selectedSchoolId !== '') {
          params.append('schoolId', selectedSchoolId)
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/clubs?${params.toString()}&limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const clubsArray = data?.clubs || (Array.isArray(data) ? data : [])
          setClubs(clubsArray)
        }
      } catch (error) {
        console.error('Error fetching clubs:', error)
      }
    }

    fetchAllClubs()
    setInitialLoading(false)
  }, [selectedSchoolId])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    fetchMemberships()
    fetchPendingRequests()
  }, [fetchMemberships, fetchPendingRequests])

  const handleAssignStudent = async () => {
    if (!assignDialogSchoolId || assignDialogSchoolId === 'all' || assignDialogSchoolId === '') {
      toast.error('Please select a school first')
      return
    }
    if (!selectedClub || !selectedStudent) {
      toast.error('Please select both a club and a student')
      return
    }

    if (!apiBase) {
      toast.error('Server URL is not configured')
      return
    }

    try {
      setAssigning(true)
      const token = localStorage.getItem('accessToken')

      if (!token) {
        toast.error('Authentication required')
        return
      }

      // Prevent duplicate assignment by checking current memberships
      const alreadyMember = memberships.some((m: any) => {
        const clubId = m.clubId?._id || m.clubId
        const studentId = m.studentId?._id || m.studentId
        return clubId?.toString() === selectedClub && studentId?.toString() === selectedStudent
      })
      if (alreadyMember) {
        toast.error('Student is already a member of this club')
        return
      }

      const response = await fetch(`${apiBase}/clubs/${selectedClub}/membership/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          role: selectedRole
        })
      })

      if (response.ok) {
        // Auto-approve the membership since it's admin-created
        const membershipData = await response.json()

        const userInfo = JSON.parse(localStorage.getItem('userInfo') || localStorage.getItem('user') || '{}')
        const approveResponse = await fetch(`${apiBase}/clubs/${selectedClub}/membership/${membershipData._id}/approve`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            approvedBy: userInfo._id || userInfo.id
          })
        })

        if (approveResponse.ok) {
          toast.success('Student assigned to club successfully')
          setIsAssignDialogOpen(false)
          setSelectedClub('')
          setSelectedStudent('')
          setSelectedRole('Member')
          setAssignDialogSchoolId('')
          await fetchMemberships()
          await fetchPendingRequests()
          await fetchClubs(selectedSchoolId)
        } else {
          toast.error('Assignment created but auto-approval failed')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to assign student to club')
      }
    } catch (error) {
      console.error('Error assigning student:', error)
      toast.error('Error assigning student to club')
    } finally {
      setAssigning(false)
    }
  }

  const handleApproveRequest = async (membershipId: string, clubId: string) => {
    try {
      if (!apiBase) {
        toast.error('Server URL is not configured')
        return
      }

      const token = localStorage.getItem('accessToken')
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || localStorage.getItem('user') || '{}')

      const response = await fetch(`${apiBase}/clubs/${clubId}/membership/${membershipId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approvedBy: userInfo._id || userInfo.id
        })
      })

      if (response.ok) {
        toast.success('Membership request approved')
        await fetchMemberships()
        await fetchPendingRequests()
        await fetchClubs()
      } else {
        toast.error('Failed to approve membership request')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error('Error approving membership request')
    }
  }


  // Filter memberships and requests
  const filteredMemberships = memberships.filter((m: any) => {
    const matchesSearch = !debouncedSearch || 
      `${m.studentId?.firstName} ${m.studentId?.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.clubId?.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesClub = filterClub === 'all' || m.clubId?._id === filterClub || m.clubId === filterClub
    const matchesRole = roleFilter === 'all' || m.role === roleFilter
    return matchesSearch && matchesClub && matchesRole
  })

  const filteredPendingRequests = pendingRequests.filter((r: any) => {
    const matchesSearch = !debouncedSearch || 
      `${r.studentId?.firstName} ${r.studentId?.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.clubId?.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesClub = filterClub === 'all' || r.clubId?._id === filterClub || r.clubId === filterClub
    const matchesRole = requestRoleFilter === 'all' || r.role === requestRoleFilter
    return matchesSearch && matchesClub && matchesRole
  })

  // Pagination calculations
  const totalMemberships = filteredMemberships.length
  const totalRequests = filteredPendingRequests.length
  const totalPagesMemberships = Math.ceil(totalMemberships / pageSize) || 1
  const totalPagesRequests = Math.ceil(totalRequests / pageSize) || 1
  
  const paginatedMemberships = filteredMemberships.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const paginatedRequests = filteredPendingRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, filterClub, roleFilter, requestRoleFilter, activeTab])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Academic: 'bg-blue-100 text-blue-800',
      Sports: 'bg-green-100 text-green-800',
      Arts: 'bg-purple-100 text-purple-800',
      Service: 'bg-yellow-100 text-yellow-800',
      STEM: 'bg-indigo-100 text-indigo-800',
      Cultural: 'bg-pink-100 text-pink-800',
      Language: 'bg-orange-100 text-orange-800',
      Other: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || colors['Other']
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      President: 'bg-purple-100 text-purple-800',
      'Vice President': 'bg-blue-100 text-blue-800',
      Secretary: 'bg-green-100 text-green-800',
      Treasurer: 'bg-yellow-100 text-yellow-800',
      Member: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || colors['Member']
  }

  // 2. handleRemoveMembership function ko update karo
  const handleRemoveMembership = async (membershipId: string, clubId: string) => {
    setRemovingMembershipId(membershipId) // ← yahan set karo

    try {
      if (!apiBase) {
        toast.error('Server URL is not configured')
        return
      }

      const token = localStorage.getItem('accessToken')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`${apiBase}/clubs/${clubId}/membership/${membershipId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Member removed successfully')
        await fetchMemberships()
        await fetchClubs()
      } else {
        toast.error('Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing membership:', error)
      toast.error('Error removing member')
    } finally {
      setRemovingMembershipId(null) // ← finally mein reset
    }
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
            <h1 className="text-3xl font-bold">Student Assignments</h1>
            <p className="text-muted-foreground">
              Manage student assignments to school clubs
            </p>
          </div>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Student to Club</DialogTitle>
              <DialogDescription>
                Select a student and club to create a new membership
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="school">Select School <span className="text-red-500">*</span></Label>
                <Select 
                  value={assignDialogSchoolId} 
                  onValueChange={(value) => {
                    setAssignDialogSchoolId(value)
                    setSelectedClub('')
                    setSelectedStudent('')
                    fetchClubs(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school._id} value={school._id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="club">Select Club <span className="text-red-500">*</span></Label>
                <Select 
                  value={selectedClub} 
                  onValueChange={setSelectedClub}
                  disabled={!assignDialogSchoolId || assignDialogSchoolId === 'all' || assignDialogSchoolId === ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={assignDialogSchoolId ? "Choose a club" : "Please select a school first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(clubs) && clubs.map((club: any) => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name} ({club.type})
                        {club.maxMembers && ` - ${club.memberCount || 0}/${club.maxMembers} members`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student">Select Student <span className="text-red-500">*</span></Label>
                <StudentSelect
                  value={selectedStudent}
                  onValueChange={(value) => setSelectedStudent(value)}
                  placeholder={assignDialogSchoolId ? "Search student" : "Please select a school first"}
                  disabled={!assignDialogSchoolId || assignDialogSchoolId === 'all' || assignDialogSchoolId === ''}
                  schoolId={assignDialogSchoolId && assignDialogSchoolId !== 'all' && assignDialogSchoolId !== '' ? assignDialogSchoolId : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Club Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: string) => (
                      <SelectItem key={role} value={role}>
                        {role}
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
              <Button onClick={handleAssignStudent} disabled={assigning}>
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Student'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* School Selection Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="schoolFilter" className="whitespace-nowrap">Filter by School:</Label>
            <Select 
              value={selectedSchoolId} 
              onValueChange={(value) => {
                setSelectedSchoolId(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school._id} value={school._id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="memberships">Active Memberships ({memberships.length})</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests ({pendingRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Club Memberships</CardTitle>
              <CardDescription>
                Students currently assigned to clubs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[220px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search memberships..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      disabled={false}
                    />
                  </div>
                </div>
                <Select 
                  value={filterClub} 
                  onValueChange={setFilterClub}
                  disabled={false}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clubs</SelectItem>
                    {Array.isArray(clubs) && clubs.map((club: any) => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={roleFilter} 
                  onValueChange={setRoleFilter}
                  disabled={!selectedSchoolId || selectedSchoolId === 'all' || selectedSchoolId === ''}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role: string) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(initialLoading || membershipsLoading) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Club Type</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Loading memberships...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : totalMemberships > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Club Type</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMemberships.map((membership: any) => {
                      const clubSchoolId = typeof membership.clubId?.schoolId === 'object' 
                        ? membership.clubId.schoolId._id 
                        : membership.clubId?.schoolId
                      const school = schools.find(s => s._id === clubSchoolId)
                      return (
                      <TableRow key={membership._id}>
                        <TableCell className="font-medium">
                          {membership.studentId?.firstName || ''} {membership.studentId?.lastName || ''}
                        </TableCell>
                        <TableCell>{membership.studentId?.gradeLevel || membership.studentId?.class || 'N/A'}</TableCell>
                        <TableCell>{school?.name || 'N/A'}</TableCell>
                        <TableCell>{membership.clubId?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(membership.clubId?.type || 'Other')}>
                            {membership.clubId?.type || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(membership.role)}>
                            {membership.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(membership.joinedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMembershipToDelete(membership)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No memberships found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterClub !== 'all' || selectedSchoolId !== 'all'
                      ? 'No memberships match your search criteria'
                      : 'No students have been assigned to clubs yet'}
                  </p>
                </div>
              )}
              
              {/* Pagination for Memberships */}
              {totalMemberships > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder={pageSize.toString()} />
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
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPagesMemberships) }, (_, i) => {
                        let pageNum;
                        if (totalPagesMemberships <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPagesMemberships - 2) {
                          pageNum = totalPagesMemberships - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPagesMemberships}
                    >
                      Next
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalMemberships)} of {totalMemberships} memberships
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Membership Requests</CardTitle>
              <CardDescription>
                Student requests waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[220px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      disabled={false}
                    />
                  </div>
                </div>
                <Select 
                  value={filterClub} 
                  onValueChange={setFilterClub}
                  disabled={false}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clubs</SelectItem>
                    {Array.isArray(clubs) && clubs.map((club: any) => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={requestRoleFilter} 
                  onValueChange={setRequestRoleFilter}
                  disabled={false}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role: string) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(initialLoading || requestsLoading) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Club Type</TableHead>
                      <TableHead>Requested Role</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Loading pending requests...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : totalRequests > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Club Type</TableHead>
                      <TableHead>Requested Role</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((request: any) => {
                      const clubSchoolId = typeof request.clubId?.schoolId === 'object' 
                        ? request.clubId.schoolId._id 
                        : request.clubId?.schoolId
                      const school = schools.find(s => s._id === clubSchoolId)
                      return (
                      <TableRow key={request._id}>
                        <TableCell className="font-medium">
                          {request.studentId?.firstName || ''} {request.studentId?.lastName || ''}
                        </TableCell>
                        <TableCell>{request.studentId?.gradeLevel || request.studentId?.class || 'N/A'}</TableCell>
                        <TableCell>{school?.name || 'N/A'}</TableCell>
                        <TableCell>{request.clubId?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(request.clubId?.type || 'Other')}>
                            {request.clubId?.type || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(request.role)}>
                            {request.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.joinedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request._id, request.clubId?._id || request.clubId)}
                            disabled={!request.clubId?._id && !request.clubId}
                          >
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No pending requests
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterClub !== 'all' || selectedSchoolId !== 'all'
                      ? 'No requests match your search criteria'
                      : 'No students are waiting for club approval'}
                  </p>
                </div>
              )}
              
              {/* Pagination for Requests */}
              {totalRequests > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder={pageSize.toString()} />
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
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPagesRequests) }, (_, i) => {
                        let pageNum;
                        if (totalPagesRequests <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPagesRequests - 2) {
                          pageNum = totalPagesRequests - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPagesRequests}
                    >
                      Next
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRequests)} of {totalRequests} requests
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              {membershipToDelete
                ? `Are you sure you want to remove ${membershipToDelete.studentId?.firstName} ${membershipToDelete.studentId?.lastName} from "${membershipToDelete.clubId?.name}"? This action cannot be undone.`
                : 'Are you sure you want to remove this club assignment? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setMembershipToDelete(null)
              }}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!membershipToDelete) return
                await handleRemoveMembership(
                  membershipToDelete._id,
                  membershipToDelete.clubId?._id || membershipToDelete.clubId
                )
                setDeleteDialogOpen(false)
                setMembershipToDelete(null)
              }}
              disabled={!!removingMembershipId} // ← disable jab chal raha ho
            >
              {removingMembershipId === membershipToDelete?._id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

