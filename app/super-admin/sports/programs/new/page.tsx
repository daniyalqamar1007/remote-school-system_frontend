"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { sportsApi, adminApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { TagInput } from '@/components/sports/TagInput'
import { TeacherSelect } from '@/components/sports/TeacherSelect'

// Enums matching backend
const SportsSeason = {
  FALL: 'fall',
  WINTER: 'winter',
  SPRING: 'spring',
  SUMMER: 'summer',
  YEAR_ROUND: 'year-round'
}

const SportsProgramType = {
  COMPETITIVE: 'competitive',
  RECREATIONAL: 'recreational',
  BOTH: 'both'
}

export default function NewProgramPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [headCoach, setHeadCoach] = useState<string>('')
  const [assistantCoaches, setAssistantCoaches] = useState<string[]>([])
  const [touched, setTouched] = useState(false) // Track if form has been submitted/attempted
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [schools, setSchools] = useState<any[]>([])

  // Handle head coach change - remove from assistant coaches if selected
  const handleHeadCoachChange = (coachId: string) => {
    setHeadCoach(coachId)
    // Remove the new head coach from assistant coaches if they were selected
    if (coachId) {
      setAssistantCoaches(prev => prev.filter(id => id !== coachId))
    }
    // Clear touched state when user starts editing to remove error messages
    if (touched) {
      setTouched(false)
    }
  }
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowedGradeLevels: [] as string[],
    season: '',
    type: '',
    maxParticipants: '',
    requiredEquipment: [] as string[],
    venue: [] as string[],
    requiresPhysicalExam: true,
    requiresMedicalClearance: true,
    requiresConsentForm: true,
    eligibilityTrackingEnabled: true,
    isActive: true
  })

  const gradeLevels = [
    { value: '0', label: 'Kindergarten' },
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
    { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' }
  ]

  const seasons = [
    { value: SportsSeason.FALL, label: 'Fall' },
    { value: SportsSeason.WINTER, label: 'Winter' },
    { value: SportsSeason.SPRING, label: 'Spring' },
    { value: SportsSeason.SUMMER, label: 'Summer' },
    { value: SportsSeason.YEAR_ROUND, label: 'Year Round' }
  ]

  const types = [
    { value: SportsProgramType.COMPETITIVE, label: 'Competitive' },
    { value: SportsProgramType.RECREATIONAL, label: 'Recreational' },
    { value: SportsProgramType.BOTH, label: 'Both' }
  ]

  // Fetch schools for super-admin
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/super-admin/schools?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          const data = await response.json()
          const schoolsList = data?.data?.schools || data?.schools || []
          setSchools(schoolsList)
        }
      } catch (error) {
        console.error('Error fetching schools:', error)
      }
    }
    fetchSchools()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear touched state when user starts editing to remove error messages
    if (touched) {
      setTouched(false)
    }
  }

  const handleGradeLevelChange = (gradeLevel: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowedGradeLevels: checked
        ? [...prev.allowedGradeLevels, gradeLevel]
        : prev.allowedGradeLevels.filter(level => level !== gradeLevel)
    }))
    // Clear touched state when user starts editing to remove error messages
    if (touched) {
      setTouched(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      allowedGradeLevels: [],
      season: '',
      type: '',
      maxParticipants: '',
      requiredEquipment: [],
      venue: [],
      requiresPhysicalExam: true,
      requiresMedicalClearance: true,
      requiresConsentForm: true,
      eligibilityTrackingEnabled: true,
      isActive: true
    })
    setHeadCoach('')
    setAssistantCoaches([])
    setSelectedSchoolId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true) // Mark form as touched/submitted
    
    // Validation for required fields
    const errors: string[] = []
    
    if (!formData.name || !formData.name.trim()) {
      errors.push('Program name is required')
    }
    
    if (!formData.season) {
      errors.push('Season is required')
    }
    
    if (!formData.type) {
      errors.push('Program type is required')
    }
    
    if (formData.allowedGradeLevels.length === 0) {
      errors.push('At least one grade level must be selected')
    }
    
    if (!headCoach || !headCoach.trim()) {
      errors.push('Head coach is required')
    }
    
    // For super-admin, school selection is required
    if (!selectedSchoolId || !selectedSchoolId.trim()) {
      errors.push('School selection is required')
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(', '))
      return
    }

    setLoading(true)

    try {

      // Prepare coaches arrays correctly
      // Head coach goes in coaches array (single element array)
      // Assistant coaches go in assistantCoaches array (separate)
      const coaches = headCoach ? [headCoach] : []
      
      // Filter out head coach from assistant coaches (in case they selected same person)
      const filteredAssistantCoaches = assistantCoaches.filter(id => id && id !== headCoach)

      // Prepare data for backend
      // For super-admin, use selectedSchoolId; for admin, use user.schoolId
      const schoolId = selectedSchoolId || user?.schoolId
      
      if (!schoolId) {
        toast.error('School selection is required')
        setLoading(false)
        return
      }
      
      const programData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        allowedGradeLevels: formData.allowedGradeLevels,
        schoolId: schoolId,
        coaches: coaches, // Only head coach
        assistantCoaches: filteredAssistantCoaches, // Only assistant coaches
        season: formData.season,
        type: formData.type || SportsProgramType.COMPETITIVE,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : 0,
        requiredEquipment: formData.requiredEquipment,
        venue: formData.venue,
        requiresPhysicalExam: formData.requiresPhysicalExam,
        requiresMedicalClearance: formData.requiresMedicalClearance,
        requiresConsentForm: formData.requiresConsentForm,
        eligibilityTrackingEnabled: formData.eligibilityTrackingEnabled,
        isActive: true // Always true - static
      }

      const response = await sportsApi.programs.create(programData)
      
      // Handle response - check for new API format
      if (response?.success || response?.statusCode === 201 || response?.data || response?._id) {
        toast.success(response?.message || 'Sports program created successfully!')
        // Reset touched state after successful submission
        setTouched(false)
        resetForm()
        // Refresh the main sports page
        router.push('/super-admin/sports?refresh=true')
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (error: any) {
      console.error('Error creating sports program:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create sports program. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/sports">
          <Button variant="outline" size="sm" disabled={loading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sports
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Sports Program</h1>
          <p className="text-gray-600 mt-1">Set up a new sports program for students</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="school" className="text-base font-medium">
                      School <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={selectedSchoolId} 
                      onValueChange={(value) => {
                        setSelectedSchoolId(value)
                        // Clear head coach and assistant coaches when school changes
                        setHeadCoach('')
                        setAssistantCoaches([])
                        // Clear touched state when user starts editing to remove error messages
                        if (touched) {
                          setTouched(false)
                        }
                      }}
                      disabled={loading}
                      required
                    >
                      <SelectTrigger className={touched && !selectedSchoolId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school._id} value={school._id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched && !selectedSchoolId && (
                      <p className="text-sm text-red-500 mt-1">School selection is required</p>
                    )}
                  </div>
                <div>
                    <Label htmlFor="name" className="text-base font-medium">
                      Program Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Basketball, Soccer, Track & Field"
                      required
                      disabled={loading}
                      className={touched && !formData.name.trim() ? 'border-red-500' : ''}
                    />
                    {touched && !formData.name.trim() && (
                      <p className="text-sm text-red-500 mt-1">Program name is required</p>
                    )}
                </div>
                  <div>
                    <Label htmlFor="season" className="text-base font-medium">
                      Season <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.season} 
                      onValueChange={(value) => handleInputChange('season', value)}
                      disabled={loading}
                      required
                    >
                      <SelectTrigger className={touched && !formData.season ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season.value} value={season.value}>
                            {season.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched && !formData.season && (
                      <p className="text-sm text-red-500 mt-1">Season is required</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-base font-medium">
                      Program Type <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleInputChange('type', value)}
                      disabled={loading}
                      required
                    >
                      <SelectTrigger className={touched && !formData.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched && !formData.type && (
                      <p className="text-sm text-red-500 mt-1">Program type is required</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Maximum Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                      placeholder="Leave empty for unlimited"
                      disabled={loading}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-medium">
                    Description <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the sports program..."
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TagInput
                    tags={formData.requiredEquipment}
                    onTagsChange={(tags) => handleInputChange('requiredEquipment', tags)}
                    placeholder="Press Enter to add equipment"
                    label="Required Equipment"
                    disabled={loading}
                  />
                  <TagInput
                    tags={formData.venue}
                    onTagsChange={(tags) => handleInputChange('venue', tags)}
                    placeholder="Press Enter to add venue"
                    label="Venues"
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Assignment */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Staff Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Head Coach */}
                <div>
                  <Label className="text-base font-medium">
                    Head Coach <span className="text-red-500">*</span>
                  </Label>
                  <div className={touched && !headCoach ? 'border border-red-500 rounded-md' : ''}>
                    <TeacherSelect
                      value={headCoach}
                      onValueChange={handleHeadCoachChange}
                      placeholder={selectedSchoolId ? "Select head coach..." : "Please select a school first"}
                      disabled={loading || !selectedSchoolId}
                      schoolId={selectedSchoolId}
                      eligibleForSports={true}
                    />
                  </div>
                  {touched && !headCoach && (
                    <p className="text-sm text-red-500 mt-1">Head coach is required</p>
                  )}
                </div>

                {/* Assistant Coaches */}
                <div>
                  <Label className="text-base font-medium">
                    Assistant Coaches <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <TeacherSelect
                    multiple
                    selectedValues={assistantCoaches}
                    onMultipleChange={setAssistantCoaches}
                    placeholder={!selectedSchoolId ? "Please select a school first" : !headCoach ? "Please select head coach first" : "Select assistant coaches..."}
                    disabled={loading || !selectedSchoolId || !headCoach}
                    excludeTeacherId={headCoach}
                    schoolId={selectedSchoolId}
                    eligibleForSports={true}
                  />
                  {!selectedSchoolId && (
                    <p className="text-sm text-gray-500 mt-1">Please select a school first to enable coach selection</p>
                  )}
                  {selectedSchoolId && !headCoach && (
                    <p className="text-sm text-gray-500 mt-1">Please select a head coach first to enable assistant coaches selection</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Program Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Grade Levels */}
                <div>
                  <Label className="text-base font-medium">
                    Eligible Grade Levels <span className="text-red-500">*</span>
                  </Label>
                  <div className={`grid grid-cols-2 gap-2 mt-2 p-2 rounded ${touched && formData.allowedGradeLevels.length === 0 ? 'border border-red-500' : ''}`}>
                    {gradeLevels.map((grade) => (
                      <div key={grade.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`grade-${grade.value}`}
                          checked={formData.allowedGradeLevels.includes(grade.value)}
                          onCheckedChange={(checked) => handleGradeLevelChange(grade.value, checked as boolean)}
                          disabled={loading}
                        />
                        <Label htmlFor={`grade-${grade.value}`} className="text-sm">
                          {grade.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {touched && formData.allowedGradeLevels.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">At least one grade level is required</p>
                  )}
                </div>

                {/* Medical Requirements */}
                <div>
                  <Label className="text-base font-medium">Medical Requirements</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresPhysicalExam"
                        checked={formData.requiresPhysicalExam}
                        onCheckedChange={(checked) => handleInputChange('requiresPhysicalExam', checked)}
                        disabled={loading}
                      />
                      <Label htmlFor="requiresPhysicalExam" className="text-sm">
                        Requires Physical Exam
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresMedicalClearance"
                        checked={formData.requiresMedicalClearance}
                        onCheckedChange={(checked) => handleInputChange('requiresMedicalClearance', checked)}
                        disabled={loading}
                      />
                      <Label htmlFor="requiresMedicalClearance" className="text-sm">
                        Requires Medical Clearance
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresConsentForm"
                        checked={formData.requiresConsentForm}
                        onCheckedChange={(checked) => handleInputChange('requiresConsentForm', checked)}
                        disabled={loading}
                      />
                      <Label htmlFor="requiresConsentForm" className="text-sm">
                        Requires Consent Form
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Other Settings */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="eligibilityTrackingEnabled"
                      checked={formData.eligibilityTrackingEnabled}
                      onCheckedChange={(checked) => handleInputChange('eligibilityTrackingEnabled', checked)}
                      disabled={loading}
                    />
                    <Label htmlFor="eligibilityTrackingEnabled">Enable Eligibility Tracking</Label>
                  </div>
                  {/* isActive is always true - static, no checkbox needed */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link href="/super-admin/sports">
            <Button variant="outline" type="button" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Program
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
