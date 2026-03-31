"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'
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

export default function EditProgramPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [headCoach, setHeadCoach] = useState<string>('')
  const [assistantCoaches, setAssistantCoaches] = useState<string[]>([])
  const [touched, setTouched] = useState(false) // Track if form has been submitted/attempted

  // Handle head coach change - remove from assistant coaches if selected
  const handleHeadCoachChange = (coachId: string) => {
    setHeadCoach(coachId)
    // Remove the new head coach from assistant coaches if they were selected
    if (coachId) {
      setAssistantCoaches(prev => prev.filter(id => id !== coachId))
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

  useEffect(() => {
    if (params.id) {
      loadProgram()
    }
  }, [params.id])

  const loadProgram = async () => {
    try {
      setLoading(true)
      const programId = Array.isArray(params.id) ? params.id[0] : params.id
      const response = await sportsApi.programs.getById(programId)
      
      // Handle response structure
      const program = response?.data || response
      
      if (program) {
        // Extract coaches properly - handle both populated and unpopulated coaches
        const coaches = program.coaches || []
        const assistantCoachesList = program.assistantCoaches || []
        
        let headCoachId = ''
        let assistantCoachIds: string[] = []
        
        if (coaches && coaches.length > 0) {
          // First coach is head coach
          headCoachId = typeof coaches[0] === 'string' ? coaches[0] : (coaches[0]._id || coaches[0])
          
          // Get assistant coaches from rest of coaches array and assistantCoaches array
          const restCoaches = coaches.slice(1).map((c: any) => typeof c === 'string' ? c : (c._id || c))
          const assistantList = assistantCoachesList.map((c: any) => typeof c === 'string' ? c : (c._id || c))
          
          assistantCoachIds = [...restCoaches, ...assistantList]
            .filter((id, index, self) => id && self.indexOf(id) === index && id !== headCoachId)
        } else if (assistantCoachesList && assistantCoachesList.length > 0) {
          assistantCoachIds = assistantCoachesList.map((c: any) => typeof c === 'string' ? c : (c._id || c))
        }
        
        setHeadCoach(headCoachId)
        setAssistantCoaches(assistantCoachIds)
        
        setFormData({
          name: program.name || '',
          description: program.description || '',
          allowedGradeLevels: program.allowedGradeLevels || [],
          season: program.season || '',
          type: program.type || '',
          maxParticipants: program.maxParticipants > 0 ? program.maxParticipants.toString() : '',
          requiredEquipment: program.requiredEquipment || [],
          venue: program.venue || [],
          requiresPhysicalExam: program.requiresPhysicalExam !== false,
          requiresMedicalClearance: program.requiresMedicalClearance !== false,
          requiresConsentForm: program.requiresConsentForm !== false,
          eligibilityTrackingEnabled: program.eligibilityTrackingEnabled !== false,
          isActive: true // Always true - static
        })
      }
    } catch (error) {
      console.error('Error loading program:', error)
      toast.error('Failed to load program details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGradeLevelToggle = (grade: string) => {
    setFormData(prev => ({
      ...prev,
      allowedGradeLevels: prev.allowedGradeLevels.includes(grade)
        ? prev.allowedGradeLevels.filter(g => g !== grade)
        : [...prev.allowedGradeLevels, grade]
    }))
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
    
    if (errors.length > 0) {
      toast.error(errors.join(', '))
      return
    }

    try {
      setSaving(true)
      
      // Prepare coaches arrays correctly
      // Head coach goes in coaches array (single element array)
      // Assistant coaches go in assistantCoaches array (separate)
      const coaches = headCoach ? [headCoach] : []
      
      // Filter out head coach from assistant coaches (in case they selected same person)
      const filteredAssistantCoaches = assistantCoaches.filter(id => id && id !== headCoach)

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        allowedGradeLevels: formData.allowedGradeLevels,
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

      const programId = Array.isArray(params.id) ? params.id[0] : params.id
      const response = await sportsApi.programs.update(programId, updateData)
      
      // Handle response
      if (response?.success || response?.statusCode === 200 || response?.data) {
        toast.success(response?.message || 'Program updated successfully')
        // Refresh main page and redirect
        router.push(`/admin/sports?refresh=true`)
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (error: any) {
      console.error('Error updating program:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update program'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/sports/programs/${params.id}`}>
            <Button variant="ghost" size="sm" disabled={saving}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Program
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Program</h1>
            <p className="text-gray-600 mt-1">Update program information and settings</p>
          </div>
        </div>
      </div>

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
                    <Label htmlFor="name" className="text-base font-medium">
                      Program Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Varsity Basketball"
                      required
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                    placeholder="Brief description of the program..."
                    rows={3}
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <Label className="text-base font-medium">
                    Grade Levels <span className="text-red-500">*</span>
                  </Label>
                  <div className={`grid grid-cols-4 md:grid-cols-6 gap-2 mt-2 p-2 rounded ${touched && formData.allowedGradeLevels.length === 0 ? 'border border-red-500' : ''}`}>
                    {gradeLevels.map((grade) => (
                      <div key={grade.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={grade.value}
                          checked={formData.allowedGradeLevels.includes(grade.value)}
                          onCheckedChange={() => handleGradeLevelToggle(grade.value)}
                          disabled={saving}
                        />
                        <Label htmlFor={grade.value} className="text-sm">{grade.label}</Label>
                      </div>
                    ))}
                  </div>
                  {touched && formData.allowedGradeLevels.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">At least one grade level is required</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TagInput
                    tags={formData.requiredEquipment}
                    onTagsChange={(tags) => handleInputChange('requiredEquipment', tags)}
                    placeholder="Press Enter to add equipment"
                    label="Required Equipment"
                    disabled={saving}
                  />
                  <TagInput
                    tags={formData.venue}
                    onTagsChange={(tags) => handleInputChange('venue', tags)}
                    placeholder="Press Enter to add venue"
                    label="Venues"
                    disabled={saving}
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
                      placeholder="Select head coach..."
                      disabled={saving}
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
                    placeholder={headCoach ? "Select assistant coaches..." : "Please select head coach first"}
                    disabled={saving || !headCoach}
                    excludeTeacherId={headCoach}
                    eligibleForSports={true}
                  />
                  {!headCoach && (
                    <p className="text-sm text-gray-500 mt-1">Please select a head coach first to enable assistant coaches selection</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical Requirements & Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Medical Requirements & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresPhysicalExam"
                      checked={formData.requiresPhysicalExam}
                      onCheckedChange={(checked) => handleInputChange('requiresPhysicalExam', checked)}
                      disabled={saving}
                    />
                    <Label htmlFor="requiresPhysicalExam">Requires Physical Exam</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresMedicalClearance"
                      checked={formData.requiresMedicalClearance}
                      onCheckedChange={(checked) => handleInputChange('requiresMedicalClearance', checked)}
                      disabled={saving}
                    />
                    <Label htmlFor="requiresMedicalClearance">Requires Medical Clearance</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresConsentForm"
                      checked={formData.requiresConsentForm}
                      onCheckedChange={(checked) => handleInputChange('requiresConsentForm', checked)}
                      disabled={saving}
                    />
                    <Label htmlFor="requiresConsentForm">Requires Consent Form</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="eligibilityTrackingEnabled"
                      checked={formData.eligibilityTrackingEnabled}
                      onCheckedChange={(checked) => handleInputChange('eligibilityTrackingEnabled', checked)}
                      disabled={saving}
                    />
                    <Label htmlFor="eligibilityTrackingEnabled">Enable Eligibility Tracking</Label>
                  </div>
                  
                  {/* isActive is always true - static, no need for checkbox */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link href={`/admin/sports/programs/${params.id}`}>
            <Button type="button" variant="outline" disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
