'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  return {
    'Authorization': `Bearer ${token}`,
  }
}

const DOCUMENT_CATEGORIES = [
  'Medical Records',
  'Immunization Records',
  'Allergy Documentation',
  'Medication Forms',
  'Physical Exam Reports',
  'Emergency Contacts',
  'Insurance Information',
  'Doctor Notes',
  'Lab Results',
  'X-rays/Imaging',
  'IEP/504 Plans',
  'Permission Forms',
  'Other Health Documents'
]

const ACCESS_LEVELS = [
  'Public',
  'Staff Only',
  'Nurse Only',
  'Admin Only'
]

interface DocumentUploadFormProps {
  onSuccess: () => void
  onCancel: () => void
  studentId?: string
}

export default function DocumentUploadForm({ onSuccess, onCancel, studentId }: DocumentUploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    isConfidential: false,
    accessLevel: 'Staff Only' as 'Public' | 'Staff Only' | 'Nurse Only' | 'Admin Only',
    tags: ''
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
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
    if (!selectedFile) {
      newErrors.file = 'File is required'
    } else {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        newErrors.file = 'File size must be less than 10MB'
      }
      
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(selectedFile.type)) {
        newErrors.file = 'File type not supported. Please use PDF, images, Word documents, or text files.'
      }
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = 'Description is required'
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (errors.file) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.file
          return newErrors
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields and select a file')
      return
    }

    setLoading(true)
    try {
      const targetStudentId = selectedStudentId || studentId
      if (!targetStudentId) {
        toast.error('Student is required')
        return
      }

      if (!selectedFile) {
        toast.error('File is required')
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append('file', selectedFile)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('isConfidential', formData.isConfidential.toString())
      formDataToSend.append('accessLevel', formData.accessLevel)
      if (formData.tags) {
        formDataToSend.append('tags', formData.tags)
      }

      const response = await fetch(`${API_BASE_URL}/nurse/health-records/student/${targetStudentId}/upload-document`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formDataToSend,
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Document uploaded successfully')
        // Reset form
        setFormData({
          category: '',
          description: '',
          isConfidential: false,
          accessLevel: 'Staff Only',
          tags: ''
        })
        setSelectedFile(null)
        onSuccess()
      } else {
        throw new Error(data.message || 'Failed to upload document')
      }
    } catch (error: any) {
      console.error('Error uploading document:', error)
      toast.error(error.message || 'Failed to upload document')
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

      <div className="space-y-2">
        <Label htmlFor="file">
          File <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="file"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
            className={touched && errors.file ? 'border-red-500' : ''}
          />
        </div>
        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
        {touched && errors.file && (
          <p className="text-sm text-red-500">{errors.file}</p>
        )}
        <p className="text-xs text-gray-500">
          Max file size: 10MB. Allowed types: PDF, Images, Word documents, Text files
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <SelectTrigger className={touched && errors.category ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched && errors.category && (
            <p className="text-sm text-red-500">{errors.category}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessLevel">Access Level</Label>
          <Select
            value={formData.accessLevel}
            onValueChange={(value) => handleInputChange('accessLevel', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCESS_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Enter document description..."
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
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input
            id="tags"
            placeholder="Enter tags separated by commas..."
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isConfidential"
              checked={formData.isConfidential}
              onCheckedChange={(checked) => handleInputChange('isConfidential', checked)}
            />
            <Label htmlFor="isConfidential" className="cursor-pointer">Mark as Confidential</Label>
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
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

