'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ArrowLeft, 
  Edit, 
  Heart, 
  Shield, 
  Pill, 
  Stethoscope, 
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Loader2,
  Phone,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export default function StudentHealthRecordViewPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [healthRecord, setHealthRecord] = useState<any>(null)

  useEffect(() => {
    if (studentId) {
      fetchStudentData()
    }
  }, [studentId])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      
      // Fetch student info
      const studentRes = await fetch(`${API_BASE_URL}/nurse/student/${studentId}`, {
        headers: getAuthHeaders(),
      })
      
      if (studentRes.ok) {
        const studentData = await studentRes.json()
        setStudent(studentData)
        
        // Fetch health record
        const healthRes = await fetch(`${API_BASE_URL}/nurse/health-records/student/${studentId}`, {
          headers: getAuthHeaders(),
        })
        
        if (healthRes.ok) {
          const healthData = await healthRes.json()
          setHealthRecord(healthData)
        }
      } else {
        toast.error('Failed to load student data')
        router.push('/nurse/health-record')
      }
    } catch (error: any) {
      console.error('Error fetching student data:', error)
      toast.error('Error loading student data')
      router.push('/nurse/health-record')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading student health record...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Student not found</p>
          <Link href="/nurse/health-record">
            <Button className="mt-4">Back to Health Records</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/nurse/health-record">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Records
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              Grade {student.gradeLevel || student.class || 'N/A'} • Section {student.section || 'N/A'}
            </p>
          </div>
        </div>
        <Link href={`/nurse/health-record/${studentId}/edit`}>
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Record
          </Button>
        </Link>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student ID</p>
              <p className="font-medium text-black">{student.studentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-black">{student.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium text-black">
                {(student.dateOfBirth || student.dob) ? format(new Date(student.dateOfBirth || student.dob), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium text-black">
                {(healthRecord?.studentAge ?? student?.age) != null ? `${healthRecord?.studentAge ?? student?.age} years` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthRecord?.allergies && healthRecord.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {healthRecord.allergies.map((allergy: string, index: number) => (
                <Badge key={index} variant="destructive" className="text-sm">
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No allergies recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Medical Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthRecord?.medicalConditions && healthRecord.medicalConditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {healthRecord.medicalConditions.map((condition: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {condition}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No medical conditions recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Immunizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Immunizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthRecord?.immunizations && healthRecord.immunizations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaccine Name</TableHead>
                    <TableHead>Date Administered</TableHead>
                    <TableHead>Administrator / Batch</TableHead>
                    <TableHead>Next Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthRecord.immunizations.map((immunization: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-black">{immunization.vaccineName || 'N/A'}</TableCell>
                      <TableCell className="text-black">
                        {immunization.dateAdministered ? format(new Date(immunization.dateAdministered), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-black">{immunization.batchNumber || immunization.lotNumber || 'N/A'}</TableCell>
                      <TableCell className="text-black">
                        {immunization.administratorName ? (
                          <div>
                            <div>{immunization.administratorName}</div>
                            <div className="text-xs text-gray-500">{immunization.batchNumber || immunization.lotNumber || ''}</div>
                          </div>
                        ) : (immunization.batchNumber || immunization.lotNumber || 'N/A')}
                      </TableCell>
                      <TableCell className="text-black">
                        {immunization.nextDueDate ? format(new Date(immunization.nextDueDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500">No immunizations recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Emergency Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(healthRecord?.emergencyContactName || healthRecord?.emergencyContactPhone || healthRecord?.emergencyContactRelation) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {healthRecord.emergencyContactName && (
                <div>
                  <p className="text-sm text-gray-500">Contact Name</p>
                  <p className="font-medium text-black">{healthRecord.emergencyContactName}</p>
                </div>
              )}
              {healthRecord.emergencyContactPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-black">{healthRecord.emergencyContactPhone}</p>
                </div>
              )}
              {healthRecord.emergencyContactRelation && (
                <div>
                  <p className="text-sm text-gray-500">Relation</p>
                  <p className="font-medium text-black">{healthRecord.emergencyContactRelation}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No emergency contact information recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Physician Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Physician Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(healthRecord?.physicianName || healthRecord?.physicianPhone) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthRecord.physicianName && (
                <div>
                  <p className="text-sm text-gray-500">Physician Name</p>
                  <p className="font-medium text-black">{healthRecord.physicianName}</p>
                </div>
              )}
              {healthRecord.physicianPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-black">{healthRecord.physicianPhone}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No physician information recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Insurance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-teal-600" />
            Insurance Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(healthRecord?.insuranceProvider || healthRecord?.insurancePolicyNumber) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthRecord.insuranceProvider && (
                <div>
                  <p className="text-sm text-gray-500">Insurance Provider</p>
                  <p className="font-medium text-black">{healthRecord.insuranceProvider}</p>
                </div>
              )}
              {healthRecord.insurancePolicyNumber && (
                <div>
                  <p className="text-sm text-gray-500">Policy Number</p>
                  <p className="font-medium text-black">{healthRecord.insurancePolicyNumber}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No insurance information recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Check both medications array and medicationLog
            const medicationsList = healthRecord?.medications || []
            const medicationLogList = healthRecord?.medicationLog || []
            const allMedications = [...medicationsList, ...medicationLogList]
            
            if (allMedications.length > 0) {
              return (
                <div className="space-y-4">
                  {/* Simple medications list */}
                  {medicationsList.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Medication List</h4>
                      <div className="flex flex-wrap gap-2">
                        {medicationsList.map((medication: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {medication}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Detailed medication log */}
                  {medicationLogList.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Medication Log</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medication</TableHead>
                              <TableHead>Dosage</TableHead>
                              <TableHead>Frequency</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>End Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {medicationLogList.map((medication: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="text-black">{medication.medicationName || medication.medication || 'N/A'}</TableCell>
                                <TableCell className="text-black">{medication.dosage || 'N/A'}</TableCell>
                                <TableCell className="text-black">{medication.frequency || 'N/A'}</TableCell>
                                <TableCell className="text-black">
                                  {medication.startDate ? format(new Date(medication.startDate), 'MMM dd, yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell className="text-black">
                                  {medication.endDate ? format(new Date(medication.endDate), 'MMM dd, yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={medication.isActive ? "default" : "outline"}>
                                    {medication.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )
            } else {
              return <p className="text-gray-500">No medications recorded</p>
            }
          })()}
        </CardContent>
      </Card>

      {/* Nurse Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Nurse Visits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthRecord?.nurseVisits && healthRecord.nurseVisits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Action Taken</TableHead>
                    <TableHead>Disposition</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthRecord.nurseVisits.map((visit: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-black">
                        {visit.visitDate ? format(new Date(visit.visitDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-black">{visit.reason || 'N/A'}</TableCell>
                      <TableCell className="text-black">{visit.treatment || visit.actionTaken || 'N/A'}</TableCell>
                      <TableCell className="text-black">{visit.disposition || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            visit.priority === 'Emergency' || visit.priority === 'High' ? 'destructive' : 
                            visit.priority === 'Medium' ? 'default' : 'outline'
                          }
                        >
                          {visit.priority || 'Low'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500">No nurse visits recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Health Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Health Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthRecord?.healthAlerts && healthRecord.healthAlerts.length > 0 ? (
            <div className="space-y-3">
              {[...healthRecord.healthAlerts]
                .sort((a: any, b: any) => {
                  // Sort by createdDate descending (newest first)
                  const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0
                  const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0
                  // If no createdDate, use updatedAt as fallback
                  const fallbackA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
                  const fallbackB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
                  const finalA = dateA || fallbackA
                  const finalB = dateB || fallbackB
                  return finalB - finalA // Descending order (newest first)
                })
                .map((alert: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={
                            alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 
                            alert.severity === 'Medium' ? 'default' : 'outline'
                          }
                        >
                          {alert.severity || 'Low'}
                        </Badge>
                        <Badge variant={alert.isActive ? "default" : "outline"}>
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-black mb-1">{alert.title || alert.type || 'Alert'}</h4>
                      <p className="text-sm text-gray-600 mb-2">{alert.description || 'N/A'}</p>
                      {alert.actionRequired && (
                        <p className="text-sm text-red-600 font-medium">Action Required: {alert.actionRequired}</p>
                      )}
                      {alert.expiryDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Expires: {format(new Date(alert.expiryDate), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No health alerts</p>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Medical Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthRecord?.documents && healthRecord.documents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Access Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthRecord.documents.map((doc: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-black">{doc.originalName || doc.fileName || 'N/A'}</TableCell>
                      <TableCell className="text-black">{doc.category || 'N/A'}</TableCell>
                      <TableCell className="text-black">
                        {doc.uploadDate ? format(new Date(doc.uploadDate), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.accessLevel || 'Staff Only'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500">No documents uploaded</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

