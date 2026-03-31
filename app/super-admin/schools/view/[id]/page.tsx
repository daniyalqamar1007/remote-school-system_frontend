'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Code,
  Globe,
  Shield,
  Settings,
  TrendingUp,
  UserCheck,
  Stethoscope,
  FileText,
  CheckCircle2,
  XCircle,
  School,
  Building,
  Award
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface School {
  _id: string
  name: string
  code: string
  type: string
  status: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    _id?: string
  }
  phone: string
  email: string
  adminId: string
  establishedYear: number
  currentStudentCount: number
  currentUserCount: number
  maxUsers: number
  gradelevels: string[]
  academicYearStart: string
  academicYearEnd: string
  isActive: boolean
  settings: {
    allowParentRegistration: boolean
    requireEmailVerification: boolean
    maxStudentsPerClass: number
    attendanceGracePeriod: number
  }
  createdAt: string
  updatedAt: string
}

interface Admin {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface Statistics {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  totalNurses: number
  totalSecretaries: number
  totalAdmins: number
  totalDepartments: number
  totalCourses: number
}

interface Department {
  _id: string
  name: string
  code: string
  description: string
}

interface Course {
  _id: string
  courseName: string
  courseCode: string
  description?: string
  isActive: boolean
}

interface SchoolData {
  school: School
  admin: Admin
  statistics: Statistics
  departments: Department[]
  courses: Course[]
}

export default function SchoolViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchoolDetails()
  }, [params.id])

  const fetchSchoolDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken')

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success) {
        setSchoolData(response.data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch school details",
          variant: "destructive",
        })
        router.back()
      }
    } catch (error) {
      console.error('Error fetching school details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch school details",
        variant: "destructive",
      })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAcademicYear = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'Not specified'
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.getFullYear()} - ${end.getFullYear()}`
  }

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getTypeColor = (type: string | null | undefined) => {
    if (!type) return 'bg-gray-100 text-gray-800'
    return type === 'PUBLIC' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading school details...</p>
        </div>
      </div>
    )
  }

  if (!schoolData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">School not found</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { school, admin, statistics, departments, courses } = schoolData

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                School Details
              </h1>
              <p className="text-gray-600 mt-1">
                Complete information for {school.name || 'School'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* {school.status && (
              <Badge className={getStatusColor(school.status)}>
                {school.status}
              </Badge>
            )} */}
            {school.type && (
              <Badge className={getTypeColor(school.type)}>
                {school.type}
              </Badge>
            )}
            <Badge variant={school.isActive ? 'default' : 'secondary'}>
              {school.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - School Info & Admin */}
          <div className="lg:col-span-1 space-y-6">
            {/* School Profile Card */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl">{school.name || '-'}</CardTitle>
                <CardDescription className="text-base mt-2">
                  School Code: {school.code || '-'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium truncate">{school.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{school.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Address</p>
                    {school.address ? (
                      <>
                        <p className="text-sm font-medium">
                          {school.address.street || '-'}, {school.address.city || '-'}, {school.address.state || '-'} {school.address.zipCode || ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{school.address.country || '-'}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium">Not found</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Established</p>
                    <p className="text-sm font-medium">{school.establishedYear || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            {/* <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Quick Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{statistics.totalStudents}</p>
                    <p className="text-xs text-gray-600 mt-1">Students</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{statistics.totalTeachers}</p>
                    <p className="text-xs text-gray-600 mt-1">Teachers</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{statistics.totalParents}</p>
                    <p className="text-xs text-gray-600 mt-1">Parents</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-pink-600">{statistics.totalNurses}</p>
                    <p className="text-xs text-gray-600 mt-1">Nurses</p>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-indigo-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-indigo-600">{statistics.totalDepartments}</p>
                      <p className="text-xs text-gray-600 mt-1">Departments</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-600">{statistics.totalCourses}</p>
                      <p className="text-xs text-gray-600 mt-1">Courses</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* Admin Information */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  School Administrator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {admin ? (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {admin.firstName || '-'} {admin.lastName || '-'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{admin.email || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{admin.phone || '-'}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Not found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Information */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Academic Year</label>
                    {school.academicYearStart && school.academicYearEnd ? (
                      <>
                        <p className="text-sm font-semibold mt-1">
                          {formatAcademicYear(school.academicYearStart, school.academicYearEnd)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(school.academicYearStart)} - {formatDate(school.academicYearEnd)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Not found</p>
                    )}
                  </div>
                  {/* <div>
                    <label className="text-sm font-medium text-gray-600">Grade Levels</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {school.gradelevels && school.gradelevels.length > 0 ? (
                        school.gradelevels.map((grade, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            Grade {grade || '-'}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                  </div> */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Students</label>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{school.currentStudentCount ?? '-'}</p>
                  </div>
                  {/* <div>
                    <label className="text-sm font-medium text-gray-600">User Capacity</label>
                    <p className="text-sm font-semibold mt-1">
                      {school.currentUserCount} / {school.maxUsers} users
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(school.currentUserCount / school.maxUsers) * 100}%` }}
                      />
                    </div>
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {/* School Settings */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  School Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {school.settings ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {school.settings.allowParentRegistration ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="text-sm font-medium">Parent Registration</span>
                      </div>
                      <Badge variant={school.settings.allowParentRegistration ? 'default' : 'secondary'}>
                        {school.settings.allowParentRegistration ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {school.settings.requireEmailVerification ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="text-sm font-medium">Email Verification</span>
                      </div>
                      <Badge variant={school.settings.requireEmailVerification ? 'default' : 'secondary'}>
                        {school.settings.requireEmailVerification ? 'Required' : 'Not Required'}
                      </Badge>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Max Students Per Class</label>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {school.settings.maxStudentsPerClass ?? '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Attendance Grace Period</label>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {school.settings.attendanceGracePeriod ? `${school.settings.attendanceGracePeriod} minutes` : '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not found</p>
                )}
              </CardContent>
            </Card>

            {/* Detailed Statistics */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Detailed Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{statistics.totalStudents ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Students</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <UserCheck className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{statistics.totalTeachers ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Teachers</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{statistics.totalParents ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Parents</p>
                    </div>
                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                      <Stethoscope className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-pink-600">{statistics.totalNurses ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Nurses</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <FileText className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-600">{statistics.totalSecretaries ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Secretaries</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <Shield className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">{statistics.totalAdmins ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Admins</p>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <Building className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-indigo-600">{statistics.totalDepartments ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Departments</p>
                    </div>
                    <div className="text-center p-4 bg-teal-50 rounded-lg">
                      <BookOpen className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-teal-600">{statistics.totalCourses ?? '-'}</p>
                      <p className="text-xs text-gray-600 mt-1">Courses</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not found</p>
                )}
              </CardContent>
            </Card>

            {/* Departments */}
            {departments && departments.length > 0 && (
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    Departments ({departments.length})
                  </CardTitle>
                  <CardDescription>All departments in this school</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {departments.map((dept) => (
                      <div key={dept._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{dept.name || '-'}</h4>
                              <Badge variant="outline" className="text-xs">{dept.code || '-'}</Badge>
                            </div>
                            {dept.description ? (
                              <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                            ) : (
                              <p className="text-sm text-gray-400 mt-1">-</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Courses */}
            {courses && courses.length > 0 && (
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    Courses ({courses.length})
                  </CardTitle>
                  <CardDescription>All courses offered by this school</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {courses.map((course) => (
                      <div key={course._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{course.courseName || '-'}</h4>
                              <Badge variant="outline" className="text-xs">{course.courseCode || '-'}</Badge>
                              {course.isActive && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                              )}
                            </div>
                            {course.description ? (
                              <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                            ) : (
                              <p className="text-sm text-gray-400 mt-1">-</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Information */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-sm font-semibold mt-1">
                      {school.createdAt ? formatDate(school.createdAt) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-sm font-semibold mt-1">
                      {school.updatedAt ? formatDate(school.updatedAt) : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

