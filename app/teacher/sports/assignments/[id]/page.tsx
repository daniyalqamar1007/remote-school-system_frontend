"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  ArrowLeft, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Heart,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { sportsApi, nurseApi } from '@/lib/api'
import { toast } from 'sonner'

interface Assignment {
  studentId: any
  sportsProgramId: any
  enrollmentDate: string
  _id: string
  student: {
    _id: string
    firstName: string
    lastName: string
    studentId: string
    gradeLevel: string
    email?: string
    phone?: string
    address?: string
  }
  program: {
    _id: string
    name: string
    season: string
    sport: string
    description?: string
  }
  status: string
  assignedDate: string
  medicalClearance: boolean
  medicalClearanceStatus?: string
  healthWarnings?: string[]
  medicalCheckDate?: string
  notes?: string
  academicYear: string
}

interface HealthRecord {
  _id: string
  medicalConditions: string[]
  allergies: string[]
  medications: string[]
  physicalExams: Array<{
    examDate: string
    examType: string
    cleared: boolean
    clearanceDate: string
    expiryDate: string
    restrictions: string[]
    performedBy: string
  }>
  activityClearances: Array<{
    activityType: string
    activityName: string
    cleared: boolean
    clearanceDate: string
    restrictions: string[]
    expiryDate: string
  }>
  healthAlerts: Array<{
    alertType?: string
    severity: string
    description: string
    isActive: boolean
  }>
}

export default function TeacherStudentAssignmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params?.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails()
    }
  }, [assignmentId])

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true)
      
      // Get the assignment details using the API
      const assignmentResponse = await sportsApi.assignments.getById(assignmentId)
      
      // Handle API response structure: { success, statusCode, message, data }
      // handleResponse already extracts data field if present
      let assignmentData: any = null
      
      if (assignmentResponse?.data) {
        assignmentData = assignmentResponse.data
      } else if (assignmentResponse && typeof assignmentResponse === 'object' && !assignmentResponse.success) {
        // If response is the data directly
        assignmentData = assignmentResponse
      } else if (assignmentResponse?.success && assignmentResponse?.data) {
        assignmentData = assignmentResponse.data
      } else {
        // Fallback: if data is at root level (old format)
        assignmentData = assignmentResponse
      }

      if (!assignmentData) {
        throw new Error('Assignment data not found')
      }

      // Ensure assignment has required structure
      if (!assignmentData.student && !assignmentData.studentId) {
        throw new Error('Invalid assignment data: student information is missing')
      }

      setAssignment(assignmentData)

      // If we have a student ID, fetch their health records
      const studentId = assignmentData.student?._id || assignmentData.studentId?._id || assignmentData.studentId
      if (studentId) {
        try {
          const healthData = await nurseApi.healthRecords.getByStudentId(studentId)
          setHealthRecord(healthData)
        } catch (healthError) {
          console.log('Could not fetch health records (may not exist):', healthError)
        }
      }

    } catch (error: any) {
      console.error('Error fetching assignment details:', error)
      toast.error(error?.message || 'Failed to load assignment details')
      setAssignment(null) // Set to null so error UI shows
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!assignment) return

    try {
      setUpdating(true)
      await sportsApi.assignments.update(assignment._id, { status: newStatus })
      toast.success('Assignment status updated successfully')
      await fetchAssignmentDetails() // Refresh data
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Failed to update assignment status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment Not Found</h3>
          <p className="text-gray-600 mb-4">The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/teacher/sports/assignments">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/sports/assignments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {assignment.student?.firstName || assignment.studentId?.firstName || 'Unknown'} {assignment.student?.lastName || assignment.studentId?.lastName || 'Student'}
            </h1>
            <p className="text-gray-600 mt-1">Sports Assignment Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(assignment.status)}
          <Badge variant={getStatusBadgeVariant(assignment.status)}>
            {assignment.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <p className="text-gray-900">
                {assignment.student?.firstName || assignment.studentId?.firstName || 'Unknown'} {assignment.student?.lastName || assignment.studentId?.lastName || 'Student'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Student ID</label>
              <p className="text-gray-900">{assignment.student?.studentId || assignment.studentId?.studentId || 'N/A'}</p>
            </div>
            {(assignment.student?.email || assignment.studentId?.email) && (
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {assignment.student?.email || assignment.studentId?.email}
                </p>
              </div>
            )}
            {(assignment.student?.phone || assignment.studentId?.phone) && (
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {assignment.student?.phone || assignment.studentId?.phone}
                </p>
              </div>
            )}
            {(assignment.student?.address || assignment.studentId?.address) && (
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {assignment.student?.address || assignment.studentId?.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sports Program Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Sports Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Program Name</label>
              <p className="text-gray-900">{assignment.program?.name || assignment.sportsProgramId?.name || 'N/A'}</p>
            </div>
            {assignment.program?.sport || assignment.sportsProgramId?.sport ? (
              <div>
                <label className="text-sm font-medium text-gray-700">Sport</label>
                <p className="text-gray-900">{assignment.program?.sport || assignment.sportsProgramId?.sport}</p>
              </div>
            ) : null}
            <div>
              <label className="text-sm font-medium text-gray-700">Season</label>
              <p className="text-gray-900">{assignment.program?.season || assignment.sportsProgramId?.season || 'N/A'}</p>
            </div>
            {(assignment.program?.description || assignment.sportsProgramId?.description) && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{assignment.program?.description || assignment.sportsProgramId?.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Academic Year</label>
              <p className="text-gray-900">{assignment.academicYear}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Assignment Date</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {assignment.assignedDate || assignment.enrollmentDate ? 
                  new Date(assignment.assignedDate || assignment.enrollmentDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Medical Clearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Medical Clearance Status</label>
              <p className={`flex items-center gap-2 ${assignment.medicalClearance ? 'text-green-600' : 'text-red-600'}`}>
                {assignment.medicalClearance ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {assignment.medicalClearance ? 'Cleared' : 'Not Cleared'}
              </p>
            </div>
            
            {assignment.medicalCheckDate && (
              <div>
                <label className="text-sm font-medium text-gray-700">Last Medical Check</label>
                <p className="text-gray-900">
                  {new Date(assignment.medicalCheckDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {assignment.healthWarnings && assignment.healthWarnings.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Health Warnings</label>
                <div className="space-y-1">
                  {assignment.healthWarnings.map((warning, index) => (
                    <p key={index} className="text-red-600 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {assignment.notes && (
              <div>
                <label className="text-sm font-medium text-gray-700">Assignment Notes</label>
                <p className="text-gray-900 text-sm">{assignment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Records */}
      {healthRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medical Conditions & Allergies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Medical Conditions & Allergies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthRecord.medicalConditions && healthRecord.medicalConditions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Medical Conditions</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {healthRecord.medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-red-700 border-red-200">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {healthRecord.allergies && healthRecord.allergies.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Allergies</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {healthRecord.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="text-orange-700 border-orange-200">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {healthRecord.medications && healthRecord.medications.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Medications</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {healthRecord.medications.map((medication, index) => (
                      <Badge key={index} variant="outline" className="text-gray-700 border-gray-200">
                        {medication}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Health Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthRecord.healthAlerts && healthRecord.healthAlerts.filter(alert => alert.isActive).length > 0 ? (
                <div className="space-y-3">
                  {healthRecord.healthAlerts
                    .filter(alert => alert.isActive)
                    .map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{(alert.alertType || 'Alert').replace('_', ' ')}</span>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{alert.description}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No active health alerts</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Physical Exams & Sports Clearances */}
      {/* {healthRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Physical Examinations</CardTitle>
            </CardHeader>
            <CardContent>
              {healthRecord.physicalExams && healthRecord.physicalExams.length > 0 ? (
                <div className="space-y-3">
                  {healthRecord.physicalExams.map((exam, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{exam.examType} Physical</span>
                        {exam.cleared ? (
                          <Badge className="bg-green-100 text-green-800">Cleared</Badge>
                        ) : (
                          <Badge variant="destructive">Not Cleared</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Exam Date: {new Date(exam.examDate).toLocaleDateString()}</p>
                        <p>Performed By: {exam.performedBy}</p>
                        {exam.expiryDate && (
                          <p>Expires: {new Date(exam.expiryDate).toLocaleDateString()}</p>
                        )}
                        {exam.restrictions && exam.restrictions.length > 0 && (
                          <p>Restrictions: {exam.restrictions.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No physical exams on record</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sports Clearances</CardTitle>
            </CardHeader>
            <CardContent>
              {healthRecord.activityClearances && healthRecord.activityClearances.length > 0 ? (
                <div className="space-y-3">
                  {healthRecord.activityClearances
                    .filter(clearance => clearance.activityType === 'sports')
                    .map((clearance, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{clearance.activityName}</span>
                          {clearance.cleared ? (
                            <Badge className="bg-green-100 text-green-800">Cleared</Badge>
                          ) : (
                            <Badge variant="destructive">Not Cleared</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Clearance Date: {new Date(clearance.clearanceDate).toLocaleDateString()}</p>
                          {clearance.expiryDate && (
                            <p>Expires: {new Date(clearance.expiryDate).toLocaleDateString()}</p>
                          )}
                          {clearance.restrictions && clearance.restrictions.length > 0 && (
                            <p>Restrictions: {clearance.restrictions.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No sports clearances on record</p>
              )}
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {assignment.status === 'pending' && (
              <>
                <Button 
                  onClick={() => handleStatusUpdate('active')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {updating ? 'Updating...' : 'Approve Assignment'}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleStatusUpdate('inactive')}
                  disabled={updating}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {updating ? 'Updating...' : 'Reject Assignment'}
                </Button>
              </>
            )}
            {assignment.status === 'active' && (
              <Button 
                variant="destructive"
                onClick={() => handleStatusUpdate('inactive')}
                disabled={updating}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {updating ? 'Updating...' : 'Deactivate Assignment'}
              </Button>
            )}
            {assignment.status === 'inactive' && (
              <Button 
                onClick={() => handleStatusUpdate('active')}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {updating ? 'Updating...' : 'Reactivate Assignment'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

