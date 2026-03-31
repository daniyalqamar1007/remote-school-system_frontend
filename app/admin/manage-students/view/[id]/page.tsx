'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, GraduationCap, Heart, Shield, Trophy, Users, Car, Globe, BookOpen, Utensils, Star, Award, FileText, Clock, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Student {
  _id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  class: string
  section: string
  gender: string
  dob: string
  address: string
  emergencyContact: {
    firstName: string
    lastName: string
    relationship: string
    phone: string
    _id?: string
  }
  enrollDate: string
  expectedGraduation: string
  bloodGroup: string
  medicalConditions: string[]
  allergies: string[]
  previousSchool: string
  previousGrade: string
  transportMode: string
  busRoute: string
  nationality: string
  religion: string
  clubs: string[]
  lunch: string
  iipFlag: boolean
  honorRolls: boolean
  athletics: boolean
  profilePicture: string
  profilePhoto?: string
  transcripts: string[]
  parentIds: Array<{
    _id: string
    email: string
    firstName: string
    lastName: string
    phone: string
    address: string
  }>
  parents?: Array<{
    _id: string
    email: string
    firstName: string
    lastName: string
    phone: string
    address: string
  }>
  status: string
  createdAt: string
  updatedAt: string
}

export default function StudentViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudentDetails()
  }, [params.id])

  const fetchStudentDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/admin/students/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        setStudent(response.data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch student details",
          variant: "destructive",
        })
        router.back()
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch student details",
        variant: "destructive",
      })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    
    // If it's just a year (4 digits), return it as-is
    if (/^\d{4}$/.test(dateString.trim())) {
      return dateString.trim()
    }
    
    // Otherwise format as date
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatExpectedGraduation = (value: string) => {
    if (!value) return 'Not specified'
    
    // Expected graduation should always be just a year
    if (/^\d{4}$/.test(value.trim())) {
      return value.trim()
    }
    
    // If it's a date string, extract just the year
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return String(date.getFullYear())
      }
    } catch {
      // If parsing fails, return as-is
    }
    
    return value
  }

  const getFileNameFromUrl = (url: string) => {
    try {
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      return fileName.split('-').slice(1).join('-') || fileName
    } catch {
      return 'Document'
    }
  }

  // const downloadTranscript = (url: string) => {
  //   try {
  //     // Create a temporary anchor element for download
  //     const link = document.createElement('a')
  //     link.href = url
  //     link.target = '_blank'
  //     link.download = getFileNameFromUrl(url)
      
  //     // Add to DOM, click, and remove
  //     document.body.appendChild(link)
  //     link.click()
  //     document.body.removeChild(link)
  //   } catch (error) {
  //     console.error('Error downloading file:', error)
  //     toast({
  //       title: "Error",
  //       description: "Failed to download file",
  //       variant: "destructive",
  //     })
  //   }
  // }

  const previewTranscript = (url: string) => {
    try {
      // Open in new tab for preview
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error opening preview:', error)
      toast({
        title: "Error",
        description: "Failed to open preview",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading student details...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Student not found</p>
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
              Student Details
            </h1>
            <p className="text-gray-600">
              Complete information for {student.firstName} {student.lastName}
            </p>
          </div>
        </div>
        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
          {student.status === 'active' ? 'Active' : 'Inactive'}
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
                    src={student.profilePicture || student.profilePhoto} 
                    alt={`${student.firstName} ${student.lastName}`}
                  />
                  <AvatarFallback className="text-2xl">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">
                {student.firstName} {student.lastName}
              </CardTitle>
              <p className="text-gray-600">Student ID: {student.studentId}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{student.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{student.gender}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{formatDate(student.dob)}</span>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{student.class} - Section {student.section}</span>
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Enrollment Date</label>
                <p className="text-sm">{formatDate(student.enrollDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Expected Graduation</label>
                <p className="text-sm">{formatExpectedGraduation(student.expectedGraduation)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Previous School</label>
                <p className="text-sm">{student.previousSchool || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Previous Grade</label>
                <p className="text-sm">{student.previousGrade || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Flags & Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Flags & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">IIP Flag</span>
                <Badge variant={student.iipFlag ? 'default' : 'secondary'}>
                  {student.iipFlag ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Honor Rolls</span>
                <Badge variant={student.honorRolls ? 'default' : 'secondary'}>
                  {student.honorRolls ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Athletics</span>
                <Badge variant={student.athletics ? 'default' : 'secondary'}>
                  {student.athletics ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <p className="text-sm">{student.address}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{student.emergencyContact.firstName} {student.emergencyContact.lastName}</p>
                  <p className="text-sm text-gray-600">{student.emergencyContact.relationship}</p>
                  <p className="text-sm text-gray-600">{student.emergencyContact.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Health Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Blood Group</label>
                <p className="text-sm">{student.bloodGroup || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Medical Conditions</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {student.medicalConditions && student.medicalConditions.length > 0 ? (
                    student.medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="outline">{condition}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">None</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Allergies</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {student.allergies && student.allergies.length > 0 ? (
                    student.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline">{allergy}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">None</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transportation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Transportation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Transport Mode</label>
                <p className="text-sm">{student.transportMode || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Bus Route</label>
                <p className="text-sm">{student.busRoute || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Nationality</label>
                <p className="text-sm">{student.nationality || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Religion</label>
                <p className="text-sm">{student.religion || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Lunch</label>
                <p className="text-sm">{student.lunch || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Clubs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clubs & Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.clubs && student.clubs.length > 0 ? (
                  student.clubs.map((club, index) => (
                    <Badge key={index} variant="secondary">{club}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No clubs joined</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transcripts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcripts & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.transcripts && student.transcripts.length > 0 ? (
                <div className="space-y-2">
                  {student.transcripts.map((transcript, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {getFileNameFromUrl(transcript)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewTranscript(transcript)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </Button>
                        {/* <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadTranscript(transcript)}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button> */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No transcripts available</p>
              )}
            </CardContent>
          </Card>

          {/* Parents Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Parents/Guardians
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.parentIds && student.parentIds.length > 0 ? (
                <div className="space-y-4">
                  {student.parentIds.map((parent, index) => (
                    <div key={parent._id || index} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium">{parent.firstName} {parent.lastName}</h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{parent.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{parent.phone || 'No phone provided'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span className="text-sm">{parent.address || 'No address provided'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No parent information available</p>
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
                <p className="text-sm">{formatDate(student.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-sm">{formatDate(student.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
