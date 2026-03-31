"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Save,
  Users,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function EditSchedulePage() {
  const router = useRouter()
  const params = useParams()
  const scheduleId = params?.id as string

  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false) // Track if form has been submitted
  const [errors, setErrors] = useState<Record<string, string>>({}) // Track field errors
  const [formData, setFormData] = useState({
    programId: '',
    eventType: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    time: '',
    endTime: '',
    location: '',
    opponent: '',
    isRecurring: false,
    recurringPattern: '',
    recurringEndDate: '',
    notes: '',
    requiresTransportation: false,
    maxParticipants: '',
    timeSlots: [] as Array<{ date: string; startTime: string; endTime: string; description: string }>
  })
  
  const DESCRIPTION_MAX_LENGTH = 500

  useEffect(() => {
    if (scheduleId) {
      fetchPrograms()
      fetchSchedule()
    }
  }, [scheduleId])

  const fetchPrograms = async () => {
    try {
      const response = await sportsApi.programs.getAll({ page: '1', limit: '100' })
      // Handle new API response format
      const programsList = response?.data?.programs || response?.programs || (Array.isArray(response) ? response : [])
      setPrograms(Array.isArray(programsList) ? programsList : [])
    } catch (error: any) {
      console.error('Error fetching programs:', error)
      toast.error(error?.message || 'Failed to load sports programs')
    }
  }

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      // Use getById API
      const response = await sportsApi.schedule.getById(scheduleId)
      
      // Handle new API response format
      let schedule: any = null
      if (response?.data) {
        schedule = response.data
      } else if (response?.success && response?.data) {
        schedule = response.data
      } else if (response) {
        schedule = response
      }
      
      if (!schedule) {
        toast.error('Schedule not found')
        router.push('/secretary/sports/schedule')
        return
      }

      // Populate form with schedule data
      const scheduleStartDate = new Date(schedule.startDate || schedule.date)
      const scheduleEndDate = new Date(schedule.endDate || schedule.startDate || schedule.date)
      const scheduleTime = schedule.startTime || schedule.time || ''
      const endTime = schedule.endTime || ''
      
      // Process time slots if available
      const timeSlots = schedule.timeSlots && Array.isArray(schedule.timeSlots) 
        ? schedule.timeSlots.map((slot: any) => ({
            date: new Date(slot.date).toISOString().split('T')[0],
            startTime: slot.startTime || '',
            endTime: slot.endTime || '',
            description: slot.description || ''
          }))
        : []

      setFormData({
        programId: schedule.program?._id || schedule.sportsProgramId?._id || schedule.sportsProgramId || '',
        eventType: schedule.eventType || schedule.type || '',
        title: schedule.title || schedule.name || '',
        description: schedule.description || '',
        startDate: scheduleStartDate.toISOString().split('T')[0],
        endDate: scheduleEndDate.toISOString().split('T')[0],
        time: scheduleTime,
        endTime: endTime,
        location: schedule.location || schedule.venue || '',
        opponent: schedule.opponent || '',
        isRecurring: schedule.isRecurring || false,
        recurringPattern: schedule.recurringPattern || '',
        recurringEndDate: schedule.recurringEndDate ? new Date(schedule.recurringEndDate).toISOString().split('T')[0] : '',
        notes: schedule.specialInstructions || schedule.notes || '',
        requiresTransportation: schedule.requiresTransportation === true || schedule.requiresTransportation === 'true',
        maxParticipants: schedule.maxAttendees?.toString() || schedule.maxParticipants?.toString() || '',
        timeSlots: timeSlots
      })
    } catch (error: any) {
      console.error('Error fetching schedule:', error)
      toast.error(error?.message || 'Failed to load schedule')
      router.push('/secretary/sports/schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Validate description length in real-time
    if (field === 'description' && value.length > DESCRIPTION_MAX_LENGTH) {
      setErrors(prev => ({
        ...prev,
        description: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`
      }))
    }
    
    // Validate start time before end time
    if (field === 'time' && formData.endTime) {
      const startTime = value
      const endTime = formData.endTime
      if (startTime && endTime && startTime >= endTime) {
        setErrors(prev => ({
          ...prev,
          time: 'Start time must be before end time',
          endTime: 'End time must be after start time'
        }))
      } else if (errors.time || errors.endTime) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.time
          delete newErrors.endTime
          return newErrors
        })
      }
    }
    
    if (field === 'endTime' && formData.time) {
      const startTime = formData.time
      const endTime = value
      if (startTime && endTime && startTime >= endTime) {
        setErrors(prev => ({
          ...prev,
          time: 'Start time must be before end time',
          endTime: 'End time must be after start time'
        }))
      } else if (errors.time || errors.endTime) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.time
          delete newErrors.endTime
          return newErrors
        })
      }
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.programId) {
      newErrors.programId = 'Sports program is required'
    }
    
    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required'
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date cannot be before start date'
      }
    }
    
    if (!formData.time) {
      newErrors.time = 'Start time is required'
    }
    
    if (formData.endTime && formData.time && formData.time >= formData.endTime) {
      newErrors.time = 'Start time must be before end time'
      newErrors.endTime = 'End time must be after start time'
    }
    
    if (formData.description && formData.description.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`
    }
    
    if (formData.isRecurring && !formData.recurringPattern) {
      newErrors.recurringPattern = 'Recurring pattern is required for recurring events'
    }
    
    // Validate time slots if provided
    if (formData.timeSlots && formData.timeSlots.length > 0) {
      const slotsByDate: Record<string, any[]> = {};
      
      for (let i = 0; i < formData.timeSlots.length; i++) {
        const slot = formData.timeSlots[i];
        
        if (!slot.date) {
          newErrors[`timeSlot_${i}_date`] = 'Date is required';
        }
        if (!slot.startTime) {
          newErrors[`timeSlot_${i}_startTime`] = 'Start time is required';
        }
        if (!slot.endTime) {
          newErrors[`timeSlot_${i}_endTime`] = 'End time is required';
        }
        
        if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
          newErrors[`timeSlot_${i}_time`] = 'Start time must be before end time';
        }
        
        if (slot.date) {
          const slotDate = new Date(slot.date);
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          
          if (slotDate < startDate || slotDate > endDate) {
            newErrors[`timeSlot_${i}_date`] = 'Date must be between start and end date';
          }
          
          const dateKey = slot.date;
          if (!slotsByDate[dateKey]) {
            slotsByDate[dateKey] = [];
          }
          slotsByDate[dateKey].push({ ...slot, index: i });
        }
      }
      
      // Check for overlaps on the same day
      for (const dateKey in slotsByDate) {
        const daySlots = slotsByDate[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 0; i < daySlots.length - 1; i++) {
          const current = daySlots[i];
          const next = daySlots[i + 1];
          if (current.endTime > next.startTime) {
            newErrors[`timeSlot_${current.index}_overlap`] = `Overlaps with another slot`;
            newErrors[`timeSlot_${next.index}_overlap`] = `Overlaps with another slot`;
          }
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true) // Mark form as touched/submitted
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setSaving(true)
      
      const scheduleData = {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        timeSlots: formData.timeSlots.length > 0 ? formData.timeSlots : undefined
      }

      const result = await sportsApi.schedule.update(scheduleId, scheduleData)
      
      // Handle response format: { success, statusCode, message, data }
      if (result?.success || result?.statusCode === 200 || result?.data) {
        toast.success(result?.message || 'Schedule event updated successfully')
      } else {
        toast.success('Schedule event updated successfully')
      }
      
      router.push('/secretary/sports/schedule')
      
    } catch (error: any) {
      console.error('Error updating schedule:', error)
      toast.error(error?.message || 'Failed to update schedule event')
    } finally {
      setSaving(false)
    }
  }

  const eventTypes = [
    'practice',
    'game',
    'match',
    'tournament',
    'training',
    'meeting',
    'event'
  ]

  const recurringPatterns = [
    'daily',
    'weekly',
    'bi-weekly',
    'monthly'
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/secretary/sports/schedule">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedule
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Schedule Event</h1>
          <p className="text-gray-600 mt-1">Update schedule event details</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program Selection */}
            <div>
              <Label htmlFor="programId">
                Sports Program <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.programId} 
                onValueChange={(value) => handleInputChange('programId', value)}
              >
                <SelectTrigger className={touched && errors.programId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a sports program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program: any) => (
                    <SelectItem key={program._id} value={program._id}>
                      {program.name} - {program.season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched && errors.programId && (
                <p className="text-red-500 text-sm mt-1">{errors.programId}</p>
              )}
            </div>

            {/* Event Type */}
            <div>
              <Label htmlFor="eventType">
                Event Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.eventType} 
                onValueChange={(value) => handleInputChange('eventType', value)}
              >
                <SelectTrigger className={touched && errors.eventType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched && errors.eventType && (
                <p className="text-red-500 text-sm mt-1">{errors.eventType}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Event Title <span className="text-gray-500 text-sm">(Optional)</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Championship Game"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    handleInputChange('startDate', e.target.value);
                    if (!formData.endDate) {
                      handleInputChange('endDate', e.target.value);
                    }
                  }}
                  className={touched && errors.startDate ? 'border-red-500' : ''}
                />
                {touched && errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={touched && errors.endDate ? 'border-red-500' : ''}
                />
                {touched && errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Time Slots <span className="text-gray-500 text-sm">(Optional)</span></Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSlot = { date: formData.startDate || '', startTime: '', endTime: '', description: '' };
                    setFormData(prev => ({
                      ...prev,
                      timeSlots: [...prev.timeSlots, newSlot]
                    }));
                  }}
                  disabled={!formData.startDate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
              
              {formData.timeSlots.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4">
                  {formData.timeSlots.map((slot, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 border rounded bg-gray-50">
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={slot.date}
                          onChange={(e) => {
                            const updated = [...formData.timeSlots];
                            updated[index].date = e.target.value;
                            setFormData(prev => ({ ...prev, timeSlots: updated }));
                          }}
                          min={formData.startDate}
                          max={formData.endDate}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            const updated = [...formData.timeSlots];
                            updated[index].startTime = e.target.value;
                            setFormData(prev => ({ ...prev, timeSlots: updated }));
                          }}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => {
                            const updated = [...formData.timeSlots];
                            updated[index].endTime = e.target.value;
                            setFormData(prev => ({ ...prev, timeSlots: updated }));
                          }}
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            type="text"
                            value={slot.description}
                            onChange={(e) => {
                              const updated = [...formData.timeSlots];
                              updated[index].description = e.target.value;
                              setFormData(prev => ({ ...prev, timeSlots: updated }));
                            }}
                            placeholder="e.g., Opening ceremony"
                            className="h-8"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = formData.timeSlots.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, timeSlots: updated }));
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Time (for backward compatibility) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={touched && errors.time ? 'border-red-500' : ''}
                />
                {touched && errors.time && (
                  <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                )}
              </div>
              <div>
                <Label htmlFor="endTime">
                  End Time <span className="text-gray-500 text-sm">(Optional)</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={touched && errors.endTime ? 'border-red-500' : ''}
                />
                {touched && errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Location and Opponent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location/Venue <span className="text-gray-500 text-sm">(Optional)</span></Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Main Gymnasium"
                />
              </div>
              <div>
                <Label htmlFor="opponent">Opponent (if applicable) <span className="text-gray-500 text-sm">(Optional)</span></Label>
                <Input
                  id="opponent"
                  value={formData.opponent}
                  onChange={(e) => handleInputChange('opponent', e.target.value)}
                  placeholder="e.g., Lincoln High School"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">
                Description <span className="text-gray-500 text-sm">(Optional)</span>
                {formData.description && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({formData.description.length}/{DESCRIPTION_MAX_LENGTH})
                  </span>
                )}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional details about the event..."
                rows={3}
                maxLength={DESCRIPTION_MAX_LENGTH}
                className={touched && errors.description ? 'border-red-500' : ''}
              />
              {touched && errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Recurring Event */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => handleInputChange('isRecurring', checked)}
                />
                <Label htmlFor="isRecurring">This is a recurring event</Label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recurringPattern">
                      Recurring Pattern <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.recurringPattern} 
                      onValueChange={(value) => handleInputChange('recurringPattern', value)}
                    >
                      <SelectTrigger className={touched && errors.recurringPattern ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {recurringPatterns.map((pattern) => (
                          <SelectItem key={pattern} value={pattern}>
                            {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched && errors.recurringPattern && (
                      <p className="text-red-500 text-sm mt-1">{errors.recurringPattern}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="recurringEndDate">Recurring End Date <span className="text-gray-500 text-sm">(Optional)</span></Label>
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => handleInputChange('recurringEndDate', e.target.value)}
                      min={formData.date || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxParticipants">Max Participants <span className="text-gray-500 text-sm">(Optional)</span></Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="requiresTransportation"
                  checked={formData.requiresTransportation}
                  onCheckedChange={(checked) => handleInputChange('requiresTransportation', checked)}
                />
                <Label htmlFor="requiresTransportation">Requires Transportation</Label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Special Instructions/Notes <span className="text-gray-500 text-sm">(Optional)</span></Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Link href="/secretary/sports/schedule" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving} 
                className="flex-1 bg-black hover:bg-gray-800 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Schedule
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

