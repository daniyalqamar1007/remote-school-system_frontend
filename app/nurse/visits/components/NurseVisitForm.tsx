'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { 
  NurseVisitStatus, 
  NurseVisitPriority, 
  NurseVisitDisposition,
  NurseVisitStatusLabels,
  NurseVisitPriorityLabels,
  NurseVisitDispositionLabels
} from '@/lib/enums/nurse-visit.enums'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const COMMON_REASONS = [
  'Headache',
  'Stomach Ache',
  'Fever/Temperature Check',
  'Injury - Minor Cut/Scrape',
  'Injury - Bruise/Bump',
  'Injury - Sprain/Strain',
  'Nausea/Vomiting',
  'Sore Throat',
  'Cough/Cold Symptoms',
  'Allergic Reaction',
  'Asthma/Breathing Issues',
  'Medication Administration',
  'Blood Sugar Check',
  'Vision/Hearing Screening',
  'Behavioral/Emotional Support',
  'First Aid',
  'Other'
]

interface NurseVisitFormProps {
  visit?: any
  onSuccess: () => void
  onCancel: () => void
  studentId?: string
}

export default function NurseVisitForm({ visit, onSuccess, onCancel, studentId }: NurseVisitFormProps) {
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || '')
  
  const [formData, setFormData] = useState({
    visitDate: visit?.visitDate ? new Date(visit.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    visitTime: visit?.visitTime || new Date().toTimeString().split(' ')[0].slice(0, 5),
    reason: visit?.reason || '',
    symptoms: Array.isArray(visit?.symptoms) ? visit.symptoms.join(', ') : (visit?.symptoms || ''),
    temperature: visit?.temperature?.toString() || '',
    bloodPressure: visit?.bloodPressure || '',
    heartRate: visit?.heartRate?.toString() || '',
    weight: visit?.weight?.toString() || '',
    height: visit?.height?.toString() || '',
    treatment: visit?.treatment || '',
    medications: Array.isArray(visit?.medications) ? visit.medications.join(', ') : (visit?.medications || ''),
    followUpNeeded: visit?.followUpNeeded || false,
    parentNotified: visit?.parentNotified || false,
    returnToClass: visit?.returnToClass !== undefined ? visit.returnToClass : true,
    restrictionsNotes: visit?.restrictionsNotes || '',
    priority: visit?.priority || NurseVisitPriority.MEDIUM,
    status: visit?.status || NurseVisitStatus.IN_PROGRESS,
    disposition: visit?.disposition || '',
    dispositionTime: visit?.dispositionTime || '',
    visitDuration: visit?.visitDuration?.toString() || '',
    actionTaken: Array.isArray(visit?.actionTaken) ? visit.actionTaken : (visit?.actionTaken ? [visit.actionTaken] : [])
  })
  
  const [newActionTaken, setNewActionTaken] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!studentId) {
      fetchStudents()
    }
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/nurse/students?limit=1000`, {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        const studentsList = data?.students || data?.data || (Array.isArray(data) ? data : [])
        setStudents(studentsList)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!selectedStudentId && !studentId) {
      newErrors.studentId = 'Student is required'
    }
    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required'
    }
    if (!formData.visitTime) {
      newErrors.visitTime = 'Visit time is required'
    }
    if (!formData.reason) {
      newErrors.reason = 'Reason is required'
    }
    if (!formData.treatment) {
      newErrors.treatment = 'Treatment is required'
    }
    if (formData.treatment && formData.treatment.length > 500) {
      newErrors.treatment = 'Treatment description must be less than 500 characters'
    }
    if (formData.restrictionsNotes && formData.restrictionsNotes.length > 500) {
      newErrors.restrictionsNotes = 'Restrictions notes must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const targetStudentId = selectedStudentId || studentId
      if (!targetStudentId) {
        toast.error('Student is required')
        return
      }

      const visitData = {
        visitDate: new Date(formData.visitDate),
        visitTime: formData.visitTime,
        reason: formData.reason,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map((s: string) => s.trim()).filter((s: any) => s) : [],
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        bloodPressure: formData.bloodPressure || undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        treatment: formData.treatment,
        medications: formData.medications ? formData.medications.split(',').map((m: string) => m.trim()).filter((m: any) => m) : [],
        actionTaken: formData.actionTaken || [],
        followUpNeeded: formData.followUpNeeded,
        parentNotified: formData.parentNotified,
        returnToClass: formData.returnToClass,
        restrictionsNotes: formData.restrictionsNotes || undefined,
        priority: formData.priority,
        status: formData.status,
        disposition: formData.disposition || undefined,
        dispositionTime: formData.dispositionTime || undefined,
        visitDuration: formData.visitDuration ? parseInt(formData.visitDuration) : undefined
      }

      let response
      if (visit?._id) {
        // Update existing visit
        response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${targetStudentId}/nurse-visit/${visit._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(visitData),
        })
      } else {
        // Create new visit
        response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${targetStudentId}/nurse-visit`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(visitData),
        })
      }

      let data: any = {}
      try {
        data = await response.json()
        console.log('data', data)
      } catch (parseError) {
        // If JSON parsing fails
        const errorMessage = `Failed to save nurse visit: Invalid response from server (Status: ${response.status})`
        toast.error(errorMessage)
        setLoading(false)
        return
      }
      
      if (response.ok) {
        console.log('response.ok', response.ok)
        // Check if the response indicates success
        if (data.success === false) {
          console.log('data.success', data.success)
          // Backend returned success: false
          const errorMessage = data.message || data.error || 'Failed to save nurse visit'
          toast.error(errorMessage)
          setLoading(false)
          return
        }
        console.log('data.success', data.success)
        // Success - show toast with backend message and close modal
        const successMessage = data.message || (visit ? 'Nurse visit updated successfully' : 'Nurse visit recorded successfully')
        toast.success(successMessage)
        onSuccess() // This will close the modal and refresh the list
      } else {
        console.log('response', response)
        // HTTP error response - show backend error message
        const errorMessage = data.message || data.error || `Failed to save nurse visit (Status: ${response.status})`
        toast.error(errorMessage)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error saving nurse visit:', error)
      const errorMessage = error.message || 'Network error: Failed to save nurse visit'
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!studentId && (
        <div className="space-y-2">
          <Label htmlFor="studentId">
            Student <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedStudentId}
            onValueChange={(value) => {
              setSelectedStudentId(value)
              if (errors.studentId) {
                setErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors.studentId
                  return newErrors
                })
              }
            }}
          >
            <SelectTrigger className={touched && errors.studentId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select student..." />
            </SelectTrigger>
            <SelectContent>
              {students.map(student => (
                <SelectItem key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} - {student.gradeLevel || student.class || 'N/A'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched && errors.studentId && (
            <p className="text-sm text-red-500">{errors.studentId}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="visitDate">
            Visit Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="visitDate"
            type="date"
            value={formData.visitDate}
            onChange={(e) => handleInputChange('visitDate', e.target.value)}
            className={touched && errors.visitDate ? 'border-red-500' : ''}
          />
          {touched && errors.visitDate && (
            <p className="text-sm text-red-500">{errors.visitDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitTime">
            Visit Time <span className="text-red-500">*</span>
          </Label>
          <Input
            id="visitTime"
            type="time"
            value={formData.visitTime}
            onChange={(e) => handleInputChange('visitTime', e.target.value)}
            className={touched && errors.visitTime ? 'border-red-500' : ''}
          />
          {touched && errors.visitTime && (
            <p className="text-sm text-red-500">{errors.visitTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">
            Reason for Visit <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.reason}
            onValueChange={(value) => handleInputChange('reason', value)}
          >
            <SelectTrigger className={touched && errors.reason ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select reason..." />
            </SelectTrigger>
            <SelectContent>
              {COMMON_REASONS.map(reason => (
                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched && errors.reason && (
            <p className="text-sm text-red-500">{errors.reason}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority Level</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => handleInputChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NurseVisitPriority).map(priority => (
                <SelectItem key={priority} value={priority}>
                  {NurseVisitPriorityLabels[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="symptoms">Symptoms (Optional)</Label>
          <Input
            id="symptoms"
            placeholder="e.g., fever, headache, nausea"
            value={formData.symptoms}
            onChange={(e) => handleInputChange('symptoms', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature (°F) (Optional)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            placeholder="98.6"
            value={formData.temperature}
            onChange={(e) => handleInputChange('temperature', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heartRate">Heart Rate (BPM) (Optional)</Label>
          <Input
            id="heartRate"
            type="number"
            placeholder="72"
            value={formData.heartRate}
            onChange={(e) => handleInputChange('heartRate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bloodPressure">Blood Pressure (Optional)</Label>
          <Input
            id="bloodPressure"
            placeholder="120/80"
            value={formData.bloodPressure}
            onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (lbs) (Optional)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="treatment">
            Treatment Provided <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="treatment"
            placeholder="Describe treatment, care provided, or actions taken..."
            value={formData.treatment}
            onChange={(e) => handleInputChange('treatment', e.target.value)}
            rows={3}
            className={touched && errors.treatment ? 'border-red-500' : ''}
            maxLength={500}
          />
          <div className="flex justify-between">
            {touched && errors.treatment && (
              <p className="text-sm text-red-500">{errors.treatment}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.treatment.length}/500 characters
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="medications">Medications Given (Optional)</Label>
          <Input
            id="medications"
            placeholder="e.g., Tylenol 325mg, Ice pack"
            value={formData.medications}
            onChange={(e) => handleInputChange('medications', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="actionTaken">Actions Taken</Label>
          <div className="flex gap-2">
            <Input
              id="actionTaken"
              placeholder="Enter action taken (e.g., Applied bandage, Administered medication)"
              value={newActionTaken}
              onChange={(e) => setNewActionTaken(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (newActionTaken.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      actionTaken: [...prev.actionTaken, newActionTaken.trim()]
                    }))
                    setNewActionTaken('')
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (newActionTaken.trim()) {
                  setFormData(prev => ({
                    ...prev,
                    actionTaken: [...prev.actionTaken, newActionTaken.trim()]
                  }))
                  setNewActionTaken('')
                }
              }}
            >
              Add
            </Button>
          </div>
          {formData.actionTaken.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.actionTaken.map((action: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined, index: React.Key | null | undefined) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                  <span>{action}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        actionTaken: prev.actionTaken.filter((_: any, i: any) => i !== index)
                      }))
                    }}
                    className="text-red-600 hover:text-red-800 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NurseVisitStatus).map(status => (
                <SelectItem key={status} value={status}>
                  {NurseVisitStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="disposition">Disposition (Optional)</Label>
          <Select
            value={formData.disposition}
            onValueChange={(value) => handleInputChange('disposition', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select disposition..." />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NurseVisitDisposition).map(disposition => (
                <SelectItem key={disposition} value={disposition}>
                  {NurseVisitDispositionLabels[disposition]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="restrictionsNotes">Restrictions Notes (Optional)</Label>
          <Textarea
            id="restrictionsNotes"
            placeholder="Any activity restrictions or special instructions..."
            value={formData.restrictionsNotes}
            onChange={(e) => handleInputChange('restrictionsNotes', e.target.value)}
            rows={2}
            className={touched && errors.restrictionsNotes ? 'border-red-500' : ''}
            maxLength={500}
          />
          <div className="flex justify-between">
            {touched && errors.restrictionsNotes && (
              <p className="text-sm text-red-500">{errors.restrictionsNotes}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.restrictionsNotes.length}/500 characters
            </p>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUpNeeded"
              checked={formData.followUpNeeded}
              onCheckedChange={(checked) => handleInputChange('followUpNeeded', checked)}
            />
            <Label htmlFor="followUpNeeded" className="cursor-pointer">Follow-up Needed</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="parentNotified"
              checked={formData.parentNotified}
              onCheckedChange={(checked) => handleInputChange('parentNotified', checked)}
            />
            <Label htmlFor="parentNotified" className="cursor-pointer">Parent Notified</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="returnToClass"
              checked={formData.returnToClass}
              onCheckedChange={(checked) => handleInputChange('returnToClass', checked)}
            />
            <Label htmlFor="returnToClass" className="cursor-pointer">Return to Class</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800 text-white">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            visit ? 'Update Visit' : 'Record Visit'
          )}
        </Button>
      </div>
    </form>
  )
}

