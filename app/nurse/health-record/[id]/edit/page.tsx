'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save,
  Loader2,
  Plus,
  X,
  AlertTriangle,
  Heart,
  Shield,
  Pill,
  User,
  Phone,
  Building,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export default function HealthRecordEditPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [healthRecord, setHealthRecord] = useState<any>(null)
  const [isNewRecord, setIsNewRecord] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    academicYear: '',
    studentAge: '' as string | number,
    medicalConditions: [] as string[],
    allergies: [] as string[],
    medications: [] as string[],
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    physicianName: '',
    physicianPhone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  })

  const [newCondition, setNewCondition] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [newMedication, setNewMedication] = useState('')
  
  // Immunizations state
  const [immunizations, setImmunizations] = useState<any[]>([])
  const [newImmunization, setNewImmunization] = useState({
    vaccineName: '',
    dateAdministered: '',
    administratorName: '',
    batchNumber: '',
    nextDueDate: '',
  })
  
  // Phone validation state
  const [phoneErrors, setPhoneErrors] = useState({
    emergencyContactPhone: '',
    physicianPhone: '',
  })

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
          if (healthData && !healthData.message) {
            // Existing record
            setHealthRecord(healthData)
            const currentYear = new Date().getFullYear()
            const nextYear = currentYear + 1
            setFormData({
              academicYear: healthData.academicYear || `${currentYear}-${nextYear}`,
              studentAge: healthData.studentAge != null ? String(healthData.studentAge) : (studentData?.age != null ? String(studentData.age) : ''),
              medicalConditions: healthData.medicalConditions || [],
              allergies: healthData.allergies || [],
              medications: healthData.medications || [],
              emergencyContactName: healthData.emergencyContactName || '',
              emergencyContactPhone: healthData.emergencyContactPhone || '',
              emergencyContactRelation: healthData.emergencyContactRelation || '',
              physicianName: healthData.physicianName || '',
              physicianPhone: healthData.physicianPhone || '',
              insuranceProvider: healthData.insuranceProvider || '',
              insurancePolicyNumber: healthData.insurancePolicyNumber || '',
            })
            // Load immunizations - ensure we get them from the health record
            const immunizationsData = healthData.immunizations || []
            if (Array.isArray(immunizationsData) && immunizationsData.length > 0) {
              setImmunizations(immunizationsData.map((imm: any) => {
                // Handle date conversion properly
                let dateAdministered = ''
                if (imm.dateAdministered) {
                  if (typeof imm.dateAdministered === 'string') {
                    dateAdministered = imm.dateAdministered.split('T')[0]
                  } else {
                    dateAdministered = new Date(imm.dateAdministered).toISOString().split('T')[0]
                  }
                }
                
                let nextDueDate = ''
                if (imm.nextDueDate) {
                  if (typeof imm.nextDueDate === 'string') {
                    nextDueDate = imm.nextDueDate.split('T')[0]
                  } else {
                    nextDueDate = new Date(imm.nextDueDate).toISOString().split('T')[0]
                  }
                }
                
                return {
                  vaccineName: imm.vaccineName || '',
                  dateAdministered: dateAdministered,
                  administratorName: imm.administratorName || '',
                  batchNumber: imm.batchNumber || imm.lotNumber || '',
                  nextDueDate: nextDueDate,
                }
              }))
            } else {
              setImmunizations([])
            }
            setIsNewRecord(false)
          } else {
            const currentYear = new Date().getFullYear()
            const nextYear = currentYear + 1
            setFormData(prev => ({
              ...prev,
              academicYear: `${currentYear}-${nextYear}`,
              studentAge: studentData?.age != null ? String(studentData.age) : '',
            }))
            setIsNewRecord(true)
          }
        } else {
          const currentYear = new Date().getFullYear()
          const nextYear = currentYear + 1
          setFormData(prev => ({
            ...prev,
            academicYear: `${currentYear}-${nextYear}`,
            studentAge: studentData?.age != null ? String(studentData.age) : '',
          }))
          setIsNewRecord(true)
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, newCondition.trim()]
      }))
      setNewCondition('')
    }
  }

  const handleRemoveCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((_, i) => i !== index)
    }))
  }

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy('')
    }
  }

  const handleRemoveAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }))
      setNewMedication('')
    }
  }

  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const handleAddImmunization = () => {
    if (newImmunization.vaccineName.trim() && newImmunization.dateAdministered) {
      // Keep dates as strings for form display, convert to Date when submitting
      setImmunizations(prev => [...prev, {
        ...newImmunization,
        // Keep as string for display in form
        dateAdministered: newImmunization.dateAdministered,
        nextDueDate: newImmunization.nextDueDate || '',
      }])
      setNewImmunization({
        vaccineName: '',
        dateAdministered: '',
        administratorName: '',
        batchNumber: '',
        nextDueDate: '',
      })
    }
  }

  const handleRemoveImmunization = (index: number) => {
    setImmunizations(prev => prev.filter((_, i) => i !== index))
  }

  const handleImmunizationChange = (field: string, value: string) => {
    setNewImmunization(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone numbers before submit
    if (formData.emergencyContactPhone) {
      const digitsOnly = formData.emergencyContactPhone.replace(/\D/g, '')
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        toast.error('Please enter a valid emergency contact phone number (10-15 digits)')
        setPhoneErrors(prev => ({ ...prev, emergencyContactPhone: 'Please enter a valid phone number (10-15 digits)' }))
        return
      }
    }
    if (formData.physicianPhone) {
      const digitsOnly = formData.physicianPhone.replace(/\D/g, '')
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        toast.error('Please enter a valid physician phone number (10-15 digits)')
        setPhoneErrors(prev => ({ ...prev, physicianPhone: 'Please enter a valid phone number (10-15 digits)' }))
        return
      }
    }
    
    setSaving(true)

    try {
      const url = isNewRecord
        ? `${API_BASE_URL}/nurse/health-records/student/${studentId}`
        : `${API_BASE_URL}/nurse/health-records/student/${studentId}`
      
      const method = isNewRecord ? 'POST' : 'PUT'

      // Prepare data with immunizations - ensure proper date formatting
      const submitData = {
        ...formData,
        studentId,
        immunizations: immunizations.map(imm => {
          // Convert date strings to Date objects for backend
          let dateAdministered: Date | null = null
          if (imm.dateAdministered) {
            if (typeof imm.dateAdministered === 'string') {
              dateAdministered = new Date(imm.dateAdministered)
            } else if (imm.dateAdministered instanceof Date) {
              dateAdministered = imm.dateAdministered
            }
          }
          
          let nextDueDate: Date | null = null
          if (imm.nextDueDate) {
            if (typeof imm.nextDueDate === 'string') {
              nextDueDate = new Date(imm.nextDueDate)
            } else if (imm.nextDueDate instanceof Date) {
              nextDueDate = imm.nextDueDate
            }
          }
          
          return {
            vaccineName: imm.vaccineName || '',
            dateAdministered: dateAdministered || new Date(),
            administratorName: imm.administratorName || '',
            batchNumber: imm.batchNumber || '',
            nextDueDate: nextDueDate,
          }
        }),
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(submitData),
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.success === false) {
          toast.error(data.message || (isNewRecord ? 'Failed to create health record' : 'Failed to update health record'))
        } else {
          toast.success(data.message || (isNewRecord ? 'Health record created successfully' : 'Health record updated successfully'))
          router.push(`/nurse/health-record/${studentId}`)
        }
      } else {
        toast.error(data.message || (isNewRecord ? 'Failed to create health record' : 'Failed to update health record'))
      }
    } catch (error: any) {
      console.error('Error saving health record:', error)
      toast.error('Error saving health record')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
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
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNewRecord ? 'Create' : 'Edit'} Health Record
            </h1>
            <p className="text-gray-600 mt-1">
              {student.firstName} {student.lastName} • Grade {student.gradeLevel || student.class || 'N/A'}
            </p>
          </div>
        </div>
        <Link href={`/nurse/health-record/${studentId}`}>
          <Button variant="outline" size="sm">
            View Record
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentAge">Age</Label>
                  <Input
                    id="studentAge"
                    type="number"
                    min={1}
                    max={120}
                    value={formData.studentAge}
                    onChange={(e) => handleInputChange('studentAge', e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
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
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Enter medical condition"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCondition()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddCondition} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.medicalConditions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.medicalConditions.map((condition, index) => (
                    <Badge key={index} variant="outline" className="text-sm flex items-center gap-1">
                      {condition}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Enter allergy"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAllergy()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddAllergy} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="text-sm flex items-center gap-1">
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(index)}
                        className="ml-1 hover:text-red-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
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
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Enter medication name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMedication()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddMedication} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.medications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.medications.map((medication, index) => (
                    <Badge key={index} variant="secondary" className="text-sm flex items-center gap-1">
                      {medication}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
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
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vaccineName">Vaccine Name *</Label>
                    <Input
                      id="vaccineName"
                      value={newImmunization.vaccineName}
                      onChange={(e) => handleImmunizationChange('vaccineName', e.target.value)}
                      placeholder="e.g., MMR, DTaP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateAdministered">Date Administered *</Label>
                    <Input
                      id="dateAdministered"
                      type="date"
                      value={newImmunization.dateAdministered}
                      onChange={(e) => handleImmunizationChange('dateAdministered', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="administratorName">Administrator Name</Label>
                    <Input
                      id="administratorName"
                      value={newImmunization.administratorName}
                      onChange={(e) => handleImmunizationChange('administratorName', e.target.value)}
                      placeholder="Name of person who administered"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch/Lot Number</Label>
                    <Input
                      id="batchNumber"
                      value={newImmunization.batchNumber}
                      onChange={(e) => handleImmunizationChange('batchNumber', e.target.value)}
                      placeholder="Batch or lot number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextDueDate">Next Due Date</Label>
                    <Input
                      id="nextDueDate"
                      type="date"
                      value={newImmunization.nextDueDate}
                      onChange={(e) => handleImmunizationChange('nextDueDate', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddImmunization}
                  variant="outline"
                  disabled={!newImmunization.vaccineName.trim() || !newImmunization.dateAdministered}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Immunization
                </Button>
              </div>
              
              {immunizations.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Immunizations</Label>
                  <div className="space-y-2">
                    {immunizations.map((imm, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-black">{imm.vaccineName}</div>
                          <div className="text-sm text-gray-600">
                            Administered: {imm.dateAdministered ? (typeof imm.dateAdministered === 'string' ? new Date(imm.dateAdministered).toLocaleDateString() : new Date(imm.dateAdministered).toLocaleDateString()) : 'N/A'}
                            {imm.nextDueDate && ` • Next Due: ${typeof imm.nextDueDate === 'string' ? new Date(imm.nextDueDate).toLocaleDateString() : new Date(imm.nextDueDate).toLocaleDateString()}`}
                          </div>
                          {imm.administratorName && (
                            <div className="text-xs text-gray-500">By: {imm.administratorName}</div>
                          )}
                          {imm.batchNumber && (
                            <div className="text-xs text-gray-500">Batch: {imm.batchNumber}</div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImmunization(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                  <PhoneInput
                    country={'us'}
                    value={formData.emergencyContactPhone || ''}
                    onChange={(value, data, event, formattedValue) => {
                      handleInputChange('emergencyContactPhone', value)
                      // Validate phone number - check if valid format
                      const digitsOnly = value.replace(/\D/g, '')
                      const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                      if (value && !isValid) {
                        setPhoneErrors(prev => ({ ...prev, emergencyContactPhone: 'Please enter a valid phone number (10-15 digits)' }))
                      } else {
                        setPhoneErrors(prev => ({ ...prev, emergencyContactPhone: '' }))
                      }
                    }}
                    onBlur={(e, data) => {
                      // Additional validation on blur
                      const value = formData.emergencyContactPhone || ''
                      const digitsOnly = value.replace(/\D/g, '')
                      const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                      if (value && !isValid) {
                        setPhoneErrors(prev => ({ ...prev, emergencyContactPhone: 'Please enter a valid phone number (10-15 digits)' }))
                      }
                    }}
                    containerClass={`w-full border rounded-md relative ${phoneErrors.emergencyContactPhone ? 'border-red-500' : 'border-gray-200'}`}
                    inputClass="!w-full !h-10 !border-0 !shadow-none !pl-12"
                    buttonClass="!border-0 !bg-white !h-10 !rounded-none !border-r !border-gray-200"
                    placeholder="Emergency phone"
                  />
                  {phoneErrors.emergencyContactPhone && (
                    <p className="text-sm text-red-500 mt-1">{phoneErrors.emergencyContactPhone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelation">Relation</Label>
                  <Input
                    id="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                    placeholder="e.g., Parent, Guardian"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Physician Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Physician Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="physicianName">Physician Name</Label>
                  <Input
                    id="physicianName"
                    value={formData.physicianName}
                    onChange={(e) => handleInputChange('physicianName', e.target.value)}
                    placeholder="Doctor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="physicianPhone">Phone Number</Label>
                  <PhoneInput
                    country={'us'}
                    value={formData.physicianPhone || ''}
                    onChange={(value, data, event, formattedValue) => {
                      handleInputChange('physicianPhone', value)
                      // Validate phone number - check if valid format
                      const digitsOnly = value.replace(/\D/g, '')
                      const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                      if (value && !isValid) {
                        setPhoneErrors(prev => ({ ...prev, physicianPhone: 'Please enter a valid phone number (10-15 digits)' }))
                      } else {
                        setPhoneErrors(prev => ({ ...prev, physicianPhone: '' }))
                      }
                    }}
                    onBlur={(e, data) => {
                      // Additional validation on blur
                      const value = formData.physicianPhone || ''
                      const digitsOnly = value.replace(/\D/g, '')
                      const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15
                      if (value && !isValid) {
                        setPhoneErrors(prev => ({ ...prev, physicianPhone: 'Please enter a valid phone number (10-15 digits)' }))
                      }
                    }}
                    containerClass={`w-full border rounded-md relative ${phoneErrors.physicianPhone ? 'border-red-500' : 'border-gray-200'}`}
                    inputClass="!w-full !h-10 !border-0 !shadow-none !pl-12"
                    buttonClass="!border-0 !bg-white !h-10 !rounded-none !border-r !border-gray-200"
                    placeholder="Physician phone"
                  />
                  {phoneErrors.physicianPhone && (
                    <p className="text-sm text-red-500 mt-1">{phoneErrors.physicianPhone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input
                    id="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                    placeholder="Insurance company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                  <Input
                    id="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber}
                    onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                    placeholder="Policy number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Link href={`/nurse/health-record/${studentId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="bg-black hover:bg-gray-800 text-white">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isNewRecord ? 'Create Record' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

