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
  HealthAlertType, 
  HealthAlertSeverity,
  HealthAlertTypeLabels,
  HealthAlertSeverityLabels
} from '@/lib/enums/health-alert.enums'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

interface HealthAlertFormProps {
  alert?: any
  onSuccess: () => void
  onCancel: () => void
  studentId?: string
}

export default function HealthAlertForm({ alert, onSuccess, onCancel, studentId }: HealthAlertFormProps) {
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || '')
  
  const [formData, setFormData] = useState({
    type: alert?.type || HealthAlertType.CUSTOM_ALERT,
    severity: alert?.severity || HealthAlertSeverity.MEDIUM,
    title: alert?.title || '',
    description: alert?.description || '',
    triggerConditions: alert?.triggerConditions || '',
    actionRequired: alert?.actionRequired || '',
    expiryDate: alert?.expiryDate ? new Date(alert.expiryDate).toISOString().split('T')[0] : '',
    isActive: alert?.isActive !== undefined ? alert.isActive : true,
    autoTrigger: alert?.autoTrigger || false,
    notifyParents: alert?.notifyParents || false,
    notifyTeachers: alert?.notifyTeachers || false
  })

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
        console.log('[HealthAlertForm] Students API response:', data)
        // Handle different response structures
        const studentsList = data?.students || data?.data?.students || data?.data || (Array.isArray(data) ? data : [])
        console.log('[HealthAlertForm] Processed students:', studentsList.length)
        setStudents(Array.isArray(studentsList) ? studentsList : [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[HealthAlertForm] Failed to fetch students:', errorData)
        toast.error(errorData.message || 'Failed to load students')
      }
    } catch (error: any) {
      console.error('Error fetching students:', error)
      toast.error('Error loading students. Please try again.')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!selectedStudentId && !studentId) {
      newErrors.studentId = 'Student is required'
    }
    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Title is required'
    }
    if (formData.title && formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }
    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = 'Description is required'
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }
    if (formData.actionRequired && formData.actionRequired.length > 500) {
      newErrors.actionRequired = 'Action required must be less than 500 characters'
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

      const alertData = {
        type: formData.type,
        severity: formData.severity,
        title: formData.title.trim(),
        description: formData.description.trim(),
        triggerConditions: formData.triggerConditions.trim() || undefined,
        actionRequired: formData.actionRequired.trim() || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        isActive: formData.isActive,
        autoTrigger: formData.autoTrigger,
        notifyParents: formData.notifyParents,
        notifyTeachers: formData.notifyTeachers,
        visibleToStaff: true
      }

      let response
      if (alert?._id) {
        // Update existing alert
        response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${targetStudentId}/health-alert/${alert._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(alertData),
        })
      } else {
        // Create new alert
        response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${targetStudentId}/health-alert`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(alertData),
        })
      }

      const data = await response.json()
      console.log('[HealthAlertForm] API Response:', { ok: response.ok, success: data.success, data })
      
      if (response.ok) {
        if (data.success === false) {
          const errorMessage = data.message || data.error || 'Failed to save health alert'
          toast.error(errorMessage)
          setLoading(false)
          return
        }
        const successMessage = data.message || (alert ? 'Health alert updated successfully' : 'Health alert created successfully')
        toast.success(successMessage)
        onSuccess()
      } else {
        const errorMessage = data.message || data.error || `Failed to save health alert (${response.status})`
        toast.error(errorMessage)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error saving health alert:', error)
      toast.error(error.message || 'Failed to save health alert')
    } finally {
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
          <Label htmlFor="type">Alert Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(HealthAlertType).map(type => (
                <SelectItem key={type} value={type}>
                  {HealthAlertTypeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) => handleInputChange('severity', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(HealthAlertSeverity).map(severity => (
                <SelectItem key={severity} value={severity}>
                  {HealthAlertSeverityLabels[severity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Enter alert title..."
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={touched && errors.title ? 'border-red-500' : ''}
            maxLength={200}
          />
          <div className="flex justify-between">
            {touched && errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.title.length}/200 characters
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Enter alert description..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={touched && errors.description ? 'border-red-500' : ''}
            maxLength={500}
          />
          <div className="flex justify-between">
            {touched && errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.description.length}/500 characters
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="triggerConditions">Trigger Conditions (Optional)</Label>
          <Textarea
            id="triggerConditions"
            placeholder="Describe conditions that trigger this alert..."
            value={formData.triggerConditions}
            onChange={(e) => handleInputChange('triggerConditions', e.target.value)}
            rows={2}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="actionRequired">Action Required (Optional)</Label>
          <Textarea
            id="actionRequired"
            placeholder="Describe required actions..."
            value={formData.actionRequired}
            onChange={(e) => handleInputChange('actionRequired', e.target.value)}
            rows={2}
            className={touched && errors.actionRequired ? 'border-red-500' : ''}
            maxLength={500}
          />
          <div className="flex justify-between">
            {touched && errors.actionRequired && (
              <p className="text-sm text-red-500">{errors.actionRequired}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.actionRequired.length}/500 characters
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoTrigger"
              checked={formData.autoTrigger}
              onCheckedChange={(checked) => handleInputChange('autoTrigger', checked)}
            />
            <Label htmlFor="autoTrigger" className="cursor-pointer">Auto Trigger</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyParents"
              checked={formData.notifyParents}
              onCheckedChange={(checked) => handleInputChange('notifyParents', checked)}
            />
            <Label htmlFor="notifyParents" className="cursor-pointer">Notify Parents</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyTeachers"
              checked={formData.notifyTeachers}
              onCheckedChange={(checked) => handleInputChange('notifyTeachers', checked)}
            />
            <Label htmlFor="notifyTeachers" className="cursor-pointer">Notify Teachers</Label>
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
            alert ? 'Update Alert' : 'Create Alert'
          )}
        </Button>
      </div>
    </form>
  )
}

