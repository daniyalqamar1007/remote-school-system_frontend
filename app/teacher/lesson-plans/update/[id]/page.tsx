"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  X,
  Paperclip,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axios from "axios"
import { getLocalStorageValue } from "@/lib/utils"

interface Course {
  courseId: string
  courseName: string
  courseCode: string
  gradeLevel: string
  section: string
}

interface LessonPlan {
  _id: string
  title: string
  description: string
  courseId: {
    _id: string
    courseCode: string
    courseName: string
  }
  objectives: string[]
  materials: string[]
  duration: number
  status: string
  attachments?: string[]
}

export default function UpdateLessonPlanPage() {
  const router = useRouter()
  const params = useParams()
  const lessonPlanId = params.id as string
  const teacherId = getLocalStorageValue("id")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    objectives: [''],
    materials: [''],
    duration: 60
  })

  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch lesson plan
  const fetchLessonPlan = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/lesson-plan/${lessonPlanId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const plan: LessonPlan = response.data
      setFormData({
        title: plan.title || '',
        description: plan.description || '',
        courseId: plan.courseId?._id || '',
        objectives: plan.objectives && plan.objectives.length > 0 ? plan.objectives : [''],
        materials: plan.materials && plan.materials.length > 0 ? plan.materials : [''],
        duration: plan.duration || 60
      })
      setAttachmentUrls(Array.isArray(plan.attachments) ? plan.attachments : [])
    } catch (error: any) {
      console.error('Error fetching lesson plan:', error)
      toast.error('Failed to load lesson plan')
      router.back()
    } finally {
      setLoading(false)
    }
  }, [lessonPlanId, router])

  // Fetch teacher's courses
  const fetchCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/attendance/teacher/courses`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const coursesData = response.data?.data || response.data || []
      setCourses(Array.isArray(coursesData) ? coursesData : [])
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    }
  }, [])

  useEffect(() => {
    fetchLessonPlan()
    fetchCourses()
  }, [fetchLessonPlan, fetchCourses])

  // Get unique courses assigned to teacher (remove duplicates by courseId)
  const filteredCourses = Array.from(
    new Map(
      courses.map(course => {
        const courseId = typeof course.courseId === 'string' 
          ? course.courseId 
          : (course.courseId?._id || course.courseId?.toString() || '')
        return [courseId, course]
      })
    ).values()
  )

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }))
  }

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }))
  }

  const updateObjective = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj)
    }))
    if (errors[`objective-${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`objective-${index}`]
        return newErrors
      })
    }
  }

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, '']
    }))
  }

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }))
  }

  const updateMaterial = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((mat, i) => i === index ? value : mat)
    }))
    if (errors[`material-${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`material-${index}`]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.courseId || formData.courseId === 'select-course') {
      newErrors.courseId = 'Please select a course'
    }

    const validObjectives = formData.objectives.filter(obj => obj.trim() !== '')
    if (validObjectives.length === 0) {
      newErrors.objectives = 'At least one objective is required'
    }

    const validMaterials = formData.materials.filter(mat => mat.trim() !== '')
    if (validMaterials.length === 0) {
      newErrors.materials = 'At least one material is required'
    }

    if (formData.duration < 15 || formData.duration > 180) {
      newErrors.duration = 'Duration must be between 15 and 180 minutes'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
      const validObjectives = formData.objectives.filter(obj => obj.trim() !== '')
      const validMaterials = formData.materials.filter(mat => mat.trim() !== '')

      const form = new FormData()
      form.append('title', formData.title.trim())
      form.append('description', formData.description.trim())
      form.append('courseId', formData.courseId)
      form.append('objectives', JSON.stringify(validObjectives))
      form.append('materials', JSON.stringify(validMaterials))
      form.append('duration', String(formData.duration))
      form.append('attachments', JSON.stringify(attachmentUrls))
      newFiles.forEach((file) => form.append('files', file))

      await axios.put(
        `${process.env.NEXT_PUBLIC_SRS_SERVER}/lesson-plan/${lessonPlanId}`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      toast.success('Lesson plan updated successfully!')
      router.push('/teacher/lesson-plans')
    } catch (error: any) {
      console.error('Error updating lesson plan:', error)
      toast.error(error.response?.data?.message || 'Failed to update lesson plan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Update Lesson Plan</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Lesson Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Lesson Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                    if (errors.title) {
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.title
                        return newErrors
                      })
                    }
                  }}
                  placeholder="Enter lesson title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">
                  Course <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.courseId} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, courseId: value }))
                    if (errors.courseId) {
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.courseId
                        return newErrors
                      })
                    }
                  }}
                >
                  <SelectTrigger className={errors.courseId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCourses.length === 0 ? (
                      <SelectItem value="no-courses" disabled>
                        No courses assigned
                      </SelectItem>
                    ) : (
                      filteredCourses.map((course) => (
                        <SelectItem key={course.courseId} value={course.courseId}>
                          {course.courseName} ({course.courseCode})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.courseId && (
                  <p className="text-sm text-red-500">{errors.courseId}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                  if (errors.description) {
                    setErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.description
                      return newErrors
                    })
                  }
                }}
                placeholder="Describe the lesson content and approach"
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 60
                  setFormData(prev => ({ ...prev, duration: value }))
                  if (errors.duration) {
                    setErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.duration
                      return newErrors
                    })
                  }
                }}
                min="15"
                max="180"
                className={`w-32 ${errors.duration ? 'border-red-500' : ''}`}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Learning Objectives <span className="text-red-500">*</span>
                </Label>
                {formData.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={objective}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      placeholder={`Objective ${index + 1}`}
                      className={errors[`objective-${index}`] ? 'border-red-500' : ''}
                    />
                    {formData.objectives.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addObjective}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </Button>
                {errors.objectives && (
                  <p className="text-sm text-red-500">{errors.objectives}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Required Materials <span className="text-red-500">*</span>
                </Label>
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={material}
                      onChange={(e) => updateMaterial(index, e.target.value)}
                      placeholder={`Material ${index + 1}`}
                      className={errors[`material-${index}`] ? 'border-red-500' : ''}
                    />
                    {formData.materials.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
                {errors.materials && (
                  <p className="text-sm text-red-500">{errors.materials}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </Label>
              {attachmentUrls.length > 0 && (
                <ul className="text-sm space-y-1">
                  {attachmentUrls.map((url, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {url.split('/').pop() || `Attachment ${i + 1}`}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachmentUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
                onChange={(e) => {
                  const files = e.target.files
                  if (files?.length) setNewFiles((prev) => [...prev, ...Array.from(files)])
                  e.target.value = ''
                }}
              />
              {newFiles.length > 0 && (
                <ul className="text-sm text-gray-600 space-y-1">
                  {newFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>{f.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={saving || filteredCourses.length === 0}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Lesson Plan
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

