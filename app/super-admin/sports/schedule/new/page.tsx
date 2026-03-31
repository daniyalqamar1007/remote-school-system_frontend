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
  Plus,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sportsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function NewSchedulePage() {
  const router = useRouter()
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
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const response = await sportsApi.programs.getAll({ page: '1', limit: '100' })
      // Handle new API response format
      const programsList = response?.data?.programs || response?.programs || (Array.isArray(response) ? response : [])
      setPrograms(Array.isArray(programsList) ? programsList : [])
    } catch (error: any) {
      console.error('Error fetching programs:', error)
      toast.error(error?.message || 'Failed to load sports programs')
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
      if (startTime && endTime) {
        if (startTime === endTime) {
          setErrors(prev => ({
            ...prev,
            time: 'Start time and end time cannot be the same',
            endTime: 'Start time and end time cannot be the same'
          }))
        } else if (startTime >= endTime) {
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
    
    if (field === 'endTime' && formData.time) {
      const startTime = formData.time
      const endTime = value
      if (startTime && endTime) {
        if (startTime === endTime) {
          setErrors(prev => ({
            ...prev,
            time: 'Start time and end time cannot be the same',
            endTime: 'Start time and end time cannot be the same'
          }))
        } else if (startTime >= endTime) {
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
  }
  
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
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
    
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }
    
    if (formData.endTime && formData.time) {
      if (formData.time >= formData.endTime) {
        if (formData.time === formData.endTime) {
          newErrors.time = 'Start time and end time cannot be the same'
          newErrors.endTime = 'Start time and end time cannot be the same'
        } else {
          newErrors.time = 'Start time must be before end time'
          newErrors.endTime = 'End time must be after start time'
        }
      }
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
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true) // Mark form as touched/submitted
    
    // Validate form
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      const validationErrors = validationResult.errors;
      
      // Get all error messages to show in toast
      const errorMessages = Object.values(validationErrors);
      if (errorMessages.length > 0) {
        const firstError = errorMessages[0];
        const errorCount = errorMessages.length;
        toast.error(errorCount > 1 ? `${firstError} (and ${errorCount - 1} more error${errorCount > 2 ? 's' : ''})` : firstError);
      } else {
        toast.error('Please fix the errors in the form');
      }
      
      // Scroll to first error after a short delay to ensure DOM is updated
      setTimeout(() => {
        const firstErrorKey = Object.keys(validationErrors)[0];
        if (firstErrorKey) {
          // Try multiple selectors to find the error element
          let errorElement = document.querySelector(`[data-error="${firstErrorKey}"]`);
          if (!errorElement) {
            errorElement = document.querySelector(`input#${firstErrorKey}, select#${firstErrorKey}`);
          }
          if (!errorElement) {
            errorElement = document.querySelector(`input[name="${firstErrorKey}"], select[name="${firstErrorKey}"]`);
          }
          // For time slot errors, find the parent container
          if (!errorElement && firstErrorKey.startsWith('timeSlot_')) {
            const slotIndex = firstErrorKey.match(/timeSlot_(\d+)_/)?.[1];
            if (slotIndex !== undefined) {
              const slotContainer = document.querySelector(`[data-slot-index="${slotIndex}"]`);
              if (slotContainer) {
                errorElement = slotContainer;
              }
            }
          }
          
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus on the element if it's an input or select
            if (errorElement instanceof HTMLInputElement || errorElement instanceof HTMLSelectElement) {
              errorElement.focus();
            } else {
              // If it's a container, try to focus the first input inside it
              const inputInside = errorElement.querySelector('input, select');
              if (inputInside instanceof HTMLInputElement || inputInside instanceof HTMLSelectElement) {
                inputInside.focus();
              }
            }
          }
        }
      }, 100);
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

      const result = await sportsApi.schedule.create(scheduleData)
      // Handle response format: { success, statusCode, message, data }
      if (result?.success || result?.statusCode === 201 || result?.data) {
        toast.success(result?.message || 'Schedule event created successfully')
      } else {
        toast.success('Schedule event created successfully')
      }
      router.push('/super-admin/sports/schedule')
      
    } catch (error: any) {
      console.error('Error creating schedule:', error)
      toast.error(error?.message || 'Failed to create schedule event')
    } finally {
      setSaving(false)
    }
  }

  const eventTypes = [
    'Practice',
    'Game',
    'Match',
    'Tournament',
    'Training',
    'Meeting',
    'Event'
  ]

  const recurringPatterns = [
    'Daily',
    'Weekly',
    'Bi-weekly',
    'Monthly'
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
        <Link href="/super-admin/sports/schedule">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedule
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Schedule Event</h1>
          <p className="text-gray-600 mt-1">Create a new sports schedule event</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="program">
                  Sports Program <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.programId} 
                  onValueChange={(value) => handleInputChange('programId', value)}
                >
                  <SelectTrigger className={touched && errors.programId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a program" />
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
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched && errors.eventType && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventType}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="title">Event Title <span className="text-gray-500 text-sm">(Optional)</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
              />
            </div>

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
                placeholder="Enter event description"
                rows={3}
                maxLength={DESCRIPTION_MAX_LENGTH}
                className={touched && errors.description ? 'border-red-500' : ''}
              />
              {touched && errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    // Auto-set end date to start date if not set
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
                <div>
                  <Label>Time Slots <span className="text-gray-500 text-sm">(Optional)</span></Label>
                  {touched && formData.timeSlots.length > 0 && (() => {
                    const timeSlotErrors = Object.keys(errors).filter(key => key.startsWith('timeSlot_'));
                    if (timeSlotErrors.length > 0) {
                      return (
                        <p className="text-red-500 text-xs mt-1">
                          {timeSlotErrors.length} error{timeSlotErrors.length > 1 ? 's' : ''} in time slots. Please fix them below.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
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
                  {formData.timeSlots.map((slot, index) => {
                    const dateError = errors[`timeSlot_${index}_date`];
                    const startTimeError = errors[`timeSlot_${index}_startTime`];
                    const endTimeError = errors[`timeSlot_${index}_endTime`];
                    const timeError = errors[`timeSlot_${index}_time`];
                    const overlapError = errors[`timeSlot_${index}_overlap`];
                    const hasError = dateError || startTimeError || endTimeError || timeError || overlapError;
                    
                    return (
                      <div key={index} data-slot-index={index} className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-3 border rounded ${hasError ? 'bg-red-50 border-red-300' : 'bg-gray-50'}`}>
                        <div>
                          <Label className="text-xs">Date <span className="text-red-500">*</span></Label>
                          <Input
                            type="date"
                            value={slot.date}
                            onChange={(e) => {
                              const updated = [...formData.timeSlots];
                              updated[index].date = e.target.value;
                              setFormData(prev => ({ ...prev, timeSlots: updated }));
                              // Clear error when field changes
                              if (errors[`timeSlot_${index}_date`]) {
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`timeSlot_${index}_date`];
                                  return newErrors;
                                });
                              }
                            }}
                            min={formData.startDate}
                            max={formData.endDate}
                            className={`h-8 ${touched && dateError ? 'border-red-500' : ''}`}
                            data-error={`timeSlot_${index}_date`}
                          />
                          {touched && dateError && (
                            <p className="text-red-500 text-xs mt-1">{dateError}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Start Time <span className="text-red-500">*</span></Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const updated = [...formData.timeSlots];
                              updated[index].startTime = e.target.value;
                              setFormData(prev => ({ ...prev, timeSlots: updated }));
                              // Clear errors when field changes
                              if (errors[`timeSlot_${index}_startTime`] || errors[`timeSlot_${index}_time`] || errors[`timeSlot_${index}_overlap`]) {
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`timeSlot_${index}_startTime`];
                                  delete newErrors[`timeSlot_${index}_time`];
                                  delete newErrors[`timeSlot_${index}_overlap`];
                                  return newErrors;
                                });
                              }
                            }}
                            className={`h-8 ${touched && (startTimeError || timeError) ? 'border-red-500' : ''}`}
                            data-error={`timeSlot_${index}_startTime`}
                          />
                          {touched && (startTimeError || timeError) && (
                            <p className="text-red-500 text-xs mt-1">{startTimeError || timeError}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">End Time <span className="text-red-500">*</span></Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const updated = [...formData.timeSlots];
                              updated[index].endTime = e.target.value;
                              setFormData(prev => ({ ...prev, timeSlots: updated }));
                              // Clear errors when field changes
                              if (errors[`timeSlot_${index}_endTime`] || errors[`timeSlot_${index}_time`] || errors[`timeSlot_${index}_overlap`]) {
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`timeSlot_${index}_endTime`];
                                  delete newErrors[`timeSlot_${index}_time`];
                                  delete newErrors[`timeSlot_${index}_overlap`];
                                  return newErrors;
                                });
                              }
                            }}
                            className={`h-8 ${touched && (endTimeError || timeError) ? 'border-red-500' : ''}`}
                            data-error={`timeSlot_${index}_endTime`}
                          />
                          {touched && (endTimeError || timeError) && (
                            <p className="text-red-500 text-xs mt-1">{endTimeError || timeError}</p>
                          )}
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
                              // Clear errors for this slot
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[`timeSlot_${index}_date`];
                                delete newErrors[`timeSlot_${index}_startTime`];
                                delete newErrors[`timeSlot_${index}_endTime`];
                                delete newErrors[`timeSlot_${index}_time`];
                                delete newErrors[`timeSlot_${index}_overlap`];
                                return newErrors;
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {touched && overlapError && (
                          <div className="col-span-full">
                            <p className="text-red-500 text-xs mt-1">{overlapError}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Basic Time (for backward compatibility) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                  End Time <span className="text-red-500">*</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="location">Location <span className="text-gray-500 text-sm">(Optional)</span></Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter event location"
                />
              </div>

              <div>
                <Label htmlFor="opponent">Opponent (for games/matches) <span className="text-gray-500 text-sm">(Optional)</span></Label>
                <Input
                  id="opponent"
                  value={formData.opponent}
                  onChange={(e) => handleInputChange('opponent', e.target.value)}
                  placeholder="Enter opponent name"
                />
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => handleInputChange('isRecurring', checked)}
                />
                <Label htmlFor="recurring">Recurring Event</Label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
                  <div>
                    <Label htmlFor="pattern">
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
                          <SelectItem key={pattern.toLowerCase()} value={pattern.toLowerCase()}>
                            {pattern}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched && errors.recurringPattern && (
                      <p className="text-red-500 text-sm mt-1">{errors.recurringPattern}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="recurringEndDate">End Date <span className="text-gray-500 text-sm">(Optional)</span></Label>
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => handleInputChange('recurringEndDate', e.target.value)}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transportation"
                  checked={formData.requiresTransportation}
                  onCheckedChange={(checked) => handleInputChange('requiresTransportation', checked)}
                />
                <Label htmlFor="transportation">Requires Transportation</Label>
              </div>

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
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes <span className="text-gray-500 text-sm">(Optional)</span></Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/super-admin/sports/schedule">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-black hover:bg-gray-800 text-white">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
