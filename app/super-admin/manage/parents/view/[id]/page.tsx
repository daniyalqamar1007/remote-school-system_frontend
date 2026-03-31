'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, GraduationCap, Users, Building2, Shield, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Parent {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  gender: string
  profilePicture: string | null
  isActive: boolean
  parentType: string
  isPrimaryContact: boolean
  hasPickupPermission: boolean
  belongToSchools: Array<{
    schoolId: string
    schoolName: string
    isActive: boolean
  }>
  numberOfChildren: number
  createdAt: string
  updatedAt: string
}

interface Child {
  _id: string
  firstName: string
  lastName: string
  profilePicture: string | null
  schoolId: string
  schoolName: string
  studentId: string
  class: string
  section?: string
  email: string
  gender: string
  dob: string
}

export default function ParentViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [parent, setParent] = useState<Parent | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParentDetails()
  }, [params.id])

  const fetchParentDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/parents/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        setParent(response.data.data.parent)
        setChildren(response.data.data.children || [])
      } else {
        router.back()
      }
    } catch (error) {
      console.error('Error fetching parent details:', error)
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

  const handleViewStudent = (studentId: string) => {
    router.push(`/admin/manage-students/view/${studentId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading parent details...</p>
        </div>
      </div>
    )
  }

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Parent not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            <h1 className="text-3xl font-bold text-gray-900">
              Parent Details
            </h1>
            <p className="text-gray-600">
              Complete information for {parent.firstName} {parent.lastName}
            </p>
          </div>
        </div>
        <Badge variant={parent.isActive ? 'default' : 'secondary'}>
          {parent.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={parent.profilePicture || undefined} 
                    alt={`${parent.firstName} ${parent.lastName}`}
                  />
                  <AvatarFallback className="text-2xl">
                    {parent.firstName.charAt(0)}{parent.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">
                {parent.firstName} {parent.lastName}
              </CardTitle>
              <p className="text-gray-600">{parent.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm capitalize">{parent.gender || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{parent.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{parent.phone || 'Not specified'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <span className="text-sm">{parent.address || 'Not specified'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Parent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Parent Type</label>
                <p className="text-sm capitalize">{parent.parentType || 'Not specified'}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Primary Contact</span>
                <Badge variant={parent.isPrimaryContact ? 'default' : 'secondary'}>
                  {parent.isPrimaryContact ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> No</>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pickup Permission</span>
                <Badge variant={parent.hasPickupPermission ? 'default' : 'secondary'}>
                  {parent.hasPickupPermission ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> No</>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Number of Children</label>
                <p className="text-2xl font-bold text-primary">{parent.numberOfChildren}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Associated School</label>
                <p className="text-2xl font-bold text-primary">
                  {parent.belongToSchools?.filter(s => s.isActive).length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Belonging Schools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Associated Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parent.belongToSchools && parent.belongToSchools.length > 0 ? (
                <div className="space-y-3">
                  {parent.belongToSchools.map((school, index) => (
                    <div key={school.schoolId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{school.schoolName}</p>
                          {/* <p className="text-xs text-gray-500">School ID: {school.schoolId}</p> */}
                        </div>
                      </div>
                      <Badge variant={school.isActive ? 'default' : 'secondary'}>
                        {school.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">School not associated</p>
              )}
            </CardContent>
          </Card>

          {/* Children Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Children ({children.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length > 0 ? (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child._id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage 
                            src={child.profilePicture || undefined} 
                            alt={`${child.firstName} ${child.lastName}`}
                          />
                          <AvatarFallback>
                            {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-lg">
                                {child.firstName} {child.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">Student ID: {child.studentId}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStudent(child._id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{child.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {child.class} {child.section ? `- Section ${child.section}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{child.schoolName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm capitalize">{child.gender}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{formatDate(child.dob)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No children associated with this parent</p>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Created At</label>
                <p className="text-sm">{formatDate(parent.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-sm">{formatDate(parent.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

